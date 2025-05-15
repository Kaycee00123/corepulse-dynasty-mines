import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { useAdmin } from '@/contexts/AdminContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface Role {
  id: string;
  name: string;
  description: string;
  permissions: {
    [key: string]: {
      read: boolean;
      write: boolean;
    };
  };
  created_at: string;
  updated_at: string;
}

interface UserRole {
  id: string;
  user_id: string;
  role_id: string;
  created_at: string;
  user: {
    username: string;
  };
  role: {
    name: string;
  };
}

export function AdminRoles() {
  const { hasPermission, logAdminAction } = useAdmin();
  const [roles, setRoles] = useState<Role[]>([]);
  const [userRoles, setUserRoles] = useState<UserRole[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [newRole, setNewRole] = useState({
    name: '',
    description: '',
    permissions: {
      users: { read: false, write: false },
      nfts: { read: false, write: false },
      crews: { read: false, write: false },
      settings: { read: false, write: false },
      security: { read: false, write: false },
      content: { read: false, write: false },
      transactions: { read: false, write: false },
      analytics: { read: false, write: false }
    }
  });

  useEffect(() => {
    if (hasPermission('roles', 'read')) {
      fetchRoles();
      fetchUserRoles();
    }
  }, [hasPermission]);

  const fetchRoles = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('roles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRoles(data || []);
    } catch (error) {
      console.error('Error fetching roles:', error);
      toast({
        title: "Error",
        description: "Failed to fetch roles. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchUserRoles = async () => {
    try {
      const { data, error } = await supabase
        .from('user_roles')
        .select('*, user:user_id(username), role:role_id(name)')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setUserRoles(data || []);
    } catch (error) {
      console.error('Error fetching user roles:', error);
      toast({
        title: "Error",
        description: "Failed to fetch user roles. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleSaveRole = async () => {
    if (!hasPermission('roles', 'write')) {
      toast({
        title: "Permission denied",
        description: "You don't have permission to modify roles.",
        variant: "destructive"
      });
      return;
    }

    try {
      if (editingRole) {
        const { error } = await supabase
          .from('roles')
          .update({
            name: editingRole.name,
            description: editingRole.description,
            permissions: editingRole.permissions,
            updated_at: new Date().toISOString()
          })
          .eq('id', editingRole.id);

        if (error) throw error;

        await logAdminAction('update_role', 'role', editingRole.id);
        toast({
          title: "Role updated",
          description: "Role has been updated successfully."
        });
      } else {
        const { error } = await supabase
          .from('roles')
          .insert([{
            ...newRole,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }]);

        if (error) throw error;

        await logAdminAction('create_role', 'role');
        toast({
          title: "Role created",
          description: "New role has been created successfully."
        });
      }

      setEditingRole(null);
      setNewRole({
        name: '',
        description: '',
        permissions: {
          users: { read: false, write: false },
          nfts: { read: false, write: false },
          crews: { read: false, write: false },
          settings: { read: false, write: false },
          security: { read: false, write: false },
          content: { read: false, write: false },
          transactions: { read: false, write: false },
          analytics: { read: false, write: false }
        }
      });
      fetchRoles();
    } catch (error) {
      console.error('Error saving role:', error);
      toast({
        title: "Error",
        description: "Failed to save role. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleDeleteRole = async (id: string) => {
    if (!hasPermission('roles', 'write')) {
      toast({
        title: "Permission denied",
        description: "You don't have permission to delete roles.",
        variant: "destructive"
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('roles')
        .delete()
        .eq('id', id);

      if (error) throw error;

      await logAdminAction('delete_role', 'role', id);
      toast({
        title: "Role deleted",
        description: "Role has been deleted successfully."
      });
      fetchRoles();
    } catch (error) {
      console.error('Error deleting role:', error);
      toast({
        title: "Error",
        description: "Failed to delete role. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleAssignRole = async (userId: string, roleId: string) => {
    if (!hasPermission('roles', 'write')) {
      toast({
        title: "Permission denied",
        description: "You don't have permission to assign roles.",
        variant: "destructive"
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('user_roles')
        .insert([{
          user_id: userId,
          role_id: roleId,
          created_at: new Date().toISOString()
        }]);

      if (error) throw error;

      await logAdminAction('assign_role', 'user_role', userId, { roleId });
      toast({
        title: "Role assigned",
        description: "Role has been assigned successfully."
      });
      fetchUserRoles();
    } catch (error) {
      console.error('Error assigning role:', error);
      toast({
        title: "Error",
        description: "Failed to assign role. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleRemoveRole = async (id: string) => {
    if (!hasPermission('roles', 'write')) {
      toast({
        title: "Permission denied",
        description: "You don't have permission to remove roles.",
        variant: "destructive"
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('user_roles')
        .delete()
        .eq('id', id);

      if (error) throw error;

      await logAdminAction('remove_role', 'user_role', id);
      toast({
        title: "Role removed",
        description: "Role has been removed successfully."
      });
      fetchUserRoles();
    } catch (error) {
      console.error('Error removing role:', error);
      toast({
        title: "Error",
        description: "Failed to remove role. Please try again.",
        variant: "destructive"
      });
    }
  };

  if (!hasPermission('roles', 'read')) {
    return (
      <div className="text-center py-12">
        <p className="text-red-500">You don't have permission to view role management.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Role Management</CardTitle>
          <CardDescription>Create and manage roles and permissions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div className="space-y-4">
              <Input
                placeholder="Role Name"
                value={editingRole?.name || newRole.name}
                onChange={(e) => editingRole
                  ? setEditingRole({ ...editingRole, name: e.target.value })
                  : setNewRole({ ...newRole, name: e.target.value })
                }
              />
              <Input
                placeholder="Description"
                value={editingRole?.description || newRole.description}
                onChange={(e) => editingRole
                  ? setEditingRole({ ...editingRole, description: e.target.value })
                  : setNewRole({ ...newRole, description: e.target.value })
                }
              />

              <div className="space-y-4">
                <h3 className="font-semibold">Permissions</h3>
                {Object.entries(editingRole?.permissions || newRole.permissions).map(([key, value]) => (
                  <div key={key} className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="capitalize">{key}</Label>
                      <div className="flex space-x-4">
                        <div className="flex items-center space-x-2">
                          <Switch
                            checked={value.read}
                            onCheckedChange={(checked) => {
                              if (editingRole) {
                                setEditingRole({
                                  ...editingRole,
                                  permissions: {
                                    ...editingRole.permissions,
                                    [key]: { ...value, read: checked }
                                  }
                                });
                              } else {
                                setNewRole({
                                  ...newRole,
                                  permissions: {
                                    ...newRole.permissions,
                                    [key]: { ...value, read: checked }
                                  }
                                });
                              }
                            }}
                          />
                          <Label>Read</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Switch
                            checked={value.write}
                            onCheckedChange={(checked) => {
                              if (editingRole) {
                                setEditingRole({
                                  ...editingRole,
                                  permissions: {
                                    ...editingRole.permissions,
                                    [key]: { ...value, write: checked }
                                  }
                                });
                              } else {
                                setNewRole({
                                  ...newRole,
                                  permissions: {
                                    ...newRole.permissions,
                                    [key]: { ...value, write: checked }
                                  }
                                });
                              }
                            }}
                          />
                          <Label>Write</Label>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <Button onClick={handleSaveRole}>
                {editingRole ? 'Update Role' : 'Create Role'}
              </Button>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Existing Roles</h3>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {roles.map((role) => (
                      <TableRow key={role.id}>
                        <TableCell>{role.name}</TableCell>
                        <TableCell>{role.description}</TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setEditingRole(role)}
                            >
                              Edit
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => handleDeleteRole(role.id)}
                            >
                              Delete
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-semibold">User Role Assignments</h3>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {userRoles.map((userRole) => (
                      <TableRow key={userRole.id}>
                        <TableCell>{userRole.user?.username || 'Unknown'}</TableCell>
                        <TableCell>{userRole.role?.name || 'Unknown'}</TableCell>
                        <TableCell>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleRemoveRole(userRole.id)}
                          >
                            Remove
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 