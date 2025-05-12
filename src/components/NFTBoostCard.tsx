
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

export const NFTBoostCard = () => {
  const { user } = useAuth();
  const [totalBoost, setTotalBoost] = useState(0);
  const [nftCount, setNftCount] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) return;
    
    // Initial fetch
    fetchNFTData(user.id);
    
    // Set up real-time subscription for user NFT updates
    const channel = supabase
      .channel('public:user_nfts')
      .on(
        'postgres_changes',
        {
          event: '*', // Listen for all change events (INSERT, UPDATE, DELETE)
          schema: 'public',
          table: 'user_nfts',
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          // Refetch data when NFTs change
          fetchNFTData(user.id);
        }
      )
      .subscribe();
      
    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);
  
  const fetchNFTData = async (userId: string) => {
    try {
      // Get all user NFTs with their associated NFT data
      const { data, error } = await supabase
        .from('user_nfts')
        .select('*, nft:nfts(*)')
        .eq('user_id', userId);
        
      if (error) throw error;
      
      // Calculate total boost
      const boost = data.reduce((sum, item) => {
        return sum + (item.nft?.boost_percentage || 0);
      }, 0);
      
      setTotalBoost(boost);
      setNftCount(data.length);
    } catch (error) {
      console.error('Error fetching NFT data:', error);
    }
  };

  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-base">NFT Boost</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col items-center">
          <div className="relative mb-2">
            <svg className="w-20 h-20" viewBox="0 0 36 36">
              <path
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none"
                stroke="#E5E7EB"
                strokeWidth="3"
              />
              <path
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none"
                stroke="#F97316"
                strokeWidth="3"
                strokeDasharray={`${totalBoost}, 100`}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-lg font-bold text-core">
              {totalBoost}%
            </div>
          </div>
          <div className="text-xs text-gray-500 mt-2">Current Boost: {totalBoost}%</div>
          <div className="mt-1 text-xs text-gray-500">NFT Count: {nftCount}</div>
          <Button variant="outline" className="mt-2 text-xs" onClick={() => navigate('/nfts')}>
            Upgrade NFTs
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
