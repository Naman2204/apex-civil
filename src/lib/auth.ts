import { auth, currentUser } from "@clerk/nextjs/server";
import { db } from "./db";

/**
 * Ensures the currently authenticated Clerk user exists in the Neon database.
 * If not, it creates them. Returns the Neon User record.
 * Call this at the start of any Server Action that creates relations to the User.
 */
export async function getOrCreateDbUser() {
  const { userId } = await auth();
  
  if (!userId) {
    throw new Error("Unauthorized");
  }

  // Fetch Clerk user details for creation data
  const user = await currentUser();
  if (!user) {
    throw new Error("Clerk user not found");
  }

  const email = user.emailAddresses[0]?.emailAddress || `${userId}@placeholder.com`;

  // Use upsert to avoid race conditions
  const dbUser = await db.user.upsert({
    where: { clerkId: userId },
    update: {}, // Do nothing if exists
    create: {
      clerkId: userId,
      email: email,
    }
  });

  return dbUser;
}
