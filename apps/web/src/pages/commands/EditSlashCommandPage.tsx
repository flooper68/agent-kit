import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import {
  Button,
  Input,
  Text,
  Textarea,
  Heading,
  useToast,
} from '@agent-kit/ui';
import { trpc } from '../../lib/trpc';
import { useHeaderActions } from '../../contexts/HeaderActionsContext';
import { useAutosave } from '../../hooks/useAutosave';

interface SlashCommandFormData {
  key: string;
  name: string;
  description: string;
  prompt: string;
}

export function EditSlashCommandPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { addToast } = useToast();
  const { clearActions } = useHeaderActions();

  // Form state
  const [formData, setFormData] = useState<SlashCommandFormData>({
    key: '',
    name: '',
    description: '',
    prompt: '',
  });

  // Track whether form has been initialized from server data
  const isFormInitializedRef = useRef(false);

  const utils = trpc.useUtils();

  // Clear header actions on mount
  useEffect(() => {
    clearActions();
  }, [clearActions]);

  // Reset initialization ref when ID changes
  useEffect(() => {
    isFormInitializedRef.current = false;
  }, [id]);

  // Fetch the slash command
  const commandQuery = trpc.slashCommands.get.useQuery(
    { id: id! },
    { enabled: !!id }
  );

  // Set page title
  useEffect(() => {
    if (commandQuery.data) {
      document.title = `Edit ${commandQuery.data.name} | Agent Kit`;
    }
  }, [commandQuery.data]);

  // Mutation for autosave
  const updateMutation = trpc.slashCommands.update.useMutation({
    onSuccess: () => {
      addToast({ message: 'Changes saved', variant: 'success' });
      utils.slashCommands.list.invalidate();
    },
    onError: (err) => {
      // Check for unique constraint violation from database error message
      if (err.message.includes('unique')) {
        addToast({
          message: 'A command with this key already exists',
          variant: 'error',
        });
      } else {
        addToast({
          message: `Failed to save: ${err.message}`,
          variant: 'error',
        });
      }
    },
  });

  // Autosave hook
  const autosave = useAutosave({
    data: formData,
    enabled: !!id,
    onSave: useCallback(
      (data: SlashCommandFormData, done: () => void) => {
        if (!id) {
          done();
          return;
        }

        // Validate key format before saving
        if (!/^[a-z0-9-]+$/.test(data.key)) {
          addToast({
            message: 'Key must be lowercase letters, numbers, and hyphens only',
            variant: 'error',
          });
          done();
          return;
        }

        const dataToSave = { ...data };
        updateMutation.mutate(
          {
            id,
            key: data.key,
            name: data.name.trim(),
            description: data.description.trim() || undefined,
            prompt: data.prompt,
          },
          {
            onSuccess: () => {
              autosave.lastSavedDataRef.current = dataToSave;
            },
            onSettled: done,
          }
        );
      },
      // autosave.lastSavedDataRef is a stable ref that doesn't need to be in deps
      // eslint-disable-next-line react-hooks/exhaustive-deps
      [id, updateMutation, addToast]
    ),
  });

  // Initialize form data when command loads (only on initial load)
  useEffect(() => {
    if (commandQuery.data && !isFormInitializedRef.current) {
      const data: SlashCommandFormData = {
        key: commandQuery.data.key,
        name: commandQuery.data.name,
        description: commandQuery.data.description ?? '',
        prompt: commandQuery.data.prompt,
      };
      setFormData(data);
      autosave.lastSavedDataRef.current = data;
      isFormInitializedRef.current = true;
    }
  }, [commandQuery.data, autosave.lastSavedDataRef]);

  // Key validation error
  const keyError = useMemo(() => {
    if (formData.key && !/^[a-z0-9-]*$/.test(formData.key)) {
      return 'Lowercase letters, numbers, and hyphens only';
    }
    return undefined;
  }, [formData.key]);

  // Loading state
  if (commandQuery.isLoading) {
    return (
      <div className="h-full overflow-auto p-6">
        <div className="mx-auto max-w-2xl">
          <div className="space-y-4">
            <div className="h-6 w-32 animate-pulse rounded bg-muted" />
            <div className="h-10 w-64 animate-pulse rounded bg-muted" />
            <div className="space-y-4 pt-4">
              <div className="h-10 animate-pulse rounded bg-muted" />
              <div className="h-10 animate-pulse rounded bg-muted" />
              <div className="h-24 animate-pulse rounded bg-muted" />
              <div className="h-40 animate-pulse rounded bg-muted" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Error state - command not found
  if (commandQuery.error || !commandQuery.data) {
    return (
      <div className="h-full overflow-auto p-6">
        <div className="mx-auto max-w-2xl">
          <div className="mb-6">
            <Heading as="h1" size="24">
              Command Not Found
            </Heading>
          </div>
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Text className="text-muted-foreground mb-4">
              The command you&apos;re looking for doesn&apos;t exist or you
              don&apos;t have access to it.
            </Text>
            <Button onClick={() => navigate('/app/commands')}>
              Back to Commands
            </Button>
          </div>
        </div>
      </div>
    );
  }

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
              Edit Command
            </span>
          </nav>

          {/* Page title and description */}
          <Heading as="h1" size="24">
            Edit Command
          </Heading>
          <Text className="text-muted-foreground mt-1">
            Update configuration for /{commandQuery.data.key}
          </Text>
        </div>

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
              }}
              onBlur={autosave.trigger}
              error={keyError}
            />
            <Input
              label="Name"
              placeholder="e.g., Code Review"
              value={formData.name}
              onChange={(e) => {
                setFormData((prev) => ({ ...prev, name: e.target.value }));
              }}
              onBlur={autosave.trigger}
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
              onBlur={autosave.trigger}
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
              onBlur={autosave.trigger}
              rows={8}
            />
            <Text className="text-xs text-muted-foreground">
              This prompt will be expanded when you use /
              {formData.key || 'command'} in the chat input
            </Text>
          </div>
        </div>
      </div>
    </div>
  );
}
