export interface UserProfile {
  userId: string;
  userAddress?: string;
  // Add other profile fields as needed
}

export interface SavedAddress {
  id: string;
  label: string;
  address: string;
  coordinates: [number, number]; // [latitude, longitude]
}

export interface SecuritySettings {
  twoFactorEnabled: boolean;
  lastPasswordChange: Date;
}
