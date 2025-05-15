import { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Navigation } from '@/components/Navigation';
import { Footer } from '@/components/Footer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { supabase } from '@/integrations/supabase/client';
import { AvatarUploader } from '@/components/AvatarUploader';
import { toast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { Database } from '@/integrations/supabase/types';

type NotificationPreferences = Database['public']['Tables']['profiles']['Update']['notification_preferences'];

const Profile = () => {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const [username, setUsername] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [notificationPreferences, setNotificationPreferences] = useState<NotificationPreferences>({
    email: true,
    push: true,
    epoch_events: true,
    mining_updates: true,
    referral_updates: true
  });

  useEffect(() => {
    if (user) {
      setUsername(user.username || '');
      setAvatarUrl(user.avatar_url || null);
      if (user.notification_preferences) {
        setNotificationPreferences(user.notification_preferences);
      }
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
      const updateData = {
        username,
        notification_preferences: notificationPreferences
      };

      const { error } = await supabase
        .from('profiles')
        .update(updateData)
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

            {/* Notification Preferences */}
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle>Notification Preferences</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Email Notifications</Label>
                      <p className="text-sm text-gray-500">Receive notifications via email</p>
                    </div>
                    <Switch
                      checked={notificationPreferences.email}
                      onCheckedChange={(checked) => 
                        setNotificationPreferences(prev => ({ ...prev, email: checked }))
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Push Notifications</Label>
                      <p className="text-sm text-gray-500">Receive push notifications</p>
                    </div>
                    <Switch
                      checked={notificationPreferences.push}
                      onCheckedChange={(checked) => 
                        setNotificationPreferences(prev => ({ ...prev, push: checked }))
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Epoch Events</Label>
                      <p className="text-sm text-gray-500">Get notified about epoch transitions</p>
                    </div>
                    <Switch
                      checked={notificationPreferences.epoch_events}
                      onCheckedChange={(checked) => 
                        setNotificationPreferences(prev => ({ ...prev, epoch_events: checked }))
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Mining Updates</Label>
                      <p className="text-sm text-gray-500">Receive updates about your mining activity</p>
                    </div>
                    <Switch
                      checked={notificationPreferences.mining_updates}
                      onCheckedChange={(checked) => 
                        setNotificationPreferences(prev => ({ ...prev, mining_updates: checked }))
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Referral Updates</Label>
                      <p className="text-sm text-gray-500">Get notified about referral activities</p>
                    </div>
                    <Switch
                      checked={notificationPreferences.referral_updates}
                      onCheckedChange={(checked) => 
                        setNotificationPreferences(prev => ({ ...prev, referral_updates: checked }))
                      }
                    />
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
