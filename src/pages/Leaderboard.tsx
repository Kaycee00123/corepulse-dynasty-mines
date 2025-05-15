
import { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Navigation } from '@/components/Navigation';
import { Footer } from '@/components/Footer';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LeaderboardTable } from '@/components/LeaderboardTable';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

const Leaderboard = () => {
  const { user, isAuthenticated, isLoading } = useAuth();
  const [totalUsers, setTotalUsers] = useState<number>(0);
  const [showLeaderboard, setShowLeaderboard] = useState<boolean>(true); // Always show leaderboard
  
  // Fetch total users
  useEffect(() => {
    const fetchUserCount = async () => {
      try {
        const { count, error } = await supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true });
          
        if (error) throw error;
        
        setTotalUsers(count || 0);
        // Always show leaderboard regardless of count
        setShowLeaderboard(true);
        
        toast({
          title: "Leaderboard loaded",
          description: `Showing rankings for ${count} miners`,
        });
      } catch (error) {
        console.error('Error fetching user count:', error);
        setTotalUsers(0);
        toast({
          title: "Error loading leaderboard",
          description: "Unable to fetch user data",
          variant: "destructive"
        });
      }
    };
    
    fetchUserCount();
  }, []);

  // If not authenticated, redirect to sign in
  if (!isLoading && !isAuthenticated) {
    return <Navigate to="/signin" replace />;
  }
  
  // Loading state
  if (isLoading) {
    return <div className="h-screen flex items-center justify-center">Loading...</div>;
  }

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
                <LeaderboardTable period="daily" periodLabel="Today" />
              </TabsContent>
              
              {/* Weekly Leaderboard */}
              <TabsContent value="weekly">
                <LeaderboardTable period="weekly" periodLabel="This Week" />
              </TabsContent>
              
              {/* All Time Leaderboard */}
              <TabsContent value="all-time">
                <LeaderboardTable period="all-time" periodLabel="All Time" />
              </TabsContent>
              
              <Card className="mb-8">
                <CardContent className="pt-6">
                  <div className="text-sm text-gray-500">
                    <p>
                      Leaderboard rankings are updated in real-time. Mining activity is tracked 
                      as it happens and contributes to your ranking on the leaderboard.
                    </p>
                    <p className="mt-2">
                      Rewards for top miners will be distributed at the end of each epoch.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </Tabs>
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

export default Leaderboard;
