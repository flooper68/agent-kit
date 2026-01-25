import { useState } from 'react';
import {
  Bot,
  Pencil,
  RefreshCw,
  Power,
  PowerOff,
  MoreVertical,
  Loader2,
  Copy,
  Check,
  Star,
  Trash2,
} from 'lucide-react';
import { ActionCard, IconButton, DropdownMenu, Text } from '@agent-kit/ui';

// Provider display config
const PROVIDER_LABELS: Record<string, string> = {
  anthropic: 'Anthropic',
  openai: 'OpenAI',
  gemini: 'Google',
};

export interface ExternalAgentCardProps {
  id: string;
  name: string;
  description: string | null;
  secretKeyPrefix: string;
  /** Agent key/slug - unique identifier for the agent */
  agentKey?: string;
  /** Provider - only shown for server agents */
  provider?: string;
  /** Model - only shown for server agents */
  model?: string;
  isFavorite: boolean;
  disabled: boolean;
  isConnected?: boolean;
  isLoading?: boolean;
  /** Hide the secret key section (for server agents that don't use secret keys) */
  hideSecretKey?: boolean;
  /** Hide the connection status indicator (for server agents) */
  hideStatus?: boolean;
  /** Hide the ID copy/paste section (for server agents) */
  hideId?: boolean;
  onEdit: () => void;
  onRegenerateKey: () => void;
  onToggleDisabled: () => void;
  onToggleFavorite: () => void;
  onDelete: () => void;
}

export function ExternalAgentCard({
  id,
  name,
  description,
  secretKeyPrefix,
  agentKey,
  provider,
  model,
  isFavorite,
  disabled,
  isConnected,
  isLoading,
  hideSecretKey,
  hideStatus,
  hideId,
  onEdit,
  onRegenerateKey,
  onToggleDisabled,
  onToggleFavorite,
  onDelete,
}: ExternalAgentCardProps) {
  const [copiedId, setCopiedId] = useState(false);
  const [copiedKey, setCopiedKey] = useState(false);

  const handleCopyId = async () => {
    try {
      await navigator.clipboard.writeText(id);
      setCopiedId(true);
      setTimeout(() => setCopiedId(false), 2000);
    } catch {
      // Clipboard access failed
    }
  };

  const handleCopyKey = async () => {
    if (!agentKey) return;
    try {
      await navigator.clipboard.writeText(agentKey);
      setCopiedKey(true);
      setTimeout(() => setCopiedKey(false), 2000);
    } catch {
      // Clipboard access failed
    }
  };

  // Get short model name (last part after -) - only for server agents
  const shortModelName = model?.split('-').slice(0, 2).join('-') ?? '';

  return (
    <ActionCard disabled={disabled}>
      <ActionCard.Header
        icon={
          <div className="relative">
            <Bot className="h-5 w-5" />
            {isFavorite && (
              <Star className="absolute -top-1 -right-1 h-3 w-3 fill-yellow-400 text-yellow-400" />
            )}
          </div>
        }
        title={name}
        rightContent={
          hideStatus ? undefined : disabled ? (
            <span className="text-xs px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
              Disabled
            </span>
          ) : isConnected ? (
            <span className="text-xs px-1.5 py-0.5 rounded bg-green-500/10 text-green-600 dark:text-green-400 border border-green-500/20 flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
              Connected
            </span>
          ) : (
            <span className="text-xs px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
              Offline
            </span>
          )
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
              <DropdownMenu.Separator />
              <DropdownMenu.Item
                onClick={onDelete}
                disabled={isLoading}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
                Delete agent
              </DropdownMenu.Item>
            </DropdownMenu.Content>
          </DropdownMenu>
        }
      />

      <ActionCard.Content className="pt-0">
        {/* Provider/Model badge - only shown for server agents */}
        {provider && model && (
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs px-1.5 py-0.5 rounded bg-primary/10 text-primary">
              {PROVIDER_LABELS[provider] ?? provider}
            </span>
            <Text className="text-xs text-muted-foreground truncate">
              {shortModelName}
            </Text>
          </div>
        )}
        {/* Agent key display */}
        {agentKey && (
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs text-muted-foreground">Key:</span>
            <code className="text-xs font-mono text-muted-foreground flex-1 truncate">
              {agentKey}
            </code>
            <IconButton
              icon={
                copiedKey ? (
                  <Check className="h-3 w-3" />
                ) : (
                  <Copy className="h-3 w-3" />
                )
              }
              onClick={handleCopyKey}
              label="Copy key"
              size="sm"
              variant="ghost"
            />
          </div>
        )}
        <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
          {description || <span className="italic">No description</span>}
        </p>
        {/* Agent ID display - hidden for server agents */}
        {!hideId && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">ID:</span>
            <code className="text-xs font-mono text-muted-foreground flex-1 truncate">
              {id}
            </code>
            <IconButton
              icon={
                copiedId ? (
                  <Check className="h-3 w-3" />
                ) : (
                  <Copy className="h-3 w-3" />
                )
              }
              onClick={handleCopyId}
              label="Copy ID"
              size="sm"
              variant="ghost"
            />
          </div>
        )}
      </ActionCard.Content>

      {/* Secret key prefix display - hidden for server agents */}
      {!hideSecretKey && (
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
      )}

      <ActionCard.Footer
        rightActions={
          <>
            <IconButton
              icon={
                <Star
                  className={`h-4 w-4 ${isFavorite ? 'fill-yellow-400 text-yellow-400' : ''}`}
                />
              }
              onClick={onToggleFavorite}
              label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
              size="sm"
              variant="ghost"
            />
            <IconButton
              icon={<Pencil className="h-4 w-4" />}
              onClick={onEdit}
              label="Edit"
              size="sm"
              variant="outline"
              disabled={isLoading}
            />
          </>
        }
      />
    </ActionCard>
  );
}
