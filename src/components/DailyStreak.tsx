
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';

export const DailyStreak = () => {
  const { user } = useAuth();
  const [streakDays, setStreakDays] = useState(0);
  const maxStreakDays = 12;

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
        .select('streak_days')
        .eq('id', userId)
        .single();
        
      if (error) throw error;
      setStreakDays(data.streak_days || 0);
    } catch (error) {
      console.error('Error fetching streak data:', error);
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
      </CardContent>
    </Card>
  );
};
