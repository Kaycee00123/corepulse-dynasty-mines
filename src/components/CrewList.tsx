
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Crew } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';

interface CrewListProps {
  onJoinCrew: () => void;
}

export const CrewList = ({ onJoinCrew }: CrewListProps) => {
  const { user } = useAuth();
  const [crews, setCrews] = useState<Crew[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [joiningCrewId, setJoiningCrewId] = useState<string | null>(null);

  useEffect(() => {
    fetchCrews();
  }, []);

  const fetchCrews = async () => {
    try {
      setIsLoading(true);
      
      // Get list of public crews with member count
      const { data, error } = await supabase
        .from('crews')
        .select('*, crew_members(count)')
        .order('created_at', { ascending: false });
        
      if (error) throw error;
      
      // Process data to include member count
      const processedCrews = data.map((crew: any) => {
        const memberCount = crew.crew_members?.[0]?.count || 0;
        return {
          ...crew,
          member_count: memberCount
        };
      });
      
      setCrews(processedCrews as Crew[]);
    } catch (error) {
      console.error('Error fetching crews:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleJoinCrew = async (crewId: string) => {
    if (!user) return;
    
    try {
      setJoiningCrewId(crewId);
      
      // First check if user is already in a crew
      const { data: existingMembership, error: membershipError } = await supabase
        .from('crew_members')
        .select('*')
        .eq('user_id', user.id);
        
      if (membershipError) throw membershipError;
      
      if (existingMembership && existingMembership.length > 0) {
        toast({
          title: "Already in a crew",
          description: "You must leave your current crew before joining another",
          variant: "destructive"
        });
        return;
      }
      
      // Join the crew as member
      const { error: joinError } = await supabase
        .from('crew_members')
        .insert({
          crew_id: crewId,
          user_id: user.id,
          role: 'member'
        });
        
      if (joinError) throw joinError;
      
      toast({
        title: "Crew joined!",
        description: "You've successfully joined the crew"
      });
      
      onJoinCrew();
    } catch (error: any) {
      console.error('Error joining crew:', error);
      toast({
        title: "Failed to join crew",
        description: error.message || "An error occurred. Please try again.",
        variant: "destructive"
      });
    } finally {
      setJoiningCrewId(null);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Join a Crew</CardTitle>
        <CardDescription>
          Find a crew to join and mine together
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 max-h-[500px] overflow-y-auto">
        {isLoading ? (
          <div className="flex justify-center py-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-core"></div>
          </div>
        ) : crews.length > 0 ? (
          crews.map((crew) => (
            <div key={crew.id} className="border rounded-lg p-4 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <Avatar>
                  <AvatarImage src={crew.avatar_url || ''} />
                  <AvatarFallback>{crew.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-medium">{crew.name}</h3>
                  <p className="text-sm text-gray-500">{crew.member_count || 0} members</p>
                </div>
              </div>
              <Button 
                variant="outline" 
                size="sm"
                disabled={joiningCrewId === crew.id}
                onClick={() => handleJoinCrew(crew.id)}
              >
                {joiningCrewId === crew.id ? 'Joining...' : 'Join'}
              </Button>
            </div>
          ))
        ) : (
          <p className="text-center py-4 text-gray-500">No crews available to join</p>
        )}
      </CardContent>
    </Card>
  );
};
