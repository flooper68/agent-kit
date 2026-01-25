// Primitives
export { Button, buttonVariants } from './Button';
export type { ButtonProps } from './Button';

export { Checkbox } from './Checkbox';
export type { CheckboxProps } from './Checkbox';

export { Avatar } from './Avatar';
export type { AvatarProps } from './Avatar';

export { IconButton } from './IconButton';
export type { IconButtonProps } from './IconButton';

export { Textarea } from './Textarea';
export type { TextareaProps } from './Textarea';

export {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
  useCollapsible,
} from './Collapsible';
export type {
  CollapsibleProps,
  CollapsibleTriggerProps,
  CollapsibleContentProps,
} from './Collapsible';

export { Dialog, useDialog } from './Dialog';
export type {
  DialogProps,
  DialogTriggerProps,
  DialogContentProps,
  DialogCloseProps,
  DialogHeaderProps,
  DialogFooterProps,
} from './Dialog';

export { Tooltip, TooltipProvider } from './Tooltip';
export type { TooltipProps } from './Tooltip';

export { StatusIndicator } from './StatusIndicator';
export type { StatusIndicatorProps, StatusType } from './StatusIndicator';

export { StreamingIndicator } from './StreamingIndicator';
export type { StreamingIndicatorProps } from './StreamingIndicator';

export { ConnectionSnackbar } from './ConnectionSnackbar';
export type {
  ConnectionSnackbarProps,
  ConnectionStatus,
} from './ConnectionSnackbar';

export { Spinner } from './Spinner';
export type { SpinnerProps } from './Spinner';

export { Skeleton } from './Skeleton';
export type { SkeletonProps } from './Skeleton';

export { Select } from './Select';
export type { SelectProps, SelectOption } from './Select';

export { MultiSelectChips } from './MultiSelectChips';
export type {
  MultiSelectChipsProps,
  MultiSelectOption,
} from './MultiSelectChips';

export { ToggleGroup, ToggleGroupItem } from './ToggleGroup';
export type {
  ToggleGroupProps,
  ToggleGroupItemProps,
  ToggleGroupItemColorScheme,
} from './ToggleGroup';

export { ScopesCheckboxList } from './ScopesCheckboxList';
export type {
  ScopesCheckboxListProps,
  ScopeOption,
} from './ScopesCheckboxList';

export { Input } from './Input';
export type { InputProps } from './Input';

export { FormCard } from './FormCard';
export type { FormCardProps } from './FormCard';

export { ActionCard } from './ActionCard';
export type {
  ActionCardProps,
  ActionCardHeaderProps,
  ActionCardSeparatorProps,
  ActionCardContentProps,
  ActionCardFooterProps,
} from './ActionCard';

export { ProjectSwitcher } from './ProjectSwitcher';
export type { ProjectSwitcherProps, Project } from './ProjectSwitcher';

export { NavigationTabs } from './NavigationTabs';
export type { NavigationTabsProps, NavigationTab } from './NavigationTabs';

export { Tabs } from './Tabs';
export type {
  TabsProps,
  TabsListProps,
  TabsTriggerProps,
  TabsContentProps,
} from './Tabs';

export { DropdownMenu } from './DropdownMenu';
export type {
  DropdownMenuTriggerProps,
  DropdownMenuContentProps,
  DropdownMenuItemProps,
} from './DropdownMenu';

export { DataList } from './DataList';
export type {
  DataListProps,
  DataListItemProps,
  DataListCellProps,
  DataListEmptyProps,
} from './DataList';

export { Pagination } from './Pagination';
export type { PaginationProps } from './Pagination';

export { CollapsibleList, useCollapsibleListItem } from './CollapsibleList';
export type {
  CollapsibleListProps,
  CollapsibleListItemProps,
  CollapsibleListTriggerProps,
  CollapsibleListContentProps,
  CollapsibleListEmptyProps,
} from './CollapsibleList';

// Theme
export { ThemeToggle } from './ThemeToggle';
export type { ThemeToggleProps } from './ThemeToggle';

// Typography
export {
  Heading,
  headingVariants,
  Text,
  textVariants,
  Label,
  labelVariants,
  Code,
  codeVariants,
} from './Typography';
export type {
  HeadingProps,
  TextProps,
  LabelProps,
  CodeProps,
} from './Typography';

// Chat components
export * from './Chat';

// Layout
export { AppLayout, useAppLayout } from './AppLayout';
export type {
  AppLayoutProps,
  AppLayoutRef,
  AppLayoutContextValue,
  HeaderSlots,
  MainMenuConfig,
  MoreMenuConfig,
  PanelConfig,
  MenuItem,
  MenuSection,
} from './AppLayout';

// Planning components
export { PriorityBadge } from './PriorityBadge';
export type { PriorityBadgeProps, Priority } from './PriorityBadge';

export { StatusBadge } from './StatusBadge';
export type { StatusBadgeProps } from './StatusBadge';
export type { TaskStatus as PlanningTaskStatus } from './StatusBadge';

export { DueDateIndicator } from './DueDateIndicator';
export type { DueDateIndicatorProps } from './DueDateIndicator';

export { ProjectCard } from './ProjectCard';
export type { ProjectCardProps, TaskCounts } from './ProjectCard';

export { TaskCard } from './TaskCard';
export type { TaskCardProps } from './TaskCard';

export { KanbanColumn } from './KanbanColumn';
export type { KanbanColumnProps } from './KanbanColumn';

export { KanbanBoard } from './KanbanBoard';
export type { KanbanBoardProps, KanbanTask } from './KanbanBoard';

export { TaskFilters } from './TaskFilters';
export type { TaskFiltersProps, TaskFiltersState } from './TaskFilters';

export { TaskListView } from './TaskListView';
export type { TaskListViewProps, TaskListItem } from './TaskListView';

export { TaskDetailDialog } from './TaskDetailDialog';
export type {
  TaskDetailDialogProps,
  TaskData,
  TaskEvent,
  TaskArtifact,
  AutoSaveStatus,
} from './TaskDetailDialog';

export { Toast, ToastProvider, useToast } from './Toast';
export type { ToastData, ToastVariant } from './Toast';

export { CommandPalette, CommandPaletteItem } from './CommandPalette';
export type { Command, CommandPaletteProps } from './CommandPalette';

// File Tree
export {
  FileTree,
  buildFileTree,
  flattenTree,
  getDirectoryPaths,
} from './FileTree';
export type { FileTreeProps, FileItem, FileTreeNode } from './FileTree';

// Editable File Tree
export { EditableFileTree } from './EditableFileTree';
export type { EditableFileTreeProps } from './EditableFileTree';

// File Editor
export { FileEditor } from './FileEditor';
export type { FileEditorProps } from './FileEditor';

// Tag components
export { TagBadge } from './TagBadge';
export type { TagBadgeProps, TagColorPreset } from './TagBadge';

export { TagInput } from './TagInput';
export type { TagInputProps, Tag } from './TagInput';
