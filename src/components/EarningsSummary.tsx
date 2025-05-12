
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

export const EarningsSummary = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('daily');
  const [earningsData, setEarningsData] = useState<{
    daily: number,
    weekly: number,
    monthly: number,
    chartData: any[]
  }>({
    daily: 0,
    weekly: 0,
    monthly: 0,
    chartData: []
  });

  useEffect(() => {
    if (!user) return;
    
    // Initial fetch
    fetchEarningsData(user.id);
    
    // Set up real-time subscription for mining sessions updates
    const channel = supabase
      .channel('public:mining_sessions')
      .on(
        'postgres_changes',
        {
          event: '*', // Listen for all change events
          schema: 'public',
          table: 'mining_sessions',
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          // Refetch data when mining sessions change
          fetchEarningsData(user.id);
        }
      )
      .subscribe();
      
    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);
  
  const fetchEarningsData = async (userId: string) => {
    try {
      const now = new Date();
      const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
      const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
      const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
      
      // Get daily earnings
      const { data: dailyData, error: dailyError } = await supabase
        .from('mining_sessions')
        .select('tokens_mined')
        .eq('user_id', userId)
        .gte('start_time', oneDayAgo);
        
      if (dailyError) throw dailyError;
      
      // Get weekly earnings
      const { data: weeklyData, error: weeklyError } = await supabase
        .from('mining_sessions')
        .select('tokens_mined')
        .eq('user_id', userId)
        .gte('start_time', oneWeekAgo);
        
      if (weeklyError) throw weeklyError;
      
      // Get monthly earnings
      const { data: monthlyData, error: monthlyError } = await supabase
        .from('mining_sessions')
        .select('tokens_mined')
        .eq('user_id', userId)
        .gte('start_time', oneMonthAgo);
        
      if (monthlyError) throw monthlyError;
      
      // Calculate total earnings for each period
      const dailyTotal = dailyData.reduce((sum, session) => sum + (session.tokens_mined || 0), 0);
      const weeklyTotal = weeklyData.reduce((sum, session) => sum + (session.tokens_mined || 0), 0);
      const monthlyTotal = monthlyData.reduce((sum, session) => sum + (session.tokens_mined || 0), 0);
      
      // Generate chart data - for demo purposes, we'll create some sample data
      // In a real app, you'd aggregate data points from the mining sessions
      const chartData = generateChartData(activeTab);
      
      setEarningsData({
        daily: dailyTotal,
        weekly: weeklyTotal,
        monthly: monthlyTotal,
        chartData
      });
    } catch (error) {
      console.error('Error fetching earnings data:', error);
    }
  };
  
  // Helper to generate chart data
  const generateChartData = (period: string) => {
    const now = new Date();
    const data = [];
    
    if (period === 'daily') {
      // Generate hourly data for last 24 hours
      for (let i = 0; i < 24; i++) {
        const hour = new Date(now.getTime() - (23 - i) * 60 * 60 * 1000);
        data.push({
          time: `${hour.getHours()}:00`,
          earnings: Math.random() * 3 + 1 // Random value between 1-4
        });
      }
    } else if (period === 'weekly') {
      // Generate daily data for last 7 days
      for (let i = 0; i < 7; i++) {
        const day = new Date(now.getTime() - (6 - i) * 24 * 60 * 60 * 1000);
        data.push({
          time: day.toLocaleDateString('en-US', { weekday: 'short' }),
          earnings: Math.random() * 20 + 5 // Random value between 5-25
        });
      }
    } else {
      // Generate weekly data for last month
      for (let i = 0; i < 4; i++) {
        const week = new Date(now.getTime() - (3 - i) * 7 * 24 * 60 * 60 * 1000);
        data.push({
          time: `Week ${i + 1}`,
          earnings: Math.random() * 80 + 20 // Random value between 20-100
        });
      }
    }
    
    return data;
  };
  
  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    if (user) {
      // Update chart data when tab changes
      setEarningsData(prev => ({
        ...prev,
        chartData: generateChartData(tab)
      }));
    }
  };

  return (
    <Card className="mb-4">
      <CardHeader className="pb-2 flex flex-row items-center justify-between">
        <CardTitle className="text-base">Earnings Summary</CardTitle>
        <div className="flex space-x-1">
          <Badge 
            variant={activeTab === 'daily' ? "default" : "outline"} 
            className="cursor-pointer" 
            onClick={() => handleTabChange('daily')}
          >
            Daily
          </Badge>
          <Badge 
            variant={activeTab === 'weekly' ? "default" : "outline"} 
            className="cursor-pointer" 
            onClick={() => handleTabChange('weekly')}
          >
            Weekly
          </Badge>
          <Badge 
            variant={activeTab === 'monthly' ? "default" : "outline"} 
            className="cursor-pointer" 
            onClick={() => handleTabChange('monthly')}
          >
            Monthly
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-32 bg-gray-50 rounded-lg mb-2">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={earningsData.chartData}>
              <defs>
                <linearGradient id="colorEarnings" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#F97316" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#F97316" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <XAxis dataKey="time" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip />
              <Area 
                type="monotone" 
                dataKey="earnings" 
                stroke="#F97316" 
                fillOpacity={1} 
                fill="url(#colorEarnings)" 
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <div className="text-right">
          <div className="text-lg font-bold">
            {activeTab === 'daily' && earningsData.daily.toFixed(2)}
            {activeTab === 'weekly' && earningsData.weekly.toFixed(2)}
            {activeTab === 'monthly' && earningsData.monthly.toFixed(2)} $WAVES
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
