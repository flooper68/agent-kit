import {
  Dialog,
  Text,
  Button,
  MarkdownRenderer,
  CopyButton,
} from '@agent-kit/ui';
import { Download, FileText } from 'lucide-react';
import { trpc } from '../../lib/trpc';

interface ArtifactDetailModalProps {
  artifactId: string | null;
  onClose: () => void;
  onDownload: (artifact: { title: string; content: string }) => void;
}

export function ArtifactDetailModal({
  artifactId,
  onClose,
  onDownload,
}: ArtifactDetailModalProps) {
  const artifactQuery = trpc.artifacts.get.useQuery(
    { id: artifactId! },
    { enabled: !!artifactId }
  );

  const handleDownload = () => {
    if (!artifactQuery.data) return;
    onDownload({
      title: artifactQuery.data.title,
      content: artifactQuery.data.content,
    });
  };

  const formatDate = (date: Date | string) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    }).format(new Date(date));
  };

  return (
    <Dialog open={!!artifactId} onOpenChange={(open) => !open && onClose()}>
      <Dialog.Content size="2xl" className="flex max-h-[85vh] flex-col">
        <Dialog.Header>
          <Dialog.Title className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            {artifactQuery.data?.title ?? 'Loading...'}
          </Dialog.Title>
          {artifactQuery.data?.summary && (
            <Dialog.Description>
              {artifactQuery.data.summary}
            </Dialog.Description>
          )}
        </Dialog.Header>

        <div className="flex-1 overflow-y-auto py-4">
          {artifactQuery.isLoading && (
            <div className="flex items-center justify-center py-12">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-muted border-t-primary" />
            </div>
          )}

          {artifactQuery.error && (
            <div className="rounded-lg bg-destructive/10 p-4 text-destructive">
              <Text>Failed to load artifact</Text>
            </div>
          )}

          {artifactQuery.data && (
            <div className="space-y-4">
              {/* Metadata */}
              <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                <span>Created: {formatDate(artifactQuery.data.createdAt)}</span>
                {new Date(artifactQuery.data.updatedAt).getTime() !==
                  new Date(artifactQuery.data.createdAt).getTime() && (
                  <span>
                    Updated: {formatDate(artifactQuery.data.updatedAt)}
                  </span>
                )}
              </div>

              {/* Content */}
              <div className="rounded-lg border bg-muted/30 p-4">
                <MarkdownRenderer content={artifactQuery.data.content} />
              </div>
            </div>
          )}
        </div>

        <Dialog.Footer>
          <CopyButton content={artifactQuery.data?.content ?? ''} />
          <Button
            variant="outline"
            onClick={handleDownload}
            disabled={!artifactQuery.data}
          >
            <Download className="mr-2 h-4 w-4" />
            Download
          </Button>
          <Dialog.Close asChild>
            <Button variant="ghost">Close</Button>
          </Dialog.Close>
        </Dialog.Footer>
      </Dialog.Content>
    </Dialog>
  );
}
