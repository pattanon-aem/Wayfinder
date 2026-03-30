import mongoose, { Document, Model, Schema } from "mongoose";

export interface ICustomAddress {
  addressName: string;
  address: string;
  latitude?: number;
  longitude?: number;
  default?: boolean;
}

export interface ISearchHistory {
  address: string;
  latitude: number;
  longitude: number;
  timestamp: Date;
}

export interface IUser extends Document {
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
  createdAt: Date;
  updatedAt: Date;
}
const CustomAddressSchema = new Schema<ICustomAddress>({
  addressName: { type: String, required: true },
  address: { type: String, required: true },
  latitude: { type: Number },
  longitude: { type: Number },
  default: { type: Boolean, default: false },
});

const SearchHistorySchema = new Schema<ISearchHistory>({
  address: { type: String, required: true },
  latitude: { type: Number, required: true },
  longitude: { type: Number, required: true },
  timestamp: { type: Date, default: Date.now },
});

const FrequentAddressSchema = new Schema({
  address: { type: String, required: true },
  latitude: { type: Number, required: true },
  longitude: { type: Number, required: true },
  count: { type: Number, default: 1 },
  lastVisited: { type: Date, default: Date.now },
});

const UserSchema = new Schema<IUser>(
  {
    clerkId: { type: String, required: true, unique: true },
    userAddress: { type: String },
    userAddressLatitude: { type: Number },
    userAddressLongitude: { type: Number },
    customAddresses: [CustomAddressSchema],
    searchHistory: [SearchHistorySchema],
    frequentAddresses: [FrequentAddressSchema],
  },
  {
    timestamps: true,
  }
);

const User: Model<IUser> =
  mongoose.models.User || mongoose.model<IUser>("User", UserSchema);

export default User;
