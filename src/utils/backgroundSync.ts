import { offlineStorage } from './offlineStorage';
import { supabase } from '@/integrations/supabase/client';
import { MiningSession } from '@/types';

class BackgroundSync {
  private syncTag = 'mining-sync';

  async registerSync() {
    if ('serviceWorker' in navigator && 'SyncManager' in window) {
      try {
        const registration = await navigator.serviceWorker.ready;
        await registration.sync.register(this.syncTag);
        console.log('Background sync registered');
      } catch (error) {
        console.error('Error registering background sync:', error);
      }
    }
  }

  async syncMiningData() {
    try {
      const offlineSessions = await offlineStorage.getMiningSessions();
      
      if (offlineSessions.length === 0) return;

      for (const session of offlineSessions) {
        try {
          // Update mining session in database
          const { error: sessionError } = await supabase
            .from('mining_sessions')
            .update({
              tokens_mined: session.tokens_mined,
              end_time: session.end_time || new Date().toISOString(),
              active: false
            })
            .eq('id', session.id);

          if (sessionError) throw sessionError;

          // Update user balance
          const { error: balanceError } = await supabase
            .from('user_balances')
            .update({
              tokens: session.tokens_mined,
              updated_at: new Date().toISOString()
            })
            .eq('user_id', session.user_id);

          if (balanceError) throw balanceError;

          // Remove synced session from offline storage
          await offlineStorage.deleteMiningSession(session.id);
        } catch (error) {
          console.error('Error syncing mining session:', error);
        }
      }
    } catch (error) {
      console.error('Error in syncMiningData:', error);
    }
  }

  async registerServiceWorker() {
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.register('/service-worker.js');
        console.log('Service Worker registered:', registration);
      } catch (error) {
        console.error('Error registering service worker:', error);
      }
    }
  }
}

export const backgroundSync = new BackgroundSync(); 