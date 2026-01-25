import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Heading,
  Text,
  DataList,
  Pagination,
  Button,
  Input,
} from '@agent-kit/ui';
import {
  Clock,
  Search,
  Plus,
  Play,
  Pause,
  CheckCircle,
  XCircle,
  Loader2,
} from 'lucide-react';
import { trpc } from '../lib/trpc';
import { useHeaderActions } from '../contexts/HeaderActionsContext';
import { useUrlState } from '../hooks/useUrlState';

type FilterType = 'all' | 'enabled' | 'disabled';

export function ScheduledJobsPage() {
  const navigate = useNavigate();
  const { setActions, clearActions } = useHeaderActions();
  const [cursors, setCursors] = useState<string[]>([]);
  const [searchQuery, setSearchQuery, debouncedSearch] = useUrlState('search', {
    debounceMs: 300,
  });
  const [filter, setFilter] = useUrlState<FilterType>('filter', {
    defaultValue: 'all',
    parse: (v) =>
      v && ['all', 'enabled', 'disabled'].includes(v)
        ? (v as FilterType)
        : 'all',
  });
  const currentCursor = cursors[cursors.length - 1];
  const utils = trpc.useUtils();

  useEffect(() => {
    document.title = 'Scheduled Jobs | Agent Kit';
  }, []);

  // Set header action
  useEffect(() => {
    setActions([
      {
        id: 'create-scheduled-job',
        label: 'New Job',
        icon: <Plus className="h-4 w-4" />,
        onClick: () => navigate('/app/scheduled-jobs/new'),
      },
    ]);
    return () => clearActions();
  }, [setActions, clearActions, navigate]);

  // Reset pagination when search or filter changes
  useEffect(() => {
    setCursors([]);
  }, [debouncedSearch, filter]);

  const jobsQuery = trpc.scheduledJobs.list.useQuery({
    limit: 25,
    cursor: currentCursor,
    search: debouncedSearch || undefined,
    enabled: filter === 'all' ? undefined : filter === 'enabled',
  });

  const toggleMutation = trpc.scheduledJobs.update.useMutation({
    onSuccess: () => {
      utils.scheduledJobs.list.invalidate();
    },
  });

  const handleToggle = useCallback(
    (e: React.MouseEvent, jobId: string, currentEnabled: boolean) => {
      e.stopPropagation();
      toggleMutation.mutate({ id: jobId, enabled: !currentEnabled });
    },
    [toggleMutation]
  );

  const handleNextPage = useCallback(() => {
    if (jobsQuery.data?.nextCursor) {
      setCursors([...cursors, jobsQuery.data.nextCursor]);
    }
  }, [jobsQuery.data?.nextCursor, cursors]);

  const handlePreviousPage = useCallback(() => {
    setCursors(cursors.slice(0, -1));
  }, [cursors]);

  const formatDate = (date: Date | string | null) => {
    if (!date) return 'Never';
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    }).format(new Date(date));
  };

  const getStatusIcon = (status: string | null) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'running':
        return <Loader2 className="h-4 w-4 animate-spin text-blue-500" />;
      default:
        return null;
    }
  };

  return (
    <div className="flex h-full flex-col overflow-hidden p-6">
      <div className="mx-auto w-full max-w-4xl flex-1 overflow-auto">
        {/* Header */}
        <div className="mb-6">
          <Heading as="h1" size="24">
            Scheduled Jobs
          </Heading>
          <Text className="text-muted-foreground">
            Cron-based schedules to automatically spawn agents
          </Text>
        </div>

        {/* Search and Filter */}
        <div className="mb-4 flex gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search jobs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <div className="flex gap-1">
            <Button
              variant={filter === 'all' ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setFilter('all')}
            >
              All
            </Button>
            <Button
              variant={filter === 'enabled' ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setFilter('enabled')}
            >
              Enabled
            </Button>
            <Button
              variant={filter === 'disabled' ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setFilter('disabled')}
            >
              Disabled
            </Button>
          </div>
        </div>

        {/* Loading State */}
        {jobsQuery.isLoading && (
          <div className="space-y-2">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-20 animate-pulse rounded-lg bg-muted" />
            ))}
          </div>
        )}

        {/* Content */}
        {jobsQuery.data && (
          <>
            {jobsQuery.data.items.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                {debouncedSearch ? (
                  <>
                    <Search className="mb-4 h-12 w-12 text-muted-foreground" />
                    <Text className="font-medium">No matches found</Text>
                    <Text className="text-sm text-muted-foreground">
                      Try a different search term
                    </Text>
                  </>
                ) : (
                  <>
                    <Clock className="mb-4 h-12 w-12 text-muted-foreground" />
                    <Text className="font-medium">No scheduled jobs yet</Text>
                    <Text className="mb-4 text-sm text-muted-foreground">
                      Create a scheduled job to automatically spawn agents
                    </Text>
                    <Button onClick={() => navigate('/app/scheduled-jobs/new')}>
                      <Plus className="mr-2 h-4 w-4" />
                      Create Job
                    </Button>
                  </>
                )}
              </div>
            ) : (
              <DataList>
                {jobsQuery.data.items.map((job) => (
                  <DataList.Item
                    key={job.id}
                    className="cursor-pointer transition-colors hover:bg-muted/50"
                    onClick={() =>
                      navigate(`/app/scheduled-jobs/${job.id}/edit`)
                    }
                  >
                    <DataList.Cell shrink>
                      <Clock
                        className={`h-5 w-5 ${job.enabled ? 'text-primary' : 'text-muted-foreground'}`}
                      />
                    </DataList.Cell>
                    <DataList.Cell grow>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <Text
                            className={`truncate font-medium ${!job.enabled && 'text-muted-foreground'}`}
                          >
                            {job.name}
                          </Text>
                          {!job.enabled && (
                            <span className="inline-flex items-center rounded-md bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                              Disabled
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <code className="rounded bg-muted px-1 text-xs">
                            {job.cronExpression}
                          </code>
                          <span className="truncate">
                            {job.message.slice(0, 50)}
                            {job.message.length > 50 && '...'}
                          </span>
                        </div>
                      </div>
                    </DataList.Cell>
                    <DataList.Cell shrink>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        {getStatusIcon(job.lastRunStatus)}
                        <span>
                          {job.lastRunAt
                            ? formatDate(job.lastRunAt)
                            : 'Never run'}
                        </span>
                      </div>
                    </DataList.Cell>
                    <DataList.Cell shrink>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => handleToggle(e, job.id, job.enabled)}
                        disabled={toggleMutation.isPending}
                      >
                        {job.enabled ? (
                          <Pause className="h-4 w-4" />
                        ) : (
                          <Play className="h-4 w-4" />
                        )}
                      </Button>
                    </DataList.Cell>
                  </DataList.Item>
                ))}
              </DataList>
            )}

            {/* Pagination */}
            {(jobsQuery.data.nextCursor || cursors.length > 0) && (
              <div className="mt-4">
                <Pagination
                  hasNextPage={!!jobsQuery.data.nextCursor}
                  hasPreviousPage={cursors.length > 0}
                  onNextPage={handleNextPage}
                  onPreviousPage={handlePreviousPage}
                  isLoading={jobsQuery.isFetching}
                />
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
