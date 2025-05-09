
import { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useMining } from '@/contexts/MiningContext';
import { useNFT } from '@/contexts/NFTContext';
import { useReferrals } from '@/contexts/ReferralContext';
import { Navigation } from '@/components/Navigation';
import { Footer } from '@/components/Footer';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';

const Dashboard = () => {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const { isMining, miningRate, totalMined, sessionMined, startMining, stopMining, miningBoost, projectedEarnings } = useMining();
  const { totalBoost } = useNFT();
  const { totalReferrals, totalBonusEarned } = useReferrals();
  
  const [progress, setProgress] = useState(0);
  const [timeLeft, setTimeLeft] = useState('');

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
      
      <main className="flex-grow bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Welcome Section */}
          <div className="mb-8">
            <h1 className="heading-xl mb-2">Welcome, {user?.username}!</h1>
            <p className="text-body">
              Your mining operation dashboard. Monitor your progress and rewards here.
            </p>
          </div>

          {/* Mining Status */}
          <Card className="mb-8 overflow-hidden">
            <CardHeader className={`${isMining ? 'bg-green-50' : 'bg-gray-50'}`}>
              <CardTitle className="flex items-center justify-between">
                <span>Mining Status</span>
                <Button 
                  onClick={isMining ? stopMining : startMining}
                  variant={isMining ? "destructive" : "default"}
                  className={isMining ? "" : "bg-core hover:bg-core-dark"}
                >
                  {isMining ? 'Stop Mining' : 'Start Mining'}
                </Button>
              </CardTitle>
              <CardDescription>
                {isMining ? 'Currently active and mining tokens' : 'Mining is currently paused'}
              </CardDescription>
            </CardHeader>
            <CardContent className="py-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="card-stats">
                  <span className="text-sm font-medium text-gray-500">Mining Rate</span>
                  <div className="mt-1 flex items-baseline">
                    <span className="text-2xl font-semibold text-gray-900">{miningRate.toFixed(2)}</span>
                    <span className="ml-1 text-sm text-gray-500">tokens/min</span>
                  </div>
                  {totalBoost > 0 && (
                    <span className="mt-1 text-xs text-green-600">+{totalBoost}% boost applied</span>
                  )}
                </div>
                
                <div className="card-stats">
                  <span className="text-sm font-medium text-gray-500">Session Mined</span>
                  <div className={`mt-1 flex items-baseline ${isMining ? 'animate-pulse-opacity' : ''}`}>
                    <span className="text-2xl font-semibold text-gray-900">{sessionMined.toFixed(2)}</span>
                    <span className="ml-1 text-sm text-gray-500">tokens</span>
                  </div>
                  {isMining && (
                    <div className="mt-1 flex items-center">
                      <span className="inline-block h-2 w-2 rounded-full bg-green-500 mr-1"></span>
                      <span className="text-xs text-green-600">Live mining</span>
                    </div>
                  )}
                </div>
                
                <div className="card-stats">
                  <span className="text-sm font-medium text-gray-500">Total Mined</span>
                  <div className="mt-1 flex items-baseline">
                    <span className="text-2xl font-semibold text-gray-900">{totalMined.toFixed(2)}</span>
                    <span className="ml-1 text-sm text-gray-500">tokens</span>
                  </div>
                  <span className="mt-1 text-xs text-gray-500">Lifetime earnings</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 gap-6 mb-8 md:grid-cols-2 lg:grid-cols-4">
            {/* Projected Earnings */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Daily Projection</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-core">
                  {projectedEarnings.daily.toFixed(2)}
                </div>
                <p className="text-xs text-gray-500">tokens per day</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Weekly Projection</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-core">
                  {projectedEarnings.weekly.toFixed(2)}
                </div>
                <p className="text-xs text-gray-500">tokens per week</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Monthly Projection</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-core">
                  {projectedEarnings.monthly.toFixed(2)}
                </div>
                <p className="text-xs text-gray-500">tokens per month</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Login Streak</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-core">
                  {user?.streak_days || 0}
                </div>
                <p className="text-xs text-gray-500">consecutive days</p>
              </CardContent>
            </Card>
          </div>

          {/* Epoch Timer */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Current Epoch</CardTitle>
              <CardDescription>Mining rewards will be distributed at the end of each epoch</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-2 flex justify-between text-sm">
                <span>Progress</span>
                <span>{Math.round(progress)}%</span>
              </div>
              <Progress value={progress} className="h-2 bg-gray-200" />
              <div className="mt-4 flex justify-between items-center">
                <span className="text-sm text-gray-500">Time remaining:</span>
                <span className="text-lg font-medium text-gray-900">{timeLeft}</span>
              </div>
            </CardContent>
          </Card>

          {/* NFT and Referral Summary */}
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>NFT Boost</CardTitle>
                <CardDescription>Your mining efficiency boost from NFTs</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-core">+{totalBoost}%</div>
                {totalBoost === 0 ? (
                  <p className="mt-2 text-gray-500">You don't have any NFTs yet. Visit the NFT page to mint some and boost your mining rate!</p>
                ) : (
                  <p className="mt-2 text-gray-500">Your NFTs are boosting your mining efficiency by {totalBoost}%</p>
                )}
              </CardContent>
              <CardFooter>
                <Button variant="outline" className="w-full" onClick={() => window.location.href = '/nfts'}>
                  View NFTs
                </Button>
              </CardFooter>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Referral Network</CardTitle>
                <CardDescription>Your referral stats and bonuses</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex justify-between mb-4">
                  <div>
                    <div className="text-3xl font-bold text-core">{totalReferrals}</div>
                    <p className="text-sm text-gray-500">Total Referrals</p>
                  </div>
                  <div>
                    <div className="text-3xl font-bold text-core">{totalBonusEarned.toFixed(2)}</div>
                    <p className="text-sm text-gray-500">Bonus Earned</p>
                  </div>
                </div>
                <p className="text-gray-500">Invite friends to earn referral bonuses!</p>
              </CardContent>
              <CardFooter>
                <Button variant="outline" className="w-full" onClick={() => window.location.href = '/referrals'}>
                  Manage Referrals
                </Button>
              </CardFooter>
            </Card>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default Dashboard;
