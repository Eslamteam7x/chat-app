'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import Input from '@/components/common/Input';
import Button from '@/components/common/Button';
import { HiMail, HiArrowLeft } from 'react-icons/hi';
import toast from 'react-hot-toast';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) return toast.error('Please enter your email');

    setLoading(true);
    // Simulate sending email - in production, call API
    setTimeout(() => {
      setSent(true);
      setLoading(false);
      toast.success('Password reset link sent to your email');
    }, 1500);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 via-white to-purple-50 dark:from-dark-bg dark:via-dark-header dark:to-dark-bg p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="bg-white dark:bg-dark-header rounded-3xl shadow-2xl shadow-primary-500/10 p-8">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-100 dark:bg-primary-900/30 rounded-2xl mb-4">
              <HiMail className="w-8 h-8 text-primary-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-dark-text">Forgot Password</h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1">
              {sent ? 'Check your email for the reset link' : 'Enter your email to reset your password'}
            </p>
          </div>

          {sent ? (
            <div className="text-center">
              <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-4 mb-4">
                <p className="text-green-700 dark:text-green-400 text-sm">
                  We&apos;ve sent a password reset link to <strong>{email}</strong>
                </p>
              </div>
              <Link
                href="/auth/login"
                className="text-primary-600 hover:text-primary-700 font-medium text-sm"
              >
                Back to login
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                label="Email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                icon={HiMail}
              />

              <Button type="submit" fullWidth loading={loading}>
                Send Reset Link
              </Button>
            </form>
          )}

          <div className="mt-6 text-center">
            <Link
              href="/auth/login"
              className="inline-flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400 hover:text-primary-600"
            >
              <HiArrowLeft className="w-4 h-4" />
              Back to login
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
