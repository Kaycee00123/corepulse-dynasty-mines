
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { User } from '@/types';
import { supabase } from '@/integrations/supabase/client';

export const UserProfile = () => {
  const { user } = useAuth();
  const [profileData, setProfileData] = useState<User | null>(null);

  useEffect(() => {
    if (!user) return;
    
    // Initial fetch of updated profile data
    fetchUserProfile(user.id);
    
    // Set up real-time subscription for profile updates
    const channel = supabase
      .channel('public:profiles')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'profiles',
          filter: `id=eq.${user.id}`,
        },
        (payload) => {
          console.log('Profile updated:', payload);
          setProfileData(payload.new as unknown as User);
        }
      )
      .subscribe();
      
    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);
  
  const fetchUserProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
        
      if (error) throw error;
      setProfileData(data as unknown as User);
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  };

  if (!profileData) return null;

  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Your Profile</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col items-center">
        <div className="w-16 h-16 rounded-full bg-gray-200 overflow-hidden mb-2">
          {profileData.avatar_url ? (
            <img src={profileData.avatar_url} alt="User avatar" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-core text-white text-xl font-bold">
              {profileData.username?.charAt(0) || 'U'}
            </div>
          )}
        </div>
        <div className="font-medium">{profileData.username || 'Username'}</div>
        <div className="text-xs text-gray-500">Mining since {new Date(profileData.created_at).toLocaleDateString()}</div>
        <div className="mt-2 text-xs text-gray-500">Mining rate: {profileData.mining_rate.toFixed(2)}/min</div>
        <div className="text-xs text-gray-500">Mining boost: +{profileData.mining_boost}%</div>
      </CardContent>
    </Card>
  );
};
