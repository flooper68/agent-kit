# Clerk Authentication Setup Guide

This guide walks you through setting up Clerk authentication for Agent Kit, including creating a Clerk application, configuring organizations, and connecting it to the app.

## Prerequisites

- A [Clerk account](https://clerk.com) (free tier available)
- Agent Kit repository cloned and dependencies installed

## Step 1: Create a Clerk Application

1. Go to [Clerk Dashboard](https://dashboard.clerk.com)
2. Click **Create application**
3. Enter an application name (e.g., "Agent Kit" or "Agent Kit Dev")
4. Select your preferred sign-in methods:
   - **Email** (recommended)
   - **Google** (optional)
   - **GitHub** (optional)
5. Click **Create application**

## Step 2: Get Your API Keys

After creating the application:

1. In the Clerk Dashboard, go to **API Keys** (in the sidebar)
2. Copy the following keys:
   - **Publishable key** (starts with `pk_test_` or `pk_live_`)
   - **Secret key** (starts with `sk_test_` or `sk_live_`)

## Step 3: Configure Environment Variables

### Backend Configuration

Create or update `apps/server/.env`:

```bash
# Clerk Authentication (Required)
CLERK_SECRET_KEY=sk_test_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx
CLERK_PUBLISHABLE_KEY=pk_test_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Other required variables
DATABASE_URL=postgres://postgres:postgres@localhost:5432/agent_kit
REDIS_URL=redis://localhost:6379
OPENAI_API_KEY=sk-...
TAVILY_API_KEY=tvly-...
```

### Frontend Configuration

Create or update `apps/web/.env`:

```bash
# Clerk Authentication (Required)
VITE_CLERK_PUBLISHABLE_KEY=pk_test_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Backend URL
VITE_SERVER_URL=http://localhost:3000
```

## Step 4: Enable Organizations

Organizations are the core of Agent Kit's multitenancy. Each organization represents a "project" or "tenant".

1. In Clerk Dashboard, go to **Organizations** in the sidebar
2. Click **Enable organizations**
3. Configure organization settings:

### Recommended Settings

| Setting                       | Value        | Why                                   |
| ----------------------------- | ------------ | ------------------------------------- |
| **Enable organizations**      | On           | Required for multitenancy             |
| **Limit users to single org** | Off          | Users can belong to multiple projects |
| **Creator role**              | `org:admin`  | Project creators become admins        |
| **Default role**              | `org:member` | New members get basic access          |

## Step 5: Configure Roles

Agent Kit uses two roles:

| Role         | Permissions                                                 |
| ------------ | ----------------------------------------------------------- |
| `org:admin`  | Full access - manage members, invite users, change settings |
| `org:member` | Basic access - create sessions, use agents                  |

### Setting Up Roles

1. Go to **Organizations** → **Roles**
2. Ensure these roles exist:
   - `org:admin` - Administrative access
   - `org:member` - Member access

The default Clerk organization roles work out of the box.

## Step 6: Create Your First Organization

1. Go to **Organizations** → **Organizations** tab
2. Click **Create organization**
3. Enter:
   - **Name**: Your project name (e.g., "My Project")
   - **Slug**: URL-friendly identifier (e.g., "my-project")
4. Click **Create**

### Add Members

1. Select the organization you created
2. Go to the **Members** tab
3. Click **Invite member**
4. Enter the email address and select a role

## Step 7: Configure Sign-Up Flow (Optional)

By default, new users won't belong to any organization. You have two options:

### Option A: Admin-Managed Membership

Users sign up and wait for an admin to add them to an organization. This is the default behavior.

### Option B: Allow Organization Creation

Let users create their own organizations:

1. Go to **Organizations** → **Settings**
2. Enable **Allow users to create organizations**

## Step 8: Configure OAuth Providers (Optional)

To enable Google or GitHub sign-in:

### Google OAuth

1. Go to **User & Authentication** → **Social connections**
2. Click **Google**
3. Follow the setup wizard to:
   - Create a Google Cloud project
   - Configure OAuth consent screen
   - Add OAuth credentials
4. Enter the Client ID and Secret

### GitHub OAuth

1. Go to **User & Authentication** → **Social connections**
2. Click **GitHub**
3. Follow the setup wizard to:
   - Create a GitHub OAuth app
   - Add the callback URL
4. Enter the Client ID and Secret

## Step 9: Test Your Setup

1. Start the development server:

   ```bash
   bun run dev
   ```

2. Open `http://localhost:5173`

3. You should see the sign-in page

4. Create an account or sign in

5. If you're not assigned to an organization, you'll see the "No Project" page

6. Add yourself to an organization via Clerk Dashboard

7. Refresh the page - you should now access the main app

## Architecture Overview

### Authentication Flow

```
User → Sign-in → Clerk Auth → JWT Created
                      ↓
Frontend receives JWT via Clerk SDK
                      ↓
TRPCProvider gets token via useAuth().getToken()
                      ↓
Token sent to backend in Authorization header
                      ↓
Clerk plugin verifies JWT → extracts userId, orgId, orgRole
                      ↓
tRPC procedures enforce access based on role
```

### Multitenancy Flow

```
User signs in
       ↓
Assigned to 1+ organizations (by admin or self-service)
       ↓
Clerk stores orgId in JWT when org is active
       ↓
Frontend shows org switcher
       ↓
User switches org → Clerk updates JWT
       ↓
Backend filters all data by orgId
```

### Key Files

| File                                       | Purpose                         |
| ------------------------------------------ | ------------------------------- |
| `apps/server/src/plugins/clerk.ts`         | JWT verification middleware     |
| `apps/server/src/types/auth.ts`            | Auth context types              |
| `apps/server/src/trpc/trpc.ts`             | Procedure definitions with auth |
| `apps/server/src/trpc/routers/members.ts`  | Member management API           |
| `apps/web/src/providers/ClerkProvider.tsx` | Clerk React wrapper             |
| `apps/web/src/providers/TRPCProvider.tsx`  | Token injection for API calls   |
| `apps/web/src/layouts/ProtectedLayout.tsx` | Route protection                |

## Procedure Types

The backend uses different procedure types based on required permissions:

```typescript
// No auth required
publicProcedure;

// Requires signed-in user
protectedProcedure;

// Requires signed-in user + active organization
orgProcedure;

// Requires org:admin role
adminProcedure;

// Requires session ownership verification
sessionProcedure;
```

## Tenant Isolation

All data is isolated by organization:

```typescript
// Database tables include orgId column
export const agentSessions = pgTable('agent_sessions', {
  id: uuid('id').primaryKey(),
  userId: varchar('user_id', { length: 255 }).notNull(),
  orgId: varchar('org_id', { length: 255 }).notNull(), // Tenant key
  // ...
});

// Queries always filter by orgId
const sessions = await db
  .select()
  .from(agentSessions)
  .where(
    and(
      eq(agentSessions.userId, userId),
      eq(agentSessions.orgId, orgId) // Enforced isolation
    )
  );
```

## Troubleshooting

### "You must be signed in" error

- Check that `CLERK_SECRET_KEY` is set correctly in backend `.env`
- Verify the token is being sent in the Authorization header
- Check browser console for Clerk initialization errors

### "You must select a project" error

- User is signed in but not assigned to any organization
- Add the user to an organization via Clerk Dashboard

### JWT verification fails

- Ensure `CLERK_SECRET_KEY` matches your Clerk application
- Check that you're using the correct environment (test vs. live)
- Verify the token hasn't expired

### Organization not showing in switcher

- Check that the user is a member of the organization
- Verify organizations are enabled in Clerk Dashboard
- Try signing out and back in to refresh the token

## Security Considerations

1. **Never expose `CLERK_SECRET_KEY`** - Only use in backend
2. **Validate all org access** - The `orgProcedure` middleware handles this
3. **Verify session ownership** - Use `sessionProcedure` for session-specific operations
4. **Admin self-protection** - Admins cannot demote themselves or remove themselves

## Next Steps

After setting up Clerk authentication, you can proceed with:

- Configure AI providers (OpenAI, Anthropic) by setting environment variables
- Set up additional integrations as needed for your use case
