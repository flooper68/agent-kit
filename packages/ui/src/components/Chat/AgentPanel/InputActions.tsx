import { memo } from 'react';
import { ScanSearch } from 'lucide-react';
import type { AgentType, ContextUsage, TaskStatus } from '../../../types/chat';
import type { SessionResourcesCounts } from '../Controls/SessionResourcesButton';
import { IconButton } from '../../IconButton';
import { AttachmentButton } from '../Controls/AttachmentButton';
import { ContextIndicator } from '../Controls/ContextIndicator';
import { RunningTimeIndicator } from '../Controls/RunningTimeIndicator';
import {
  AgentSelector,
  AgentSelectorSkeleton,
} from '../Controls/AgentSelector';
import { AgentInfoBadge } from '../Controls/AgentInfoBadge';
import { SessionResourcesButton } from '../Controls/SessionResourcesButton';

interface InputActionsProps {
  enableAttachments: boolean;
  onAttach?: (files: File[]) => void;
  isAgentSelectorDisabled: boolean;
  selectedAgent?: AgentType;
  isAgentsLoading?: boolean;
  agents?: AgentType[];
  onAgentSelect?: (agent: AgentType) => void;
  onInspect?: () => void;
  onSessionResources?: () => void;
  sessionResourcesCounts?: SessionResourcesCounts;
  contextUsage?: ContextUsage;
  status?: TaskStatus;
  /** Formatted elapsed time label (e.g., "5s" or "1m 23s"). Pass null to hide. */
  elapsedLabel?: string | null;
}

/**
 * Memoized component for rendering input action buttons
 * Standard memo comparison works here since props are mostly primitives or stable references
 */
const DEFAULT_CONTEXT_USAGE: ContextUsage = {
  used: 0,
  total: 200000,
  percentage: 0,
};

export const InputActions = memo(function InputActions({
  enableAttachments,
  onAttach,
  isAgentSelectorDisabled,
  selectedAgent,
  isAgentsLoading,
  agents,
  onAgentSelect,
  onInspect,
  onSessionResources,
  sessionResourcesCounts,
  contextUsage,
  status = 'ready',
  elapsedLabel,
}: InputActionsProps) {
  return (
    <>
      <div className="flex items-center gap-1">
        {enableAttachments && onAttach && (
          <AttachmentButton onAttach={onAttach} showMenu={false} />
        )}
        {/* Show selector when not locked, badge when locked, skeleton when loading */}
        {isAgentSelectorDisabled ? (
          <>
            {selectedAgent && <AgentInfoBadge agent={selectedAgent} />}
            {onInspect && (
              <IconButton
                icon={<ScanSearch className="h-4 w-4" />}
                label="Inspect session"
                size="sm"
                onClick={onInspect}
              />
            )}
            {onSessionResources && sessionResourcesCounts && (
              <SessionResourcesButton
                counts={sessionResourcesCounts}
                onClick={onSessionResources}
              />
            )}
          </>
        ) : isAgentsLoading ? (
          <AgentSelectorSkeleton />
        ) : (
          agents &&
          agents.length > 0 && (
            <AgentSelector
              agents={agents}
              selectedAgent={selectedAgent}
              onSelect={onAgentSelect}
            />
          )
        )}
      </div>
      <div className="flex items-center gap-2">
        <RunningTimeIndicator status={status} elapsedLabel={elapsedLabel} />
        <ContextIndicator usage={contextUsage ?? DEFAULT_CONTEXT_USAGE} />
      </div>
    </>
  );
});

InputActions.displayName = 'InputActions';
