import { useState } from 'react';
import {
  Bot,
  Pencil,
  RefreshCw,
  Power,
  PowerOff,
  Copy,
  Check,
  MoreVertical,
} from 'lucide-react';
import { ActionCard, IconButton, DropdownMenu } from '@agent-kit/ui';

export interface LocalAgentCardProps {
  id: string;
  name: string;
  description: string | null;
  secretKey: string;
  disabled: boolean;
  onEdit: () => void;
  onRegenerateKey: () => void;
  onToggleDisabled: () => void;
}

export function LocalAgentCard({
  name,
  description,
  secretKey,
  disabled,
  onEdit,
  onRegenerateKey,
  onToggleDisabled,
}: LocalAgentCardProps) {
  const [copied, setCopied] = useState(false);
  const maskedKey = 'ak_local_••••••••';

  const handleCopy = async () => {
    await navigator.clipboard.writeText(secretKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

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
              />
            </DropdownMenu.Trigger>
            <DropdownMenu.Content align="end">
              <DropdownMenu.Item onClick={onToggleDisabled}>
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

      {/* Secret key display */}
      <div className="mx-4 mb-3 flex items-center gap-2 rounded border border-border px-2 py-1.5 bg-muted/50">
        <code className="text-xs font-mono text-muted-foreground flex-1 truncate">
          {maskedKey}
        </code>
        <IconButton
          icon={
            copied ? (
              <Check className="h-3 w-3" />
            ) : (
              <Copy className="h-3 w-3" />
            )
          }
          onClick={handleCopy}
          label={copied ? 'Copied' : 'Copy key'}
          size="sm"
          variant="ghost"
        />
        <IconButton
          icon={<RefreshCw className="h-3 w-3" />}
          onClick={onRegenerateKey}
          label="Regenerate key"
          size="sm"
          variant="ghost"
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
          />
        }
      />
    </ActionCard>
  );
}
