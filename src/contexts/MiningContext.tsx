
import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { toast } from '@/hooks/use-toast';
import { MiningSession, UserBalance } from '@/types';
import { supabase } from '@/integrations/supabase/client';

interface MiningContextType {
  isMining: boolean;
  miningRate: number;
  totalMined: number;
  sessionMined: number;
  startMining: () => Promise<void>;
  stopMining: () => Promise<void>;
  updateMiningRate: (newRate: number) => void;
  balance: UserBalance | null;
  miningBoost: number;
  updateMiningBoost: (newBoost: number) => void;
  projectedEarnings: {
    daily: number;
    weekly: number;
    monthly: number;
  };
}

const MiningContext = createContext<MiningContextType | undefined>(undefined);

export const MiningProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  
  const [isMining, setIsMining] = useState<boolean>(false);
  const [miningRate, setMiningRate] = useState<number>(1.0); // Tokens per minute
  const [miningBoost, setMiningBoost] = useState<number>(0); // Percentage boost
  const [totalMined, setTotalMined] = useState<number>(0);
  const [sessionMined, setSessionMined] = useState<number>(0);
  const [balance, setBalance] = useState<UserBalance | null>(null);
  const [miningInterval, setMiningInterval] = useState<NodeJS.Timeout | null>(null);
  const [currentSession, setCurrentSession] = useState<MiningSession | null>(null);
  const [lastMiningUpdate, setLastMiningUpdate] = useState<number>(Date.now());

  // Calculate effective mining rate with boosts
  const effectiveRate = miningRate * (1 + miningBoost / 100);

  // Projected earnings
  const projectedEarnings = {
    daily: effectiveRate * 60 * 24, // per day
    weekly: effectiveRate * 60 * 24 * 7, // per week
    monthly: effectiveRate * 60 * 24 * 30, // per month
  };

  // Load user data
  useEffect(() => {
    if (user) {
      // Set mining rate from user profile
      setMiningRate(user.mining_rate || 1.0);
      setMiningBoost(user.mining_boost || 0);
      
      // Fetch user balance
      fetchUserBalance();

      // Check for active mining session
      checkActiveMiningSession();
    }
  }, [user]);

  // Handle user logging out
  useEffect(() => {
    if (!isAuthenticated && isMining) {
      stopMining();
    }
  }, [isAuthenticated]);

  // Subscribe to balance updates
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('schema-db-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_balances',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          if (payload.new) {
            setBalance(payload.new as UserBalance);
            setTotalMined((payload.new as UserBalance).tokens);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  // Subscribe to mining session updates
  useEffect(() => {
    if (!user || !currentSession) return;

    const channel = supabase
      .channel('schema-db-changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'mining_sessions',
          filter: `id=eq.${currentSession.id}`,
        },
        (payload) => {
          if (payload.new) {
            setCurrentSession(payload.new as MiningSession);
            setSessionMined((payload.new as MiningSession).tokens_mined);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, currentSession]);

  const fetchUserBalance = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('user_balances')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') { // No rows returned
          // Create initial balance for user
          const { data: newBalance, error: insertError } = await supabase
            .from('user_balances')
            .insert({
              user_id: user.id,
              tokens: 100 // Starting balance
            })
            .select('*')
            .single();

          if (insertError) {
            throw insertError;
          }
          
          setBalance(newBalance);
          setTotalMined(newBalance.tokens);
        } else {
          throw error;
        }
      } else if (data) {
        setBalance(data);
        setTotalMined(data.tokens);
      }
    } catch (error) {
      console.error('Error fetching user balance:', error);
    }
  };

  const checkActiveMiningSession = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('mining_sessions')
        .select('*')
        .eq('user_id', user.id)
        .eq('active', true)
        .order('start_time', { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (data) {
        // Resume active session
        setCurrentSession(data);
        setSessionMined(data.tokens_mined);
        setIsMining(true);
        setLastMiningUpdate(Date.now());

        // Start the mining interval
        const interval = setInterval(miningTick, 10000);
        setMiningInterval(interval);
        
        toast({
          title: "Mining Resumed",
          description: "Your previous mining session has been resumed.",
        });
      }
    } catch (error) {
      console.error('Error checking active mining sessions:', error);
    }
  };

  // Mining logic
  const miningTick = async () => {
    if (!user || !currentSession) return;
    
    const now = Date.now();
    const elapsedMinutes = (now - lastMiningUpdate) / (1000 * 60);
    const minedAmount = elapsedMinutes * effectiveRate;
    
    setSessionMined(prev => prev + minedAmount);
    setLastMiningUpdate(now);

    try {
      // Update mining session in database
      await supabase
        .from('mining_sessions')
        .update({
          tokens_mined: sessionMined + minedAmount
        })
        .eq('id', currentSession.id);
        
      // Update user balance
      if (balance) {
        await supabase
          .from('user_balances')
          .update({
            tokens: balance.tokens + minedAmount,
            updated_at: new Date().toISOString()
          })
          .eq('user_id', user.id);
      }

      // Milestone notifications
      if (Math.floor(sessionMined) < Math.floor(sessionMined + minedAmount)) {
        toast({
          title: "Mining Milestone!",
          description: `You've mined ${Math.floor(sessionMined + minedAmount)} tokens in this session!`,
        });
      }
    } catch (error) {
      console.error('Error updating mining data:', error);
    }
  };

  const startMining = async () => {
    if (isMining || !user) return;

    try {
      // Create a new mining session in the database
      const { data, error } = await supabase
        .from('mining_sessions')
        .insert({
          user_id: user.id,
          active: true,
          tokens_mined: 0
        })
        .select('*')
        .single();

      if (error) {
        throw error;
      }
      
      setCurrentSession(data);
      setSessionMined(0);
      setLastMiningUpdate(Date.now());
      setIsMining(true);
      
      // Start the mining interval (update every 10 seconds)
      const interval = setInterval(miningTick, 10000);
      setMiningInterval(interval);
      
      toast({
        title: "Mining Started",
        description: "You're now mining $CORE tokens!",
      });
    } catch (error) {
      console.error('Error starting mining session:', error);
      toast({
        title: "Error",
        description: "Failed to start mining. Please try again.",
        variant: "destructive"
      });
    }
  };

  const stopMining = async () => {
    if (!isMining || !currentSession) return;
    
    // Run one final mining tick
    await miningTick();
    
    // Clear the mining interval
    if (miningInterval) {
      clearInterval(miningInterval);
      setMiningInterval(null);
    }
    
    try {
      // Update the session in database
      await supabase
        .from('mining_sessions')
        .update({
          end_time: new Date().toISOString(),
          active: false
        })
        .eq('id', currentSession.id);
      
      setIsMining(false);
      
      toast({
        title: "Mining Stopped",
        description: `You mined ${sessionMined.toFixed(2)} tokens this session!`,
      });
    } catch (error) {
      console.error('Error stopping mining session:', error);
      toast({
        title: "Error",
        description: "Failed to stop mining. Please try again.",
        variant: "destructive"
      });
    }
  };

  const updateMiningRate = (newRate: number) => {
    setMiningRate(newRate);
  };

  const updateMiningBoost = (newBoost: number) => {
    setMiningBoost(newBoost);
  };

  return (
    <MiningContext.Provider value={{
      isMining,
      miningRate,
      totalMined,
      sessionMined,
      startMining,
      stopMining,
      updateMiningRate,
      balance,
      miningBoost,
      updateMiningBoost,
      projectedEarnings
    }}>
      {children}
    </MiningContext.Provider>
  );
};

export const useMining = () => {
  const context = useContext(MiningContext);
  if (context === undefined) {
    throw new Error('useMining must be used within a MiningProvider');
  }
  return context;
};
