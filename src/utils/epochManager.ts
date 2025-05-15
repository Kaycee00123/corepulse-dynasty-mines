import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export interface EpochSettings {
  duration: number; // in days
  rewardMultiplier: number;
  minimumParticipation: number;
  bonusThresholds: {
    streak: number;
    nftBoost: number;
    referralBonus: number;
  };
}

export interface EpochHistory {
  epochId: string;
  startTime: string;
  endTime: string;
  totalRewards: number;
  participants: number;
  topPerformers: Array<{
    userId: string;
    rewards: number;
  }>;
}

export interface EpochAnalytics {
  totalMiningActivity: number;
  userParticipation: number;
  rewardDistribution: {
    total: number;
    average: number;
    topEarner: number;
  };
  performanceMetrics: {
    averageMiningTime: number;
    completionRate: number;
    activeUsers: number;
  };
}

interface MiningSession {
  id: string;
  user_id: string;
  start_time: string;
  end_time: string;
  tokens_mined: number;
  status: string;
  epoch_id?: string;
}

// Default epoch settings
export const defaultEpochSettings: EpochSettings = {
  duration: 30,
  rewardMultiplier: 1,
  minimumParticipation: 1,
  bonusThresholds: {
    streak: 7,
    nftBoost: 1.5,
    referralBonus: 0.05
  }
};

// Handle epoch transition
export const handleEpochTransition = async (currentEpochId: string) => {
  try {
    // Start transaction
    const { error: transactionError } = await supabase.rpc('begin_transaction');
    if (transactionError) throw transactionError;

    // 1. Distribute rewards
    await distributeEpochRewards(currentEpochId);

    // 2. Create new epoch
    const startTime = new Date();
    const endTime = new Date(startTime.getTime() + defaultEpochSettings.duration * 24 * 60 * 60 * 1000);

    const { data: newEpoch, error: createError } = await supabase
      .from('epochs')
      .insert({
        start_time: startTime.toISOString(),
        end_time: endTime.toISOString(),
        is_active: true
      })
      .select()
      .single();

    if (createError) throw createError;

    // 3. Update old epoch status
    const { error: updateError } = await supabase
      .from('epochs')
      .update({ is_active: false })
      .eq('id', currentEpochId);

    if (updateError) throw updateError;

    // 4. Notify users
    await notifyEpochEvents('transition');

    // Commit transaction
    const { error: commitError } = await supabase.rpc('commit_transaction');
    if (commitError) throw commitError;

    return newEpoch;
  } catch (error) {
    console.error('Error in epoch transition:', error);
    await supabase.rpc('rollback_transaction');
    throw error;
  }
};

// Distribute epoch rewards
export const distributeEpochRewards = async (epochId: string) => {
  try {
    // Get all mining sessions for the epoch
    const { data: miningSessions, error: sessionsError } = await supabase
      .from('mining_sessions')
      .select('*, profiles(*)')
      .eq('epoch_id', epochId);

    if (sessionsError) throw sessionsError;

    // Calculate rewards for each user
    const userRewards = new Map<string, number>();
    
    for (const session of miningSessions) {
      const baseReward = session.tokens_mined || 0;
      let totalReward = baseReward;

      // Apply NFT boost if user has NFTs
      if (session.profiles?.nft_count > 0) {
        totalReward *= defaultEpochSettings.bonusThresholds.nftBoost;
      }

      // Apply streak bonus
      if (session.profiles?.streak_days >= defaultEpochSettings.bonusThresholds.streak) {
        totalReward *= 1.1; // 10% bonus for maintaining streak
      }

      // Add to user's total rewards
      const currentReward = userRewards.get(session.user_id) || 0;
      userRewards.set(session.user_id, currentReward + totalReward);
    }

    // Update user balances
    for (const [userId, reward] of userRewards) {
      const { error: balanceError } = await supabase
        .from('user_balances')
        .update({
          tokens: supabase.rpc('increment', { x: reward, row_id: userId })
        })
        .eq('user_id', userId);

      if (balanceError) throw balanceError;
    }

    // Record epoch rewards
    const { error: recordError } = await supabase
      .from('epoch_rewards')
      .insert({
        epoch_id: epochId,
        total_distributed: Array.from(userRewards.values()).reduce((a, b) => a + b, 0),
        participant_count: userRewards.size,
        distribution_data: Object.fromEntries(userRewards)
      });

    if (recordError) throw recordError;
  } catch (error) {
    console.error('Error distributing epoch rewards:', error);
    throw error;
  }
};

// Get epoch analytics
export const getEpochAnalytics = async (epochId: string): Promise<EpochAnalytics> => {
  try {
    const { data: miningSessions, error: sessionsError } = await supabase
      .from('mining_sessions')
      .select('*')
      .eq('epoch_id', epochId);

    if (sessionsError) throw sessionsError;

    const totalMiningActivity = miningSessions.reduce((sum, session) => sum + (session.tokens_mined || 0), 0);
    const uniqueUsers = new Set(miningSessions.map(session => session.user_id));
    const totalMiningTime = miningSessions.reduce((sum, session) => {
      const start = new Date(session.start_time);
      const end = new Date(session.end_time);
      return sum + (end.getTime() - start.getTime());
    }, 0);

    return {
      totalMiningActivity,
      userParticipation: uniqueUsers.size,
      rewardDistribution: {
        total: totalMiningActivity,
        average: totalMiningActivity / uniqueUsers.size,
        topEarner: Math.max(...miningSessions.map(session => session.tokens_mined || 0))
      },
      performanceMetrics: {
        averageMiningTime: totalMiningTime / miningSessions.length,
        completionRate: miningSessions.filter(session => session.status === 'completed').length / miningSessions.length,
        activeUsers: uniqueUsers.size
      }
    };
  } catch (error) {
    console.error('Error getting epoch analytics:', error);
    throw error;
  }
};

