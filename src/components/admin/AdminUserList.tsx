
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { 
  Table, 
  TableHeader, 
  TableBody, 
  TableHead, 
  TableRow, 
  TableCell 
} from '@/components/ui/table';
import { toast } from '@/hooks/use-toast';
import { User } from '@/types';

export function AdminUserList() {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editForm, setEditForm] = useState({
    mining_rate: 0,
    mining_boost: 0
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setIsLoading(true);
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*, user_balances(tokens)')
        .order('created_at', { ascending: false });
        
      if (error) throw error;
      
      // Process data to include tokens balance
      const processedUsers = data.map((user: any) => {
        return {
          ...user,
          tokens: user.user_balances?.tokens || 0
        };
      });
      
      setUsers(processedUsers as User[]);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditUser = (user: User) => {
    setSelectedUser(user);
    setEditForm({
      mining_rate: user.mining_rate,
      mining_boost: user.mining_boost
    });
    setIsEditDialogOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!selectedUser) return;
    
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          mining_rate: editForm.mining_rate,
          mining_boost: editForm.mining_boost
        })
        .eq('id', selectedUser.id);
        
      if (error) throw error;
      
      toast({
        title: "User updated",
        description: `${selectedUser.username}'s profile has been updated`
      });
      
      // Update local state
      setUsers(users.map(u => 
        u.id === selectedUser.id ? { ...u, ...editForm } : u
      ));
      
      setIsEditDialogOpen(false);
    } catch (error: any) {
      console.error('Error updating user:', error);
      toast({
        title: "Failed to update user",
        description: error.message || "An error occurred. Please try again.",
        variant: "destructive"
      });
    }
  };

  const filteredUsers = searchTerm 
    ? users.filter(user => 
        user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : users;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div className="w-full md:w-1/3">
          <Input
            placeholder="Search users..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Button variant="outline" onClick={fetchUsers}>
          Refresh
        </Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[250px]">User</TableHead>
              <TableHead>Mining Rate</TableHead>
              <TableHead>Mining Boost</TableHead>
              <TableHead>Tokens</TableHead>
              <TableHead>Streak</TableHead>
              <TableHead>Last Active</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center">
                  Loading users...
                </TableCell>
              </TableRow>
            ) : filteredUsers.length > 0 ? (
              filteredUsers.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={user.avatar_url || ''} />
                        <AvatarFallback>
                          {user.username.substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div>{user.username}</div>
                        <div className="text-xs text-gray-500">{user.email}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{user.mining_rate.toFixed(2)}</TableCell>
                  <TableCell>{user.mining_boost.toFixed(2)}%</TableCell>
                  <TableCell>{user.tokens?.toFixed(2) || '0.00'}</TableCell>
                  <TableCell>{user.streak_days} days</TableCell>
                  <TableCell>
                    {user.last_active ? new Date(user.last_active).toLocaleDateString() : 'Never'}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEditUser(user)}
                    >
                      Edit
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center">
                  No users found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit User: {selectedUser?.username}</DialogTitle>
            <DialogDescription>
              Adjust mining parameters for this user
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label htmlFor="mining-rate" className="text-sm font-medium">
                  Mining Rate
                </label>
                <Input
                  id="mining-rate"
                  type="number"
                  step="0.1"
                  min="0"
                  value={editForm.mining_rate}
                  onChange={(e) => setEditForm({...editForm, mining_rate: parseFloat(e.target.value)})}
                />
              </div>
              
              <div className="space-y-2">
                <label htmlFor="mining-boost" className="text-sm font-medium">
                  Mining Boost (%)
                </label>
                <Input
                  id="mining-boost"
                  type="number"
                  step="0.1"
                  min="0"
                  value={editForm.mining_boost}
                  onChange={(e) => setEditForm({...editForm, mining_boost: parseFloat(e.target.value)})}
                />
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveEdit}>
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
