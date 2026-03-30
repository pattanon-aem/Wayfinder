'use client';

import { useState } from 'react';
import { IoSearchOutline } from 'react-icons/io5';
import type { UserProfile } from '@/lib/types/user';
import { alert } from '@/components/UI/AlertDialog';
import { toast } from '@/components/UI/Toast';

interface ProfileTabProps {
    user: any;
    profile: UserProfile | null;
    isSaving: boolean;
    handleSaveProfile: () => Promise<void>;
}

export default function ProfileTab({ user, profile, isSaving, handleSaveProfile }: ProfileTabProps) {
    const [firstName, setFirstName] = useState(user?.firstName || '');
    const [lastName, setLastName] = useState(user?.lastName || '');
    const [email, setEmail] = useState(user?.primaryEmailAddress?.emailAddress || '');
    const [phoneNumber, setPhoneNumber] = useState(user?.primaryPhoneNumber?.phoneNumber || '');
    const [userAddress, setUserAddress] = useState(profile?.userAddress || '');
    const [addressSearchQuery, setAddressSearchQuery] = useState('');
    const [addressSearchResults, setAddressSearchResults] = useState<any[]>([]);
    const [showAddressResults, setShowAddressResults] = useState(false);

    const searchAddress = async (query: string) => {
        if (query.length < 3) {
            setAddressSearchResults([]);
            setShowAddressResults(false);
            return;
        }

        try {
            const response = await fetch(`/api/search/location?searchVal=${encodeURIComponent(query)}`);
            const data = await response.json();
            setAddressSearchResults(data.results || []);
            setShowAddressResults(true);
        } catch (error) {
            console.error('Error searching address:', error);
        }
    };

    const handleAddressSelect = (result: any) => {
        setUserAddress(result.SEARCHVAL);
        setAddressSearchQuery('');
        setShowAddressResults(false);
    };

    const handleSave = async () => {
        const confirmed = await alert.show({
            title: 'Save Changes',
            message: 'Are you sure you want to save these changes to your profile?',
            confirmLabel: 'Save',
            onConfirm: async () => {
                try {
                    await handleSaveProfile();
                    toast.show('Profile updated successfully', 'success');
                } catch (error) {
                    toast.show('Failed to update profile', 'error');
                }
            }
        });
    };

    return (
        <div className="flex flex-col space-y-6">
            <div className="flex flex-col">
                <h2 className="accountSectionTitle mb-4">Personal Information</h2>

                <div className="flex flex-col space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="accountInputLabel">First name</label>
                            <input
                                type="text"
                                value={firstName}
                                onChange={(e) => setFirstName(e.target.value)}
                                className="accountInput"
                            />
                        </div>
                        <div>
                            <label className="accountInputLabel">Last name</label>
                            <input
                                type="text"
                                value={lastName}
                                onChange={(e) => setLastName(e.target.value)}
                                className="accountInput"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="accountInputLabel">Email address</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="accountInput"
                        />
                    </div>

                    <div>
                        <label className="accountInputLabel">Phone number</label>
                        <input
                            type="tel"
                            value={phoneNumber}
                            onChange={(e) => setPhoneNumber(e.target.value)}
                            className="accountInput"
                        />
                    </div>

                    <div>
                        <label className="accountInputLabel">Home address</label>
                        <div className="relative">
                            <input
                                type="text"
                                value={addressSearchQuery || userAddress}
                                onChange={(e) => {
                                    setAddressSearchQuery(e.target.value);
                                    searchAddress(e.target.value);
                                }}
                                onFocus={() => addressSearchQuery.length >= 3 && setShowAddressResults(true)}
                                placeholder="Search for your address..."
                                className="accountInput pr-9"
                            />
                            <IoSearchOutline className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-600" size={14} />

                            {showAddressResults && addressSearchResults.length > 0 && (
                                <div className="absolute top-full left-0 right-0 mt-1 accountCard shadow-2xl z-50">
                                    {addressSearchResults.map((result, idx) => (
                                        <button
                                            key={idx}
                                            onClick={() => handleAddressSelect(result)}
                                            className="w-full text-left px-3 py-2.5 hover:bg-[#111] transition-colors border-b border-[#1a1a1a] last:border-b-0"
                                        >
                                            <p className="text-xs text-gray-300">{result.SEARCHVAL}</p>
                                            <p className="text-[11px] text-gray-600 mt-0.5">{result.ADDRESS}</p>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="accountButton mt-6"
                >
                    {isSaving ? 'Saving...' : 'Save changes'}
                </button>
            </div>
        </div>
    );
}