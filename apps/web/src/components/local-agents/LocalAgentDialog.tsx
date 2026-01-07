import { useState, useEffect } from 'react';
import { Dialog, Button, Input, Text, Textarea } from '@agent-kit/ui';

export interface LocalAgentFormData {
  key: string;
  name: string;
  description: string;
}

export interface LocalAgentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: 'create' | 'edit';
  initialData?: LocalAgentFormData;
  onSubmit: (data: LocalAgentFormData) => void;
  isLoading?: boolean;
  error?: string | null;
}

export function LocalAgentDialog({
  open,
  onOpenChange,
  mode,
  initialData,
  onSubmit,
  isLoading,
  error,
}: LocalAgentDialogProps) {
  const [key, setKey] = useState(initialData?.key ?? '');
  const [name, setName] = useState(initialData?.name ?? '');
  const [description, setDescription] = useState(
    initialData?.description ?? ''
  );

  // Reset form when dialog opens with new data
  useEffect(() => {
    if (open) {
      setKey(initialData?.key ?? '');
      setName(initialData?.name ?? '');
      setDescription(initialData?.description ?? '');
    }
  }, [open, initialData]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      key: key.trim().toLowerCase().replace(/\s+/g, '-'),
      name: name.trim(),
      description: description.trim(),
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <Dialog.Content size="sm">
        <Dialog.Header>
          <Dialog.Title>
            {mode === 'create' ? 'Create Local Agent' : 'Edit Local Agent'}
          </Dialog.Title>
          <Dialog.Description>
            {mode === 'create'
              ? 'Create a new local agent.'
              : 'Update your local agent.'}
          </Dialog.Description>
        </Dialog.Header>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {error && (
            <div className="rounded-md bg-destructive/10 border border-destructive/50 p-3">
              <Text className="text-sm text-destructive">{error}</Text>
            </div>
          )}

          <div className="space-y-2">
            <label className="text-sm font-medium">Key</label>
            <Input
              value={key}
              onChange={(e) => setKey(e.target.value)}
              placeholder="my-agent"
              required
              pattern="^[a-zA-Z0-9_-]+$"
              title="Key can only contain letters, numbers, underscores, and hyphens"
            />
            <Text className="text-xs text-muted-foreground">
              Unique identifier used for spawning. Letters, numbers,
              underscores, and hyphens only.
            </Text>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Name</label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="My Custom Agent"
              required
            />
            <Text className="text-xs text-muted-foreground">
              Display name shown in the UI.
            </Text>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">
              Description (optional)
            </label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="A helpful assistant for..."
              rows={3}
            />
          </div>

          <Dialog.Footer>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" isLoading={isLoading}>
              {mode === 'create' ? 'Create Agent' : 'Save Changes'}
            </Button>
          </Dialog.Footer>
        </form>
      </Dialog.Content>
    </Dialog>
  );
}
