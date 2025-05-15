import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { EnhancedAdminStats } from '@/types';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';
import { useAdmin } from '@/contexts/AdminContext';
import { useEpoch } from '@/contexts/EpochContext';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

export function AdminStats() {
  const { hasPermission } = useAdmin();
  const { currentEpoch } = useEpoch();
  const [stats, setStats] = useState<EnhancedAdminStats | null>(null);
  const [miningHistory, setMiningHistory] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (hasPermission('analytics', 'read')) {
    fetchAdminStats();
    fetchMiningHistory();
    }
  }, [hasPermission]);

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
      
      // Get mining rewards data
      const { data: rewardsData, error: rewardsError } = await supabase
        .from('mining_sessions')
        .select('user_id, tokens_mined, profiles:user_id(username)')
        .order('tokens_mined', { ascending: false })
        .limit(10);

      if (rewardsError) throw rewardsError;

      // Get referral stats
      const { data: referralData, error: referralError } = await supabase
        .from('referrals')
        .select('referrer_id, profiles:referrer_id(username)', { count: 'exact', head: true });

      if (referralError) throw referralError;

      // Get crew stats
      const { data: crewData, error: crewError } = await supabase
        .from('crews')
        .select('id, name, total_tokens_mined');

      if (crewError) {
        console.error('Error fetching crew data:', crewError);
        setStats(prev => ({
          ...prev,
          crew_stats: {
            total_crews: 0,
            active_crews: 0,
            average_crew_size: 0,
            top_performing_crews: []
          }
        }));
      } else {
        // Get member counts for each crew
        const { data: memberCounts, error: memberError } = await supabase
          .from('crew_members')
          .select('crew_id', { count: 'exact' });

        if (!memberError && memberCounts) {
          // Map member counts to crews
          const crewsWithMembers = crewData?.map(crew => ({
            ...crew,
            member_count: memberCounts.filter(m => m.crew_id === crew.id).length || 0
          })) || [];

          setStats(prev => ({
            ...prev,
            crew_stats: {
              total_crews: crewsWithMembers.length,
              active_crews: crewsWithMembers.filter(c => c.member_count > 0).length,
              average_crew_size: crewsWithMembers.length ? 
                crewsWithMembers.reduce((sum, crew) => sum + (crew.member_count || 0), 0) / crewsWithMembers.length : 0,
              top_performing_crews: crewsWithMembers.map(c => ({
                crew_id: c.id,
                name: c.name,
                total_tokens_mined: c.total_tokens_mined || 0,
                member_count: c.member_count || 0
              }))
            }
          }));
        }
      }

      // Calculate user engagement metrics
      const now = new Date();
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

      const { count: weeklyActive, error: weeklyError } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .gte('last_active', weekAgo.toISOString());

      const { count: monthlyActive, error: monthlyError } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .gte('last_active', monthAgo.toISOString());

      if (weeklyError || monthlyError) throw weeklyError || monthlyError;
      
      setStats({
        total_users: totalUsers || 0,
        active_users: activeUsers || 0,
        tokens_mined: tokensMined,
        nfts_minted: nftsMinted || 0,
        current_epoch_start: currentEpoch?.startTime || new Date().toISOString(),
        current_epoch_end: currentEpoch?.endTime || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        mining_rewards: {
          total_distributed: tokensMined,
          average_per_user: totalUsers ? tokensMined / totalUsers : 0,
          top_earners: rewardsData?.map(r => ({
            user_id: r.user_id,
            username: r.profiles[0]?.username || 'Unknown',
            total_earned: r.tokens_mined || 0
          })) || []
        },
        user_engagement: {
          daily_active_users: activeUsers || 0,
          weekly_active_users: weeklyActive || 0,
          monthly_active_users: monthlyActive || 0,
          average_session_duration: 0,
          retention_rate: totalUsers ? (monthlyActive || 0) / totalUsers : 0
        },
        referral_stats: {
          total_referrals: referralData?.length || 0,
          active_referrals: 0,
          total_rewards_distributed: 0,
          top_referrers: []
        },
        crew_stats: {
          total_crews: 0,
          active_crews: 0,
          average_crew_size: 0,
          top_performing_crews: []
        },
        token_metrics: {
          total_supply: tokensMined,
          circulating_supply: tokensMined,
          distribution_by_type: {
            mining_rewards: tokensMined,
            referral_rewards: 0,
            crew_rewards: 0,
            other: 0
          }
        }
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

  if (!hasPermission('analytics', 'read')) {
    return (
      <div className="text-center py-12">
        <p className="text-red-500">You don't have permission to view analytics.</p>
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>User Engagement</CardTitle>
            <CardDescription>Active users over time</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between">
                <span>Daily Active Users</span>
                <span className="font-semibold">{stats?.user_engagement.daily_active_users}</span>
              </div>
              <div className="flex justify-between">
                <span>Weekly Active Users</span>
                <span className="font-semibold">{stats?.user_engagement.weekly_active_users}</span>
              </div>
              <div className="flex justify-between">
                <span>Monthly Active Users</span>
                <span className="font-semibold">{stats?.user_engagement.monthly_active_users}</span>
              </div>
              <div className="flex justify-between">
                <span>Retention Rate</span>
                <span className="font-semibold">{(stats?.user_engagement.retention_rate * 100).toFixed(1)}%</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Top Earners</CardTitle>
            <CardDescription>Users with highest mining rewards</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats?.mining_rewards.top_earners.slice(0, 5).map((earner, index) => (
                <div key={earner.user_id} className="flex justify-between items-center">
                  <div className="flex items-center space-x-2">
                    <span className="font-semibold">#{index + 1}</span>
                    <span>{earner.username}</span>
                  </div>
                  <span className="font-semibold">{earner.total_earned.toFixed(2)} tokens</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Crew Performance</CardTitle>
          <CardDescription>Top performing crews</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats?.crew_stats.top_performing_crews.slice(0, 5)}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="total_tokens_mined" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Token Distribution</CardTitle>
          <CardDescription>Distribution of tokens by type</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={Object.entries(stats?.token_metrics.distribution_by_type || {}).map(([key, value]) => ({
                    name: key.replace('_', ' '),
                    value
                  }))}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {Object.entries(stats?.token_metrics.distribution_by_type || {}).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
