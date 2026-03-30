'use client';

import { useState } from 'react';
import { IoSearchOutline, IoTrashOutline } from 'react-icons/io5';
import type { SavedAddress } from '@/lib/types/user';
import { alert } from '@/components/UI/AlertDialog';
import { toast } from '@/components/UI/Toast';

interface AddressesTabProps {
    savedAddresses: SavedAddress[];
    onSaveAddress: (address: Partial<SavedAddress>) => Promise<void>;
    onDeleteAddress: (addressId: string) => Promise<void>;
}

export default function AddressesTab({ savedAddresses, onSaveAddress, onDeleteAddress }: AddressesTabProps) {
    const [newAddressLabel, setNewAddressLabel] = useState('');
    const [addressSearchQuery, setAddressSearchQuery] = useState('');
    const [addressSearchResults, setAddressSearchResults] = useState<any[]>([]);
    const [showAddressResults, setShowAddressResults] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

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
            toast.show('Failed to search address', 'error');
        }
    };

    const handleAddressSelect = async (result: any) => {
        setIsSaving(true);
        try {
            await onSaveAddress({
                label: newAddressLabel,
                address: result.SEARCHVAL,
                coordinates: [parseFloat(result.LATITUDE), parseFloat(result.LONGITUDE)]
            });
            setAddressSearchQuery('');
            setNewAddressLabel('');
            setShowAddressResults(false);
            toast.show('Address saved successfully', 'success');
        } catch (error) {
            console.error('Error saving address:', error);
            toast.show('Failed to save address', 'error');
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async (addressId: string) => {
        const confirmed = await alert.show({
            title: 'Delete Address',
            message: 'Are you sure you want to delete this address? This action cannot be undone.',
            confirmLabel: 'Delete',
            isDestructive: true,
            onConfirm: async () => {
                try {
                    await onDeleteAddress(addressId);
                    toast.show('Address deleted successfully', 'success');
                } catch (error) {
                    toast.show('Failed to delete address', 'error');
                }
            }
        });
    };

    return (
        <div className="flex flex-col space-y-6">
            <div className="flex flex-col">
                <h2 className="accountSectionTitle mb-4">Saved Addresses</h2>

                <div className="flex flex-col space-y-4">
                    {savedAddresses.map((address) => (
                        <div key={address.id} className="accountCard p-3 flex items-start justify-between">
                            <div>
                                <p className="text-sm font-medium">{address.label}</p>
                                <p className="text-xs text-gray-400 mt-1">{address.address}</p>
                            </div>
                            <button
                                onClick={() => handleDelete(address.id)}
                                className="p-1.5 hover:bg-[#1a1a1a] rounded-md transition-colors"
                            >
                                <IoTrashOutline size={16} className="text-red-500" />
                            </button>
                        </div>
                    ))}

                    <div className="accountCard p-4">
                        <h3 className="text-sm font-medium mb-3">Add new address</h3>
                        <div className="flex flex-col space-y-3">
                            <div>
                                <label className="accountInputLabel">Label</label>
                                <input
                                    type="text"
                                    value={newAddressLabel}
                                    onChange={(e) => setNewAddressLabel(e.target.value)}
                                    placeholder="e.g. Home, Work, Gym"
                                    className="accountInput"
                                />
                            </div>
                            <div>
                                <label className="accountInputLabel">Address</label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        value={addressSearchQuery}
                                        onChange={(e) => {
                                            setAddressSearchQuery(e.target.value);
                                            searchAddress(e.target.value);
                                        }}
                                        onFocus={() => addressSearchQuery.length >= 3 && setShowAddressResults(true)}
                                        placeholder="Search for an address..."
                                        className="accountInput pr-9"
                                    />
                                    <IoSearchOutline className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-600" size={14} />

                                    {showAddressResults && addressSearchResults.length > 0 && (
                                        <div className="absolute top-full left-0 right-0 mt-1 accountCard shadow-2xl z-50">
                                            {addressSearchResults.map((result, idx) => (
                                                <button
                                                    key={idx}
                                                    onClick={() => handleAddressSelect(result)}
                                                    disabled={!newAddressLabel || isSaving}
                                                    className="w-full text-left px-3 py-2.5 hover:bg-[#111] transition-colors border-b border-[#1a1a1a] last:border-b-0 disabled:opacity-50 disabled:cursor-not-allowed"
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
                    </div>
                </div>
            </div>
        </div>
    );
}