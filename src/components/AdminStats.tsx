import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

// Add debug log to verify supabase client
console.log('Supabase client:', supabase);

interface AdminStats {
  totalCrews: number;
  totalCrewMembers: number;
  totalMiningSessions: number;
  totalNfts: number;
  totalReferrals: number;
  totalUserBalances: number;
  totalUserNfts: number;
}

export const AdminStats = () => {
  const [stats, setStats] = useState<AdminStats>({
    totalCrews: 0,
    totalCrewMembers: 0,
    totalMiningSessions: 0,
    totalNfts: 0,
    totalReferrals: 0,
    totalUserBalances: 0,
    totalUserNfts: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchAdminStats();
  }, []);

  const fetchAdminStats = async () => {
    try {
      setIsLoading(true);
      
      // Use direct SQL queries for counting
      const { data: crewsData, error: crewsError } = await supabase
        .from('crews')
        .select('*', { count: 'exact', head: true });
      
      if (crewsError) throw crewsError;
      
      const { data: crewMembersData, error: crewMembersError } = await supabase
        .from('crew_members')
        .select('*', { count: 'exact', head: true });
      
      if (crewMembersError) throw crewMembersError;
      
      const { data: miningData, error: miningError } = await supabase
        .from('mining_sessions')
        .select('*', { count: 'exact', head: true });
      
      if (miningError) throw miningError;
      
      const { data: nftsData, error: nftsError } = await supabase
        .from('nfts')
        .select('*', { count: 'exact', head: true });
      
      if (nftsError) throw nftsError;
      
      const { data: referralsData, error: referralsError } = await supabase
        .from('referrals')
        .select('*', { count: 'exact', head: true });
      
      if (referralsError) throw referralsError;
      
      const { data: balancesData, error: balancesError } = await supabase
        .from('user_balances')
        .select('*', { count: 'exact', head: true });
      
      if (balancesError) throw balancesError;
      
      const { data: userNftsData, error: userNftsError } = await supabase
        .from('user_nfts')
        .select('*', { count: 'exact', head: true });
      
      if (userNftsError) throw userNftsError;
      
      // Update stats with the counts
      setStats({
        totalCrews: crewsData?.length || 0,
        totalCrewMembers: crewMembersData?.length || 0,
        totalMiningSessions: miningData?.length || 0,
        totalNfts: nftsData?.length || 0,
        totalReferrals: referralsData?.length || 0,
        totalUserBalances: balancesData?.length || 0,
        totalUserNfts: userNftsData?.length || 0,
      });
      
    } catch (error) {
      console.error('Error fetching admin stats:', error);
      setError('Failed to fetch admin statistics');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return <div>Loading admin statistics...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
      <div className="bg-white p-4 rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-2">Crews</h3>
        <p className="text-2xl font-bold">{stats.totalCrews}</p>
      </div>
      <div className="bg-white p-4 rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-2">Crew Members</h3>
        <p className="text-2xl font-bold">{stats.totalCrewMembers}</p>
      </div>
      <div className="bg-white p-4 rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-2">Mining Sessions</h3>
        <p className="text-2xl font-bold">{stats.totalMiningSessions}</p>
      </div>
      <div className="bg-white p-4 rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-2">NFTs</h3>
        <p className="text-2xl font-bold">{stats.totalNfts}</p>
      </div>
      <div className="bg-white p-4 rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-2">Referrals</h3>
        <p className="text-2xl font-bold">{stats.totalReferrals}</p>
      </div>
      <div className="bg-white p-4 rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-2">User Balances</h3>
        <p className="text-2xl font-bold">{stats.totalUserBalances}</p>
      </div>
      <div className="bg-white p-4 rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-2">User NFTs</h3>
        <p className="text-2xl font-bold">{stats.totalUserNfts}</p>
      </div>
    </div>
  );
}; 