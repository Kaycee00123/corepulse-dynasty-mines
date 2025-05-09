
import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { toast } from '@/hooks/use-toast';
import { MiningSession, UserBalance } from '@/types';

interface MiningContextType {
  isMining: boolean;
  miningRate: number;
  totalMined: number;
  sessionMined: number;
  startMining: () => void;
  stopMining: () => void;
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

  // Load initial user data
  useEffect(() => {
    if (user) {
      // This would be replaced with actual Supabase data fetching
      setMiningRate(user.mining_rate || 1.0);
      setMiningBoost(user.mining_boost || 0);
      
      // Mock initial balance
      const mockBalance: UserBalance = {
        id: '1',
        user_id: user.id,
        tokens: 100, // Starting with 100 tokens
        updated_at: new Date().toISOString()
      };
      
      setBalance(mockBalance);
      setTotalMined(mockBalance.tokens);

      // Start mining automatically when user logs in
      startMining();
    }
  }, [user]);

  // Handle user logging out
  useEffect(() => {
    if (!isAuthenticated && isMining) {
      stopMining();
    }
  }, [isAuthenticated]);

  // Mining logic
  const miningTick = () => {
    if (!user) return;
    
    const now = Date.now();
    const elapsedMinutes = (now - lastMiningUpdate) / (1000 * 60);
    const minedAmount = elapsedMinutes * effectiveRate;
    
    setSessionMined(prev => prev + minedAmount);
    setTotalMined(prev => prev + minedAmount);
    setLastMiningUpdate(now);
    
    // Update the balance (mock - would be real Supabase update)
    if (balance) {
      const updatedBalance = {
        ...balance,
        tokens: balance.tokens + minedAmount,
        updated_at: new Date().toISOString()
      };
      setBalance(updatedBalance);
    }

    // Persist the session (mock - would be real Supabase update)
    if (currentSession) {
      const updatedSession = {
        ...currentSession,
        tokens_mined: sessionMined + minedAmount
      };
      setCurrentSession(updatedSession);
    }

    // Milestone notifications
    if (Math.floor(sessionMined) < Math.floor(sessionMined + minedAmount)) {
      toast({
        title: "Mining Milestone!",
        description: `You've mined ${Math.floor(sessionMined + minedAmount)} tokens in this session!`,
      });
    }
  };

  const startMining = () => {
    if (isMining || !user) return;

    // Create a new mining session
    const newSession: MiningSession = {
      id: `session_${Date.now()}`,
      user_id: user.id,
      start_time: new Date().toISOString(),
      active: true,
      tokens_mined: 0
    };
    
    setCurrentSession(newSession);
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
  };

  const stopMining = () => {
    if (!isMining) return;
    
    // Run one final mining tick
    miningTick();
    
    // Clear the mining interval
    if (miningInterval) {
      clearInterval(miningInterval);
      setMiningInterval(null);
    }
    
    // Update the session (mock - would be real Supabase update)
    if (currentSession) {
      const updatedSession = {
        ...currentSession,
        end_time: new Date().toISOString(),
        active: false,
        tokens_mined: sessionMined
      };
      setCurrentSession(updatedSession);
    }
    
    setIsMining(false);
    
    toast({
      title: "Mining Stopped",
      description: `You mined ${sessionMined.toFixed(2)} tokens this session!`,
    });
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
