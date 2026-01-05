import {
  Bot,
  Pencil,
  RefreshCw,
  Power,
  PowerOff,
  MoreVertical,
  Loader2,
} from 'lucide-react';
import { ActionCard, IconButton, DropdownMenu } from '@agent-kit/ui';

export interface LocalAgentCardProps {
  name: string;
  description: string | null;
  secretKeyPrefix: string;
  disabled: boolean;
  isLoading?: boolean;
  onEdit: () => void;
  onRegenerateKey: () => void;
  onToggleDisabled: () => void;
}

export function LocalAgentCard({
  name,
  description,
  secretKeyPrefix,
  disabled,
  isLoading,
  onEdit,
  onRegenerateKey,
  onToggleDisabled,
}: LocalAgentCardProps) {
  return (
    <ActionCard disabled={disabled}>
      <ActionCard.Header
        icon={<Bot className="h-5 w-5" />}
        title={name}
        badge={
          disabled ? (
            <span className="text-xs px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
              Disabled
            </span>
          ) : undefined
        }
        menuContent={
          <DropdownMenu>
            <DropdownMenu.Trigger asChild>
              <IconButton
                icon={<MoreVertical className="h-4 w-4" />}
                label="More options"
                size="sm"
                variant="ghost"
                disabled={isLoading}
              />
            </DropdownMenu.Trigger>
            <DropdownMenu.Content align="end">
              <DropdownMenu.Item
                onClick={onToggleDisabled}
                disabled={isLoading}
              >
                {disabled ? (
                  <>
                    <Power className="h-4 w-4" />
                    Enable agent
                  </>
                ) : (
                  <>
                    <PowerOff className="h-4 w-4" />
                    Disable agent
                  </>
                )}
              </DropdownMenu.Item>
            </DropdownMenu.Content>
          </DropdownMenu>
        }
      />

      {description && (
        <ActionCard.Content className="pt-0">
          <p className="text-sm text-muted-foreground line-clamp-2">
            {description}
          </p>
        </ActionCard.Content>
      )}

      {/* Secret key prefix display */}
      <div className="mx-4 mb-3 flex items-center gap-2 rounded border border-border px-2 py-1.5 bg-muted/50">
        <code className="text-xs font-mono text-muted-foreground flex-1 truncate">
          {secretKeyPrefix}
        </code>
        <IconButton
          icon={
            isLoading ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <RefreshCw className="h-3 w-3" />
            )
          }
          onClick={onRegenerateKey}
          label="Regenerate key"
          size="sm"
          variant="ghost"
          disabled={isLoading}
        />
      </div>

      <ActionCard.Footer
        rightActions={
          <IconButton
            icon={<Pencil className="h-4 w-4" />}
            onClick={onEdit}
            label="Edit"
            size="sm"
            variant="outline"
            disabled={isLoading}
          />
        }
      />
    </ActionCard>
  );
}
