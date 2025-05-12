
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AdminStats as AdminStatsType } from '@/types';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export function AdminStats() {
  const [stats, setStats] = useState<AdminStatsType | null>(null);
  const [miningHistory, setMiningHistory] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchAdminStats();
    fetchMiningHistory();
  }, []);

  const fetchAdminStats = async () => {
    try {
      setIsLoading(true);
      
      // Get total users
      const { count: totalUsers, error: userError } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });
        
      if (userError) throw userError;
      
      // Get active users (active in the last 24 hours)
      const oneDayAgo = new Date();
      oneDayAgo.setDate(oneDayAgo.getDate() - 1);
      
      const { count: activeUsers, error: activeError } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .gte('last_active', oneDayAgo.toISOString());
        
      if (activeError) throw activeError;
      
      // Get total tokens mined
      const { data: miningData, error: miningError } = await supabase
        .from('mining_sessions')
        .select('tokens_mined');
        
      if (miningError) throw miningError;
      
      const tokensMined = miningData.reduce((sum, session) => sum + (session.tokens_mined || 0), 0);
      
      // Get total NFTs minted
      const { count: nftsMinted, error: nftError } = await supabase
        .from('user_nfts')
        .select('*', { count: 'exact', head: true });
        
      if (nftError) throw nftError;
      
      // Current epoch info (simplified)
      const currentDate = new Date();
      const epochStart = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).toISOString();
      const nextMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1);
      const epochEnd = new Date(nextMonth.getTime() - 1).toISOString();
      
      setStats({
        total_users: totalUsers || 0,
        active_users: activeUsers || 0,
        tokens_mined: tokensMined,
        nfts_minted: nftsMinted || 0,
        current_epoch_start: epochStart,
        current_epoch_end: epochEnd
      });
    } catch (error) {
      console.error('Error fetching admin stats:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  const fetchMiningHistory = async () => {
    try {
      // Get last 14 days mining data
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 13); // 14 days including today
      
      const { data, error } = await supabase
        .from('mining_sessions')
        .select('created_at, tokens_mined')
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString());
        
      if (error) throw error;
      
      // Group by day
      const dailyData: {[key: string]: number} = {};
      
      // Initialize all days with 0
      for (let i = 0; i < 14; i++) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateKey = date.toISOString().split('T')[0];
        dailyData[dateKey] = 0;
      }
      
      // Add actual mining data
      data.forEach((session) => {
        const sessionDate = new Date(session.created_at).toISOString().split('T')[0];
        dailyData[sessionDate] = (dailyData[sessionDate] || 0) + (session.tokens_mined || 0);
      });
      
      // Convert to array for chart
      const chartData = Object.entries(dailyData)
        .map(([date, tokens]) => ({ date, tokens }))
        .sort((a, b) => a.date.localeCompare(b.date));
      
      setMiningHistory(chartData);
    } catch (error) {
      console.error('Error fetching mining history:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-core"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Users</CardDescription>
            <CardTitle className="text-3xl">{stats?.total_users}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Active Users (24h)</CardDescription>
            <CardTitle className="text-3xl">{stats?.active_users}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Tokens Mined</CardDescription>
            <CardTitle className="text-3xl">{stats?.tokens_mined.toFixed(2)}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>NFTs Minted</CardDescription>
            <CardTitle className="text-3xl">{stats?.nfts_minted}</CardTitle>
          </CardHeader>
        </Card>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Mining Activity (Last 14 Days)</CardTitle>
          <CardDescription>Daily tokens mined by all users</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={miningHistory}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Area type="monotone" dataKey="tokens" stroke="#8884d8" fill="#8884d8" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
