
import { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Navigation } from '@/components/Navigation';
import { Footer } from '@/components/Footer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { AvatarUploader } from '@/components/AvatarUploader';
import { toast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

const Profile = () => {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const [username, setUsername] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      setUsername(user.username || '');
      setAvatarUrl(user.avatar_url || null);
    }
  }, [user]);

  // If not authenticated, redirect to sign in
  if (!authLoading && !isAuthenticated) {
    return <Navigate to="/signin" replace />;
  }

  // Loading state
  if (authLoading) {
    return <div className="h-screen flex items-center justify-center">Loading...</div>;
  }

  const handleUpdateProfile = async () => {
    if (!user) return;
    
    setIsUpdating(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          username: username
        })
        .eq('id', user.id);

      if (error) throw error;

      toast({
        title: "Profile Updated",
        description: "Your profile has been successfully updated.",
      });
    } catch (error: any) {
      console.error('Error updating profile:', error);
      toast({
        title: "Update Failed",
        description: error.message || "Failed to update profile. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Navigation />
      
      <main className="flex-grow bg-white py-8">
        <div className="max-w-3xl mx-auto px-4">
          <h1 className="text-2xl font-bold mb-6">Your Profile</h1>
          
          <div className="grid md:grid-cols-2 gap-6">
            {/* Avatar Upload */}
            <Card>
              <CardHeader>
                <CardTitle>Profile Picture</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col items-center">
                <AvatarUploader
                  userId={user?.id || ''}
                  existingUrl={avatarUrl}
                  onUploadComplete={(url) => setAvatarUrl(url)}
                />
              </CardContent>
            </Card>
            
            {/* User Information */}
            <Card>
              <CardHeader>
                <CardTitle>Your Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={user?.email || ''}
                      disabled
                      className="bg-gray-50"
                    />
                    <p className="text-sm text-gray-500">Email cannot be changed</p>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="username">Username</Label>
                    <Input
                      id="username"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="Enter your username"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="referral">Your Referral Code</Label>
                    <Input
                      id="referral"
                      value={user?.referral_code || ''}
                      disabled
                      className="bg-gray-50"
                    />
                    <p className="text-sm text-gray-500">Referral code cannot be changed</p>
                  </div>
                  
                  <div className="pt-4">
                    <Button 
                      onClick={handleUpdateProfile}
                      disabled={isUpdating}
                      className="w-full"
                    >
                      {isUpdating ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Updating...
                        </>
                      ) : 'Update Profile'}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* Account Statistics */}
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle>Account Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-gray-50 p-4 rounded-lg text-center">
                    <div className="text-sm text-gray-500">Member Since</div>
                    <div className="font-medium">
                      {user?.created_at ? new Date(user.created_at).toLocaleDateString() : '-'}
                    </div>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg text-center">
                    <div className="text-sm text-gray-500">Mining Streak</div>
                    <div className="font-medium">
                      {user?.streak_days || 0} days
                    </div>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg text-center">
                    <div className="text-sm text-gray-500">Mining Rate</div>
                    <div className="font-medium">
                      {user?.mining_rate?.toFixed(2) || '1.00'}/min
                    </div>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg text-center">
                    <div className="text-sm text-gray-500">Mining Boost</div>
                    <div className="font-medium">
                      +{user?.mining_boost || 0}%
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default Profile;
