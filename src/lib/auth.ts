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

  let dbUser = await db.user.findUnique({ where: { clerkId: userId } });

  if (!dbUser) {
    // The clerkId is not in the database.
    // Check if the email already exists (e.g., user deleted Clerk account and recreated it)
    dbUser = await db.user.findUnique({ where: { email } });
    
    if (dbUser) {
      // Update the existing user with the new clerkId
      dbUser = await db.user.update({
        where: { id: dbUser.id },
        data: { clerkId: userId },
      });
    } else {
      // Create a brand new user
      dbUser = await db.user.create({
        data: {
          clerkId: userId,
          email: email,
        },
      });
    }
  } else if (dbUser.email !== email) {
    // If the user changed their email in Clerk, sync it here
    dbUser = await db.user.update({
      where: { id: dbUser.id },
      data: { email: email },
    });
  }

  return dbUser;
}
