import { memo } from 'react';
import { cn } from '../../../lib/utils';
import { SubAgentBreadcrumb, type BreadcrumbItem } from './SubAgentBreadcrumb';
import { IconButton } from '../../IconButton';

export interface SubAgentDialogHeaderProps {
  /** Breadcrumb items for navigation */
  breadcrumbs: BreadcrumbItem[];
  /** Callback when navigating to a session */
  onNavigateToSession: (sessionId: string) => void;
  /** Whether back navigation is available */
  canNavigateBack: boolean;
  /** Callback for back navigation */
  onNavigateBack: () => void;
  /** Callback to close the dialog */
  onClose: () => void;
}

// Back arrow icon
const BackIcon = () => (
  <svg
    className="h-4 w-4"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth="2"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M10 19l-7-7m0 0l7-7m-7 7h18"
    />
  </svg>
);

// Close icon
const CloseIcon = () => (
  <svg
    className="h-4 w-4"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth="2"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M6 18L18 6M6 6l12 12"
    />
  </svg>
);

/**
 * Custom comparison function for memoization
 */
function areSubAgentDialogHeaderPropsEqual(
  prev: SubAgentDialogHeaderProps,
  next: SubAgentDialogHeaderProps
): boolean {
  if (prev.canNavigateBack !== next.canNavigateBack) return false;
  if (prev.onNavigateBack !== next.onNavigateBack) return false;
  if (prev.onNavigateToSession !== next.onNavigateToSession) return false;
  if (prev.onClose !== next.onClose) return false;
  if (prev.breadcrumbs.length !== next.breadcrumbs.length) return false;

  for (let i = 0; i < prev.breadcrumbs.length; i++) {
    if (prev.breadcrumbs[i]?.sessionId !== next.breadcrumbs[i]?.sessionId)
      return false;
    if (prev.breadcrumbs[i]?.title !== next.breadcrumbs[i]?.title) return false;
  }

  return true;
}

export const SubAgentDialogHeader = memo(function SubAgentDialogHeader({
  breadcrumbs,
  onNavigateToSession,
  canNavigateBack,
  onNavigateBack,
  onClose,
}: SubAgentDialogHeaderProps) {
  return (
    <div
      className={cn(
        'flex items-center justify-between gap-4',
        'pb-4 border-b border-border'
      )}
    >
      <div className="flex items-center gap-3 min-w-0 flex-1">
        {canNavigateBack && (
          <IconButton
            icon={<BackIcon />}
            label="Go back"
            onClick={onNavigateBack}
            size="sm"
            variant="ghost"
          />
        )}
        <SubAgentBreadcrumb
          items={breadcrumbs}
          onNavigate={onNavigateToSession}
        />
      </div>
      <IconButton
        icon={<CloseIcon />}
        label="Close dialog"
        onClick={onClose}
        size="sm"
        variant="ghost"
      />
    </div>
  );
}, areSubAgentDialogHeaderPropsEqual);
