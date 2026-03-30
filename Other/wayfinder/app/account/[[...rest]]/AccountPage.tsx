'use client';

import { useUser, useClerk } from '@clerk/nextjs';
import { useEffect, useState } from 'react';
import { IoSearchOutline, IoClose, IoHome, IoBriefcase, IoSchool, IoAdd, IoTrash, IoPencil, IoCamera } from 'react-icons/io5';
import Image from 'next/image';
import { ICustomAddress, ISearchHistory } from '@/lib/models/User';
import { toast } from '@/components/UI/Toast';
import { alert } from '@/components/UI/AlertDialog';

interface UserProfile {
    clerkId: string;
    userAddress?: string;
    userAddressLatitude?: number;
    userAddressLongitude?: number;
    customAddresses: ICustomAddress[];
    searchHistory: ISearchHistory[];
    frequentAddresses: Array<{
        address: string;
        latitude: number;
        longitude: number;
        count: number;
        lastVisited: Date;
    }>;
}

function AccountPage() {
    const { user, isLoaded } = useUser();
    const clerk = useClerk();
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'profile' | 'addresses' | 'history' | 'security'>('profile');

    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [email, setEmail] = useState('');
    const [userAddress, setUserAddress] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    const [isHoveringPfp, setIsHoveringPfp] = useState(false);

    const [addressSearchQuery, setAddressSearchQuery] = useState('');
    const [addressSearchResults, setAddressSearchResults] = useState<any[]>([]);
    const [showAddressResults, setShowAddressResults] = useState(false);

    const [showAddressForm, setShowAddressForm] = useState(false);
    const [newAddressName, setNewAddressName] = useState('');
    const [newAddress, setNewAddress] = useState('');
    const [newAddressLat, setNewAddressLat] = useState<number | undefined>();
    const [newAddressLng, setNewAddressLng] = useState<number | undefined>();
    const [editingAddressId, setEditingAddressId] = useState<string | null>(null);

    const [password, setPassword] = useState('');
    const [passwordConfirm, setPasswordConfirm] = useState('');
    const [passwordMsg, setPasswordMsg] = useState('');
    const [deleteMsg, setDeleteMsg] = useState('');
    const [editPasswordMode, setEditPasswordMode] = useState(false);
    const [devices, setDevices] = useState<any[]>([]);
    const [currentSession, setCurrentSession] = useState<any>(null);

    useEffect(() => {
        if (isLoaded && user) {
            setFirstName(user.firstName || '');
            setLastName(user.lastName || '');
            setEmail(user.primaryEmailAddress?.emailAddress || '');
            fetchProfile();
            fetchDevices();
        }
    }, [isLoaded, user]);

    const fetchDevices = async () => {
        if (!user) return;
        try {
            const sessions = await user.getSessions();
            setDevices(sessions || []);
            setCurrentSession(sessions[0]);
        } catch (err) {
            console.error('Error fetching devices:', err);
            setDevices([]);
        }
    };

    const fetchProfile = async () => {
        try {
            const response = await fetch('/api/user');
            if (response.ok) {
                const data = await response.json();
                setProfile(data.user);
                setUserAddress(data.user.userAddress || '');
            } else {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to fetch profile');
            }
        } catch (error) {
            console.error('Error fetching profile:', error);
            toast.show(error instanceof Error ? error.message : 'Failed to fetch profile', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleSaveProfile = async () => {
        const confirmed = await alert.show({
            title: 'Save Profile Changes',
            message: 'Are you sure you want to save these changes to your profile?',
            confirmLabel: 'Save',
            cancelLabel: 'Cancel',
            onConfirm: () => { },
        });

        if (!confirmed) return;

        setIsSaving(true);
        try {
            await user?.update({
                firstName,
                lastName,
            });

            if (email !== user?.primaryEmailAddress?.emailAddress) {
                await user?.createEmailAddress({ email });
            }


            const response = await fetch('/api/user', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userAddress,
                    userAddressLatitude: newAddressLat,
                    userAddressLongitude: newAddressLng,
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                const errorMessage = errorData.message || 'Failed to update profile';
                console.error('Profile update error:', errorMessage);
                toast.show(errorMessage, 'error');
                return;
            }

            toast.show('Profile updated successfully!', 'success');
            await fetchProfile();
        } catch (error) {
            console.error('Error saving profile:', error);
            toast.show('Failed to save profile', 'error');
        } finally {
            setIsSaving(false);
        }
    };

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

    const handleAddressSelect = (result: any, isUserAddress = false) => {
        if (isUserAddress) {
            setUserAddress(result.SEARCHVAL);
            setNewAddressLat(parseFloat(result.LATITUDE));
            setNewAddressLng(parseFloat(result.LONGITUDE));
            setAddressSearchQuery('');
            setShowAddressResults(false);
        } else {
            setNewAddress(result.SEARCHVAL);
            setNewAddressLat(parseFloat(result.LATITUDE));
            setNewAddressLng(parseFloat(result.LONGITUDE));
            setAddressSearchQuery('');
            setShowAddressResults(false);
        }
    };

    const handleAddCustomAddress = async () => {
        if (!newAddressName || !newAddress) {
            toast.show('Please provide address name and address', 'warning');
            return;
        }

        try {
            const url = editingAddressId
                ? '/api/user/custom-addresses'
                : '/api/user/custom-addresses';

            const method = editingAddressId ? 'PATCH' : 'POST';

            const body = editingAddressId
                ? { addressId: editingAddressId, addressName: newAddressName, address: newAddress, latitude: newAddressLat, longitude: newAddressLng }
                : { addressName: newAddressName, address: newAddress, latitude: newAddressLat, longitude: newAddressLng };

            const response = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            });

            if (response.ok) {
                toast.show('Address saved successfully!', 'success');
                fetchProfile();
                setShowAddressForm(false);
                setNewAddressName('');
                setNewAddress('');
                setNewAddressLat(undefined);
                setNewAddressLng(undefined);
                setEditingAddressId(null);
            }
        } catch (error) {
            console.error('Error adding custom address:', error);
            toast.show('Failed to add address', 'error');
        }
    };

    const handleDeleteCustomAddress = async (addressId: string) => {
        const confirmed = await alert.show({
            title: 'Delete Address',
            message: 'Are you sure you want to delete this address? This action cannot be undone.',
            confirmLabel: 'Delete',
            cancelLabel: 'Cancel',
            isDestructive: true,
            onConfirm: () => { },
        });

        if (!confirmed) return;

        try {
            const response = await fetch(`/api/user/custom-addresses?addressId=${addressId}`, {
                method: 'DELETE',
            });

            if (response.ok) {
                toast.show('Address deleted successfully', 'success');
                fetchProfile();
            } else {
                toast.show('Failed to delete address', 'error');
            }
        } catch (error) {
            console.error('Error deleting address:', error);
            toast.show('Failed to delete address', 'error');
        };
    };

    const handleDeleteSearchHistory = async (historyId?: string) => {
        const message = historyId
            ? 'Are you sure you want to delete this search?'
            : 'Are you sure you want to clear all search history?';

        if (!confirm(message)) return;

        try {
            const url = historyId
                ? `/api/user/search-history?historyId=${historyId}`
                : '/api/user/search-history';

            const response = await fetch(url, { method: 'DELETE' });

            if (response.ok) {
                fetchProfile();
            }
        } catch (error) {
            console.error('Error deleting search history:', error);
            toast.show('Failed to delete search history', 'error');
        };
    };

    const handleQuickAddAddress = (type: 'Home' | 'Work' | 'School') => {
        setNewAddressName(type);
        if (type === 'Home' && userAddress) {
            setNewAddress(userAddress);
            setNewAddressLat(profile?.userAddressLatitude);
            setNewAddressLng(profile?.userAddressLongitude);
        } else {
            setNewAddress('');
            setNewAddressLat(undefined);
            setNewAddressLng(undefined);
        }
        setShowAddressForm(true);
    };

    const handlePasswordSave = async () => {
        setPasswordMsg('');
        if (password !== passwordConfirm) {
            toast.show('Passwords do not match', 'error');
            setPasswordMsg('Passwords do not match.');
            return;
        }

        const confirmed = await alert.show({
            title: 'Update Password',
            message: 'Are you sure you want to update your password?',
            confirmLabel: 'Update',
            cancelLabel: 'Cancel',
            onConfirm: () => { },
        });

        if (!confirmed) return;

        setLoading(true);
        try {
            await user?.updatePassword({ newPassword: password });
            toast.show('Password updated successfully!', 'success');
            setPasswordMsg('Password updated successfully!');
            setEditPasswordMode(false);
            setPassword('');
            setPasswordConfirm('');
        } catch (err) {
            const errorMsg = 'Failed to update password.';
            toast.show(errorMsg, 'error');
            setPasswordMsg(errorMsg);
        }
        setLoading(false);
    };

    const handleSignOutSession = async (sessionId: string) => {
        setLoading(true);
        try {
            await clerk.signOut({ sessionId });
            fetchDevices();
        } catch (err) {
            toast.show('Failed to sign out device', 'error');
        }
        setLoading(false);
    };

    const handleDeleteAccount = async () => {
        const confirmed = await alert.show({
            title: 'Delete Account',
            message: 'Are you sure you want to permanently delete your account? This action cannot be undone and all your data will be lost.',
            confirmLabel: 'Delete Account',
            cancelLabel: 'Cancel',
            isDestructive: true,
            onConfirm: () => { },
        });

        if (!confirmed) return;

        setLoading(true);
        try {
            await user?.delete();
            toast.show('Account deleted successfully', 'success');
            setDeleteMsg('Account deleted.');
            clerk.signOut();
        } catch (err) {
            const errorMsg = 'Failed to delete account.';
            toast.show(errorMsg, 'error');
            setDeleteMsg(errorMsg);
        }
        setLoading(false);
    };

    const handleProfilePictureClick = () => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.onchange = async (e: any) => {
            const file = e.target.files?.[0];
            if (file) {
                try {
                    await user?.setProfileImage({ file });
                    toast.show('Profile picture updated successfully!', 'success');
                } catch (err) {
                    toast.show('Failed to update profile picture', 'error');
                }
            }
        };
        input.click();
    };

    if (!isLoaded || loading) {
        return (
            <div className="w-full h-screen flex items-center justify-center bg-black">
                <div
                    className="w-8 h-8 border-4 border-emerald-400 border-t-transparent rounded-full animate-spin"
                    aria-label="Loading"
                    role="status"
                />
            </div>
        );
    }

    return (
        <div className="w-full min-h-screen bg-black flex flex-col pt-32 pb-16 px-4">
            <div className="max-w-3xl w-full mx-auto px-6 flex flex-col">
                <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-lg p-6 mb-10 flex items-center gap-5">
                    <div
                        className="relative group cursor-pointer w-16 h-16 flex-shrink-0"
                        onMouseEnter={() => setIsHoveringPfp(true)}
                        onMouseLeave={() => setIsHoveringPfp(false)}
                        onClick={handleProfilePictureClick}
                    >
                        <div className="w-16 h-16 rounded-full overflow-hidden ring-1 ring-[#1a1a1a]">
                            {user?.imageUrl ? (
                                <Image
                                    src={user.imageUrl}
                                    alt="Profile"
                                    width={64}
                                    height={64}
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <div className="w-full h-full bg-[#111] flex items-center justify-center text-lg text-gray-600 font-normal">
                                    {user?.firstName?.[0]}{user?.lastName?.[0]}
                                </div>
                            )}
                        </div>
                        {isHoveringPfp && (
                            <div className="absolute inset-0 bg-black/70 backdrop-blur-sm rounded-full flex items-center justify-center transition-all duration-200">
                                <IoCamera size={18} className="text-white/80" />
                            </div>
                        )}
                    </div>
                    <div className="flex flex-col">
                        <h1 className="text-xl font-normal text-white mb-0.5">
                            Welcome {user?.firstName} {user?.lastName}
                        </h1>
                        <p className="text-xs text-gray-600">
                            {user?.primaryEmailAddress?.emailAddress}
                        </p>
                    </div>
                </div>

                <div className="flex gap-6 mb-10 border-b border-[#1a1a1a]">
                    <button
                        onClick={() => setActiveTab('profile')}
                        className={`pb-3 text-xs font-normal transition-all duration-200 relative ${activeTab === 'profile'
                            ? 'text-gray-300'
                            : 'text-gray-400 hover:text-gray-200'
                            }`}
                    >
                        Profile
                        {activeTab === 'profile' && (
                            <div className="absolute bottom-0 left-0 right-0 h-px bg-gray-500" />
                        )}
                    </button>
                    <button
                        onClick={() => setActiveTab('addresses')}
                        className={`pb-3 text-xs font-normal transition-all duration-200 relative ${activeTab === 'addresses'
                            ? 'text-gray-300'
                            : 'text-gray-400 hover:text-gray-200'
                            }`}
                    >
                        Addresses
                        {activeTab === 'addresses' && (
                            <div className="absolute bottom-0 left-0 right-0 h-px bg-gray-500" />
                        )}
                    </button>
                    <button
                        onClick={() => setActiveTab('history')}
                        className={`pb-3 text-xs font-normal transition-all duration-200 relative ${activeTab === 'history'
                            ? 'text-gray-300'
                            : 'text-gray-400 hover:text-gray-200'
                            }`}
                    >
                        History
                        {activeTab === 'history' && (
                            <div className="absolute bottom-0 left-0 right-0 h-px bg-gray-500" />
                        )}
                    </button>
                    <button
                        onClick={() => setActiveTab('security')}
                        className={`pb-3 text-xs font-normal transition-all duration-200 relative ${activeTab === 'security'
                            ? 'text-gray-300'
                            : 'text-gray-400 hover:text-gray-200'
                            }`}
                    >
                        Security
                        {activeTab === 'security' && (
                            <div className="absolute bottom-0 left-0 right-0 h-px bg-gray-500" />
                        )}
                    </button>
                </div>

                {activeTab === 'profile' && (
                    <div className="flex flex-col space-y-6">
                        <div className="flex flex-col">
                            <h2 className="text-sm font-normal mb-4">Personal Information</h2>

                            <div className="flex flex-col space-y-4">
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-[11px] font-normal text-gray-600 mb-1.5">First name</label>
                                        <input
                                            type="text"
                                            value={firstName}
                                            onChange={(e) => setFirstName(e.target.value)}
                                            className="w-full bg-[#0a0a0a] border border-[#1a1a1a] rounded-md px-3 py-2 text-xs text-gray-300 placeholder-gray-700 focus:outline-none focus:border-[#2a2a2a] transition-all duration-200"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[11px] font-normal text-gray-600 mb-1.5">Last name</label>
                                        <input
                                            type="text"
                                            value={lastName}
                                            onChange={(e) => setLastName(e.target.value)}
                                            className="w-full bg-[#0a0a0a] border border-[#1a1a1a] rounded-md px-3 py-2 text-xs text-gray-300 placeholder-gray-700 focus:outline-none focus:border-[#2a2a2a] transition-all duration-200"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-[11px] font-normal text-gray-600 mb-1.5">Email address</label>
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="w-full bg-[#0a0a0a] border border-[#1a1a1a] rounded-md px-3 py-2 text-xs text-gray-300 placeholder-gray-700 focus:outline-none focus:border-[#2a2a2a] transition-all duration-200"
                                    />
                                </div>

                                <div>
                                    <label className="block text-[11px] font-normal text-gray-600 mb-1.5">Home address</label>
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
                                            className="w-full bg-[#0a0a0a] border border-[#1a1a1a] rounded-md px-3 py-2 pr-9 text-xs text-gray-300 placeholder-gray-700 focus:outline-none focus:border-[#2a2a2a] transition-all duration-200"
                                        />
                                        <IoSearchOutline className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-600" size={14} />

                                        {showAddressResults && addressSearchResults.length > 0 && (
                                            <div className="absolute top-full left-0 right-0 mt-1 bg-[#0a0a0a] border border-[#1a1a1a] rounded-md overflow-hidden shadow-2xl z-50">
                                                {addressSearchResults.map((result, idx) => (
                                                    <button
                                                        key={idx}
                                                        onClick={() => handleAddressSelect(result, true)}
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
                                onClick={handleSaveProfile}
                                disabled={isSaving}
                                className="mt-6 px-4 py-2 bg-[#1a1a1a] text-gray-400 text-xs font-normal rounded-md hover:bg-[#222] hover:text-gray-300 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isSaving ? 'Saving...' : 'Save changes'}
                            </button>
                        </div>
                    </div>
                )}

                {activeTab === 'addresses' && (
                    <div className="flex flex-col space-y-6">
                        <div className="flex flex-col">
                            <h2 className="text-xs font-normal text-gray-600 mb-4">Quick Add</h2>
                            <div className="flex gap-3 flex-wrap">
                                {['Home', 'Work', 'School'].map((type) => {
                                    const exists = profile?.customAddresses.some(
                                        (addr) => addr.addressName === type
                                    );
                                    if (exists) return null;

                                    return (
                                        <button
                                            key={type}
                                            onClick={() => handleQuickAddAddress(type as 'Home' | 'Work' | 'School')}
                                            className="flex items-center gap-2 px-3 py-2 bg-[#0a0a0a] border border-[#1a1a1a] rounded-md text-xs font-normal text-gray-600 hover:text-gray-400 hover:bg-[#111] hover:border-[#2a2a2a] transition-all duration-200"
                                        >
                                            {type === 'Home' && <IoHome size={14} />}
                                            {type === 'Work' && <IoBriefcase size={14} />}
                                            {type === 'School' && <IoSchool size={14} />}
                                            Add {type}
                                        </button>
                                    );
                                })}
                                <button
                                    onClick={() => {
                                        setNewAddressName('');
                                        setNewAddress('');
                                        setNewAddressLat(undefined);
                                        setNewAddressLng(undefined);
                                        setEditingAddressId(null);
                                        setShowAddressForm(true);
                                    }}
                                    className="flex items-center gap-2 px-3 py-2 bg-[#1a1a1a] border border-[#2a2a2a] rounded-md text-xs font-normal text-gray-400 hover:bg-[#222] hover:text-gray-300 transition-all duration-200"
                                >
                                    <IoAdd size={14} /> Custom address
                                </button>
                            </div>
                        </div>

                        {showAddressForm && (
                            <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-lg p-5">
                                <div className="flex items-center justify-between mb-5">
                                    <h3 className="text-xs font-normal text-gray-300">
                                        {editingAddressId ? 'Edit Address' : 'New Address'}
                                    </h3>
                                    <button
                                        onClick={() => {
                                            setShowAddressForm(false);
                                            setEditingAddressId(null);
                                        }}
                                        className="text-gray-600 hover:text-gray-400 transition-colors"
                                    >
                                        <IoClose size={16} />
                                    </button>
                                </div>

                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-[11px] font-normal text-gray-600 mb-1.5">Label</label>
                                        <input
                                            type="text"
                                            value={newAddressName}
                                            onChange={(e) => setNewAddressName(e.target.value)}
                                            placeholder="e.g., Office, Gym"
                                            className="w-full bg-[#111] border border-[#1a1a1a] rounded-md px-3 py-2 text-xs text-gray-300 placeholder-gray-700 focus:outline-none focus:border-[#2a2a2a] transition-all duration-200"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-[11px] font-normal text-gray-600 mb-1.5">Address</label>
                                        <div className="relative">
                                            <input
                                                type="text"
                                                value={addressSearchQuery || newAddress}
                                                onChange={(e) => {
                                                    setAddressSearchQuery(e.target.value);
                                                    searchAddress(e.target.value);
                                                }}
                                                onFocus={() => addressSearchQuery.length >= 3 && setShowAddressResults(true)}
                                                placeholder="Search for address..."
                                                className="w-full bg-[#111] border border-[#1a1a1a] rounded-md px-3 py-2 pr-9 text-xs text-gray-300 placeholder-gray-700 focus:outline-none focus:border-[#2a2a2a] transition-all duration-200"
                                            />
                                            <IoSearchOutline className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-600" size={14} />

                                            {showAddressResults && addressSearchResults.length > 0 && (
                                                <div className="absolute top-full left-0 right-0 mt-1 bg-[#0a0a0a] border border-[#1a1a1a] rounded-md overflow-hidden shadow-2xl z-50">
                                                    {addressSearchResults.map((result, idx) => (
                                                        <button
                                                            key={idx}
                                                            onClick={() => handleAddressSelect(result, false)}
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

                                    <button
                                        onClick={handleAddCustomAddress}
                                        className="w-full px-4 py-2 bg-[#1a1a1a] text-gray-400 text-xs font-normal rounded-md hover:bg-[#222] hover:text-gray-300 transition-all duration-200"
                                    >
                                        {editingAddressId ? 'Update' : 'Add address'}
                                    </button>
                                </div>
                            </div>
                        )}

                        <div className="flex flex-col">
                            <h2 className="text-xs font-normal text-gray-600 mb-4">Saved Addresses</h2>
                            <div className="flex flex-col space-y-2">
                                {profile?.customAddresses.length === 0 ? (
                                    <div className="text-center py-8">
                                        <p className="text-xs text-gray-600">No addresses saved yet</p>
                                    </div>
                                ) : (
                                    profile?.customAddresses.map((address) => (
                                        <div
                                            key={address.addressName}
                                            className="group bg-[#0a0a0a] border border-[#1a1a1a] hover:bg-[#111] rounded-md p-3 flex items-center justify-between transition-all duration-200"
                                        >
                                            <div className="flex items-center gap-2.5">
                                                <div className="w-8 h-8 rounded-md bg-[#111] flex items-center justify-center text-gray-600">
                                                    {address.addressName === 'Home' && <IoHome size={14} />}
                                                    {address.addressName === 'Work' && <IoBriefcase size={14} />}
                                                    {address.addressName === 'School' && <IoSchool size={14} />}
                                                    {!['Home', 'Work', 'School'].includes(address.addressName) && <span className="text-[11px] font-normal">{address.addressName[0]}</span>}
                                                </div>
                                                <div>
                                                    <p className="text-xs font-normal text-gray-300">{address.addressName}</p>
                                                    <p className="text-[11px] text-gray-600 mt-0.5">{address.address}</p>
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => handleDeleteCustomAddress((address as any)._id)}
                                                className="opacity-0 group-hover:opacity-100 text-gray-600 hover:text-red-500 transition-all duration-200"
                                            >
                                                <IoTrash size={13} />
                                            </button>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'history' && (
                    <div className="flex flex-col space-y-6">
                        <div className="flex items-center justify-between">
                            <h2 className="text-sm font-normal ">Recent Searches</h2>
                            {profile?.searchHistory && profile.searchHistory.length > 0 && (
                                <button
                                    onClick={() => handleDeleteSearchHistory()}
                                    className="text-[11px] font-normal text-gray-600 hover:text-red-500 transition-colors duration-200"
                                >
                                    Clear all
                                </button>
                            )}
                        </div>

                        <div className="flex flex-col space-y-2">
                            {!profile?.searchHistory || profile.searchHistory.length === 0 ? (
                                <div className="text-center py-8">
                                    <p className="text-xs text-gray-600">No search history</p>
                                </div>
                            ) : (
                                profile.searchHistory.map((search) => (
                                    <div
                                        key={(search as any)._id}
                                        className="group bg-[#0a0a0a] border border-[#1a1a1a] hover:bg-[#111] rounded-md p-3 flex items-center justify-between transition-all duration-200"
                                    >
                                        <div className="flex-1 min-w-0">
                                            <p className="text-xs font-normal text-gray-300 truncate">{search.address}</p>
                                            <p className="text-[11px] text-gray-600 mt-0.5">
                                                {new Date(search.timestamp).toLocaleDateString('en-US', {
                                                    month: 'short',
                                                    day: 'numeric',
                                                    year: 'numeric',
                                                    hour: '2-digit',
                                                    minute: '2-digit'
                                                })}
                                            </p>
                                        </div>
                                        <button
                                            onClick={() => handleDeleteSearchHistory((search as any)._id)}
                                            className="opacity-0 group-hover:opacity-100 text-gray-600 hover:text-red-500 transition-all duration-200 ml-3"
                                        >
                                            <IoTrash size={13} />
                                        </button>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                )}

                {activeTab === 'security' && (
                    <div className="flex flex-col space-y-6">
                        <div className="flex flex-col">
                            <div className="flex items-center justify-between mb-4">
                                <div>
                                    <h2 className="text-sm font-normal ">Password</h2>
                                    <p className="text-[11px] text-gray-600 mt-0.5">Change your account password</p>
                                </div>
                                {!editPasswordMode ? (
                                    <button
                                        onClick={() => setEditPasswordMode(true)}
                                        className="flex items-center gap-1.5 text-[11px] font-normal text-gray-600 hover:text-gray-400 transition-colors duration-200"
                                    >
                                        <IoPencil size={12} />
                                        Edit
                                    </button>
                                ) : (
                                    <button
                                        onClick={handlePasswordSave}
                                        disabled={loading}
                                        className="flex items-center gap-1.5 px-3 py-1.5 bg-[#1a1a1a] text-gray-400 text-[11px] font-normal rounded-md hover:bg-[#222] hover:text-gray-300 transition-all duration-200 disabled:opacity-50"
                                    >
                                        Save
                                    </button>
                                )}
                            </div>

                            {!editPasswordMode ? (
                                <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-md px-3 py-2">
                                    <p className="text-xs text-gray-600">••••••••••••</p>
                                </div>
                            ) : (
                                <div className="space-y-2.5">
                                    <input
                                        type="password"
                                        placeholder="New password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="w-full px-3 py-2 bg-[#0a0a0a] border border-[#1a1a1a] rounded-md text-xs text-gray-300 placeholder-gray-700 focus:outline-none focus:border-[#2a2a2a] transition-all duration-200"
                                    />
                                    <input
                                        type="password"
                                        placeholder="Confirm password"
                                        value={passwordConfirm}
                                        onChange={(e) => setPasswordConfirm(e.target.value)}
                                        className="w-full px-3 py-2 bg-[#0a0a0a] border border-[#1a1a1a] rounded-md text-xs text-gray-300 placeholder-gray-700 focus:outline-none focus:border-[#2a2a2a] transition-all duration-200"
                                    />
                                    {passwordMsg && (
                                        <p className={`text-[11px] ${passwordMsg.includes('success') ? 'text-emerald-500' : 'text-red-500'}`}>
                                            {passwordMsg}
                                        </p>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Active Devices Section */}
                        <div className="flex flex-col">
                            <div className="mb-4 flex flex-col">
                                <h2 className="text-sm font-normal ">Active Sessions</h2>
                                <p className="text-[11px] text-gray-600 mt-0.5">Manage your active sessions across devices</p>
                            </div>

                            <div className="flex flex-col space-y-2">
                                {devices.length === 0 ? (
                                    <div className="text-center py-6">
                                        <p className="text-xs text-gray-600">No active sessions</p>
                                    </div>
                                ) : (
                                    devices.map((device) => {
                                        const isCurrent = currentSession && device.id === currentSession.id;
                                        const activity = device.latestActivity || {};
                                        return (
                                            <div
                                                key={device.id}
                                                className="bg-[#0a0a0a] border border-[#1a1a1a] hover:bg-[#111] rounded-md p-3 transition-all duration-200"
                                            >
                                                <div className="flex items-start gap-3">
                                                    <div className="w-8 h-8 rounded-md bg-[#111] flex items-center justify-center text-sm flex-shrink-0">
                                                        💻
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <p className="text-xs font-normal text-gray-300">
                                                                {activity.deviceType || "Device"}
                                                            </p>
                                                            {isCurrent && (
                                                                <span className="px-1.5 py-0.5 bg-emerald-500/10 text-emerald-500 rounded text-[10px] font-normal">
                                                                    Current
                                                                </span>
                                                            )}
                                                        </div>
                                                        <div className="space-y-0.5">
                                                            <p className="text-[11px] text-gray-600">
                                                                {activity.browserName} {activity.browserVersion}
                                                                {activity.browserName && (activity.city || activity.country) && " · "}
                                                                {activity.city}{activity.city && activity.country && ", "}{activity.country}
                                                            </p>
                                                            {activity.ipAddress && (
                                                                <p className="text-[11px] text-gray-700">
                                                                    {activity.ipAddress}
                                                                </p>
                                                            )}
                                                            {device.lastActiveAt && (
                                                                <p className="text-[11px] text-gray-700">
                                                                    Last active {new Date(device.lastActiveAt).toLocaleDateString('en-US', {
                                                                        month: 'short',
                                                                        day: 'numeric',
                                                                        hour: '2-digit',
                                                                        minute: '2-digit'
                                                                    })}
                                                                </p>
                                                            )}
                                                        </div>
                                                        {!isCurrent && (
                                                            <button
                                                                onClick={() => handleSignOutSession(device.id)}
                                                                className="mt-2 text-[11px] font-normal text-gray-600 hover:text-red-500 transition-colors duration-200"
                                                                disabled={loading}
                                                            >
                                                                Sign out
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        </div>

                        <div className="pt-6 border-t border-[#1a1a1a]">
                            <div className="mb-4">
                                <h2 className="text-sm font-normal ">Delete Account</h2>
                                <p className="text-[11px] text-gray-600 mt-0.5">Permanently delete your account and all data</p>
                            </div>

                            <button
                                onClick={handleDeleteAccount}
                                disabled={loading}
                                className="px-4 py-2 bg-red-500/10 border border-red-500/20 text-red-400 rounded-md text-xs font-normal hover:bg-red-500/20 hover:border-red-500/30 transition-all duration-200 disabled:opacity-50"
                            >
                                Delete account
                            </button>
                            {deleteMsg && (
                                <p className="text-[11px] text-red-500 mt-2">{deleteMsg}</p>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default AccountPage;