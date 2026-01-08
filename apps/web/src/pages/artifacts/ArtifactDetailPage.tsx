import { useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ChevronRight, FileText, Download } from 'lucide-react';
import {
  Heading,
  Text,
  Button,
  MarkdownRenderer,
  CopyButton,
} from '@agent-kit/ui';
import { trpc } from '../../lib/trpc';
import { ArtifactDetailPageSkeleton } from '../../components/skeletons';

export function ArtifactDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const artifactQuery = trpc.artifacts.get.useQuery(
    { id: id! },
    { enabled: !!id }
  );

  useEffect(() => {
    if (artifactQuery.data) {
      document.title = `${artifactQuery.data.title} | Agent Kit`;
    }
    return () => {
      document.title = 'Agent Kit';
    };
  }, [artifactQuery.data]);

  const handleDownload = () => {
    if (!artifactQuery.data) return;
    const blob = new Blob([artifactQuery.data.content], {
      type: 'text/markdown',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${artifactQuery.data.title.replace(/[^a-z0-9]/gi, '_')}.md`;
    a.click();
    URL.revokeObjectURL(url);
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

  // Loading state
  if (artifactQuery.isLoading) {
    return <ArtifactDetailPageSkeleton />;
  }

  // Error/not found state
  if (artifactQuery.error || !artifactQuery.data) {
    return (
      <div className="h-full overflow-auto p-6">
        <div className="mx-auto max-w-4xl">
          {/* Breadcrumb */}
          <nav className="mb-3 flex items-center gap-1.5">
            <Link
              to="/app/artifacts"
              className="text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              Artifacts
            </Link>
            <ChevronRight className="h-4 w-4 text-muted-foreground/50" />
            <span className="text-sm font-medium">Not Found</span>
          </nav>
          <div className="flex flex-col items-center justify-center py-16">
            <Text className="mb-4 text-muted-foreground">
              The artifact you&apos;re looking for doesn&apos;t exist or you
              don&apos;t have access to it.
            </Text>
            <Button onClick={() => navigate('/app/artifacts')}>
              Back to Artifacts
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-auto p-6">
      <div className="mx-auto max-w-4xl">
        {/* Breadcrumb */}
        <nav className="mb-3 flex items-center gap-1.5">
          <Link
            to="/app/artifacts"
            className="text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            Artifacts
          </Link>
          <ChevronRight className="h-4 w-4 text-muted-foreground/50" />
          <span className="max-w-xs truncate text-sm font-medium">
            {artifactQuery.data.title}
          </span>
        </nav>

        {/* Header */}
        <div className="mb-6">
          <div className="mb-2 flex items-center gap-2">
            <FileText className="h-6 w-6 text-muted-foreground" />
            <Heading as="h1" size="24">
              {artifactQuery.data.title}
            </Heading>
          </div>
          {artifactQuery.data.summary && (
            <Text className="text-muted-foreground">
              {artifactQuery.data.summary}
            </Text>
          )}
        </div>

        {/* Metadata */}
        <div className="mb-6 flex flex-wrap gap-4 text-sm text-muted-foreground">
          <span>Created: {formatDate(artifactQuery.data.createdAt)}</span>
          {new Date(artifactQuery.data.updatedAt).getTime() !==
            new Date(artifactQuery.data.createdAt).getTime() && (
            <span>Updated: {formatDate(artifactQuery.data.updatedAt)}</span>
          )}
        </div>

        {/* Action buttons */}
        <div className="mb-6 flex gap-2">
          <CopyButton content={artifactQuery.data.content} />
          <Button variant="outline" onClick={handleDownload}>
            <Download className="mr-2 h-4 w-4" />
            Download
          </Button>
        </div>

        {/* Content */}
        <div className="rounded-lg border bg-muted/30 p-6">
          <MarkdownRenderer content={artifactQuery.data.content} />
        </div>
      </div>
    </div>
  );
}
