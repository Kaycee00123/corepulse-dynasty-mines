
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Table, 
  TableHeader, 
  TableBody, 
  TableHead, 
  TableRow, 
  TableCell 
} from '@/components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { toast } from '@/hooks/use-toast';
import { Crew, CrewMember } from '@/types';

export function AdminCrewsManager() {
  const [crews, setCrews] = useState<Crew[]>([]);
  const [selectedCrew, setSelectedCrew] = useState<Crew | null>(null);
  const [crewMembers, setCrewMembers] = useState<CrewMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isMembersLoading, setIsMembersLoading] = useState(false);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchCrews();
  }, []);

  const fetchCrews = async () => {
    try {
      setIsLoading(true);
      
      // Get crews with member count
      const { data, error } = await supabase
        .from('crews')
        .select(`
          *, 
          owner:owner_id(username),
          crew_members(count)
        `)
        .order('created_at', { ascending: false });
        
      if (error) throw error;
      
      // Process data to include member count
      const processedCrews = data.map((crew: any) => {
        return {
          ...crew,
          member_count: crew.crew_members?.[0]?.count || 0
        };
      });
      
      setCrews(processedCrews as Crew[]);
    } catch (error) {
      console.error('Error fetching crews:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchCrewMembers = async (crewId: string) => {
    try {
      setIsMembersLoading(true);
      
      const { data, error } = await supabase
        .from('crew_members')
        .select(`
          *,
          user:user_id(username, avatar_url, mining_rate)
        `)
        .eq('crew_id', crewId)
        .order('joined_at', { ascending: false });
        
      if (error) throw error;
      
      setCrewMembers(data as CrewMember[]);
    } catch (error) {
      console.error('Error fetching crew members:', error);
    } finally {
      setIsMembersLoading(false);
    }
  };

  const handleViewCrewDetails = (crew: Crew) => {
    setSelectedCrew(crew);
    fetchCrewMembers(crew.id);
    setIsDetailsDialogOpen(true);
  };

  const handleDisbandCrew = async (crew: Crew) => {
    try {
      // Delete the crew (this will cascade delete members due to FK constraint)
      const { error } = await supabase
        .from('crews')
        .delete()
        .eq('id', crew.id);
        
      if (error) throw error;
      
      toast({
        title: "Crew disbanded",
        description: `The crew "${crew.name}" has been disbanded`
      });
      
      // Update local state
      setCrews(crews.filter(c => c.id !== crew.id));
    } catch (error: any) {
      console.error('Error disbanding crew:', error);
      toast({
        title: "Failed to disband crew",
        description: error.message || "An error occurred. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleRemoveMember = async (member: CrewMember) => {
    try {
      // Check if member is the owner
      if (member.role === 'owner') {
        toast({
          title: "Cannot remove owner",
          description: "Transfer ownership to another member before removing the owner",
          variant: "destructive"
        });
        return;
      }
      
      const { error } = await supabase
        .from('crew_members')
        .delete()
        .eq('id', member.id);
        
      if (error) throw error;
      
      toast({
        title: "Member removed",
        description: `The member has been removed from the crew`
      });
      
      // Update local state
      setCrewMembers(crewMembers.filter(m => m.id !== member.id));
      
      // Update crew member count in local state
      if (selectedCrew) {
        setCrews(crews.map(c => 
          c.id === selectedCrew.id 
            ? { ...c, member_count: (c.member_count || 0) - 1 } 
            : c
        ));
      }
    } catch (error: any) {
      console.error('Error removing member:', error);
      toast({
        title: "Failed to remove member",
        description: error.message || "An error occurred. Please try again.",
        variant: "destructive"
      });
    }
  };

  const filteredCrews = searchTerm 
    ? crews.filter(crew => 
        crew.name.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : crews;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div className="w-full md:w-1/3">
          <Input
            placeholder="Search crews..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Button variant="outline" onClick={fetchCrews}>
          Refresh
        </Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[250px]">Crew</TableHead>
              <TableHead>Owner</TableHead>
              <TableHead>Members</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center">
                  Loading crews...
                </TableCell>
              </TableRow>
            ) : filteredCrews.length > 0 ? (
              filteredCrews.map((crew) => (
                <TableRow key={crew.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={crew.avatar_url || ''} />
                        <AvatarFallback>{crew.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <div>
                        <div>{crew.name}</div>
                        <div className="text-xs text-gray-500 truncate max-w-[200px]">
                          {crew.description}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{crew.owner?.username || 'Unknown'}</TableCell>
                  <TableCell>{crew.member_count || 0}</TableCell>
                  <TableCell>
                    {new Date(crew.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="mr-2"
                      onClick={() => handleViewCrewDetails(crew)}
                    >
                      Details
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-red-500 hover:text-red-700"
                      onClick={() => handleDisbandCrew(crew)}
                    >
                      Disband
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center">
                  No crews found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={isDetailsDialogOpen} onOpenChange={setIsDetailsDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>{selectedCrew?.name} - Members</DialogTitle>
            <DialogDescription>
              Manage crew members
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[250px]">User</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Mining Power</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isMembersLoading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center">
                      Loading members...
                    </TableCell>
                  </TableRow>
                ) : crewMembers.length > 0 ? (
                  crewMembers.map((member) => (
                    <TableRow key={member.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={member.user?.avatar_url || ''} />
                            <AvatarFallback>
                              {member.user?.username?.substring(0, 2).toUpperCase() || 'UN'}
                            </AvatarFallback>
                          </Avatar>
                          <div>{member.user?.username || 'Unknown'}</div>
                        </div>
                      </TableCell>
                      <TableCell className="capitalize">{member.role}</TableCell>
                      <TableCell>{member.user?.mining_rate?.toFixed(1) || '0.0'}</TableCell>
                      <TableCell>
                        {new Date(member.joined_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-red-500 hover:text-red-700"
                          disabled={member.role === 'owner'}
                          onClick={() => handleRemoveMember(member)}
                        >
                          Remove
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center">
                      No members found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
          
          <DialogFooter>
            <Button onClick={() => setIsDetailsDialogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
