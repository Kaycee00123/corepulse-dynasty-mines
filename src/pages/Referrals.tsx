
import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useReferrals } from '@/contexts/ReferralContext';
import { Navigation } from '@/components/Navigation';
import { Footer } from '@/components/Footer';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from "@/hooks/use-toast";

const Referrals = () => {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const { referrals, totalReferrals, totalBonusEarned, referralCode, isLoading: referralLoading } = useReferrals();
  
  const [copied, setCopied] = useState(false);
  
  // Construct the referral URL (this would be the actual deployed URL)
  const referralUrl = `https://corepulse.app/signup?ref=${referralCode}`;
  
  const handleCopyClick = async () => {
    try {
      await navigator.clipboard.writeText(referralUrl);
      setCopied(true);
      toast({
        title: "Copied!",
        description: "Referral link copied to clipboard.",
      });
      
      // Reset the copied state after 2 seconds
      setTimeout(() => {
        setCopied(false);
      }, 2000);
    } catch (err) {
      console.error('Failed to copy text:', err);
      toast({
        title: "Failed to copy",
        description: "Please select and copy the link manually.",
        variant: "destructive"
      });
    }
  };
  
  const handleShareClick = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: 'Join CorePulse Mining DApp',
          text: 'Join me on CorePulse and start mining virtual tokens! Use my referral code to get started.',
          url: referralUrl,
        });
      } else {
        toast({
          title: "Share not supported",
          description: "Your browser doesn't support sharing. Please copy the link instead.",
          variant: "destructive"
        });
      }
    } catch (err) {
      console.error('Error sharing:', err);
    }
  };

  // If not authenticated, redirect to sign in
  if (!authLoading && !isAuthenticated) {
    return <Navigate to="/signin" replace />;
  }
  
  // Loading state
  if (authLoading || referralLoading) {
    return <div className="h-screen flex items-center justify-center">Loading...</div>;
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Navigation />
      
      <main className="flex-grow bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="heading-xl mb-2">Referral Program</h1>
            <p className="text-body">
              Invite friends to join CorePulse and earn bonus tokens for each referred user's mining activities.
            </p>
          </div>

          {/* Referral Stats */}
          <div className="grid grid-cols-1 gap-6 mb-8 md:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Your Referral Code</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-core">{referralCode}</div>
                <p className="text-xs text-gray-500 mt-1">Share this code with friends</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Total Referrals</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-core">{totalReferrals}</div>
                <p className="text-xs text-gray-500 mt-1">Users who joined with your code</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Bonus Earned</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-core">{totalBonusEarned.toFixed(2)}</div>
                <p className="text-xs text-gray-500 mt-1">Tokens earned from referrals</p>
              </CardContent>
            </Card>
          </div>

          {/* Referral Link */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Your Referral Link</CardTitle>
              <CardDescription>
                Share this link with friends to earn referral bonuses when they sign up and mine tokens
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center">
                <Input 
                  value={referralUrl} 
                  readOnly 
                  className="flex-grow mr-2"
                />
                <Button
                  onClick={handleCopyClick}
                  variant="outline"
                  className={copied ? "bg-green-50 text-green-600" : ""}
                >
                  {copied ? "Copied!" : "Copy"}
                </Button>
                {navigator.share && (
                  <Button
                    onClick={handleShareClick}
                    variant="outline"
                    className="ml-2"
                  >
                    Share
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* How It Works */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>How It Works</CardTitle>
            </CardHeader>
            <CardContent>
              <ol className="list-decimal list-inside space-y-2">
                <li className="text-gray-700">Share your referral link or code with friends</li>
                <li className="text-gray-700">When they sign up using your referral, they become part of your network</li>
                <li className="text-gray-700">You earn 5% of their mining rewards as bonus tokens</li>
                <li className="text-gray-700">There's no limit to how many people you can refer</li>
              </ol>
            </CardContent>
          </Card>

          {/* Referral History */}
          <Card>
            <CardHeader>
              <CardTitle>Referral History</CardTitle>
              <CardDescription>Users who signed up with your referral code</CardDescription>
            </CardHeader>
            <CardContent>
              {referrals.length === 0 ? (
                <div className="text-center py-6">
                  <div className="text-gray-400 mb-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-medium">No referrals yet</h3>
                  <p className="text-gray-500 mt-1">
                    Share your referral link or code with friends to start earning bonuses!
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead>
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User ID</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Bonus Earned</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {referrals.map((referral) => (
                        <tr key={referral.id}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {new Date(referral.created_at).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {/* In a real app, this would show the username */}
                            {referral.referred_id.substring(0, 8)}...
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {referral.bonus_earned.toFixed(2)} tokens
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default Referrals;
