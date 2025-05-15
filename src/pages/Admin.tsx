import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAdmin } from '@/contexts/AdminContext';
import { AdminStats } from '@/components/admin/AdminStats';
import { AdminUserList } from '@/components/admin/AdminUserList';
import { AdminNFTsManager } from '@/components/admin/AdminNFTsManager';
import { AdminCrewsManager } from '@/components/admin/AdminCrewsManager';
import { AdminSettings } from '@/components/admin/AdminSettings';
import { AdminSecurity } from '@/components/admin/AdminSecurity';
import { AdminContent } from '@/components/admin/AdminContent';
import { AdminTransactions } from '@/components/admin/AdminTransactions';
import { AdminRoles } from '@/components/admin/AdminRoles';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { ChevronRight, Users, Settings, Shield, FileText, CreditCard, BarChart, UserCog } from 'lucide-react';

export default function Admin() {
  const navigate = useNavigate();
  const { isAdmin, hasPermission } = useAdmin();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('overview');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAdminAccess = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          navigate('/login');
      return;
    }
    
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', session.user.id)
          .single();

        if (!profile || profile.role !== 'admin') {
          navigate('/');
          return;
        }

        setIsLoading(false);
      } catch (error) {
        console.error('Error checking admin access:', error);
        navigate('/');
      }
    };

    checkAdminAccess();
  }, [navigate]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
          <p className="text-gray-600">You don't have permission to access this page.</p>
        </div>
      </div>
    );
  }

  const quickActions = [
    {
      title: 'View Users',
      description: 'Manage user accounts and permissions',
      icon: <Users className="h-6 w-6" />,
      action: () => setActiveTab('users'),
      permission: 'users'
    },
    {
      title: 'Role Management',
      description: 'Manage roles and permissions',
      icon: <UserCog className="h-6 w-6" />,
      action: () => setActiveTab('roles'),
      permission: 'roles'
    },
    {
      title: 'System Settings',
      description: 'Configure global system parameters',
      icon: <Settings className="h-6 w-6" />,
      action: () => setActiveTab('settings'),
      permission: 'settings'
    },
    {
      title: 'Security & Logs',
      description: 'View security logs and audit trails',
      icon: <Shield className="h-6 w-6" />,
      action: () => setActiveTab('security'),
      permission: 'security'
    },
    {
      title: 'Content Management',
      description: 'Manage announcements and legal content',
      icon: <FileText className="h-6 w-6" />,
      action: () => setActiveTab('content'),
      permission: 'content'
    },
    {
      title: 'Transactions',
      description: 'View and manage user transactions',
      icon: <CreditCard className="h-6 w-6" />,
      action: () => setActiveTab('transactions'),
      permission: 'transactions'
    },
    {
      title: 'Analytics',
      description: 'View system statistics and reports',
      icon: <BarChart className="h-6 w-6" />,
      action: () => setActiveTab('overview'),
      permission: 'analytics'
    }
  ];

  return (
    <div className="container mx-auto py-8 space-y-8">
      {/* Breadcrumb Navigation */}
      <div className="flex items-center space-x-2 text-sm text-gray-500">
        <span>Admin</span>
        <ChevronRight className="h-4 w-4" />
        <span className="capitalize">{activeTab}</span>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {quickActions.map((action) => (
          hasPermission(action.permission, 'read') && (
            <Card
              key={action.title}
              className="cursor-pointer hover:bg-gray-50 transition-colors"
              onClick={action.action}
            >
              <CardContent className="p-6">
                <div className="flex items-start space-x-4">
                  <div className="p-2 bg-gray-100 rounded-lg">
                    {action.icon}
                  </div>
                  <div>
                    <h3 className="font-semibold">{action.title}</h3>
                    <p className="text-sm text-gray-500">{action.description}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        ))}
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="roles">Roles</TabsTrigger>
          <TabsTrigger value="nfts">NFTs</TabsTrigger>
          <TabsTrigger value="crews">Crews</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="content">Content</TabsTrigger>
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview">
          <AdminStats />
        </TabsContent>
        
        <TabsContent value="users">
          <AdminUserList />
        </TabsContent>

        <TabsContent value="roles">
          <AdminRoles />
        </TabsContent>
        
        <TabsContent value="nfts">
          <AdminNFTsManager />
        </TabsContent>
        
        <TabsContent value="crews">
          <AdminCrewsManager />
        </TabsContent>

        <TabsContent value="settings">
          <AdminSettings />
        </TabsContent>

        <TabsContent value="security">
          <AdminSecurity />
        </TabsContent>

        <TabsContent value="content">
          <AdminContent />
        </TabsContent>

        <TabsContent value="transactions">
          <AdminTransactions />
        </TabsContent>
      </Tabs>
    </div>
  );
}
