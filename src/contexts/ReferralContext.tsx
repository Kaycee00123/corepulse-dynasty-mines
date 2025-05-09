
import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { toast } from '@/hooks/use-toast';
import { Referral } from '@/types';

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
      
      // This would be replaced with actual Supabase query for user's referrals
      const mockReferrals: Referral[] = [
        {
          id: '1',
          referrer_id: user.id,
          referred_id: 'user2',
          created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
          bonus_earned: 15.5
        },
        {
          id: '2',
          referrer_id: user.id,
          referred_id: 'user3',
          created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
          bonus_earned: 8.2
        }
      ];
      
      setReferrals(mockReferrals);
    } else {
      setReferralCode(null);
      setReferrals([]);
    }
    
    setIsLoading(false);
  }, [user]);

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
