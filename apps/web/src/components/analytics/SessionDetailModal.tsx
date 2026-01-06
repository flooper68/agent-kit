import {
  Button,
  CopyButton,
  Dialog,
  Heading,
  Spinner,
  Text,
} from '@agent-kit/ui';
import { Download } from 'lucide-react';
import { trpc } from '../../lib/trpc';
import { SessionMetadataHeader } from './SessionMetadataHeader';
import { SessionEventsTimeline } from './SessionEventsTimeline';

interface SessionDetailModalProps {
  sessionId: string | null;
  onClose: () => void;
}

export function SessionDetailModal({
  sessionId,
  onClose,
}: SessionDetailModalProps) {
  const sessionQuery = trpc.analytics.getSessionDetail.useQuery(
    { sessionId: sessionId! },
    { enabled: !!sessionId }
  );

  const isOpen = !!sessionId;

  const jsonContent = sessionQuery.data
    ? JSON.stringify(
        {
          session: sessionQuery.data.session,
          messages: sessionQuery.data.messages,
          events: sessionQuery.data.events,
        },
        null,
        2
      )
    : '';

  const handleDownload = () => {
    if (!sessionQuery.data || !sessionId) return;

    const blob = new Blob([jsonContent], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `session-${sessionId}-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <Dialog.Content
        size="2xl"
        className="max-h-[90vh] overflow-hidden flex flex-col"
      >
        <Dialog.Header>
          <Dialog.Title>
            {sessionQuery.data?.session.title ?? 'Session Details'}
          </Dialog.Title>
          {sessionQuery.data?.session.description && (
            <Dialog.Description>
              {sessionQuery.data.session.description}
            </Dialog.Description>
          )}
        </Dialog.Header>

        <div className="flex-1 overflow-y-auto divide-y">
          {sessionQuery.isLoading && (
            <div className="flex items-center justify-center py-12">
              <Spinner size="lg" />
            </div>
          )}

          {sessionQuery.error && (
            <div className="py-8 text-center">
              <Text className="text-red-500">
                Failed to load session details
              </Text>
              <Text className="text-sm text-muted-foreground mt-1">
                {sessionQuery.error.message}
              </Text>
            </div>
          )}

          {sessionQuery.data && (
            <div className="divide-y divide-border">
              <div className="py-3">
                <SessionMetadataHeader session={sessionQuery.data.session} />
              </div>

              <div className="py-3">
                <Heading as="h4" size="14" className="mb-3">
                  Events ({sessionQuery.data.events.length})
                </Heading>
                <SessionEventsTimeline
                  events={sessionQuery.data.events}
                  messages={sessionQuery.data.messages}
                />
              </div>
            </div>
          )}
        </div>

        <Dialog.Footer className="flex gap-2">
          <CopyButton content={jsonContent} />
          <Button
            variant="outline"
            onClick={handleDownload}
            disabled={!sessionQuery.data}
          >
            <Download className="mr-2 h-4 w-4" />
            Download JSON
          </Button>
          <Dialog.Close asChild>
            <Button variant="ghost">Close</Button>
          </Dialog.Close>
        </Dialog.Footer>
      </Dialog.Content>
    </Dialog>
  );
}
