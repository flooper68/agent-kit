import { Dialog, Heading, Spinner, Text } from '@agent-kit/ui';
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
                <SessionEventsTimeline events={sessionQuery.data.events} />
              </div>
            </div>
          )}
        </div>

        <Dialog.Footer>
          <Dialog.Close asChild>
            <button className="px-4 py-2 text-sm font-medium rounded-md bg-muted hover:bg-muted/80 transition-colors">
              Close
            </button>
          </Dialog.Close>
        </Dialog.Footer>
      </Dialog.Content>
    </Dialog>
  );
}
