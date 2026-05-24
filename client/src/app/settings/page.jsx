'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { useAuthStore } from '@/store/authStore';
import { userService } from '@/services/userService';
import Avatar from '@/components/common/Avatar';
import Input from '@/components/common/Input';
import Button from '@/components/common/Button';
import {
  HiArrowLeft, HiUser, HiPencil, HiCamera,
  HiSun, HiMoon, HiBell, HiEye, HiStatusOnline,
  HiCheckCircle, HiShieldCheck, HiLogout,
} from 'react-icons/hi';
import toast from 'react-hot-toast';

export default function SettingsPage() {
  const router = useRouter();
  const { user, theme, toggleTheme, logout, updateUser } = useAuthStore();
  const [form, setForm] = useState({
    username: '',
    bio: '',
    phone: '',
    showLastSeen: true,
    readReceipts: true,
    typingStatus: true,
    notificationSound: true,
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user) {
      setForm({
        username: user.username || '',
        bio: user.bio || '',
        phone: user.phone || '',
        showLastSeen: user.showLastSeen !== false,
        readReceipts: user.readReceipts !== false,
        typingStatus: user.typingStatus !== false,
        notificationSound: user.notificationSound !== false,
      });
    }
  }, [user]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const { data } = await userService.updateProfile(form);
      updateUser(data.data);
      toast.success('Profile updated');
    } catch (error) {
      toast.error('Failed to update profile');
    }
    setSaving(false);
  };

  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('avatar', file);

    try {
      const { data } = await userService.updateAvatar(formData);
      updateUser({ avatar: data.data.avatar });
      toast.success('Avatar updated');
    } catch {
      toast.error('Failed to update avatar');
    }
  };

  const Toggle = ({ value, onChange, label, description }) => (
    <div className="flex items-center justify-between py-3">
      <div>
        <p className="text-sm font-medium text-gray-900 dark:text-dark-text">{label}</p>
        {description && <p className="text-xs text-gray-500 dark:text-gray-400">{description}</p>}
      </div>
      <button
        onClick={() => onChange(!value)}
        className={`relative w-11 h-6 rounded-full transition-colors ${
          value ? 'bg-primary-600' : 'bg-gray-300 dark:bg-gray-600'
        }`}
      >
        <span
          className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
            value ? 'translate-x-5' : ''
          }`}
        />
      </button>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-dark-bg">
      <div className="max-w-2xl mx-auto p-4">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={() => router.back()}
            className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-dark-hover"
          >
            <HiArrowLeft className="w-6 h-6 text-gray-600 dark:text-dark-text" />
          </button>
          <h1 className="text-xl font-bold text-gray-900 dark:text-dark-text">Settings</h1>
        </div>

        {/* Profile Section */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-dark-header rounded-2xl p-6 mb-4 shadow-sm"
        >
          <div className="flex items-center gap-4 mb-6">
            <div className="relative group">
              <Avatar src={user?.avatar} name={user?.username} size="xl" />
              <label className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-full opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity">
                <HiCamera className="w-8 h-8 text-white" />
                <input type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
              </label>
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-dark-text">{user?.username}</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">{user?.email}</p>
              <p className="text-xs text-gray-400 mt-1">{user?.bio}</p>
            </div>
          </div>

          <div className="space-y-4">
            <Input
              label="Username"
              value={form.username}
              onChange={(e) => setForm({ ...form, username: e.target.value })}
              icon={HiUser}
            />
            <Input
              label="Bio"
              value={form.bio}
              onChange={(e) => setForm({ ...form, bio: e.target.value })}
              icon={HiPencil}
            />
            <Input
              label="Phone"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              type="tel"
            />
          </div>

          <Button onClick={handleSave} loading={saving} className="mt-4">
            Save Changes
          </Button>
        </motion.div>

        {/* Privacy Section */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white dark:bg-dark-header rounded-2xl p-6 mb-4 shadow-sm"
        >
          <h3 className="text-lg font-semibold text-gray-900 dark:text-dark-text mb-4 flex items-center gap-2">
            <HiShieldCheck className="w-5 h-5 text-primary-600" />
            Privacy
          </h3>
          <div className="divide-y divide-gray-100 dark:divide-dark-border">
            <Toggle
              label="Last Seen & Online"
              description="Show when you were last active"
              value={form.showLastSeen}
              onChange={(v) => setForm({ ...form, showLastSeen: v })}
            />
            <Toggle
              label="Read Receipts"
              description="Show when you read messages"
              value={form.readReceipts}
              onChange={(v) => setForm({ ...form, readReceipts: v })}
            />
            <Toggle
              label="Typing Indicator"
              description="Show when you are typing"
              value={form.typingStatus}
              onChange={(v) => setForm({ ...form, typingStatus: v })}
            />
          </div>
        </motion.div>

        {/* Notifications Section */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white dark:bg-dark-header rounded-2xl p-6 mb-4 shadow-sm"
        >
          <h3 className="text-lg font-semibold text-gray-900 dark:text-dark-text mb-4 flex items-center gap-2">
            <HiBell className="w-5 h-5 text-primary-600" />
            Notifications
          </h3>
          <div className="divide-y divide-gray-100 dark:divide-dark-border">
            <Toggle
              label="Message Sound"
              description="Play sound for new messages"
              value={form.notificationSound}
              onChange={(v) => setForm({ ...form, notificationSound: v })}
            />
          </div>
        </motion.div>

        {/* Appearance Section */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white dark:bg-dark-header rounded-2xl p-6 mb-4 shadow-sm"
        >
          <h3 className="text-lg font-semibold text-gray-900 dark:text-dark-text mb-4 flex items-center gap-2">
            {theme === 'dark' ? <HiMoon className="w-5 h-5 text-primary-600" /> : <HiSun className="w-5 h-5 text-primary-600" />}
            Appearance
          </h3>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-dark-text">Theme</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">{theme === 'dark' ? 'Dark Mode' : 'Light Mode'}</p>
            </div>
            <button
              onClick={toggleTheme}
              className="px-4 py-2 bg-gray-100 dark:bg-dark-hover rounded-xl text-sm text-gray-700 dark:text-dark-text hover:bg-gray-200 dark:hover:bg-dark-border transition-colors"
            >
              {theme === 'dark' ? '☀️ Light' : '🌙 Dark'}
            </button>
          </div>
        </motion.div>

        {/* Sign Out */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <button
            onClick={logout}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-white dark:bg-dark-header rounded-2xl shadow-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
          >
            <HiLogout className="w-5 h-5" />
            <span className="font-medium">Sign Out</span>
          </button>
        </motion.div>
      </div>
    </div>
  );
}
