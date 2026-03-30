import { createWebhooksHandler } from "@brianmmdev/clerk-webhooks-handler";
import { connectToDatabase } from "@/lib/db";
import User from "@/lib/models/User";

const handler = createWebhooksHandler({
  secret: process.env.CLERK_WEBHOOK_SECRET!,
  onUserCreated: async (user) => {
    try {
      await connectToDatabase();

      const newUser = await User.create({
        clerkId: user.id,
        customAddresses: [],
        searchHistory: [],
        frequentAddresses: [],
      });
    } catch (error) {
      console.error("Error creating user in MongoDB:", error);
      throw error;
    }
  },
  onUserUpdated: async (user) => {
    try {
      await connectToDatabase();
    } catch (error) {
      console.error("Error in user updated webhook:", error);
      throw error;
    }
  },
  onUserDeleted: async (user) => {
    try {
      await connectToDatabase();

      await User.findOneAndDelete({ clerkId: user.id });
    } catch (error) {
      console.error("Error deleting user from MongoDB:", error);
      throw error;
    }
  },
});

export const POST = handler.POST;
