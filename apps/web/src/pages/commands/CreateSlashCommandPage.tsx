import { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, Plus, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Input, Text, Textarea, Heading, useToast } from '@agent-kit/ui';
import { trpc } from '../../lib/trpc';
import { useHeaderActions } from '../../contexts/HeaderActionsContext';

interface SlashCommandFormData {
  key: string;
  name: string;
  description: string;
  prompt: string;
}

export function CreateSlashCommandPage() {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const { setActions, clearActions } = useHeaderActions();
  const formRef = useRef<HTMLFormElement>(null);

  // Form state
  const [formData, setFormData] = useState<SlashCommandFormData>({
    key: '',
    name: '',
    description: '',
    prompt: '',
  });
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const utils = trpc.useUtils();

  // Set page title
  useEffect(() => {
    document.title = 'New Command | Agent Kit';
  }, []);

  // Set header actions
  useEffect(() => {
    setActions([
      {
        id: 'cancel',
        label: 'Cancel',
        icon: <X className="h-4 w-4" />,
        onClick: () => navigate('/app/commands'),
        variant: 'outline',
      },
      {
        id: 'create',
        label: isSubmitting ? 'Creating...' : 'Create',
        icon: <Plus className="h-4 w-4" />,
        onClick: () => formRef.current?.requestSubmit(),
        variant: 'primary',
      },
    ]);
    return () => clearActions();
  }, [setActions, clearActions, navigate, isSubmitting]);

  // Mutation for creating command
  const createMutation = trpc.slashCommands.create.useMutation({
    onSuccess: (data) => {
      addToast({ message: 'Command created successfully', variant: 'success' });
      utils.slashCommands.list.invalidate();
      navigate(`/app/commands/${data.id}/edit`);
    },
    onError: (err) => {
      if (err.message.includes('unique')) {
        setError('A command with this key already exists');
      } else {
        setError(err.message);
      }
      setIsSubmitting(false);
    },
  });

  // Key validation error
  const keyError = useMemo(() => {
    if (formData.key && !/^[a-z0-9-]*$/.test(formData.key)) {
      return 'Lowercase letters, numbers, and hyphens only';
    }
    return undefined;
  }, [formData.key]);

  // Form validation
  const isFormValid = useMemo(() => {
    return (
      formData.key.trim() &&
      formData.name.trim() &&
      formData.prompt.trim() &&
      /^[a-z0-9-]+$/.test(formData.key)
    );
  }, [formData.key, formData.name, formData.prompt]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validate key format
    if (!/^[a-z0-9-]+$/.test(formData.key)) {
      setError('Key must be lowercase letters, numbers, and hyphens only');
      return;
    }

    setIsSubmitting(true);
    createMutation.mutate({
      key: formData.key,
      name: formData.name.trim(),
      description: formData.description.trim() || undefined,
      prompt: formData.prompt,
    });
  };

  return (
    <div className="h-full overflow-auto p-6">
      <div className="mx-auto max-w-2xl">
        <div className="mb-6">
          {/* Breadcrumb navigation */}
          <nav className="flex items-center gap-1.5 mb-3">
            <Link
              to="/app/commands"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Commands
            </Link>
            <ChevronRight className="h-4 w-4 text-muted-foreground/50" />
            <span className="text-sm font-medium text-foreground">
              New Command
            </span>
          </nav>

          {/* Page title and description */}
          <Heading as="h1" size="24">
            New Command
          </Heading>
          <Text className="text-muted-foreground mt-1">
            Create a custom slash command to quickly insert prompts.
          </Text>
        </div>

        <form ref={formRef} onSubmit={handleSubmit}>
          {error && (
            <div className="rounded-md bg-destructive/10 border border-destructive/50 p-3 mb-4">
              <Text className="text-sm text-destructive">{error}</Text>
            </div>
          )}

          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Key"
                placeholder="e.g., review"
                value={formData.key}
                onChange={(e) => {
                  setFormData((prev) => ({
                    ...prev,
                    key: e.target.value.toLowerCase().replace(/\s/g, '-'),
                  }));
                  setError(null);
                }}
                error={keyError}
              />
              <Input
                label="Name"
                placeholder="e.g., Code Review"
                value={formData.name}
                onChange={(e) => {
                  setFormData((prev) => ({ ...prev, name: e.target.value }));
                }}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">
                Description (optional)
              </label>
              <Textarea
                placeholder="Brief description of what this command does"
                value={formData.description}
                onChange={(e) => {
                  setFormData((prev) => ({
                    ...prev,
                    description: e.target.value.slice(0, 500),
                  }));
                }}
                rows={2}
              />
              <Text className="text-xs text-muted-foreground text-right">
                {formData.description.length}/500
              </Text>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">
                Prompt
              </label>
              <Textarea
                placeholder="The prompt that will be inserted when using this command..."
                value={formData.prompt}
                onChange={(e) => {
                  setFormData((prev) => ({ ...prev, prompt: e.target.value }));
                }}
                rows={8}
              />
              <Text className="text-xs text-muted-foreground">
                This prompt will be expanded when you use /
                {formData.key || 'command'} in the chat input
              </Text>
            </div>
          </div>

          {/* Hidden submit button for form submission */}
          <button
            type="submit"
            disabled={!isFormValid || isSubmitting}
            className="sr-only"
          >
            Create
          </button>
        </form>
      </div>
    </div>
  );
}
