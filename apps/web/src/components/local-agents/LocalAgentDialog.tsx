import { useState, useEffect } from 'react';
import { Dialog, Button, Input, Text } from '@agent-kit/ui';

export interface LocalAgentFormData {
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
  const [name, setName] = useState(initialData?.name ?? '');
  const [description, setDescription] = useState(
    initialData?.description ?? ''
  );

  // Reset form when dialog opens with new data
  useEffect(() => {
    if (open) {
      setName(initialData?.name ?? '');
      setDescription(initialData?.description ?? '');
    }
  }, [open, initialData]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
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
            <label className="text-sm font-medium">Name</label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="My Custom Agent"
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">
              Description (optional)
            </label>
            <Input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="A helpful assistant for..."
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
