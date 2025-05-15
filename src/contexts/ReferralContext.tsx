import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../integrations/supabase/client';
import { useAuth } from './AuthContext';
import { Referral } from '../types';
import { toast } from '@/hooks/use-toast';

interface ReferralContextType {
  referrals: Referral[];
  isLoading: boolean;
  totalReferrals: number;
  totalBonusEarned: number;
  referralCode: string | null;
    validateReferralCode: (code: string) => Promise<boolean>;
    createReferral: (referralCode: string) => Promise<void>;
    error: string | null;
}

const ReferralContext = createContext<ReferralContextType | undefined>(undefined);

// Export the context
export { ReferralContext };

export function ReferralProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [referrals, setReferrals] = useState<Referral[]>([]);
    const [isLoading, setIsLoading] = useState(true);
  const [referralCode, setReferralCode] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

  useEffect(() => {
        if (!user) return;

        const fetchReferrals = async () => {
            try {
                setIsLoading(true);
                setError(null);

                // Fetch user's referral code
                const { data: profileData, error: profileError } = await supabase
                    .from('profiles')
                    .select('referral_code')
                    .eq('id', user.id)
                    .single();

                if (profileError) throw profileError;
                setReferralCode(profileData?.referral_code || null);

                // Fetch referrals
                const { data: referralsData, error: referralsError } = await supabase
                    .from('referrals')
                    .select('*')
                    .eq('referrer_id', user.id);

                if (referralsError) throw referralsError;
                setReferrals(referralsData || []);

            } catch (err) {
                console.error('Error fetching referrals:', err);
                setError('Failed to load referrals');
            } finally {
      setIsLoading(false);
    }
        };

        fetchReferrals();

        // Subscribe to changes
        const referralsSubscription = supabase
            .channel('referrals_changes')
      .on(
        'postgres_changes',
        {
                    event: '*',
          schema: 'public',
          table: 'referrals',
                    filter: `referrer_id=eq.${user.id}`
        },
                (payload) => {
                    if (payload.eventType === 'INSERT') {
                        setReferrals(prev => [...prev, payload.new as Referral]);
                    } else if (payload.eventType === 'UPDATE') {
                        setReferrals(prev =>
                            prev.map(r => r.id === payload.new.id ? payload.new as Referral : r)
                        );
                    } else if (payload.eventType === 'DELETE') {
                        setReferrals(prev => prev.filter(r => r.id !== payload.old.id));
                    }
        }
      )
      .subscribe();

    return () => {
            referralsSubscription.unsubscribe();
    };
  }, [user]);

    const validateReferralCode = async (code: string): Promise<boolean> => {
        if (!user) return false;

        try {
            // First check if the code exists in profiles
            const { data: profileData, error: profileError } = await supabase
                .from('profiles')
                .select('id')
                .eq('referral_code', code)
                .single();

            if (profileError) {
                console.error('Error checking referral code:', profileError);
                return false;
            }

            if (!profileData) {
                console.log('Referral code not found in profiles');
                return false;
            }

            // Check if user is trying to refer themselves
            if (profileData.id === user.id) {
                console.log('User cannot refer themselves');
                return false;
            }

            // Check if user already has a referral
            const { data: existingReferral, error: referralError } = await supabase
                .from('referrals')
                .select('id')
                .eq('referred_id', user.id)
                .single();

            if (referralError && referralError.code !== 'PGRST116') { // PGRST116 is "no rows returned"
                console.error('Error checking existing referral:', referralError);
                return false;
            }

            if (existingReferral) {
                console.log('User already has a referral');
                return false;
            }

            return true;
        } catch (err) {
            console.error('Error validating referral code:', err);
            return false;
        }
    };

    const createReferral = async (code: string) => {
    if (!user) return;
    
        try {
            setError(null);

            // Validate the referral code
            const isValid = await validateReferralCode(code);
            if (!isValid) {
                throw new Error('Invalid referral code');
            }

            // Get referrer's ID
            const { data: referrerData, error: referrerError } = await supabase
                .from('profiles')
                .select('id')
                .eq('referral_code', code)
                .single();

            if (referrerError) throw referrerError;

            // Create the referral
            const { data: referralData, error: createError } = await supabase
                .from('referrals')
                .insert({
                    referrer_id: referrerData.id,
                    referred_id: user.id
                })
                .select()
                .single();

            if (createError) throw createError;

            // Initialize analytics for the new referral
            const { error: analyticsError } = await supabase
                .rpc('update_referral_analytics', {
                    p_referral_id: referralData.id,
                    p_status: 'active'
                });

            if (analyticsError) throw analyticsError;

        } catch (err) {
            console.error('Error creating referral:', err);
            setError(err instanceof Error ? err.message : 'Failed to create referral');
            throw err;
    }
  };

  const totalReferrals = referrals.length;
    const totalBonusEarned = referrals.reduce((sum, referral) => sum + (referral.bonus_earned || 0), 0);

  return (
        <ReferralContext.Provider
            value={{
      referrals,
      isLoading,
      totalReferrals,
      totalBonusEarned,
                referralCode,
                validateReferralCode,
                createReferral,
                error
            }}
        >
      {children}
    </ReferralContext.Provider>
  );
}

export function useReferral() {
  const context = useContext(ReferralContext);
  if (context === undefined) {
        throw new Error('useReferral must be used within a ReferralProvider');
  }
  return context;
}
