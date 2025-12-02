import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { getSettings, saveSettings, getAllMenuItems, getAllBills } from '@/lib/db';
import { AppSettings } from '@/types';
import { Save, Download, Moon, Sun } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { exportDataBackup } from '@/lib/export';

// CLOUD SYNC (Hard-coded API URL system)
import { loadAllFromCloudAndOverwriteLocal } from '@/lib/cloud/cloud-load';
import { pushFullSync } from '@/lib/cloud/cloud';
import { startAutoSync, stopAutoSync } from '@/lib/cloud/cloud-auto';

export default function Settings() {
  const [settings, setSettings] = useState<AppSettings>({
    shopName: 'My Restaurant',
    shopAddress: '',
    shopGST: '',
    cgstRate: 2.5,
    sgstRate: 2.5,
    printerFormat: '80mm',
    theme: 'dark',
    autoSync: false,
    currency: '₹',

    // NOTE: URL is visible in UI but NOT USED in Option 1
    googleSheetsUrl: '',
  });

  const [isDarkMode, setIsDarkMode] = useState(true);
  const { toast } = useToast();

  // Load settings on mount
  useEffect(() => {
    loadSettings();

    const theme = localStorage.getItem('theme') || 'dark';
    setIsDarkMode(theme === 'dark');
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, []);

  const loadSettings = async () => {
    try {
      const data = await getSettings();
      if (data) {
        setSettings(data);

        // Option 1: Hard-coded URL → No parameter needed
        await loadAllFromCloudAndOverwriteLocal();

        setIsDarkMode(data.theme === 'dark');
      }
    } catch (error) {
      console.error('Failed to load settings:', error);
    }
  };

  const handleSave = async () => {
    try {
      await saveSettings({
        ...settings,
        id: 'settings-1',
      });

      // Auto-sync toggle
      if (settings.autoSync) startAutoSync();
      else stopAutoSync();

      document.documentElement.classList.toggle('dark', settings.theme === 'dark');
      localStorage.setItem('theme', settings.theme);

      toast({
        title: 'Success',
        description: 'Settings saved successfully',
      });
    } catch (error) {
      console.error('Failed to save settings:', error);
      toast({
        title: 'Error',
        description: 'Failed to save settings',
        variant: 'destructive',
      });
    }
  };

  const handleThemeToggle = () => {
    const newTheme = isDarkMode ? 'light' : 'dark';
    setIsDarkMode(!isDarkMode);
    setSettings({ ...settings, theme: newTheme });
  };

  const handleBackup = async () => {
    try {
      const [bills, menuItems] = await Promise.all([
        getAllBills(),
        getAllMenuItems(),
      ]);
      exportDataBackup(bills, menuItems, `pos-backup-${Date.now()}.json`);
      toast({
        title: 'Success',
        description: 'Backup created successfully',
      });
    } catch (error) {
      console.error('Failed to create backup:', error);
      toast({
        title: 'Error',
        description: 'Failed to create backup',
        variant: 'destructive',
      });
    }
  };

  const handleManualSync = async () => {
    try {
      const [bills, menu, appSettings] = await Promise.all([
        getAllBills(),
        getAllMenuItems(),
        getSettings(),
      ]);

      await pushFullSync({ bills, menu, settings: appSettings });

      toast({
        title: "Success",
        description: "Cloud sync completed",
      });
    } catch (err) {
      console.error(err);
      toast({
        title: "Error",
        description: "Cloud sync failed",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold">Settings</h1>
          <p className="text-muted-foreground">Configure your POS system</p>
        </div>
        <Button onClick={handleSave} size="lg">
          <Save className="mr-2 h-5 w-5" />
          Save Settings
        </Button>
      </div>

      <Tabs defaultValue="shop" className="space-y-6">
        <TabsList>
          <TabsTrigger value="shop">Shop Info</TabsTrigger>
          <TabsTrigger value="billing">Billing</TabsTrigger>
          <TabsTrigger value="appearance">Appearance</TabsTrigger>
          <TabsTrigger value="backup">Backup</TabsTrigger>
        </TabsList>

        {/* SHOP INFO TAB */}
        <TabsContent value="shop" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Shop Information</CardTitle>
              <CardDescription>This information will appear on printed bills</CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="shop-name">Shop Name *</Label>
                <Input
                  id="shop-name"
                  value={settings.shopName}
                  onChange={(e) => setSettings({ ...settings, shopName: e.target.value })}
                  placeholder="Enter shop name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="shop-address">Shop Address</Label>
                <Textarea
                  id="shop-address"
                  value={settings.shopAddress}
                  onChange={(e) => setSettings({ ...settings, shopAddress: e.target.value })}
                  rows={3}
                  placeholder="Address"
                />
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="gst">GST</Label>
                  <Input
                    id="gst"
                    value={settings.shopGST}
                    onChange={(e) => setSettings({ ...settings, shopGST: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    value={settings.shopPhone || ''}
                    onChange={(e) => setSettings({ ...settings, shopPhone: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  value={settings.shopEmail || ''}
                  onChange={(e) => setSettings({ ...settings, shopEmail: e.target.value })}
                />
              </div>

            </CardContent>
          </Card>
        </TabsContent>

        {/* BILLING TAB */}
        <TabsContent value="billing" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Billing Tax</CardTitle>
              <CardDescription>Configure GST rates</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>CGST (%)</Label>
                  <Input
                    value={settings.cgstRate}
                    onChange={(e) => setSettings({ ...settings, cgstRate: parseFloat(e.target.value) })}
                  />
                </div>

                <div>
                  <Label>SGST (%)</Label>
                  <Input
                    value={settings.sgstRate}
                    onChange={(e) => setSettings({ ...settings, sgstRate: parseFloat(e.target.value) })}
                  />
                </div>
              </div>

              <div>
                <Label>Currency</Label>
                <Input
                  value={settings.currency}
                  onChange={(e) => setSettings({ ...settings, currency: e.target.value })}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Printer Settings</CardTitle>
            </CardHeader>
            <CardContent>
              <Label>Printer Format</Label>
              <Select
                value={settings.printerFormat}
                onValueChange={(value: any) => setSettings({ ...settings, printerFormat: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="58mm">58mm</SelectItem>
                  <SelectItem value="80mm">80mm</SelectItem>
                </SelectContent>
              </Select>
            </CardContent>
          </Card>
        </TabsContent>

        {/* APPEARANCE TAB */}
        <TabsContent value="appearance">
          <Card>
            <CardHeader>
              <CardTitle>Theme</CardTitle>
            </CardHeader>
            <CardContent className="flex justify-between items-center">
              <span>Dark Mode</span>
              <div className="flex items-center gap-2">
                <Sun className="h-4 w-4" />
                <Switch checked={isDarkMode} onCheckedChange={handleThemeToggle} />
                <Moon className="h-4 w-4" />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* BACKUP + CLOUD TAB */}
        <TabsContent value="backup" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Backup</CardTitle>
            </CardHeader>
            <CardContent>
              <Button variant="outline" onClick={handleBackup}>
                <Download className="mr-2 h-4 w-4" />
                Download Backup
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Cloud Sync</CardTitle>
              <CardDescription>Using hard-coded Apps Script URL</CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">

              {/* Field still visible but unused */}
              <div>
                <Label>Google Script URL (Not used)</Label>
                <Input
                  value={settings.googleSheetsUrl}
                  onChange={(e) =>
                    setSettings({ ...settings, googleSheetsUrl: e.target.value })
                  }
                  placeholder="Visible only"
                />
              </div>

              <div className="flex justify-between items-center">
                <div>
                  <Label>Enable Auto Sync</Label>
                </div>
                <Switch
                  checked={settings.autoSync}
                  onCheckedChange={(checked) =>
                    setSettings({ ...settings, autoSync: checked })
                  }
                />
              </div>

              <Button className="w-full" onClick={handleManualSync}>
                Sync All Data Now
              </Button>

            </CardContent>
          </Card>
        </TabsContent>

      </Tabs>
    </div>
  );
}
