import { useEffect, useRef } from 'react';
import { HardDrive, RefreshCw } from 'lucide-react';
import {
  IntegrationCard,
  IntegrationStatus,
  Button,
  FolderPickerButton,
  Text,
} from '@agent-kit/ui';
import { trpc } from '../../../lib/trpc';

export function GoogleDriveIntegration() {
  const utils = trpc.useUtils();

  // Check if Google Drive is configured on the server
  const { data: config } = trpc.googleDrive.isConfigured.useQuery();

  // Get current connection status
  const { data: connection, isLoading: isLoadingConnection } =
    trpc.googleDrive.getConnection.useQuery(undefined, {
      enabled: config?.configured,
    });

  // Get sync stats
  const { data: syncStats } = trpc.googleDrive.getSyncStats.useQuery(
    undefined,
    {
      enabled: config?.configured && !!connection,
    }
  );

  // Get auth URL for OAuth flow
  const { data: authData } = trpc.googleDrive.getAuthUrl.useQuery(undefined, {
    enabled: config?.configured && !connection,
  });

  // Mutations
  const disconnectMutation = trpc.googleDrive.disconnect.useMutation({
    onSuccess: () => {
      utils.googleDrive.getConnection.invalidate();
      utils.googleDrive.getSyncStats.invalidate();
    },
  });

  const updateFolderMutation = trpc.googleDrive.updateFolder.useMutation({
    onSuccess: () => {
      utils.googleDrive.getConnection.invalidate();
    },
  });

  const syncAllMutation = trpc.googleDrive.syncAllArtifacts.useMutation({
    onSuccess: () => {
      utils.googleDrive.getSyncStats.invalidate();
    },
  });

  // Handle OAuth callback from URL
  const handleCallbackMutation = trpc.googleDrive.handleCallback.useMutation({
    onSuccess: () => {
      utils.googleDrive.getConnection.invalidate();
      // Clean up URL
      window.history.replaceState({}, '', window.location.pathname);
    },
  });

  // Track if callback has been handled to prevent double execution
  const callbackHandledRef = useRef(false);

  // Check for OAuth callback on mount
  useEffect(() => {
    if (callbackHandledRef.current) return;

    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    const state = params.get('state');

    if (code && state && !connection && config?.configured) {
      callbackHandledRef.current = true;
      handleCallbackMutation.mutate({ code, state });
    }
  }, [config?.configured, connection, handleCallbackMutation]);

  const handleConnect = () => {
    if (authData?.url) {
      window.location.href = authData.url;
    }
  };

  const handleDisconnect = () => {
    if (
      window.confirm(
        'Are you sure you want to disconnect Google Drive? Synced files will remain in Drive.'
      )
    ) {
      disconnectMutation.mutate();
    }
  };

  const handleFolderPick = () => {
    // For now, use a simple prompt. In production, use the Google Picker API.
    const folderId = window.prompt('Enter Google Drive folder ID:');
    const folderName = window.prompt('Enter folder name:');

    if (folderId && folderName) {
      updateFolderMutation.mutate({ folderId, folderName });
    }
  };

  const handleSyncAll = () => {
    syncAllMutation.mutate();
  };

  // Don't render if not configured
  if (!config?.configured) {
    return (
      <IntegrationCard
        title="Google Drive"
        description="Sync your artifacts to Google Drive"
        icon={<HardDrive className="h-5 w-5 text-muted-foreground" />}
        status="disconnected"
      >
        <Text className="text-sm text-muted-foreground">
          Google Drive integration is not configured. Contact your administrator
          to set up the Google OAuth credentials.
        </Text>
      </IntegrationCard>
    );
  }

  // Loading state
  if (isLoadingConnection) {
    return (
      <IntegrationCard
        title="Google Drive"
        description="Sync your artifacts to Google Drive"
        icon={<HardDrive className="h-5 w-5 text-muted-foreground" />}
        status="disconnected"
      >
        <Text className="text-sm text-muted-foreground">Loading...</Text>
      </IntegrationCard>
    );
  }

  // Determine status
  let status: IntegrationStatus = 'disconnected';
  if (connection) {
    status = connection.isActive ? 'connected' : 'error';
  }

  return (
    <IntegrationCard
      title="Google Drive"
      description="Sync your artifacts to Google Drive"
      icon={<HardDrive className="h-5 w-5 text-muted-foreground" />}
      status={status}
      statusLabel={connection?.googleEmail}
    >
      {!connection ? (
        <div className="space-y-3">
          {handleCallbackMutation.isPending ? (
            <Text className="text-sm text-muted-foreground">
              Connecting to Google Drive...
            </Text>
          ) : handleCallbackMutation.isError ? (
            <div className="space-y-2">
              <Text className="text-sm text-destructive">
                Failed to connect: {handleCallbackMutation.error.message}
              </Text>
              <Button variant="primary" size="sm" onClick={handleConnect}>
                Try Again
              </Button>
            </div>
          ) : (
            <Button variant="primary" size="sm" onClick={handleConnect}>
              Connect Google Drive
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {/* Folder Selection */}
          <div className="flex items-center justify-between">
            <Text className="text-sm text-muted-foreground">Sync folder:</Text>
            <FolderPickerButton
              folderName={connection.folderName ?? undefined}
              placeholder="Select folder..."
              onClick={handleFolderPick}
              disabled={updateFolderMutation.isPending}
            />
          </div>

          {/* Sync Stats */}
          {syncStats && connection.folderId && (
            <div className="rounded-md bg-muted/50 p-3 text-sm">
              <div className="flex justify-between">
                <Text className="text-muted-foreground">Synced</Text>
                <Text className="font-medium">{syncStats.synced}</Text>
              </div>
              <div className="flex justify-between">
                <Text className="text-muted-foreground">Pending</Text>
                <Text className="font-medium">{syncStats.pending}</Text>
              </div>
              {syncStats.failed > 0 && (
                <div className="flex justify-between text-destructive">
                  <Text>Failed</Text>
                  <Text className="font-medium">{syncStats.failed}</Text>
                </div>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2">
            {connection.folderId && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleSyncAll}
                disabled={syncAllMutation.isPending}
              >
                <RefreshCw
                  className={`mr-2 h-4 w-4 ${syncAllMutation.isPending ? 'animate-spin' : ''}`}
                />
                Sync All
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDisconnect}
              disabled={disconnectMutation.isPending}
            >
              Disconnect
            </Button>
          </div>

          {!connection.folderId && (
            <Text className="text-sm text-amber-600 dark:text-amber-400">
              Select a folder to start syncing artifacts.
            </Text>
          )}
        </div>
      )}
    </IntegrationCard>
  );
}
