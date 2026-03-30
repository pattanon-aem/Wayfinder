'use client';

import { useState } from 'react';
import type { SecuritySettings } from '@/lib/types/user';
import { alert } from '@/components/UI/AlertDialog';
import { toast } from '@/components/UI/Toast';

interface SecurityTabProps {
    securitySettings: SecuritySettings;
    onToggleTwoFactor: () => Promise<void>;
    onChangePassword: (oldPassword: string, newPassword: string) => Promise<void>;
}

export default function SecurityTab({ securitySettings, onToggleTwoFactor, onChangePassword }: SecurityTabProps) {
    const [oldPassword, setOldPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState('');

    const handlePasswordChange = async () => {
        if (newPassword !== confirmPassword) {
            setError('New passwords do not match');
            toast.show('New passwords do not match', 'error');
            return;
        }

        if (newPassword.length < 8) {
            setError('Password must be at least 8 characters long');
            toast.show('Password must be at least 8 characters long', 'error');
            return;
        }

        const confirmed = await alert.show({
            title: 'Change Password',
            message: 'Are you sure you want to change your password? You will need to use the new password next time you sign in.',
            confirmLabel: 'Change Password',
            onConfirm: async () => {
                setError('');
                setIsSaving(true);
                try {
                    await onChangePassword(oldPassword, newPassword);
                    setOldPassword('');
                    setNewPassword('');
                    setConfirmPassword('');
                    toast.show('Password changed successfully', 'success');
                } catch (err: any) {
                    const errorMessage = err.message || 'Failed to change password';
                    setError(errorMessage);
                    toast.show(errorMessage, 'error');
                } finally {
                    setIsSaving(false);
                }
            }
        });
    };

    const handleToggle2FA = async () => {
        const confirmed = await alert.show({
            title: securitySettings.twoFactorEnabled ? 'Disable 2FA' : 'Enable 2FA',
            message: securitySettings.twoFactorEnabled
                ? 'Are you sure you want to disable two-factor authentication? This will make your account less secure.'
                : 'Enable two-factor authentication to add an extra layer of security to your account?',
            confirmLabel: securitySettings.twoFactorEnabled ? 'Disable' : 'Enable',
            isDestructive: securitySettings.twoFactorEnabled,
            onConfirm: async () => {
                try {
                    await onToggleTwoFactor();
                    toast.show(
                        `Two-factor authentication ${securitySettings.twoFactorEnabled ? 'disabled' : 'enabled'} successfully`,
                        'success'
                    );
                } catch (error) {
                    toast.show(
                        `Failed to ${securitySettings.twoFactorEnabled ? 'disable' : 'enable'} two-factor authentication`,
                        'error'
                    );
                }
            }
        });
    };

    return (
        <div className="flex flex-col space-y-6">
            <div className="flex flex-col">
                <h2 className="accountSectionTitle mb-4">Two-Factor Authentication</h2>
                <div className="accountCard p-4">
                    <div className="flex items-start justify-between">
                        <div>
                            <p className="text-sm font-medium">
                                {securitySettings.twoFactorEnabled ? 'Enabled' : 'Disabled'}
                            </p>
                            <p className="text-xs text-gray-400 mt-1">
                                Add an extra layer of security to your account
                            </p>
                        </div>
                        <button
                            onClick={handleToggle2FA}
                            className={`accountButton ${securitySettings.twoFactorEnabled ? 'bg-red-600 hover:bg-red-700' : ''}`}
                        >
                            {securitySettings.twoFactorEnabled ? 'Disable' : 'Enable'}
                        </button>
                    </div>
                </div>
            </div>

            <div className="flex flex-col">
                <h2 className="accountSectionTitle mb-4">Change Password</h2>
                <div className="accountCard p-4">
                    <div className="flex flex-col space-y-4">
                        <div>
                            <label className="accountInputLabel">Current password</label>
                            <input
                                type="password"
                                value={oldPassword}
                                onChange={(e) => setOldPassword(e.target.value)}
                                className="accountInput"
                            />
                        </div>
                        <div>
                            <label className="accountInputLabel">New password</label>
                            <input
                                type="password"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                className="accountInput"
                            />
                        </div>
                        <div>
                            <label className="accountInputLabel">Confirm new password</label>
                            <input
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                className="accountInput"
                            />
                        </div>

                        {error && (
                            <p className="text-xs text-red-500">{error}</p>
                        )}

                        <button
                            onClick={handlePasswordChange}
                            disabled={isSaving || !oldPassword || !newPassword || !confirmPassword}
                            className="accountButton mt-2"
                        >
                            {isSaving ? 'Changing password...' : 'Change password'}
                        </button>
                    </div>
                </div>

                <p className="text-xs text-gray-500 mt-4">
                    Last password change: {securitySettings.lastPasswordChange.toLocaleDateString()}
                </p>
            </div>
        </div>
    );
}