import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

export interface CommunityEvent {
  id: string;
  event_type: 'mining' | 'nft' | 'crew';
  username: string;
  avatar_url?: string;
  details: string;
  timestamp: string;
}

export const CommunityActivity = () => {
  const [activities, setActivities] = useState<CommunityEvent[]>([]);
  
  useEffect(() => {
    // Initial fetch
    fetchCommunityActivity();
    
    // Set up real-time subscriptions for various community events
    const miningChannel = supabase
      .channel('public:mining_sessions:realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'mining_sessions',
        },
        handleMiningEvent
      )
      .subscribe();
      
    const nftChannel = supabase
      .channel('public:user_nfts:realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'user_nfts',
        },
        handleNFTEvent
      )
      .subscribe();
      
    const crewChannel = supabase
      .channel('public:crew_members:realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'crew_members',
        },
        handleCrewEvent
      )
      .subscribe();
      
    return () => {
      supabase.removeChannel(miningChannel);
      supabase.removeChannel(nftChannel);
      supabase.removeChannel(crewChannel);
    };
  }, []);
  
  const fetchCommunityActivity = async () => {
    try {
      // For demonstration, we'll create some mock community events
      // In a real app, you'd probably have a dedicated table for community events
      // or join across tables to create a feed
      
      // Get recent mining sessions
      const { data: miningSessions, error: miningError } = await supabase
        .from('mining_sessions')
        .select('*, profiles:user_id(username, avatar_url)')
        .eq('active', false)
        .order('end_time', { ascending: false })
        .limit(3);
        
      if (miningError) throw miningError;
      
      // Get recent NFT purchases
      const { data: nftPurchases, error: nftError } = await supabase
        .from('user_nfts')
        .select('*, profiles:user_id(username, avatar_url), nfts:nft_id(name, tier)')
        .order('purchased_at', { ascending: false })
        .limit(3);
        
      if (nftError) throw nftError;
      
      // Get recent crew joins
      const { data: crewJoins, error: crewError } = await supabase
        .from('crew_members')
        .select('*, profiles:user_id(username, avatar_url), crews:crew_id(name)')
        .order('joined_at', { ascending: false })
        .limit(3);
        
      if (crewError) throw crewError;
      
      // Format the data into unified activity events
      const formattedMiningEvents = miningSessions.map((session: any) => ({
        id: session.id,
        event_type: 'mining',
        username: session.profiles?.username || 'Unknown User',
        avatar_url: session.profiles?.avatar_url,
        details: `mined ${session.tokens_mined.toFixed(2)} $WAVES`,
        timestamp: session.end_time
      }));
      
      const formattedNFTEvents = nftPurchases.map((purchase: any) => ({
        id: purchase.id,
        event_type: 'nft',
        username: purchase.profiles?.username || 'Unknown User',
        avatar_url: purchase.profiles?.avatar_url,
        details: `minted ${purchase.nfts?.tier || ''} NFT "${purchase.nfts?.name || 'Unknown NFT'}"`,
        timestamp: purchase.purchased_at
      }));
      
      const formattedCrewEvents = crewJoins.map((join: any) => ({
        id: join.id,
        event_type: 'crew',
        username: join.profiles?.username || 'Unknown User',
        avatar_url: join.profiles?.avatar_url,
        details: `joined crew "${join.crews?.name || 'Unknown Crew'}"`,
        timestamp: join.joined_at
      }));
      
      // Combine all events, sort by timestamp (descending), and limit to 10
      const allEvents = [...formattedMiningEvents, ...formattedNFTEvents, ...formattedCrewEvents]
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .slice(0, 10);
      
      setActivities(allEvents);
    } catch (error) {
      console.error('Error fetching community activity:', error);
    }
  };
  
  const handleMiningEvent = async (payload: any) => {
    try {
      // Get user details
      const { data: userData, error: userError } = await supabase
        .from('profiles')
        .select('username, avatar_url')
        .eq('id', payload.new.user_id)
        .single();
        
      if (userError) throw userError;
      
      // Create new activity event
      const newEvent: CommunityEvent = {
        id: payload.new.id,
        event_type: 'mining',
        username: userData.username || 'Unknown User',
        avatar_url: userData.avatar_url,
        details: `mined ${payload.new.tokens_mined.toFixed(2)} $WAVES`,
        timestamp: payload.new.end_time || new Date().toISOString()
      };
      
      // Add to state, keeping only the 10 most recent events
      setActivities(prev => [newEvent, ...prev.slice(0, 9)]);
    } catch (error) {
      console.error('Error processing mining event:', error);
    }
  };
  
  const handleNFTEvent = async (payload: any) => {
    try {
      // Get user and NFT details
      const { data: userData, error: userError } = await supabase
        .from('profiles')
        .select('username, avatar_url')
        .eq('id', payload.new.user_id)
        .single();
        
      if (userError) throw userError;
      
      const { data: nftData, error: nftError } = await supabase
        .from('nfts')
        .select('name, tier')
        .eq('id', payload.new.nft_id)
        .single();
        
      if (nftError) throw nftError;
      
      // Create new activity event
      const newEvent: CommunityEvent = {
        id: payload.new.id,
        event_type: 'nft',
        username: userData.username || 'Unknown User',
        avatar_url: userData.avatar_url,
        details: `minted ${nftData.tier} NFT "${nftData.name}"`,
        timestamp: payload.new.purchased_at
      };
      
      // Add to state, keeping only the 10 most recent events
      setActivities(prev => [newEvent, ...prev.slice(0, 9)]);
    } catch (error) {
      console.error('Error processing NFT event:', error);
    }
  };
  
  const handleCrewEvent = async (payload: any) => {
    try {
      // Get user and crew details
      const { data: userData, error: userError } = await supabase
        .from('profiles')
        .select('username, avatar_url')
        .eq('id', payload.new.user_id)
        .single();
        
      if (userError) throw userError;
      
      const { data: crewData, error: crewError } = await supabase
        .from('crews')
        .select('name')
        .eq('id', payload.new.crew_id)
        .single();
        
      if (crewError) throw crewError;
      
      // Create new activity event
      const newEvent: CommunityEvent = {
        id: payload.new.id,
        event_type: 'crew',
        username: userData.username || 'Unknown User',
        avatar_url: userData.avatar_url,
        details: `joined crew "${crewData.name}"`,
        timestamp: payload.new.joined_at
      };
      
      // Add to state, keeping only the 10 most recent events
      setActivities(prev => [newEvent, ...prev.slice(0, 9)]);
    } catch (error) {
      console.error('Error processing crew event:', error);
    }
  };

  return (
    <div className="mt-4">
      <h2 className="text-base font-bold mb-2">Community Activity</h2>
      <div className="space-y-2">
        {activities.length > 0 ? (
          activities.map((activity) => (
            <div key={activity.id} className="bg-white border border-gray-100 rounded-lg p-3 text-xs">
              <div className="flex items-center gap-2">
                <Avatar className="w-6 h-6">
                  <AvatarImage src={activity.avatar_url} />
                  <AvatarFallback className="bg-gray-200 text-[10px]">
                    {activity.username.substring(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-grow">
                  <span className="font-medium">{activity.username}</span> {" "}
                  {activity.details}
                </div>
                <div className="text-gray-400 text-[10px]">
                  {new Date(activity.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-4 text-gray-500 text-sm">
            No recent activity
          </div>
        )}
      </div>
    </div>
  );
};
