import { z } from 'zod';

export const OrgRole = z.enum(['super_admin', 'org:admin', 'org:member']);

export type OrgRole = z.infer<typeof OrgRole>;

export const OrganizationInvitationStatus = z.enum([
  'pending',
  'accepted',
  'revoked',
]);

export type OrganizationInvitationStatus = z.infer<
  typeof OrganizationInvitationStatus
>;

export interface AuthContext {
  userId: string | null;
  orgId: string | null;
  orgRole: OrgRole | null;
}
