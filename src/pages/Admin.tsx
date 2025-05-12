
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AdminUserList } from '@/components/admin/AdminUserList';
import { AdminStats } from '@/components/admin/AdminStats';
import { AdminNFTsManager } from '@/components/admin/AdminNFTsManager';
import { AdminCrewsManager } from '@/components/admin/AdminCrewsManager';

const AdminPage = () => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/signin');
      return;
    }
    
    checkAdminStatus();
  }, [isAuthenticated, navigate]);

  const checkAdminStatus = async () => {
    if (!user) return;
    
    try {
      setIsLoading(true);
      
      // For simplicity, we're checking if the username is 'admin'
      // In a real app, you would use a proper role-based system
      setIsAdmin(user.username === 'admin');
      
      if (user.username !== 'admin') {
        navigate('/dashboard');
      }
    } catch (error) {
      console.error('Error checking admin status:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="container flex items-center justify-center min-h-[600px]">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-core"></div>
      </div>
    );
  }

  if (!isAdmin) {
    return null; // We'll navigate away, but this prevents flashing content
  }

  return (
    <div className="container max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Admin Panel</h1>
      
      <Tabs defaultValue="stats" className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="stats">Stats</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="nfts">NFTs</TabsTrigger>
          <TabsTrigger value="crews">Crews</TabsTrigger>
        </TabsList>
        
        <TabsContent value="stats">
          <AdminStats />
        </TabsContent>
        
        <TabsContent value="users">
          <AdminUserList />
        </TabsContent>
        
        <TabsContent value="nfts">
          <AdminNFTsManager />
        </TabsContent>
        
        <TabsContent value="crews">
          <AdminCrewsManager />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminPage;
