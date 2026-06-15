import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Mail, Save, AlertTriangle } from 'lucide-react';
import { motion } from 'framer-motion';

export default function AdminSettings() {
  const [user, setUser] = useState(null);
  const [settings, setSettings] = useState({
    admin_notification_email: '',
    rental_reminder_days: 3,
    app_name: 'Harvest Coffee'
  });
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');

  useEffect(() => {
    const checkAdmin = async () => {
      try {
        const currentUser = await base44.auth.me();
        setUser(currentUser);
        if (currentUser.role !== 'admin') {
          window.location.href = '/';
        }
        
        // Load settings from user's admin profile
        if (currentUser.admin_settings) {
          setSettings(currentUser.admin_settings);
        }
      } catch (error) {
        window.location.href = '/';
      }
    };
    checkAdmin();
  }, []);

  const handleSaveSettings = async () => {
    setIsSaving(true);
    try {
      await base44.auth.updateMe({
        admin_settings: settings
      });
      setSaveMessage('Settings saved successfully');
      setTimeout(() => setSaveMessage(''), 3000);
    } catch (error) {
      setSaveMessage('Error saving settings');
    } finally {
      setIsSaving(false);
    }
  };

  if (!user || user.role !== 'admin') {
    return <div className="text-center py-12">Loading...</div>;
  }

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold text-amber-900 mb-2" style={{ fontFamily: 'Georgia, serif' }}>
          Admin Settings
        </h1>
        <p className="text-amber-700">Configure system settings and notifications</p>
      </div>

      {/* Success Message */}
      {saveMessage && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`p-4 rounded-lg ${saveMessage.includes('success') ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}
        >
          {saveMessage}
        </motion.div>
      )}

      {/* Email Notifications */}
      <Card className="border-amber-100">
        <CardHeader className="bg-gradient-to-r from-amber-50 to-orange-50 border-b">
          <CardTitle className="text-amber-900 flex items-center gap-2">
            <Mail className="w-5 h-5" />
            Email Notifications
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">
              Admin Notification Email
            </label>
            <p className="text-xs text-gray-500 mb-2">
              Email address where admin alerts and rental reminders will be sent
            </p>
            <Input
              type="email"
              value={settings.admin_notification_email}
              onChange={(e) => setSettings({ ...settings, admin_notification_email: e.target.value })}
              placeholder="admin@example.com"
              className="border-amber-200"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">
              Rental Reminder Days Before Expiration
            </label>
            <p className="text-xs text-gray-500 mb-2">
              Number of days before rental expiration to send reminder (default: 3)
            </p>
            <Input
              type="number"
              value={settings.rental_reminder_days}
              onChange={(e) => setSettings({ ...settings, rental_reminder_days: parseInt(e.target.value) || 3 })}
              min="1"
              max="30"
              className="border-amber-200"
            />
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex gap-3">
        <Button
          onClick={handleSaveSettings}
          disabled={isSaving}
          className="bg-amber-900 hover:bg-amber-800"
        >
          <Save className="w-4 h-4 mr-2" />
          {isSaving ? 'Saving...' : 'Save Settings'}
        </Button>
      </div>

      {/* Information Card */}
      <Card className="border-blue-200 bg-blue-50">
        <CardContent className="p-6">
          <div className="flex gap-3">
            <AlertTriangle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-900">
              <p className="font-semibold mb-2">Rental Reminder System</p>
              <ul className="space-y-1 text-xs">
                <li>• Reminders are automatically sent 3 days before rental expiration</li>
                <li>• Emails sent to both customer and admin notification email</li>
                <li>• System checks for expiring rentals daily at midnight UTC</li>
                <li>• Only products in 'Machines' category can be rented</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}