import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAdmin } from '@/contexts/AdminContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface Content {
  id: string;
  type: 'announcement' | 'faq' | 'terms' | 'privacy';
  title: string;
  content: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export function AdminContent() {
  const { hasPermission, logAdminAction } = useAdmin();
  const [contents, setContents] = useState<Content[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('announcements');
  const [editingContent, setEditingContent] = useState<Content | null>(null);
  const [newContent, setNewContent] = useState({
    type: 'announcement',
    title: '',
    content: '',
    is_active: true
  });

  useEffect(() => {
    if (hasPermission('content', 'read')) {
      fetchContents();
    }
  }, [hasPermission]);

  const fetchContents = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('content')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setContents(data || []);
    } catch (error) {
      console.error('Error fetching content:', error);
      toast({
        title: "Error",
        description: "Failed to fetch content. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveContent = async () => {
    if (!hasPermission('content', 'write')) {
      toast({
        title: "Permission denied",
        description: "You don't have permission to modify content.",
        variant: "destructive"
      });
      return;
    }

    try {
      if (editingContent) {
        const { error } = await supabase
          .from('content')
          .update({
            title: editingContent.title,
            content: editingContent.content,
            is_active: editingContent.is_active,
            updated_at: new Date().toISOString()
          })
          .eq('id', editingContent.id);

        if (error) throw error;

        await logAdminAction('update_content', 'content', editingContent.id);
        toast({
          title: "Content updated",
          description: "Content has been updated successfully."
        });
      } else {
        const { error } = await supabase
          .from('content')
          .insert([{
            ...newContent,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }]);

        if (error) throw error;

        await logAdminAction('create_content', 'content');
        toast({
          title: "Content created",
          description: "New content has been created successfully."
        });
      }

      setEditingContent(null);
      setNewContent({
        type: 'announcement',
        title: '',
        content: '',
        is_active: true
      });
      fetchContents();
    } catch (error) {
      console.error('Error saving content:', error);
      toast({
        title: "Error",
        description: "Failed to save content. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleEditContent = (content: Content) => {
    setEditingContent(content);
  };

  const handleDeleteContent = async (id: string) => {
    if (!hasPermission('content', 'write')) {
      toast({
        title: "Permission denied",
        description: "You don't have permission to delete content.",
        variant: "destructive"
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('content')
        .delete()
        .eq('id', id);

      if (error) throw error;

      await logAdminAction('delete_content', 'content', id);
      toast({
        title: "Content deleted",
        description: "Content has been deleted successfully."
      });
      fetchContents();
    } catch (error) {
      console.error('Error deleting content:', error);
      toast({
        title: "Error",
        description: "Failed to delete content. Please try again.",
        variant: "destructive"
      });
    }
  };

  if (!hasPermission('content', 'read')) {
    return (
      <div className="text-center py-12">
        <p className="text-red-500">You don't have permission to view content management.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Content Management</CardTitle>
          <CardDescription>Manage announcements, FAQs, and legal content</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList>
              <TabsTrigger value="announcements">Announcements</TabsTrigger>
              <TabsTrigger value="faq">FAQ</TabsTrigger>
              <TabsTrigger value="legal">Legal</TabsTrigger>
            </TabsList>

            <TabsContent value="announcements" className="space-y-4">
              <div className="space-y-4">
                <Input
                  placeholder="Title"
                  value={editingContent?.title || newContent.title}
                  onChange={(e) => editingContent 
                    ? setEditingContent({ ...editingContent, title: e.target.value })
                    : setNewContent({ ...newContent, title: e.target.value })
                  }
                />
                <Textarea
                  placeholder="Content"
                  value={editingContent?.content || newContent.content}
                  onChange={(e) => editingContent
                    ? setEditingContent({ ...editingContent, content: e.target.value })
                    : setNewContent({ ...newContent, content: e.target.value })
                  }
                  className="min-h-[200px]"
                />
                <Button onClick={handleSaveContent}>
                  {editingContent ? 'Update Content' : 'Create Content'}
                </Button>
              </div>

              <div className="space-y-4 mt-8">
                <h3 className="text-lg font-semibold">Existing Announcements</h3>
                {contents
                  .filter(c => c.type === 'announcement')
                  .map(content => (
                    <Card key={content.id}>
                      <CardContent className="pt-6">
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-semibold">{content.title}</h4>
                            <p className="text-sm text-gray-500 mt-1">{content.content}</p>
                          </div>
                          <div className="space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEditContent(content)}
                            >
                              Edit
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => handleDeleteContent(content.id)}
                            >
                              Delete
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
              </div>
            </TabsContent>

            <TabsContent value="faq" className="space-y-4">
              {/* Similar structure for FAQ management */}
            </TabsContent>

            <TabsContent value="legal" className="space-y-4">
              {/* Similar structure for legal content management */}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
} 