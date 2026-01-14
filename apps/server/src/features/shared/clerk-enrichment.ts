import type { ClerkClient } from '@clerk/backend';
import type { ClerkUserInfo, WithClerkUserInfo } from './types';

/**
 * Enriches an array of items containing userId with Clerk user info.
 * Automatically deduplicates user IDs for efficient API calls.
 */
export async function enrichWithClerkUserInfo<T extends { userId: string }>(
  clerk: ClerkClient,
  data: T[]
): Promise<WithClerkUserInfo<T>[]> {
  // Deduplicate user IDs to minimize Clerk API calls
  const userIds = [...new Set(data.map((d) => d.userId))];
  if (userIds.length === 0) return [];

  const clerkUsers = await clerk.users.getUserList({
    userId: userIds,
    limit: Math.max(userIds.length, 100),
  });

  const userMap = new Map<string, ClerkUserInfo>(
    clerkUsers.data.map((u) => [
      u.id,
      {
        email: u.emailAddresses[0]?.emailAddress ?? null,
        firstName: u.firstName,
        lastName: u.lastName,
      },
    ])
  );

  return data.map((d) => {
    const info = userMap.get(d.userId);
    return {
      ...d,
      email: info?.email ?? null,
      firstName: info?.firstName ?? null,
      lastName: info?.lastName ?? null,
    };
  });
}
