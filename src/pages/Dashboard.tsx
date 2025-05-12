
import { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useMining } from '@/contexts/MiningContext';
import { Navigation } from '@/components/Navigation';
import { Footer } from '@/components/Footer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faClipboard, faUser } from '@fortawesome/free-solid-svg-icons';
import { UserProfile } from '@/components/UserProfile';
import { DailyStreak } from '@/components/DailyStreak';
import { NFTBoostCard } from '@/components/NFTBoostCard';
import { EarningsSummary } from '@/components/EarningsSummary';
import { CommunityActivity } from '@/components/CommunityActivity';
import { useReferrals } from '@/contexts/ReferralContext';
import { supabase } from '@/integrations/supabase/client';

const Dashboard = () => {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const { isMining, startMining, stopMining } = useMining();
  const { totalReferrals, totalBonusEarned } = useReferrals();
  
  const [progress, setProgress] = useState(0);
  const [timeLeft, setTimeLeft] = useState('');
  const [copySuccess, setCopySuccess] = useState(false);
  
  // Calculate time until end of epoch
  useEffect(() => {
    // Mock epoch end date (30 days from now)
    const epochEnd = new Date();
    epochEnd.setDate(epochEnd.getDate() + 30);
    
    const updateTime = () => {
      const now = new Date();
      const diff = epochEnd.getTime() - now.getTime();
      
      // Calculate time components
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      
      // Update time left string
      setTimeLeft(`${days}d ${hours}h ${minutes}m`);
      
      // Calculate progress of current epoch
      const epochDuration = 30 * 24 * 60 * 60 * 1000; // 30 days in milliseconds
      const elapsed = epochDuration - diff;
      const progressPercent = (elapsed / epochDuration) * 100;
      setProgress(progressPercent);
    };
    
    updateTime();
    const interval = setInterval(updateTime, 60000); // Update every minute
    
    return () => clearInterval(interval);
  }, []);

  const copyReferralCode = async () => {
    if (user?.referral_code) {
      try {
        await navigator.clipboard.writeText(user.referral_code);
        setCopySuccess(true);
        setTimeout(() => setCopySuccess(false), 2000);
      } catch (err) {
        console.error('Failed to copy text: ', err);
      }
    }
  };
  
  // If not authenticated, redirect to sign in
  if (!authLoading && !isAuthenticated) {
    return <Navigate to="/signin" replace />;
  }
  
  // Loading state
  if (authLoading) {
    return <div className="h-screen flex items-center justify-center">Loading...</div>;
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Navigation />
      
      <main className="flex-grow bg-white py-4">
        <div className="max-w-6xl mx-auto px-4">
          <h1 className="text-xl font-bold mb-4">Mining Dashboard</h1>
          
          <div className="grid md:grid-cols-3 gap-4 mb-4">
            {/* Mining Control */}
            <div className="md:col-span-2">
              <Card className="h-full">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Mining Control</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col items-center justify-center py-2">
                    {isMining ? (
                      <div className="bg-orange-100 rounded-full w-24 h-24 flex items-center justify-center mb-4 animate-pulse-opacity">
                        <div className="bg-core rounded-full w-16 h-16 flex items-center justify-center text-white font-bold">
                          Active
                        </div>
                      </div>
                    ) : (
                      <div className="bg-gray-100 rounded-full w-24 h-24 flex items-center justify-center mb-4">
                        <div className="bg-gray-300 rounded-full w-16 h-16 flex items-center justify-center text-white font-bold">
                          Idle
                        </div>
                      </div>
                    )}
                    <Button 
                      onClick={isMining ? stopMining : startMining}
                      className={`mt-4 ${isMining ? "bg-red-500 hover:bg-red-600" : "bg-core hover:bg-core-dark"}`}
                    >
                      {isMining ? 'Stop Mining' : 'Start Mining'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
            
            {/* NFT Boost */}
            <div>
              <NFTBoostCard />
            </div>
          </div>
          
          {/* Daily Streak */}
          <DailyStreak />
          
          {/* Earnings Summary */}
          <EarningsSummary />
          
          <div className="grid md:grid-cols-12 gap-4">
            {/* User Avatar */}
            <div className="md:col-span-4">
              <UserProfile />
            </div>
            
            {/* Referral Progress */}
            <div className="md:col-span-8">
              <Card className="h-full">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Referral Progress</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm text-gray-500">Your Referral ID:</span>
                    <div className="flex items-center">
                      <code className="bg-gray-100 px-2 py-1 text-xs rounded">{user?.referral_code || 'REF12345'}</code>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-6 w-6 p-0 ml-1" 
                        onClick={copyReferralCode}
                      >
                        <FontAwesomeIcon 
                          icon={copySuccess ? faUser : faClipboard} 
                          className={`h-4 w-4 ${copySuccess ? 'text-green-500' : ''}`} 
                        />
                      </Button>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 mb-2">
                    <div className="bg-gray-50 p-2 rounded text-center">
                      <div className="text-2xl font-bold">{totalReferrals}</div>
                      <div className="text-xs text-gray-500">Total Referrals</div>
                    </div>
                    <div className="bg-gray-50 p-2 rounded text-center">
                      <div className="text-2xl font-bold">{totalBonusEarned.toFixed(1)}</div>
                      <div className="text-xs text-gray-500">WAVE BONUS</div>
                    </div>
                  </div>
                  
                  <p className="text-xs text-gray-500">
                    Invite friends to earn 5% of their mining rewards!
                  </p>
                  <Button 
                    variant="outline" 
                    className="w-full mt-2 text-xs" 
                    onClick={() => window.location.href = '/referrals'}
                  >
                    Manage Referrals
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
          
          {/* Epoch Countdown */}
          <Card className="mt-4">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Epoch Countdown</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-center mb-2">
                <div className="bg-orange-100 rounded-full w-16 h-16 flex items-center justify-center">
                  <div className="text-xl font-bold text-core">5</div>
                </div>
              </div>
              <div className="text-center">
                <p className="text-sm">{timeLeft}</p>
              </div>
              <div className="mt-2">
                <div className="flex justify-between text-xs text-gray-500">
                  <span>Progress</span>
                  <span>{Math.round(progress)}%</span>
                </div>
                <Progress value={progress} className="h-2" />
              </div>
              <p className="mt-2 text-xs text-gray-500 text-center">
                Rewards are distributed at the end of the epoch
              </p>
            </CardContent>
          </Card>
          
          {/* Community Activity */}
          <CommunityActivity />
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default Dashboard;
