
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/hooks/use-toast';
import { Crew } from '@/types';
import { CrewList } from '@/components/CrewList';
import { UserCrewDetails } from '@/components/UserCrewDetails';

const CrewsPage = () => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [userCrew, setUserCrew] = useState<Crew | null>(null);
  const [isCreatingCrew, setIsCreatingCrew] = useState(false);
  const [newCrewData, setNewCrewData] = useState({
    name: '',
    description: '',
    avatar_url: ''
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/signin');
      return;
    }
    
    fetchUserCrew();
  }, [isAuthenticated, navigate]);

  const fetchUserCrew = async () => {
    if (!user) return;
    
    try {
      setIsLoading(true);
      
      // Check if user is already in a crew
      const { data: crewMembership, error: membershipError } = await supabase
        .from('crew_members')
        .select('*, crews(*)')
        .eq('user_id', user.id)
        .single();
        
      if (membershipError && membershipError.code !== 'PGRST116') {
        console.error('Error fetching crew membership:', membershipError);
      }
      
      if (crewMembership?.crews) {
        setUserCrew(crewMembership.crews as Crew);
      }
    } catch (error) {
      console.error('Error fetching user crew:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateCrew = async () => {
    if (!user) return;
    
    if (!newCrewData.name.trim()) {
      toast({
        title: "Crew name required",
        description: "Please enter a name for your crew",
        variant: "destructive"
      });
      return;
    }
    
    try {
      setIsCreatingCrew(true);
      
      // Create new crew
      const { data: newCrew, error: crewError } = await supabase
        .from('crews')
        .insert({
          name: newCrewData.name,
          description: newCrewData.description,
          avatar_url: newCrewData.avatar_url || null,
          owner_id: user.id
        })
        .select()
        .single();
        
      if (crewError) throw crewError;
      
      // Add owner as crew member with role 'owner'
      const { error: memberError } = await supabase
        .from('crew_members')
        .insert({
          crew_id: newCrew.id,
          user_id: user.id,
          role: 'owner'
        });
        
      if (memberError) throw memberError;
      
      toast({
        title: "Crew created!",
        description: `You've successfully created ${newCrewData.name}`
      });
      
      setUserCrew(newCrew as Crew);
      setNewCrewData({ name: '', description: '', avatar_url: '' });
      setIsCreatingCrew(false);
    } catch (error: any) {
      console.error('Error creating crew:', error);
      toast({
        title: "Failed to create crew",
        description: error.message || "An error occurred. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsCreatingCrew(false);
    }
  };

  return (
    <div className="container max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Crews</h1>
      
      {isLoading ? (
        <div className="flex justify-center my-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-core"></div>
        </div>
      ) : userCrew ? (
        <UserCrewDetails crew={userCrew} onLeave={fetchUserCrew} />
      ) : (
        <div className="grid md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Create Your Crew</CardTitle>
              <CardDescription>
                Create your own crew and invite other miners to join forces
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label htmlFor="crew-name" className="text-sm font-medium block mb-1">
                  Crew Name
                </label>
                <Input 
                  id="crew-name"
                  placeholder="Enter crew name" 
                  value={newCrewData.name}
                  onChange={(e) => setNewCrewData({...newCrewData, name: e.target.value})}
                />
              </div>
              <div>
                <label htmlFor="crew-desc" className="text-sm font-medium block mb-1">
                  Description
                </label>
                <Textarea 
                  id="crew-desc"
                  placeholder="Tell us about your crew" 
                  value={newCrewData.description}
                  onChange={(e) => setNewCrewData({...newCrewData, description: e.target.value})}
                />
              </div>
              <div>
                <label htmlFor="avatar-url" className="text-sm font-medium block mb-1">
                  Avatar URL (optional)
                </label>
                <Input 
                  id="avatar-url"
                  placeholder="https://example.com/avatar.png" 
                  value={newCrewData.avatar_url}
                  onChange={(e) => setNewCrewData({...newCrewData, avatar_url: e.target.value})}
                />
              </div>
            </CardContent>
            <CardFooter>
              <Button 
                onClick={handleCreateCrew} 
                disabled={isCreatingCrew || !newCrewData.name.trim()}
              >
                {isCreatingCrew ? 'Creating...' : 'Create Crew'}
              </Button>
            </CardFooter>
          </Card>
          
          <CrewList onJoinCrew={fetchUserCrew} />
        </div>
      )}
    </div>
  );
};

export default CrewsPage;
