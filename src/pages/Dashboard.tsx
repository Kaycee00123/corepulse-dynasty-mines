
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
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faClipboard, 
  faUser, 
  faClock,
  faChartLine
} from '@fortawesome/free-solid-svg-icons';

const Dashboard = () => {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const { isMining, miningRate, totalMined, sessionMined, startMining, stopMining, miningBoost, projectedEarnings } = useMining();
  const { totalBoost } = useNFT();
  const { totalReferrals, totalBonusEarned } = useReferrals();
  
  const [progress, setProgress] = useState(0);
  const [timeLeft, setTimeLeft] = useState('');
  const [activeTab, setActiveTab] = useState('daily');

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

  // Mock data for daily streak
  const streakDays = user?.streak_days || 5;
  const maxStreakDays = 12;

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
                    <div className="text-lg font-bold">{miningRate.toFixed(4)} $WAVES/min</div>
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
                    <div className="mt-1 text-xs text-gray-500">NFT Count: 1</div>
                    <Button variant="outline" className="mt-2 text-xs" onClick={() => window.location.href = '/nfts'}>
                      Upgrade NFTs
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
          
          {/* Daily Streak */}
          <Card className="mb-4">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Daily Streak</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex space-x-1 overflow-x-auto pb-1">
                {Array.from({ length: maxStreakDays }).map((_, i) => (
                  <div 
                    key={i} 
                    className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                      i < streakDays ? 'bg-core text-white' : 'bg-gray-100 text-gray-400'
                    }`}
                  >
                    {i + 1}
                  </div>
                ))}
              </div>
              <div className="mt-2 flex justify-between text-xs text-gray-500">
                <span>{streakDays} days</span>
                <span>{maxStreakDays} days</span>
              </div>
            </CardContent>
          </Card>

          {/* Earnings Summary */}
          <Card className="mb-4">
            <CardHeader className="pb-2 flex flex-row items-center justify-between">
              <CardTitle className="text-base">Earnings Summary</CardTitle>
              <div className="flex space-x-1">
                <Badge 
                  variant={activeTab === 'daily' ? "default" : "outline"} 
                  className="cursor-pointer" 
                  onClick={() => setActiveTab('daily')}
                >
                  Daily
                </Badge>
                <Badge 
                  variant={activeTab === 'weekly' ? "default" : "outline"} 
                  className="cursor-pointer" 
                  onClick={() => setActiveTab('weekly')}
                >
                  Weekly
                </Badge>
                <Badge 
                  variant={activeTab === 'monthly' ? "default" : "outline"} 
                  className="cursor-pointer" 
                  onClick={() => setActiveTab('monthly')}
                >
                  Monthly
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="h-32 bg-gray-50 rounded-lg flex items-center justify-center mb-2">
                {/* This would be a chart in a real implementation */}
                <p className="text-sm text-gray-500">Earnings chart would appear here</p>
              </div>
              <div className="text-right">
                <div className="text-lg font-bold">
                  {activeTab === 'daily' && projectedEarnings.daily.toFixed(2)}
                  {activeTab === 'weekly' && projectedEarnings.weekly.toFixed(2)}
                  {activeTab === 'monthly' && projectedEarnings.monthly.toFixed(2)} $WAVES
                </div>
              </div>
            </CardContent>
          </Card>
          
          <div className="grid md:grid-cols-12 gap-4">
            {/* User Avatar */}
            <div className="md:col-span-4">
              <Card className="h-full">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Your Avatar</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col items-center">
                  <div className="w-16 h-16 rounded-full bg-gray-200 overflow-hidden mb-2">
                    {user?.avatar_url ? (
                      <img src={user.avatar_url} alt="User avatar" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-core text-white text-xl font-bold">
                        {user?.username?.charAt(0) || 'U'}
                      </div>
                    )}
                  </div>
                  <div className="font-medium">{user?.username || 'Username'}</div>
                  <div className="text-xs text-gray-500">Mining since {new Date().toLocaleDateString()}</div>
                </CardContent>
              </Card>
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
                      <Button variant="ghost" size="sm" className="h-6 w-6 p-0 ml-1">
                        <FontAwesomeIcon icon={faClipboard} className="h-4 w-4" />
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
                  <Button variant="outline" className="w-full mt-2 text-xs" onClick={() => window.location.href = '/referrals'}>
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
          
          {/* Community Activity - Placeholder */}
          <div className="mt-4">
            <h2 className="text-base font-bold mb-2">Community Activity</h2>
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-white border border-gray-100 rounded-lg p-2 text-xs">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 bg-gray-100 rounded-full flex-shrink-0"></div>
                    <div className="flex-grow">
                      <span className="font-medium">User{i}</span> {" "}
                      {i === 1 && "mined 24.5 $WAVES"}
                      {i === 2 && "minted Bronze NFT"}
                      {i === 3 && "joined crew CoreMiners"}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default Dashboard;
