import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { toast } from '@/hooks/use-toast';
import { MiningSession, UserBalance } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { offlineStorage } from '@/utils/offlineStorage';
import { backgroundSync } from '@/utils/backgroundSync';

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

  // Initialize service worker and background sync
  useEffect(() => {
    backgroundSync.registerServiceWorker();
  }, []);

  // Handle online/offline status
  useEffect(() => {
    const handleOnline = async () => {
      if (isMining) {
        await backgroundSync.syncMiningData();
        await backgroundSync.registerSync();
      }
    };

    window.addEventListener('online', handleOnline);
    return () => window.removeEventListener('online', handleOnline);
  }, [isMining]);

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

  // Modified mining tick function
  const miningTick = async () => {
    if (!user || !currentSession) return;
    
    const now = Date.now();
    const elapsedMinutes = (now - lastMiningUpdate) / (1000 * 60);
    const minedAmount = elapsedMinutes * effectiveRate;
    
    setSessionMined(prev => prev + minedAmount);
    setLastMiningUpdate(now);

    try {
      if (navigator.onLine) {
        // Online: Update database directly
        await supabase
          .from('mining_sessions')
          .update({
            tokens_mined: sessionMined + minedAmount
          })
          .eq('id', currentSession.id);
          
        if (balance) {
          await supabase
            .from('user_balances')
            .update({
              tokens: balance.tokens + minedAmount,
              updated_at: new Date().toISOString()
            })
            .eq('user_id', user.id);
        }
      } else {
        // Offline: Store in IndexedDB
        const offlineSession: MiningSession = {
          ...currentSession,
          tokens_mined: sessionMined + minedAmount,
          end_time: new Date().toISOString()
        };
        await offlineStorage.storeMiningSession(offlineSession);
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

  // Modified start mining function
  const startMining = async () => {
    if (isMining || !user) return;

    try {
      let sessionData;
      
      if (navigator.onLine) {
        // Online: Create session in database
        const { data, error } = await supabase
          .from('mining_sessions')
          .insert({
            user_id: user.id,
            active: true,
            tokens_mined: 0
          })
          .select('*')
          .single();

        if (error) throw error;
        sessionData = data;
      } else {
        // Offline: Create local session
        sessionData = {
          id: crypto.randomUUID(),
          user_id: user.id,
          active: true,
          tokens_mined: 0,
          start_time: new Date().toISOString()
        };
        await offlineStorage.storeMiningSession(sessionData);
      }
      
      setCurrentSession(sessionData);
      setSessionMined(0);
      setLastMiningUpdate(Date.now());
      setIsMining(true);
      
      const interval = setInterval(miningTick, 10000);
      setMiningInterval(interval);
      
      toast({
        title: "Mining Started",
        description: navigator.onLine 
          ? "You're now mining $CORE tokens!"
          : "You're now mining $CORE tokens offline!",
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

  // Modified stop mining function
  const stopMining = async () => {
    if (!isMining || !currentSession) return;
    
    await miningTick();
    
    if (miningInterval) {
      clearInterval(miningInterval);
      setMiningInterval(null);
    }
    
    try {
      if (navigator.onLine) {
        // Online: Update database
        await supabase
          .from('mining_sessions')
          .update({
            end_time: new Date().toISOString(),
            active: false
          })
          .eq('id', currentSession.id);
      } else {
        // Offline: Update local storage
        const offlineSession: MiningSession = {
          ...currentSession,
          active: false,
          end_time: new Date().toISOString()
        };
        await offlineStorage.storeMiningSession(offlineSession);
      }
      
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
