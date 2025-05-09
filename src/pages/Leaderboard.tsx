
import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Navigation } from '@/components/Navigation';
import { Footer } from '@/components/Footer';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { LeaderboardEntry } from '@/types';

const Leaderboard = () => {
  const { user, isAuthenticated, isLoading } = useAuth();
  const [leaderboardData, setLeaderboardData] = useState<{
    daily: LeaderboardEntry[];
    weekly: LeaderboardEntry[];
    allTime: LeaderboardEntry[];
  }>({
    daily: [],
    weekly: [],
    allTime: []
  });
  const [totalUsers, setTotalUsers] = useState<number>(0);
  const [showLeaderboard, setShowLeaderboard] = useState<boolean>(false);
  
  // Simulate fetching leaderboard data
  useEffect(() => {
    // This would be replaced with actual Supabase query
    const mockUsers = [
      { user_id: '1', username: 'MiningKing', avatar_url: undefined, tokens_mined: 1450.5, rank: 1 },
      { user_id: '2', username: 'CryptoQueen', avatar_url: undefined, tokens_mined: 1320.8, rank: 2 },
      { user_id: '3', username: 'TokenMaster', avatar_url: undefined, tokens_mined: 980.2, rank: 3 },
      { user_id: '4', username: 'BlockchainBaron', avatar_url: undefined, tokens_mined: 870.5, rank: 4 },
      { user_id: '5', username: 'HashPower', avatar_url: undefined, tokens_mined: 760.1, rank: 5 },
      { user_id: '6', username: 'MineOrBust', avatar_url: undefined, tokens_mined: 650.8, rank: 6 },
      { user_id: '7', username: 'DigitalGold', avatar_url: undefined, tokens_mined: 540.3, rank: 7 },
      { user_id: '8', username: 'TokenHunter', avatar_url: undefined, tokens_mined: 480.7, rank: 8 },
      { user_id: '9', username: 'CoinCollector', avatar_url: undefined, tokens_mined: 420.2, rank: 9 },
      { user_id: '10', username: 'MiningMaster', avatar_url: undefined, tokens_mined: 390.5, rank: 10 },
    ];
    
    // Generate weekly data with slight variations
    const weeklyData = mockUsers.map(user => ({
      ...user,
      tokens_mined: user.tokens_mined * 0.3
    }));
    
    // Generate daily data with more variations
    const dailyData = mockUsers.map(user => ({
      ...user,
      tokens_mined: user.tokens_mined * 0.1
    }));
    
    // Re-rank the data
    weeklyData.sort((a, b) => b.tokens_mined - a.tokens_mined);
    dailyData.sort((a, b) => b.tokens_mined - a.tokens_mined);
    
    weeklyData.forEach((user, index) => {
      user.rank = index + 1;
    });
    
    dailyData.forEach((user, index) => {
      user.rank = index + 1;
    });
    
    setLeaderboardData({
      daily: dailyData,
      weekly: weeklyData,
      allTime: mockUsers
    });
    
    // Mock total users
    setTotalUsers(875);
    
    // Decide whether to show leaderboard (in real app, this would be based on actual user count)
    setShowLeaderboard(true);
  }, []);

  // If not authenticated, redirect to sign in
  if (!isLoading && !isAuthenticated) {
    return <Navigate to="/signin" replace />;
  }
  
  // Loading state
  if (isLoading) {
    return <div className="h-screen flex items-center justify-center">Loading...</div>;
  }
  
  // Get user rank from leaderboard if available
  const getUserRank = (period: 'daily' | 'weekly' | 'allTime') => {
    if (!user) return null;
    
    const userRank = leaderboardData[period].find(entry => entry.user_id === user.id);
    
    if (userRank) {
      return userRank;
    }
    
    // If user is not in top 10, mock a rank outside of it
    return {
      user_id: user.id,
      username: user.username,
      avatar_url: user.avatar_url,
      tokens_mined: period === 'daily' ? 25.6 : period === 'weekly' ? 120.3 : 280.5,
      rank: Math.floor(Math.random() * 20) + 11 // Random rank between 11-30
    };
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Navigation />
      
      <main className="flex-grow bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="heading-xl mb-2">Leaderboard</h1>
            <p className="text-body">
              Top miners ranked by their mining achievements. Where do you stand?
            </p>
          </div>

          {showLeaderboard ? (
            <>
              <Tabs defaultValue="all-time" className="mb-8">
                <div className="flex justify-between items-center mb-6">
                  <TabsList>
                    <TabsTrigger value="daily">Daily</TabsTrigger>
                    <TabsTrigger value="weekly">Weekly</TabsTrigger>
                    <TabsTrigger value="all-time">All Time</TabsTrigger>
                  </TabsList>
                </div>
                
                {/* Daily Leaderboard */}
                <TabsContent value="daily">
                  <LeaderboardTable 
                    entries={leaderboardData.daily} 
                    userRank={getUserRank('daily')} 
                    period="Today"
                  />
                </TabsContent>
                
                {/* Weekly Leaderboard */}
                <TabsContent value="weekly">
                  <LeaderboardTable 
                    entries={leaderboardData.weekly} 
                    userRank={getUserRank('weekly')} 
                    period="This Week"
                  />
                </TabsContent>
                
                {/* All Time Leaderboard */}
                <TabsContent value="all-time">
                  <LeaderboardTable 
                    entries={leaderboardData.allTime} 
                    userRank={getUserRank('allTime')} 
                    period="All Time"
                  />
                </TabsContent>
              </Tabs>
              
              <Card className="mb-8">
                <CardContent className="pt-6">
                  <div className="text-sm text-gray-500">
                    <p>
                      Leaderboard rankings are updated every hour. Mining activity is tracked in real-time
                      and contributes to your ranking on the leaderboard.
                    </p>
                    <p className="mt-2">
                      Rewards for top miners will be distributed at the end of each epoch.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </>
          ) : (
            <Card className="bg-gray-50 border border-dashed border-gray-300">
              <CardHeader>
                <CardTitle>Coming Soon</CardTitle>
                <CardDescription>
                  The leaderboard will be activated when we reach 1,000 miners
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <div className="text-gray-400 mb-4">
                    <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-16 w-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-800">
                    {totalUsers} / 1,000 miners joined
                  </h3>
                  <div className="w-full bg-gray-200 rounded-full h-2.5 mt-4 mx-auto max-w-md">
                    <div 
                      className="bg-core h-2.5 rounded-full" 
                      style={{ width: `${Math.min((totalUsers / 1000) * 100, 100)}%` }}
                    ></div>
                  </div>
                  <p className="mt-6 text-gray-600 max-w-md mx-auto">
                    We're building a community of miners before activating the competitive leaderboard.
                    Keep mining and invite your friends to speed up the launch!
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

// Leaderboard table component
const LeaderboardTable = ({ 
  entries, 
  userRank, 
  period 
}: { 
  entries: LeaderboardEntry[],
  userRank: LeaderboardEntry | null,
  period: string
}) => {
  const { user } = useAuth();

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

  return (
    <div>
      <Card className="mb-6">
        <CardHeader className="pb-3">
          <CardTitle>Top Miners - {period}</CardTitle>
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
                {entries.map((entry) => (
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
                ))}
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

export default Leaderboard;
