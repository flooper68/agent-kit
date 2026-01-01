import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { router, orgProcedure, adminProcedure } from '../trpc';
import { OrganizationInvitationStatus, OrgRole } from '../../types/auth';

export const membersRouter = router({
  list: orgProcedure.query(async ({ ctx }) => {
    const members = await ctx.clerk.organizations.getOrganizationMembershipList(
      {
        organizationId: ctx.auth.orgId,
      }
    );

    return members.data.map((m) => ({
      id: m.id,
      userId: m.publicUserData?.userId,
      email: m.publicUserData?.identifier,
      firstName: m.publicUserData?.firstName,
      lastName: m.publicUserData?.lastName,
      imageUrl: m.publicUserData?.imageUrl,
      role: m.role,
      createdAt: m.createdAt,
    }));
  }),

  invite: adminProcedure
    .input(
      z.object({
        email: z.string().email(),
        role: OrgRole,
      })
    )
    .mutation(async ({ ctx, input }) => {
      const invitation =
        await ctx.clerk.organizations.createOrganizationInvitation({
          organizationId: ctx.auth.orgId,
          emailAddress: input.email,
          role: input.role,
          inviterUserId: ctx.auth.userId,
        });

      return {
        id: invitation.id,
        email: invitation.emailAddress,
        status:
          OrganizationInvitationStatus.parse(invitation.status) ?? 'pending',
      };
    }),

  remove: adminProcedure
    .input(z.object({ userId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      if (input.userId === ctx.auth.userId) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Cannot remove yourself from the organization',
        });
      }

      await ctx.clerk.organizations.deleteOrganizationMembership({
        organizationId: ctx.auth.orgId,
        userId: input.userId,
      });

      return { success: true };
    }),

  updateRole: adminProcedure
    .input(
      z.object({
        userId: z.string(),
        role: OrgRole,
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (
        input.userId === ctx.auth.userId &&
        input.role === OrgRole.enum['org:member']
      ) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Cannot demote yourself',
        });
      }

      await ctx.clerk.organizations.updateOrganizationMembership({
        organizationId: ctx.auth.orgId,
        userId: input.userId,
        role: input.role,
      });

      return { success: true };
    }),

  listInvitations: adminProcedure.query(async ({ ctx }) => {
    const invitations =
      await ctx.clerk.organizations.getOrganizationInvitationList({
        organizationId: ctx.auth.orgId,
        status: ['pending'],
      });

    return invitations.data.map((inv) => ({
      id: inv.id,
      email: inv.emailAddress,
      role: inv.role,
      status: OrganizationInvitationStatus.parse(inv.status) ?? 'pending',
      createdAt: inv.createdAt,
    }));
  }),

  revokeInvitation: adminProcedure
    .input(z.object({ invitationId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.clerk.organizations.revokeOrganizationInvitation({
        organizationId: ctx.auth.orgId,
        invitationId: input.invitationId,
        requestingUserId: ctx.auth.userId,
      });

      return { success: true };
    }),
});
