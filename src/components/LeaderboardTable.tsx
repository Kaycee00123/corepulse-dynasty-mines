
import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { LeaderboardEntry } from '@/types';
import { supabase } from '@/integrations/supabase/client';

interface LeaderboardTableProps { 
  period: 'daily' | 'weekly' | 'all-time';
  periodLabel: string;
}

export const LeaderboardTable = ({ period, periodLabel }: LeaderboardTableProps) => {
  const { user } = useAuth();
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [userRank, setUserRank] = useState<LeaderboardEntry | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchLeaderboardData();
    
    // Subscribe to changes
    const channel = supabase
      .channel('public:mining_sessions:leaderboard')
      .on(
        'postgres_changes',
        {
          event: '*', // Listen for all events
          schema: 'public',
          table: 'mining_sessions',
        },
        () => {
          // Refetch leaderboard data when mining sessions change
          fetchLeaderboardData();
        }
      )
      .subscribe();
      
    return () => {
      supabase.removeChannel(channel);
    };
  }, [period]);
  
  const fetchLeaderboardData = async () => {
    setIsLoading(true);
    try {
      let timeFilter;
      const now = new Date();
      
      // Set time filter based on period
      if (period === 'daily') {
        const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
        timeFilter = oneDayAgo;
      } else if (period === 'weekly') {
        const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
        timeFilter = oneWeekAgo;
      } else {
        // All time - no time filter needed
        timeFilter = null;
      }
      
      let query = supabase
        .from('mining_sessions')
        .select('user_id, tokens_mined, profiles:user_id(username, avatar_url)');
        
      // Apply time filter if needed
      if (timeFilter) {
        query = query.gte('start_time', timeFilter);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      
      // Aggregate tokens mined by user
      const userTotals = new Map<string, { 
        user_id: string; 
        username: string;
        avatar_url?: string;
        tokens_mined: number;
      }>();
      
      data.forEach((session: any) => {
        const userId = session.user_id;
        const existingTotal = userTotals.get(userId);
        
        if (existingTotal) {
          userTotals.set(userId, {
            ...existingTotal,
            tokens_mined: existingTotal.tokens_mined + (session.tokens_mined || 0)
          });
        } else {
          userTotals.set(userId, {
            user_id: userId,
            username: session.profiles?.username || 'Unknown User',
            avatar_url: session.profiles?.avatar_url,
            tokens_mined: session.tokens_mined || 0
          });
        }
      });
      
      // Convert to array, sort by tokens mined (descending), and add ranks
      const leaderboardEntries = Array.from(userTotals.values())
        .sort((a, b) => b.tokens_mined - a.tokens_mined)
        .map((entry, index) => ({
          ...entry,
          rank: index + 1
        }));
      
      // Take top 10 for leaderboard
      const topTen = leaderboardEntries.slice(0, 10);
      setEntries(topTen);
      
      // Find current user's rank
      if (user) {
        const currentUserRank = leaderboardEntries.find(entry => entry.user_id === user.id);
        setUserRank(currentUserRank || null);
      }
    } catch (error) {
      console.error('Error fetching leaderboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getRowClass = (userId: string) => {
    return userId === user?.id ? 'bg-orange-50 border-l-4 border-core' : '';
  };

  const getMedalEmoji = (rank: number) => {
    switch (rank) {
      case 1: return '🥇';
      case 2: return '🥈';
      case 3: return '🥉';
      default: return null;
    }
  };

  if (isLoading) {
    return (
      <div>
        <Card className="mb-6">
          <CardHeader className="pb-3">
            <CardTitle>Top Miners - {periodLabel}</CardTitle>
            <CardDescription>Loading leaderboard data...</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div>
      <Card className="mb-6">
        <CardHeader className="pb-3">
          <CardTitle>Top Miners - {periodLabel}</CardTitle>
          <CardDescription>Miners ranked by tokens mined</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 text-left">
                <tr>
                  <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Rank</th>
                  <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Miner</th>
                  <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider text-right">Tokens Mined</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {entries.length > 0 ? (
                  entries.map((entry) => (
                    <tr key={entry.user_id} className={getRowClass(entry.user_id)}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center">
                          {getMedalEmoji(entry.rank) && (
                            <span className="text-lg mr-2">{getMedalEmoji(entry.rank)}</span>
                          )}
                          <span className={entry.rank <= 3 ? "font-semibold" : ""}>{entry.rank}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <Avatar className="h-8 w-8 mr-3">
                            <AvatarImage src={entry.avatar_url} />
                            <AvatarFallback className="bg-gray-200">
                              {entry.username.substring(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {entry.username}
                            </div>
                            {entry.user_id === user?.id && (
                              <div className="text-xs text-core">You</div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium">
                        {entry.tokens_mined.toFixed(2)}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={3} className="px-6 py-4 text-center text-gray-500">
                      No data available for this time period
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {userRank && userRank.rank > 10 && (
        <Card>
          <CardHeader className="py-3">
            <CardTitle className="text-sm font-medium">Your Ranking</CardTitle>
          </CardHeader>
          <CardContent className="py-2 px-0">
            <table className="w-full">
              <tbody>
                <tr className="bg-orange-50 border-l-4 border-core">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    {userRank.rank}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <Avatar className="h-8 w-8 mr-3">
                        <AvatarImage src={userRank.avatar_url} />
                        <AvatarFallback className="bg-gray-200">
                          {userRank.username.substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {userRank.username}
                        </div>
                        <div className="text-xs text-core">You</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium">
                    {userRank.tokens_mined.toFixed(2)}
                  </td>
                </tr>
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
