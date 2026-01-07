import { useState } from 'react';
import { Bot, Copy, Check, FileText } from 'lucide-react';
import {
  ActionCard,
  IconButton,
  Text,
  Tooltip,
  Dialog,
  Button,
} from '@agent-kit/ui';
import { getProviderConfig } from './provider-config';

export interface BuiltInAgentCardProps {
  id: string;
  name: string;
  description: string;
  model: string;
  provider: string;
  systemPrompt: string;
  tools: string[];
}

export function BuiltInAgentCard({
  id,
  name,
  description,
  model,
  provider,
  systemPrompt,
  tools,
}: BuiltInAgentCardProps) {
  const [copiedId, setCopiedId] = useState(false);
  const [isPromptModalOpen, setIsPromptModalOpen] = useState(false);

  const handleCopyId = async () => {
    try {
      await navigator.clipboard.writeText(id);
      setCopiedId(true);
      setTimeout(() => setCopiedId(false), 2000);
    } catch {
      // Clipboard access failed
    }
  };

  const providerConfig = getProviderConfig(provider);

  const displayTools = tools.slice(0, 3);
  const remainingTools = tools.length - displayTools.length;

  return (
    <>
      <ActionCard>
        <ActionCard.Header
          icon={<Bot className="h-5 w-5" />}
          title={name}
          rightContent={
            <span
              className={`text-xs px-1.5 py-0.5 rounded inline-flex items-center gap-1 ${providerConfig.bg} ${providerConfig.text}`}
            >
              {providerConfig.icon}
              {providerConfig.label}
            </span>
          }
        />

        <ActionCard.Content className="pt-0 space-y-3">
          {/* Description */}
          <p className="text-sm text-muted-foreground line-clamp-2 min-h-[2.5rem]">
            {description}
          </p>

          {/* ID display */}
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

          {/* Model display */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Model:</span>
            <code className="text-xs font-mono text-muted-foreground truncate">
              {model}
            </code>
          </div>

          {/* System prompt - button to open modal */}
          <button
            onClick={() => setIsPromptModalOpen(true)}
            className="w-full flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors py-1"
          >
            <FileText className="h-3 w-3" />
            <span>View System Prompt</span>
          </button>

          {/* Tools summary */}
          <div className="flex items-center gap-1 flex-wrap">
            <span className="text-xs text-muted-foreground mr-1">Tools:</span>
            {displayTools.map((tool) => (
              <span
                key={tool}
                className="text-xs px-1.5 py-0.5 rounded bg-muted text-muted-foreground"
              >
                {tool}
              </span>
            ))}
            {remainingTools > 0 && (
              <Tooltip
                content={
                  <div className="max-w-xs whitespace-normal">
                    {tools.join(', ')}
                  </div>
                }
              >
                <span className="text-xs text-muted-foreground cursor-help hover:text-foreground transition-colors">
                  +{remainingTools} more
                </span>
              </Tooltip>
            )}
          </div>
        </ActionCard.Content>
      </ActionCard>

      {/* System Prompt Modal */}
      <Dialog open={isPromptModalOpen} onOpenChange={setIsPromptModalOpen}>
        <Dialog.Content size="lg">
          <Dialog.Header>
            <Dialog.Title>System Prompt</Dialog.Title>
            <Dialog.Description>{name}</Dialog.Description>
          </Dialog.Header>
          <div className="max-h-[60vh] overflow-auto rounded border border-border bg-muted/50 p-4">
            <Text className="text-sm whitespace-pre-wrap font-mono">
              {systemPrompt}
            </Text>
          </div>
          <Dialog.Footer>
            <Button onClick={() => setIsPromptModalOpen(false)}>Close</Button>
          </Dialog.Footer>
        </Dialog.Content>
      </Dialog>
    </>
  );
}
