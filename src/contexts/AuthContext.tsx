
import React, { createContext, useContext, useState, useEffect } from 'react';
import { toast } from '@/hooks/use-toast';
import { User } from '@/types';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, username: string, password: string, referralCode?: string) => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);

  useEffect(() => {
    // This would be replaced with actual Supabase client code
    const checkUser = async () => {
      try {
        // Mock authentication check - would be replaced with Supabase
        const storedUser = localStorage.getItem('corepulse_user');
        
        if (storedUser) {
          setUser(JSON.parse(storedUser));
          setIsAuthenticated(true);
        }
      } catch (error) {
        console.error('Error checking authentication status:', error);
      } finally {
        setIsLoading(false);
      }
    };

    checkUser();
  }, []);

  const signIn = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      // This would be replaced with actual Supabase auth
      // Mocking successful login
      const mockUser: User = {
        id: '123456',
        email: email,
        username: email.split('@')[0],
        created_at: new Date().toISOString(),
        mining_rate: 1.0,
        mining_boost: 0,
        streak_days: 0,
        referral_code: 'MOCK123'
      };
      
      setUser(mockUser);
      setIsAuthenticated(true);
      localStorage.setItem('corepulse_user', JSON.stringify(mockUser));
      toast({
        title: "Welcome back!",
        description: "You've successfully signed in.",
      });
    } catch (error) {
      console.error('Error signing in:', error);
      toast({
        title: "Sign in failed",
        description: "Invalid email or password. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const signUp = async (email: string, username: string, password: string, referralCode?: string) => {
    setIsLoading(true);
    try {
      // This would be replaced with actual Supabase auth
      // Generate a referral code based on username
      const generatedRefCode = `${username.substring(0, 4).toUpperCase()}${Math.floor(1000 + Math.random() * 9000)}`;
      
      // Mocking successful registration
      const mockUser: User = {
        id: '123456',
        email,
        username,
        created_at: new Date().toISOString(),
        mining_rate: 1.0,
        mining_boost: 0,
        streak_days: 0,
        referral_code: generatedRefCode
      };
      
      setUser(mockUser);
      setIsAuthenticated(true);
      localStorage.setItem('corepulse_user', JSON.stringify(mockUser));
      toast({
        title: "Account created!",
        description: "Welcome to CorePulse. Start mining now!",
      });
    } catch (error) {
      console.error('Error signing up:', error);
      toast({
        title: "Registration failed",
        description: "Unable to create account. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const signOut = async () => {
    try {
      // This would be replaced with actual Supabase auth signout
      localStorage.removeItem('corepulse_user');
      setUser(null);
      setIsAuthenticated(false);
      toast({
        title: "Signed out",
        description: "You've been successfully signed out.",
      });
    } catch (error) {
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
      // This would be replaced with actual Supabase password reset
      toast({
        title: "Reset email sent",
        description: "If an account exists with this email, you'll receive a reset link.",
      });
    } catch (error) {
      console.error('Error resetting password:', error);
      toast({
        title: "Error",
        description: "Unable to send reset email. Please try again.",
        variant: "destructive"
      });
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
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
