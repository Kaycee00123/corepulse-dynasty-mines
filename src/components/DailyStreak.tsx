import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export const DailyStreak = () => {
  const { user } = useAuth();
  const [streakDays, setStreakDays] = useState(0);
  const [wavesEarned, setWavesEarned] = useState(0);
  const [canClaim, setCanClaim] = useState(false);
  const [lastClaimed, setLastClaimed] = useState<string | null>(null);
  const [isClaiming, setIsClaiming] = useState(false);
  const maxStreakDays = 12;

  // Helper function to get current UTC+1 time
  const getCurrentTime = () => {
    const now = new Date();
    return new Date(now.getTime() + (now.getTimezoneOffset() * 60000) + (3600000)); // UTC+1
  };

  // Helper function to check if user can claim today
  const checkClaimEligibility = (lastClaimedDate: string | null) => {
    if (!lastClaimedDate) return true;
    
    const lastClaimed = new Date(lastClaimedDate);
    const currentTime = getCurrentTime();
    
    // Check if last claim was on a different day in UTC+1
    return lastClaimed.getUTCDate() !== currentTime.getUTCDate() ||
           lastClaimed.getUTCMonth() !== currentTime.getUTCMonth() ||
           lastClaimed.getUTCFullYear() !== currentTime.getUTCFullYear();
  };

  useEffect(() => {
    if (!user) return;
    
    // Initial fetch
    fetchStreakData(user.id);
    
    // Set up real-time subscription for streak updates
    const channel = supabase
      .channel('public:profiles:streak')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'profiles',
          filter: `id=eq.${user.id}`,
        },
        (payload) => {
          console.log('Streak updated:', payload.new.streak_days);
          setStreakDays(payload.new.streak_days || 0);
          setLastClaimed(payload.new.last_claimed);
          setCanClaim(checkClaimEligibility(payload.new.last_claimed));
        }
      )
      .subscribe();
      
    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);
  
  const fetchStreakData = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('streak_days, last_claimed')
        .eq('id', userId)
        .single();
        
      if (error) throw error;
      setStreakDays(data.streak_days || 0);
      setLastClaimed(data.last_claimed);
      setCanClaim(checkClaimEligibility(data.last_claimed));
      setWavesEarned((data.streak_days || 0) * 10);
    } catch (error) {
      console.error('Error fetching streak data:', error);
    }
  };

  const handleClaim = async () => {
    if (!user || !canClaim || isClaiming) return;

    try {
      setIsClaiming(true);
      
      // Get the current session
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('No active session');
      }

      // Log the request for debugging
      console.log('Sending claim request:', {
        action: 'claim_streak'
      });

      const response = await fetch('https://sfvpxjubrolngidsiczv.supabase.co/functions/v1/mining-rewards', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          action: 'claim_streak'
        })
      });

      // Log the response for debugging
      const data = await response.json();
      console.log('Claim response:', data);

      if (!response.ok) {
        throw new Error(data.error || 'Failed to claim streak bonus');
      }
      
      if (data.success) {
        toast({
          title: "Daily Streak Claimed!",
          description: `You earned 10 waves points! Your streak is now ${data.streak_days} days.`,
        });
        setWavesEarned(prev => prev + 10);
        setCanClaim(false);
        
        // Update local state
        setStreakDays(data.streak_days);
        setLastClaimed(new Date().toISOString());
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to claim streak bonus",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error claiming streak:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to claim streak bonus",
        variant: "destructive"
      });
    } finally {
      setIsClaiming(false);
    }
  };

  return (
    <Card className="mb-4">
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Daily Streak</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex space-x-1 overflow-x-auto pb-1">
          {Array.from({ length: maxStreakDays }).map((_, i) => (
            <div 
              key={i} 
              className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                i < streakDays ? 'bg-core text-white' : 'bg-gray-100 text-gray-400'
              }`}
            >
              {i + 1}
            </div>
          ))}
        </div>
        <div className="mt-2 flex justify-between text-xs text-gray-500">
          <span>{streakDays} days</span>
          <span>{maxStreakDays} days</span>
        </div>
        <div className="mt-2 text-sm text-core">
          Total Waves Earned: {wavesEarned}
        </div>
        <div className="mt-4">
          <Button 
            onClick={handleClaim}
            disabled={!canClaim || isClaiming}
            className="w-full"
          >
            {isClaiming ? 'Claiming...' : canClaim ? 'Claim Daily Streak (10 Waves)' : 'Already Claimed Today'}
          </Button>
          {lastClaimed && (
            <div className="mt-2 text-xs text-gray-500 text-center">
              Last claimed: {new Date(lastClaimed).toLocaleString('en-US', { timeZone: 'UTC+1' })}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
