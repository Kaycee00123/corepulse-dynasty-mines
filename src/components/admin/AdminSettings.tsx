import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useAdmin } from '@/contexts/AdminContext';
import { toast } from '@/hooks/use-toast';

export function AdminSettings() {
  const { hasPermission, logAdminAction } = useAdmin();
  const [isLoading, setIsLoading] = useState(false);
  const [settings, setSettings] = useState({
    maintenanceMode: false,
    globalMiningRate: 1.0,
    globalBoostPercentage: 0,
    minMiningRate: 0.1,
    maxMiningRate: 10.0,
    minBoostPercentage: 0,
    maxBoostPercentage: 100,
    maintenanceMessage: 'System is under maintenance. Please try again later.',
  });

  const handleSaveSettings = async () => {
    if (!hasPermission('settings', 'write')) {
      toast({
        title: "Permission denied",
        description: "You don't have permission to modify settings.",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    try {
      // TODO: Implement settings save logic
      await logAdminAction('update_settings', 'system', undefined, settings);
      toast({
        title: "Settings updated",
        description: "System settings have been updated successfully."
      });
    } catch (error) {
      console.error('Error saving settings:', error);
      toast({
        title: "Error",
        description: "Failed to update settings. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!hasPermission('settings', 'read')) {
    return (
      <div className="text-center py-12">
        <p className="text-red-500">You don't have permission to view settings.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>System Settings</CardTitle>
          <CardDescription>Configure global system parameters</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Maintenance Mode</Label>
              <p className="text-sm text-gray-500">Enable to put the system under maintenance</p>
            </div>
            <Switch
              checked={settings.maintenanceMode}
              onCheckedChange={(checked) => setSettings({ ...settings, maintenanceMode: checked })}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Global Mining Rate</Label>
              <Input
                type="number"
                step="0.1"
                value={settings.globalMiningRate}
                onChange={(e) => setSettings({ ...settings, globalMiningRate: parseFloat(e.target.value) })}
              />
            </div>
            <div className="space-y-2">
              <Label>Global Boost Percentage</Label>
              <Input
                type="number"
                step="0.1"
                value={settings.globalBoostPercentage}
                onChange={(e) => setSettings({ ...settings, globalBoostPercentage: parseFloat(e.target.value) })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Minimum Mining Rate</Label>
              <Input
                type="number"
                step="0.1"
                value={settings.minMiningRate}
                onChange={(e) => setSettings({ ...settings, minMiningRate: parseFloat(e.target.value) })}
              />
            </div>
            <div className="space-y-2">
              <Label>Maximum Mining Rate</Label>
              <Input
                type="number"
                step="0.1"
                value={settings.maxMiningRate}
                onChange={(e) => setSettings({ ...settings, maxMiningRate: parseFloat(e.target.value) })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Minimum Boost Percentage</Label>
              <Input
                type="number"
                step="0.1"
                value={settings.minBoostPercentage}
                onChange={(e) => setSettings({ ...settings, minBoostPercentage: parseFloat(e.target.value) })}
              />
            </div>
            <div className="space-y-2">
              <Label>Maximum Boost Percentage</Label>
              <Input
                type="number"
                step="0.1"
                value={settings.maxBoostPercentage}
                onChange={(e) => setSettings({ ...settings, maxBoostPercentage: parseFloat(e.target.value) })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Maintenance Message</Label>
            <Input
              value={settings.maintenanceMessage}
              onChange={(e) => setSettings({ ...settings, maintenanceMessage: e.target.value })}
            />
          </div>

          <Button onClick={handleSaveSettings} disabled={isLoading}>
            {isLoading ? 'Saving...' : 'Save Settings'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
} 