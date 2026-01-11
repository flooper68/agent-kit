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
import { BookOpen, Search, Plus, Files, Lock } from 'lucide-react';
import { trpc } from '../lib/trpc';
import { useHeaderActions } from '../contexts/HeaderActionsContext';

/**
 * Custom hook for debouncing a value
 */
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
}

type FilterType = 'all' | 'system' | 'user';

export function SkillsPage() {
  const navigate = useNavigate();
  const { setActions, clearActions } = useHeaderActions();
  const [cursors, setCursors] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<FilterType>('all');
  const debouncedSearch = useDebounce(searchQuery, 300);
  const currentCursor = cursors[cursors.length - 1];

  useEffect(() => {
    document.title = 'Skills | Agent Kit';
  }, []);

  // Set header action
  useEffect(() => {
    setActions([
      {
        id: 'create-skill',
        label: 'New Skill',
        icon: <Plus className="h-4 w-4" />,
        onClick: () => navigate('/app/skills/new'),
      },
    ]);
    return () => clearActions();
  }, [setActions, clearActions, navigate]);

  // Reset pagination when search or filter changes
  useEffect(() => {
    setCursors([]);
  }, [debouncedSearch, filter]);

  const skillsQuery = trpc.skills.list.useQuery({
    limit: 25,
    cursor: currentCursor,
    search: debouncedSearch || undefined,
    filter: filter === 'all' ? undefined : filter,
  });

  const handleNextPage = useCallback(() => {
    if (skillsQuery.data?.nextCursor) {
      setCursors([...cursors, skillsQuery.data.nextCursor]);
    }
  }, [skillsQuery.data?.nextCursor, cursors]);

  const handlePreviousPage = useCallback(() => {
    setCursors(cursors.slice(0, -1));
  }, [cursors]);

  const formatDate = (date: Date | string) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }).format(new Date(date));
  };

  return (
    <div className="h-full overflow-auto p-6">
      <div className="mx-auto max-w-4xl">
        {/* Header */}
        <div className="mb-6">
          <Heading as="h1" size="24">
            Skills
          </Heading>
          <Text className="text-muted-foreground">
            Documentation and tool guides for your AI agents
          </Text>
        </div>

        {/* Search and Filter */}
        <div className="mb-4 flex gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search skills..."
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
              variant={filter === 'system' ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setFilter('system')}
            >
              System
            </Button>
            <Button
              variant={filter === 'user' ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setFilter('user')}
            >
              My Skills
            </Button>
          </div>
        </div>

        {/* Loading State */}
        {skillsQuery.isLoading && (
          <div className="space-y-2">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 animate-pulse rounded-lg bg-muted" />
            ))}
          </div>
        )}

        {/* Content */}
        {skillsQuery.data && (
          <>
            {skillsQuery.data.items.length === 0 ? (
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
                    <BookOpen className="mb-4 h-12 w-12 text-muted-foreground" />
                    <Text className="font-medium">No skills yet</Text>
                    <Text className="text-sm text-muted-foreground">
                      Create a skill to teach your agents new capabilities
                    </Text>
                  </>
                )}
              </div>
            ) : (
              <DataList>
                {skillsQuery.data.items.map((skill) => (
                  <DataList.Item
                    key={skill.id}
                    className="cursor-pointer transition-colors hover:bg-muted/50"
                    onClick={() => navigate(`/app/skills/${skill.id}`)}
                  >
                    <DataList.Cell shrink>
                      <BookOpen className="h-5 w-5 text-muted-foreground" />
                    </DataList.Cell>
                    <DataList.Cell grow>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <Text className="truncate font-medium">
                            {skill.name}
                          </Text>
                          {skill.isSystem && (
                            <span className="inline-flex items-center rounded-md bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                              <Lock className="mr-1 h-3 w-3" />
                              System
                            </span>
                          )}
                        </div>
                        <Text className="truncate text-sm text-muted-foreground">
                          {skill.description}
                        </Text>
                      </div>
                    </DataList.Cell>
                    <DataList.Cell shrink>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Files className="h-4 w-4" />
                        <span>{(skill.files as unknown[]).length}</span>
                      </div>
                    </DataList.Cell>
                    <DataList.Cell shrink>
                      <Text className="text-sm text-muted-foreground">
                        {formatDate(skill.createdAt)}
                      </Text>
                    </DataList.Cell>
                  </DataList.Item>
                ))}
              </DataList>
            )}

            {/* Pagination */}
            {(skillsQuery.data.nextCursor || cursors.length > 0) && (
              <div className="mt-4">
                <Pagination
                  hasNextPage={!!skillsQuery.data.nextCursor}
                  hasPreviousPage={cursors.length > 0}
                  onNextPage={handleNextPage}
                  onPreviousPage={handlePreviousPage}
                  isLoading={skillsQuery.isFetching}
                />
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
