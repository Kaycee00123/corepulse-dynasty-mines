
import React, { createContext, useContext, useState, useEffect } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { toast } from '@/hooks/use-toast';
import { User as AppUser } from '@/types';
import { supabase } from '@/integrations/supabase/client';

interface AuthContextType {
  user: AppUser | null;
  session: Session | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, username: string, password: string, referralCode?: string) => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AppUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);

  // Initialize auth state
  useEffect(() => {
    // First set up the auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, newSession) => {
        setSession(newSession);
        setIsAuthenticated(!!newSession);

        // If session exists, fetch the user profile data
        if (newSession?.user) {
          // Defer Supabase calls to avoid potential deadlocks
          setTimeout(() => {
            fetchUserProfile(newSession.user.id);
          }, 0);
        } else {
          setUser(null);
        }
      }
    );

    // Then check for existing session
    supabase.auth.getSession().then(({ data: { session: currentSession } }) => {
      setSession(currentSession);
      setIsAuthenticated(!!currentSession);
      
      if (currentSession?.user) {
        fetchUserProfile(currentSession.user.id);
      } else {
        setIsLoading(false);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Function to fetch user profile data
  const fetchUserProfile = async (userId: string) => {
    try {
      const { data: profileData, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Error fetching user profile:', error);
        setIsLoading(false);
        return;
      }

      // Fetch user balance
      const { data: balanceData, error: balanceError } = await supabase
        .from('user_balances')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (balanceError && balanceError.code !== 'PGRST116') {
        // If error isn't "no rows returned", log it
        console.error('Error fetching user balance:', balanceError);
      }

      // If no balance exists for user, create one
      if (!balanceData) {
        const { error: insertError } = await supabase
          .from('user_balances')
          .insert({
            user_id: userId,
            tokens: 100 // Starting amount
          });

        if (insertError) {
          console.error('Error creating user balance:', insertError);
        }
      }

      // Create complete user object with profile data
      const appUser: AppUser = {
        id: userId,
        email: session?.user?.email || '',
        username: profileData.username,
        created_at: profileData.created_at,
        avatar_url: profileData.avatar_url,
        mining_rate: profileData.mining_rate,
        mining_boost: profileData.mining_boost,
        last_active: profileData.last_active,
        streak_days: profileData.streak_days,
        referral_code: profileData.referral_code
      };

      setUser(appUser);

      // Update last_active field in profile
      const now = new Date().toISOString();
      await supabase
        .from('profiles')
        .update({ last_active: now })
        .eq('id', userId);
    } catch (error) {
      console.error('Unexpected error during profile fetch:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        throw error;
      }

      toast({
        title: "Welcome back!",
        description: "You've successfully signed in.",
      });

      return data;
    } catch (error: any) {
      console.error('Error signing in:', error);
      toast({
        title: "Sign in failed",
        description: error.message || "Invalid email or password. Please try again.",
        variant: "destructive"
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const signUp = async (email: string, username: string, password: string, referralCode?: string) => {
    setIsLoading(true);
    try {
      // First register with Supabase Auth
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            username: username
          }
        }
      });

      if (error) {
        throw error;
      }

      // If referral code was provided, process it
      if (referralCode && data.user) {
        try {
          // Find referrer id from the referral code
          const { data: referrerData, error: referrerError } = await supabase
            .from('profiles')
            .select('id')
            .eq('referral_code', referralCode)
            .single();

          if (referrerData && !referrerError) {
            // Create referral record
            await supabase
              .from('referrals')
              .insert({
                referrer_id: referrerData.id,
                referred_id: data.user.id,
                bonus_earned: 15 // Default bonus amount
              });
          }
        } catch (referralError) {
          console.error('Error processing referral:', referralError);
          // Don't fail signup if referral processing fails
        }
      }

      toast({
        title: "Account created!",
        description: "Welcome to CorePulse. Start mining now!",
      });

      return data;
    } catch (error: any) {
      console.error('Error signing up:', error);
      toast({
        title: "Registration failed",
        description: error.message || "Unable to create account. Please try again.",
        variant: "destructive"
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
      setSession(null);
      setIsAuthenticated(false);
      toast({
        title: "Signed out",
        description: "You've been successfully signed out.",
      });
    } catch (error: any) {
      console.error('Error signing out:', error);
      toast({
        title: "Error",
        description: "There was a problem signing out.",
        variant: "destructive"
      });
    }
  };

  const resetPassword = async (email: string) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: window.location.origin + '/reset-password'
      });

      if (error) {
        throw error;
      }

      toast({
        title: "Reset email sent",
        description: "If an account exists with this email, you'll receive a reset link.",
      });
    } catch (error: any) {
      console.error('Error resetting password:', error);
      toast({
        title: "Error",
        description: error.message || "Unable to send reset email. Please try again.",
        variant: "destructive"
      });
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      session,
      isLoading,
      isAuthenticated,
      signIn,
      signUp,
      signOut,
      resetPassword
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
