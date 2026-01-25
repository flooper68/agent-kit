import { Cloud, RefreshCw } from 'lucide-react';
import { SyncStatusBadge, SyncStatus, Button, Tooltip } from '@agent-kit/ui';
import { trpc } from '../../lib/trpc';

interface ArtifactSyncBadgeProps {
  artifactId: string;
  showSyncButton?: boolean;
}

export function ArtifactSyncBadge({
  artifactId,
  showSyncButton = false,
}: ArtifactSyncBadgeProps) {
  const utils = trpc.useUtils();

  // Check if Google Drive is configured
  const { data: config } = trpc.googleDrive.isConfigured.useQuery();

  // Get sync status for this artifact
  const { data: syncStatus, isLoading } =
    trpc.googleDrive.getSyncStatus.useQuery(
      { artifactId },
      { enabled: config?.configured === true }
    );

  // Sync mutation
  const syncMutation = trpc.googleDrive.syncArtifact.useMutation({
    onSuccess: () => {
      utils.googleDrive.getSyncStatus.invalidate({ artifactId });
    },
  });

  // Don't render if Google Drive isn't configured
  if (!config?.configured) {
    return null;
  }

  // Loading state
  if (isLoading) {
    return null;
  }

  // No sync record means not synced yet
  if (!syncStatus) {
    if (showSyncButton) {
      return (
        <Tooltip content="Sync to Google Drive">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => syncMutation.mutate({ artifactId })}
            disabled={syncMutation.isPending}
          >
            <Cloud className="h-4 w-4 text-muted-foreground" />
          </Button>
        </Tooltip>
      );
    }
    return null;
  }

  // Map the sync status from the API to our UI component
  const status = syncStatus.syncStatus as SyncStatus;

  return (
    <div className="flex items-center gap-2">
      <SyncStatusBadge status={status} />
      {showSyncButton && (status === 'failed' || status === 'error') && (
        <Tooltip content="Retry sync">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => syncMutation.mutate({ artifactId })}
            disabled={syncMutation.isPending}
          >
            <RefreshCw
              className={`h-4 w-4 ${syncMutation.isPending ? 'animate-spin' : ''}`}
            />
          </Button>
        </Tooltip>
      )}
    </div>
  );
}
