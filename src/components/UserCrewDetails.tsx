
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Crew, CrewMember } from '@/types';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { toast } from '@/hooks/use-toast';
import { useQuery } from '@tanstack/react-query';

interface UserCrewDetailsProps {
  crew: Crew;
  onLeave: () => void;
}

export const UserCrewDetails = ({ crew, onLeave }: UserCrewDetailsProps) => {
  const { user } = useAuth();
  const [isLeaving, setIsLeaving] = useState(false);
  const isOwner = crew.owner_id === user?.id;

  const { data: members, isLoading } = useQuery({
    queryKey: ['crew-members', crew.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('crew_members')
        .select('*, user:user_id(username, avatar_url, mining_rate)')
        .eq('crew_id', crew.id);
        
      if (error) throw error;
      return data as CrewMember[];
    }
  });

  const handleLeaveCrew = async () => {
    if (!user) return;
    
    try {
      setIsLeaving(true);
      
      if (isOwner) {
        toast({
          title: "Cannot leave crew",
          description: "As the crew owner, you must transfer ownership or disband the crew",
          variant: "destructive"
        });
        return;
      }
      
      const { error } = await supabase
        .from('crew_members')
        .delete()
        .eq('crew_id', crew.id)
        .eq('user_id', user.id);
        
      if (error) throw error;
      
      toast({
        title: "Crew left",
        description: "You've successfully left the crew"
      });
      
      onLeave();
    } catch (error: any) {
      console.error('Error leaving crew:', error);
      toast({
        title: "Failed to leave crew",
        description: error.message || "An error occurred. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLeaving(false);
    }
  };
  
  const handleDisbandCrew = async () => {
    if (!user || !isOwner) return;
    
    try {
      setIsLeaving(true);
      
      // Delete the crew (this will cascade delete members due to FK constraint)
      const { error } = await supabase
        .from('crews')
        .delete()
        .eq('id', crew.id)
        .eq('owner_id', user.id);
        
      if (error) throw error;
      
      toast({
        title: "Crew disbanded",
        description: "Your crew has been disbanded"
      });
      
      onLeave();
    } catch (error: any) {
      console.error('Error disbanding crew:', error);
      toast({
        title: "Failed to disband crew",
        description: error.message || "An error occurred. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLeaving(false);
    }
  };

  // Calculate total mining power
  const totalMiningPower = members?.reduce((sum, member) => {
    return sum + (member.user?.mining_rate || 0);
  }, 0);

  return (
    <div className="grid md:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <Avatar className="h-12 w-12">
              <AvatarImage src={crew.avatar_url || ''} />
              <AvatarFallback>{crew.name.substring(0, 2).toUpperCase()}</AvatarFallback>
            </Avatar>
            <div>
              <CardTitle>{crew.name}</CardTitle>
              <CardDescription>
                {isOwner ? 'You are the owner of this crew' : 'You are a member of this crew'}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h3 className="font-medium mb-1">Description</h3>
              <p className="text-gray-600">{crew.description}</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-50 p-4 rounded-lg text-center">
                <p className="text-sm text-gray-500">Members</p>
                <p className="text-2xl font-bold">{members?.length || 0}</p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg text-center">
                <p className="text-sm text-gray-500">Mining Power</p>
                <p className="text-2xl font-bold">{totalMiningPower?.toFixed(1) || '0.0'}</p>
              </div>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex gap-2">
          {isOwner ? (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" disabled={isLeaving}>
                  Disband Crew
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will permanently delete your crew and remove all members. This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDisbandCrew}>
                    Disband Crew
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          ) : (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" disabled={isLeaving}>
                  Leave Crew
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will remove you from the crew. You will need to be invited back to rejoin.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleLeaveCrew}>
                    Leave Crew
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </CardFooter>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Members</CardTitle>
          <CardDescription>
            {members?.length || 0} members in this crew
          </CardDescription>
        </CardHeader>
        <CardContent className="max-h-[400px] overflow-y-auto">
          {isLoading ? (
            <div className="flex justify-center py-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-core"></div>
            </div>
          ) : members && members.length > 0 ? (
            <div className="space-y-3">
              {members.map((member) => (
                <div key={member.id} className="flex items-center justify-between p-2 border rounded-md">
                  <div className="flex items-center gap-2">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={member.user?.avatar_url || ''} />
                      <AvatarFallback>
                        {member.user?.username?.substring(0, 2).toUpperCase() || 'UN'}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{member.user?.username || 'Unknown User'}</p>
                      <p className="text-xs text-gray-500 capitalize">{member.role}</p>
                    </div>
                  </div>
                  <div className="text-sm text-gray-600">
                    {member.user?.mining_rate?.toFixed(1) || '0.0'} power
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center py-4 text-gray-500">No members found</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
