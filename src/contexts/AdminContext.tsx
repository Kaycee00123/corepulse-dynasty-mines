import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { AdminRole, UserRole, AdminLog } from '@/types';

interface AdminContextType {
  isAdmin: boolean;
  roles: AdminRole[];
  userRoles: UserRole[];
  hasPermission: (resource: string, action: string) => boolean;
  logAdminAction: (action: string, entityType: string, entityId?: string, details?: any) => Promise<void>;
  isLoading: boolean;
}

const AdminContext = createContext<AdminContextType | undefined>(undefined);

export function AdminProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [roles, setRoles] = useState<AdminRole[]>([]);
  const [userRoles, setUserRoles] = useState<UserRole[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user) {
      checkAdminStatus();
    } else {
      setIsAdmin(false);
      setRoles([]);
      setUserRoles([]);
      setIsLoading(false);
    }
  }, [user]);

  const checkAdminStatus = async () => {
    try {
      setIsLoading(true);
      
      // First, get the super_admin role
      const { data: adminRole, error: roleError } = await supabase
        .from('admin_roles')
        .select('*')
        .eq('name', 'super_admin')
        .single();
        
      if (roleError) throw roleError;
      
      if (!adminRole) {
        setIsAdmin(false);
        return;
      }
      
      // Then check if the user has this role
      const { data: userRolesData, error: userRolesError } = await supabase
        .from('user_roles')
        .select('*')
        .eq('user_id', user?.id)
        .eq('role_id', adminRole.id);
        
      if (userRolesError) throw userRolesError;
      
      const hasAdminRole = userRolesData && userRolesData.length > 0;
      
      if (hasAdminRole) {
        setRoles([adminRole]);
        setUserRoles(userRolesData);
        setIsAdmin(true);
      } else {
        setIsAdmin(false);
        setRoles([]);
        setUserRoles([]);
      }
    } catch (error) {
      console.error('Error checking admin status:', error);
      setIsAdmin(false);
    } finally {
      setIsLoading(false);
    }
  };

  const hasPermission = (resource: string, action: string): boolean => {
    if (!isAdmin) return false;
    
    return roles.some(role => {
      const permissions = role.permissions[resource as keyof typeof role.permissions];
      return permissions && permissions.includes(action);
    });
  };

  const logAdminAction = async (
    action: string,
    entityType: string,
    entityId?: string,
    details?: any
  ) => {
    if (!isAdmin) return;
    
    try {
      const { error } = await supabase
        .from('admin_logs')
        .insert({
          user_id: user?.id,
          action,
          entity_type: entityType,
          entity_id: entityId,
          details
        });
        
      if (error) throw error;
    } catch (error) {
      console.error('Error logging admin action:', error);
    }
  };

  return (
    <AdminContext.Provider
      value={{
        isAdmin,
        roles,
        userRoles,
        hasPermission,
        logAdminAction,
        isLoading
      }}
    >
      {children}
    </AdminContext.Provider>
  );
}

export function useAdmin() {
  const context = useContext(AdminContext);
  if (context === undefined) {
    throw new Error('useAdmin must be used within an AdminProvider');
  }
  return context;
} 