
import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { toast } from '@/hooks/use-toast';
import { Referral } from '@/types';
import { supabase } from '@/integrations/supabase/client';

interface ReferralContextType {
  referrals: Referral[];
  isLoading: boolean;
  totalReferrals: number;
  totalBonusEarned: number;
  referralCode: string | null;
}

const ReferralContext = createContext<ReferralContextType | undefined>(undefined);

export const ReferralProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [referralCode, setReferralCode] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      setReferralCode(user.referral_code);
      fetchReferrals();
    } else {
      setReferralCode(null);
      setReferrals([]);
      setIsLoading(false);
    }
  }, [user]);

  // Subscribe to referrals updates
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('schema-db-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'referrals',
          filter: `referrer_id=eq.${user.id}`,
        },
        () => {
          fetchReferrals();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const fetchReferrals = async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      // Get referrals where user is the referrer
      const { data, error } = await supabase
        .from('referrals')
        .select('*, referred:referred_id(username)')
        .eq('referrer_id', user.id);

      if (error) {
        throw error;
      }

      setReferrals(data || []);
    } catch (error) {
      console.error('Error fetching referrals:', error);
      toast({
        title: "Error",
        description: "Failed to load your referrals.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const totalReferrals = referrals.length;
  const totalBonusEarned = referrals.reduce((total, ref) => total + ref.bonus_earned, 0);

  return (
    <ReferralContext.Provider value={{
      referrals,
      isLoading,
      totalReferrals,
      totalBonusEarned,
      referralCode
    }}>
      {children}
    </ReferralContext.Provider>
  );
};

export const useReferrals = () => {
  const context = useContext(ReferralContext);
  if (context === undefined) {
    throw new Error('useReferrals must be used within a ReferralProvider');
  }
  return context;
};
