import {
  forwardRef,
  memo,
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
} from 'react';
import { cn } from '../../../../lib/utils';
import type { AgentType } from '../../../../types/chat';

const AGENT_USAGE_STORAGE_KEY = 'agent-kit:agent-selector-usage';

interface AgentUsage {
  [agentId: string]: number; // timestamp of last use
}

function getStoredAgentUsage(): AgentUsage {
  try {
    const stored = localStorage.getItem(AGENT_USAGE_STORAGE_KEY);
    if (stored) {
      const parsed: unknown = JSON.parse(stored);
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        const validated: AgentUsage = {};
        for (const [key, value] of Object.entries(parsed)) {
          if (typeof value === 'number') {
            validated[key] = value;
          }
        }
        return validated;
      }
    }
  } catch {
    // Ignore parse errors
  }
  return {};
}

function saveAgentUsage(usage: AgentUsage): void {
  try {
    localStorage.setItem(AGENT_USAGE_STORAGE_KEY, JSON.stringify(usage));
  } catch {
    // Ignore storage errors
  }
}

export interface AgentSelectorProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, 'onSelect'> {
  /** List of available agents to select from */
  agents: AgentType[];
  /** Currently selected agent */
  selectedAgent?: AgentType;
  /** Callback when an agent is selected */
  onSelect?: (agent: AgentType) => void;
  /** Placeholder text when no agent is selected */
  placeholder?: string;
  /** Whether the selector is disabled */
  disabled?: boolean;
}

export const AgentSelector = memo(
  forwardRef<HTMLDivElement, AgentSelectorProps>(
    (
      {
        agents,
        selectedAgent,
        onSelect,
        placeholder = 'Select agent',
        disabled,
        className,
        ...props
      },
      ref
    ) => {
      const [isOpen, setIsOpen] = useState(false);
      const [searchQuery, setSearchQuery] = useState('');
      const [agentUsage, setAgentUsage] =
        useState<AgentUsage>(getStoredAgentUsage);
      const searchInputRef = useRef<HTMLInputElement>(null);

      const handleClose = useCallback(() => {
        setIsOpen(false);
        setSearchQuery('');
      }, []);

      // Reload usage from storage when dropdown opens
      useEffect(() => {
        if (isOpen) {
          setAgentUsage(getStoredAgentUsage());
        }
      }, [isOpen]);

      const trackAgentUsage = useCallback((agentId: string) => {
        // Read fresh data from localStorage to avoid race conditions with other tabs
        const current = getStoredAgentUsage();
        const updated = { ...current, [agentId]: Date.now() };
        saveAgentUsage(updated);
        setAgentUsage(updated);
      }, []);

      // Normalize text for fuzzy matching
      const normalize = useCallback((text: string) => {
        return text
          .toLowerCase()
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '') // Remove diacritics
          .replace(/[^a-z0-9\s]/g, ' ') // Replace special chars with spaces
          .replace(/\s+/g, ' ')
          .trim();
      }, []);

      // Sort agents by recency (most recently used first)
      const sortedAgents = useMemo(() => {
        return [...agents].sort((a, b) => {
          const aUsage = agentUsage[a.id] ?? 0;
          const bUsage = agentUsage[b.id] ?? 0;
          return bUsage - aUsage; // Most recent first
        });
      }, [agents, agentUsage]);

      // Filter agents based on fuzzy search
      const filteredAgents = useMemo(() => {
        if (!searchQuery.trim()) return sortedAgents;

        // Split query into tokens
        const tokens = normalize(searchQuery).split(' ').filter(Boolean);
        if (tokens.length === 0) return sortedAgents;

        return sortedAgents.filter((agent) => {
          // Build searchable text from all fields
          const searchableText = normalize(
            [agent.name, agent.model, agent.provider, agent.description]
              .filter(Boolean)
              .join(' ')
          );

          // All tokens must match somewhere in the searchable text
          return tokens.every((token) => searchableText.includes(token));
        });
      }, [sortedAgents, searchQuery, normalize]);

      // Close dropdown on Escape key
      useEffect(() => {
        if (!isOpen) return;

        const handleKeyDown = (e: KeyboardEvent) => {
          if (e.key === 'Escape') {
            handleClose();
          }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
      }, [isOpen, handleClose]);

      // Focus search input when dropdown opens
      useEffect(() => {
        if (isOpen && searchInputRef.current) {
          searchInputRef.current.focus();
        }
      }, [isOpen]);

      const handleSelect = (agent: AgentType) => {
        trackAgentUsage(agent.id);
        onSelect?.(agent);
        handleClose();
      };

      return (
        <div ref={ref} className={cn('relative', className)} {...props}>
          <button
            type="button"
            onClick={() => !disabled && setIsOpen(!isOpen)}
            disabled={disabled}
            className={cn(
              'flex items-center gap-2 px-2 py-1 text-sm rounded-md hover:bg-accent transition-colors',
              disabled && 'opacity-50 cursor-not-allowed'
            )}
          >
            {selectedAgent?.icon && (
              <span className="text-muted-foreground flex-shrink-0 [&>svg]:h-4 [&>svg]:w-4">
                {selectedAgent.icon}
              </span>
            )}
            <span className="font-medium">
              {selectedAgent?.name ?? placeholder}
            </span>
            <svg
              className={cn(
                'h-4 w-4 transition-transform',
                isOpen && 'rotate-180'
              )}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </button>

          {isOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={handleClose} />
              <div className="absolute bottom-full left-0 mb-1 w-72 z-20 rounded-md border bg-popover shadow-md">
                <div className="p-2 border-b">
                  <input
                    ref={searchInputRef}
                    type="text"
                    placeholder="Search agents..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full px-2 py-1.5 text-sm rounded border bg-background focus:outline-none focus:ring-1 focus:ring-ring"
                  />
                </div>
                <div className="max-h-64 overflow-y-auto">
                  {filteredAgents.length === 0 ? (
                    <div className="px-1.5 py-1 text-sm text-muted-foreground">
                      {agents.length === 0
                        ? 'No agents available'
                        : 'No agents found'}
                    </div>
                  ) : (
                    filteredAgents.map((agent) => (
                      <button
                        key={agent.id}
                        type="button"
                        onClick={() => handleSelect(agent)}
                        className={cn(
                          'w-full px-1.5 py-1 text-left text-sm hover:bg-accent transition-colors',
                          agent.id === selectedAgent?.id && 'bg-accent'
                        )}
                      >
                        <div className="flex items-center gap-2">
                          {agent.icon && (
                            <span className="text-muted-foreground flex-shrink-0 [&>svg]:h-4 [&>svg]:w-4">
                              {agent.icon}
                            </span>
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="font-medium">{agent.name}</span>
                              {agent.isLocal && (
                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary/10 text-primary font-medium">
                                  Local
                                </span>
                              )}
                            </div>
                            {agent.description && (
                              <div className="text-xs text-muted-foreground truncate">
                                {agent.description}
                              </div>
                            )}
                          </div>
                        </div>
                      </button>
                    ))
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      );
    }
  )
);

AgentSelector.displayName = 'AgentSelector';