// Notify epoch events
export const notifyEpochEvents = async (event: 'start' | 'end' | 'transition') => {
  try {
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      console.error('Error getting current user:', userError);
      return;
    }

    // Get user's profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, notification_preferences')
      .eq('id', user.id)
      .single();

    if (profileError) {
      console.error('Error fetching profile:', profileError);
      return;
    }

    // Create notification
    const { error: notificationError } = await supabase
      .from('notifications')
      .insert({
        user_id: user.id,
        type: `epoch_${event}`,
        message: getEpochEventMessage(event),
        created_at: new Date().toISOString()
      });

    if (notificationError) {
      console.error('Error creating notification:', notificationError);
    }

    // Send email notification if enabled
    if (profile.notification_preferences?.email) {
      try {
        // Get user's email from auth
        const { data: { user: authUser } } = await supabase.auth.getUser();
        if (authUser?.email) {
          // Implement email sending logic here
          console.log(`Sending email to ${authUser.email} about epoch ${event}`);
        }
      } catch (error) {
        console.error('Error sending email notification:', error);
      }
    }
  } catch (error) {
    console.error('Error in notifyEpochEvents:', error);
  }
};

// Validate epoch state
export const validateEpochState = async () => {
  try {
    // Check for overlapping epochs
    const { data: activeEpochs, error: epochsError } = await supabase
      .from('epochs')
      .select('*')
      .eq('is_active', true);

    if (epochsError) throw epochsError;

    if (activeEpochs.length > 1) {
      throw new Error('Multiple active epochs detected');
    }

    // Validate reward calculations
    if (activeEpochs.length === 1) {
      const currentEpoch = activeEpochs[0];
      const { data: rewards, error: rewardsError } = await supabase
        .from('epoch_rewards')
        .select('*')
        .eq('epoch_id', currentEpoch.id);

      if (rewardsError) throw rewardsError;

      if (rewards.length > 0) {
        // Verify reward distribution matches mining activity
        const analytics = await getEpochAnalytics(currentEpoch.id);
        const totalRewards = rewards.reduce((sum, reward) => sum + reward.total_distributed, 0);

        if (Math.abs(totalRewards - analytics.totalMiningActivity) > 0.01) {
          throw new Error('Reward distribution mismatch detected');
        }
      }
    }

    return true;
  } catch (error) {
    console.error('Error validating epoch state:', error);
    throw error;
  }
};

// Handle offline epoch sync
export const handleOfflineEpochSync = async () => {
  try {
    const db = await openMiningDB();
    const transaction = db.transaction('mining-sessions', 'readonly');
    const store = transaction.objectStore('mining-sessions');
    
    // Get all offline sessions using getAll on the store
    const offlineSessions = await new Promise<MiningSession[]>((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    
    if (!offlineSessions || offlineSessions.length === 0) return;

    // Get current epoch
    const { data: currentEpoch, error: epochError } = await supabase
      .from('epochs')
      .select('*')
      .eq('is_active', true)
      .single();

    if (epochError) throw epochError;

    // Process each offline session
    for (const session of offlineSessions) {
      try {
        // Add epoch_id to session
        const sessionWithEpoch = {
          ...session,
          epoch_id: currentEpoch.id
        };

        // Send to server
        const { error: syncError } = await supabase
          .from('mining_sessions')
          .insert(sessionWithEpoch);

        if (syncError) throw syncError;

        // Remove synced session from IndexedDB
        const deleteTransaction = db.transaction('mining-sessions', 'readwrite');
        const deleteStore = deleteTransaction.objectStore('mining-sessions');
        await new Promise<void>((resolve, reject) => {
          const request = deleteStore.delete(session.id);
          request.onsuccess = () => resolve();
          request.onerror = () => reject(request.error);
        });
      } catch (error) {
        console.error('Error syncing mining session:', error);
      }
    }
  } catch (error) {
    console.error('Error in offline epoch sync:', error);
    throw error;
  }
};

// Helper function to get epoch event message
const getEpochEventMessage = (event: 'start' | 'end' | 'transition'): string => {
  switch (event) {
    case 'start':
      return 'A new mining epoch has begun! Start mining to earn rewards.';
    case 'end':
      return 'The current mining epoch has ended. Rewards will be distributed shortly.';
    case 'transition':
      return 'Epoch transition in progress. Please wait while we process your rewards.';
    default:
      return 'Epoch event notification';
  }
};

// Helper function to open IndexedDB
const openMiningDB = async (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('mining-db', 1);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains('mining-sessions')) {
        const store = db.createObjectStore('mining-sessions', { keyPath: 'id' });
        // Add any indexes if needed
        store.createIndex('timestamp', 'timestamp', { unique: false });
      }
    };
  });
}; 