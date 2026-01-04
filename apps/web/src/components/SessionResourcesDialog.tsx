import { useState } from 'react';
import { Dialog, Text, Button } from '@agent-kit/ui';
import { FileText, Globe, ExternalLink, Layers } from 'lucide-react';
import { trpc } from '../lib/trpc';
import { ArtifactDetailModal } from './artifacts/ArtifactDetailModal';

interface SessionResourcesDialogProps {
  sessionId: string | null;
  onClose: () => void;
}

export function SessionResourcesDialog({
  sessionId,
  onClose,
}: SessionResourcesDialogProps) {
  const [selectedArtifactId, setSelectedArtifactId] = useState<string | null>(
    null
  );

  const resourcesQuery = trpc.sessions.getResources.useQuery(
    { sessionId: sessionId! },
    { enabled: !!sessionId }
  );

  const handleArtifactClick = (artifactId: string) => {
    setSelectedArtifactId(artifactId);
  };

  const handleArtifactClose = () => {
    setSelectedArtifactId(null);
  };

  const handleDownload = (artifact: { title: string; content: string }) => {
    const blob = new Blob([artifact.content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${artifact.title}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const artifacts = resourcesQuery.data?.artifacts ?? [];
  const websites = resourcesQuery.data?.websites ?? [];

  return (
    <>
      <Dialog open={!!sessionId} onOpenChange={(open) => !open && onClose()}>
        <Dialog.Content size="lg" className="flex max-h-[85vh] flex-col">
          <Dialog.Header>
            <Dialog.Title className="flex items-center gap-2">
              <Layers className="h-5 w-5" />
              Session Resources
            </Dialog.Title>
            <Dialog.Description>
              Artifacts and websites referenced in this session
            </Dialog.Description>
          </Dialog.Header>

          <div className="flex-1 space-y-6 overflow-y-auto py-4">
            {resourcesQuery.isLoading && (
              <div className="flex items-center justify-center py-12">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-muted border-t-primary" />
              </div>
            )}

            {resourcesQuery.error && (
              <div className="rounded-lg bg-destructive/10 p-4 text-destructive">
                <Text>Failed to load resources</Text>
              </div>
            )}

            {resourcesQuery.data && (
              <>
                {/* Artifacts Section */}
                <div>
                  <h3 className="mb-3 flex items-center gap-2 text-sm font-medium">
                    <FileText className="h-4 w-4" />
                    Artifacts ({artifacts.length})
                  </h3>
                  {artifacts.length === 0 ? (
                    <Text className="text-sm text-muted-foreground">
                      No artifacts created in this session
                    </Text>
                  ) : (
                    <div className="space-y-2">
                      {artifacts.map((artifact) => (
                        <button
                          key={artifact.id}
                          onClick={() => handleArtifactClick(artifact.id)}
                          className="w-full rounded-lg border bg-muted/30 p-3 text-left transition-colors hover:bg-muted/50"
                        >
                          <div className="font-medium">{artifact.title}</div>
                          {artifact.summary && (
                            <div className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                              {artifact.summary}
                            </div>
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Websites Section */}
                <div>
                  <h3 className="mb-3 flex items-center gap-2 text-sm font-medium">
                    <Globe className="h-4 w-4" />
                    Websites ({websites.length})
                  </h3>
                  {websites.length === 0 ? (
                    <Text className="text-sm text-muted-foreground">
                      No websites accessed in this session
                    </Text>
                  ) : (
                    <div className="space-y-2">
                      {websites.map((website) => (
                        <a
                          key={website.url}
                          href={website.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="group flex items-start gap-3 rounded-lg border bg-muted/30 p-3 transition-colors hover:bg-muted/50"
                        >
                          <div className="min-w-0 flex-1">
                            <div className="truncate font-medium">
                              {website.title}
                            </div>
                            {website.snippet && (
                              <div className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                                {website.snippet}
                              </div>
                            )}
                            <div className="mt-1 truncate text-xs text-muted-foreground">
                              {website.url}
                            </div>
                          </div>
                          <ExternalLink className="h-4 w-4 flex-shrink-0 text-muted-foreground group-hover:text-foreground" />
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>

          <Dialog.Footer>
            <Dialog.Close asChild>
              <Button variant="ghost">Close</Button>
            </Dialog.Close>
          </Dialog.Footer>
        </Dialog.Content>
      </Dialog>

      <ArtifactDetailModal
        artifactId={selectedArtifactId}
        onClose={handleArtifactClose}
        onDownload={handleDownload}
      />
    </>
  );
}
