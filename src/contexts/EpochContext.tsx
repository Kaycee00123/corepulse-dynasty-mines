import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './AuthContext';
import { 
  handleEpochTransition, 
  validateEpochState, 
  handleOfflineEpochSync,
  notifyEpochEvents,
  getEpochAnalytics,
  EpochAnalytics
} from '@/utils/epochManager';
import { ensureUserProfiles } from '@/utils/profileManager';

interface EpochContextType {
  currentEpoch: {
    id: string;
    startTime: string;
    endTime: string;
    progress: number;
    timeLeft: string;
    isActive: boolean;
  } | null;
  analytics: EpochAnalytics | null;
  isLoading: boolean;
  refreshEpoch: () => Promise<void>;
  validateEpoch: () => Promise<boolean>;
}

const EpochContext = createContext<EpochContextType | undefined>(undefined);

export const EpochProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [currentEpoch, setCurrentEpoch] = useState<EpochContextType['currentEpoch']>(null);
  const [analytics, setAnalytics] = useState<EpochAnalytics | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const calculateTimeLeft = (endTime: string) => {
    const now = new Date();
    const end = new Date(endTime);
    const diff = end.getTime() - now.getTime();
    
    if (diff <= 0) return '0d 0h 0m';
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    return `${days}d ${hours}h ${minutes}m`;
  };

  const calculateProgress = (startTime: string, endTime: string) => {
    const now = new Date();
    const start = new Date(startTime);
    const end = new Date(endTime);
    const total = end.getTime() - start.getTime();
    const elapsed = now.getTime() - start.getTime();
    
    if (total <= 0) return 0;
    if (elapsed <= 0) return 0;
    
    const progress = (elapsed / total) * 100;
    return Math.min(100, Math.max(0, progress));
  };

  const fetchCurrentEpoch = async () => {
    try {
      setIsLoading(true);
      console.log('Fetching current epoch...');
      
      const { data: epoch, error } = await supabase
        .from('epochs')
        .select('*')
        .eq('is_active', true)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching epoch:', error);
        throw error;
      }

      if (epoch) {
        console.log('Found existing epoch:', epoch);
        const now = new Date();
        const endTime = new Date(epoch.end_time);
        const isActive = now < endTime;

        const progress = calculateProgress(epoch.start_time, epoch.end_time);
        const timeLeft = calculateTimeLeft(epoch.end_time);

        // Check if epoch has ended
        if (!isActive) {
          console.log('Epoch has ended, transitioning to new epoch...');
          await handleEpochTransition(epoch.id);
          await fetchCurrentEpoch(); // Fetch the new epoch
          return;
        }

        // Fetch epoch analytics
        const epochAnalytics = await getEpochAnalytics(epoch.id);
        setAnalytics(epochAnalytics);

        setCurrentEpoch({
          id: epoch.id,
          startTime: epoch.start_time,
          endTime: epoch.end_time,
          progress,
          timeLeft,
          isActive
        });
      } else {
        // Only create a new epoch if no active epoch exists
        console.log('No active epoch found, creating new one...');
        const startTime = new Date();
        const endTime = new Date(startTime.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days

        const { data: newEpoch, error: createError } = await supabase
          .from('epochs')
          .insert({
            start_time: startTime.toISOString(),
            end_time: endTime.toISOString(),
            is_active: true
          })
          .select()
          .single();

        if (createError) {
          console.error('Error creating new epoch:', createError);
          throw createError;
        }

        console.log('Created new epoch:', newEpoch);
        setCurrentEpoch({
          id: newEpoch.id,
          startTime: newEpoch.start_time,
          endTime: newEpoch.end_time,
          progress: 0,
          timeLeft: calculateTimeLeft(newEpoch.end_time),
          isActive: true
        });

        // Initialize analytics for new epoch
        setAnalytics({
          totalMiningActivity: 0,
          userParticipation: 0,
          rewardDistribution: {
            total: 0,
            average: 0,
            topEarner: 0
          },
          performanceMetrics: {
            averageMiningTime: 0,
            completionRate: 0,
            activeUsers: 0
          }
        });

        // Notify users of new epoch
        await notifyEpochEvents('start');
      }
    } catch (error) {
      console.error('Error in fetchCurrentEpoch:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Ensure profiles exist before fetching epoch data
    ensureUserProfiles().then(() => {
      fetchCurrentEpoch();
    });

    // Update progress and time left every minute
    const interval = setInterval(() => {
      if (currentEpoch) {
        setCurrentEpoch(prev => {
          if (!prev) return null;
          const progress = calculateProgress(prev.startTime, prev.endTime);
          const timeLeft = calculateTimeLeft(prev.endTime);
          console.log('Updating epoch:', { progress, timeLeft });
          return {
            ...prev,
            progress,
            timeLeft
          };
        });
      }
    }, 60000); // Update every minute

    return () => clearInterval(interval);
  }, []);

  // Subscribe to epoch changes
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('epoch_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'epochs',
          filter: 'is_active=eq.true'
        },
        () => {
          console.log('Epoch change detected, refreshing...');
          fetchCurrentEpoch();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  // Handle offline sync
  useEffect(() => {
    if (navigator.onLine) {
      handleOfflineEpochSync().catch(console.error);
    }
  }, [navigator.onLine]);

  return (
    <EpochContext.Provider 
      value={{ 
        currentEpoch, 
        analytics,
        isLoading, 
        refreshEpoch: fetchCurrentEpoch,
        validateEpoch: validateEpochState
      }}
    >
      {children}
    </EpochContext.Provider>
  );
};

export const useEpoch = () => {
  const context = useContext(EpochContext);
  if (context === undefined) {
    throw new Error('useEpoch must be used within an EpochProvider');
  }
  return context;
}; 