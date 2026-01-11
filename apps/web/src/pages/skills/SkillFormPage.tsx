import { useEffect, useState, useMemo, useCallback, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ChevronRight, X, Plus } from 'lucide-react';
import {
  Heading,
  Text,
  Button,
  Input,
  Textarea,
  Label,
  EditableFileTree,
  FileEditor,
  useToast,
} from '@agent-kit/ui';
import type { FileItem } from '@agent-kit/ui';
import { trpc } from '../../lib/trpc';
import { useAutosave } from '../../hooks/useAutosave';
import { useHeaderActions } from '../../contexts/HeaderActionsContext';

const DEFAULT_FOLDERS = ['references', 'assets'];

type SkillFormData = {
  key: string;
  name: string;
  description: string;
  files: FileItem[];
};

export function SkillFormPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const utils = trpc.useUtils();
  const { addToast } = useToast();
  const { setActions, clearActions } = useHeaderActions();
  const formRef = useRef<HTMLFormElement>(null);
  const isEditing = !!id;

  const [key, setKey] = useState('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [files, setFiles] = useState<FileItem[]>([
    { path: 'SKILL.md', content: '' },
  ]);
  const [selectedPath, setSelectedPath] = useState<string | null>('SKILL.md');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const skillQuery = trpc.skills.get.useQuery(
    { id: id! },
    { enabled: isEditing }
  );

  const createMutation = trpc.skills.create.useMutation({
    onSuccess: (skill) => {
      utils.skills.list.invalidate();
      navigate(`/app/skills/${skill.id}`);
    },
    onError: (error) => {
      setErrors({ submit: error.message });
    },
  });

  // Autosave mutation for editing (doesn't navigate)
  const autosaveMutation = trpc.skills.update.useMutation({
    onSuccess: () => {
      addToast({ message: 'Changes saved', variant: 'success' });
      utils.skills.list.invalidate();
      if (id) {
        utils.skills.get.invalidate({ id });
      }
    },
    onError: (error) => {
      addToast({
        message: `Failed to save: ${error.message}`,
        variant: 'error',
      });
    },
  });

  // Form data object for autosave
  const formData = useMemo(
    (): SkillFormData => ({
      key,
      name,
      description,
      files,
    }),
    [key, name, description, files]
  );

  // Autosave for editing skills
  const autosave = useAutosave({
    data: formData,
    enabled: isEditing && !!id && !skillQuery.data?.isSystem,
    onSave: useCallback(
      (data: SkillFormData, done: () => void) => {
        if (!id) {
          done();
          return;
        }
        const dataToSave = { ...data };
        autosaveMutation.mutate(
          {
            id,
            key: data.key.trim(),
            name: data.name.trim(),
            description: data.description.trim(),
            files: data.files,
          },
          {
            onSuccess: () => {
              autosave.lastSavedDataRef.current = dataToSave;
            },
            onSettled: done,
          }
        );
      },
      // eslint-disable-next-line react-hooks/exhaustive-deps
      [id, autosaveMutation]
    ),
  });

  // Load existing skill data when editing
  useEffect(() => {
    if (skillQuery.data) {
      const loadedData: SkillFormData = {
        key: skillQuery.data.key,
        name: skillQuery.data.name,
        description: skillQuery.data.description,
        files: skillQuery.data.files as FileItem[],
      };
      setKey(loadedData.key);
      setName(loadedData.name);
      setDescription(loadedData.description);
      setFiles(loadedData.files);
      // Select SKILL.md if it exists, otherwise first file
      const skillMd = loadedData.files.find((f) => f.path === 'SKILL.md');
      setSelectedPath(
        skillMd ? 'SKILL.md' : (loadedData.files[0]?.path ?? null)
      );
      // Initialize autosave ref
      autosave.lastSavedDataRef.current = loadedData;
    }
  }, [skillQuery.data, autosave.lastSavedDataRef]);

  useEffect(() => {
    document.title = isEditing
      ? 'Edit Skill | Agent Kit'
      : 'New Skill | Agent Kit';
    return () => {
      document.title = 'Agent Kit';
    };
  }, [isEditing]);

  // Set header actions for create mode (edit mode uses autosave)
  useEffect(() => {
    if (isEditing) {
      setActions([
        {
          id: 'cancel',
          label: 'Cancel',
          icon: <X className="h-4 w-4" />,
          onClick: () => navigate(`/app/skills/${id}`),
          variant: 'outline',
        },
      ]);
      return () => clearActions();
    }

    setActions([
      {
        id: 'cancel',
        label: 'Cancel',
        icon: <X className="h-4 w-4" />,
        onClick: () => navigate('/app/skills'),
        variant: 'outline',
      },
      {
        id: 'create',
        label: createMutation.isPending ? 'Creating...' : 'Create Skill',
        icon: <Plus className="h-4 w-4" />,
        onClick: () => formRef.current?.requestSubmit(),
        variant: 'primary',
      },
    ]);
    return () => clearActions();
  }, [
    setActions,
    clearActions,
    navigate,
    createMutation.isPending,
    isEditing,
    id,
  ]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!key.trim()) {
      newErrors.key = 'Key is required';
    } else if (!/^[a-z0-9-]+$/.test(key)) {
      newErrors.key =
        'Key must be lowercase letters, numbers, and hyphens only';
    }

    if (!name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (!description.trim()) {
      newErrors.description = 'Description is required';
    }

    if (files.length === 0) {
      newErrors.files = 'At least one file is required';
    }

    // Check SKILL.md exists and has content
    const skillMd = files.find((f) => f.path === 'SKILL.md');
    if (!skillMd) {
      newErrors.files = 'SKILL.md is required';
    } else if (!skillMd.content.trim()) {
      newErrors.files = 'SKILL.md must have content';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Editing uses autosave, so only handle creation
    if (isEditing) return;
    if (!validateForm()) return;

    createMutation.mutate({
      key: key.trim(),
      name: name.trim(),
      description: description.trim(),
      files,
    });
  };

  const handleFilesChange = (newFiles: FileItem[]) => {
    setFiles(newFiles);
    // Trigger autosave after file changes
    autosave.trigger();
  };

  const handleFileSelect = (path: string) => {
    setSelectedPath(path);
  };

  const handleContentChange = (content: string) => {
    if (!selectedPath) return;
    setFiles((prev) =>
      prev.map((f) => (f.path === selectedPath ? { ...f, content } : f))
    );
  };

  // Handle file editor blur - trigger autosave
  const handleEditorBlur = () => {
    autosave.trigger();
  };

  const selectedFile = files.find((f) => f.path === selectedPath);
  // Only disable UI during creation - editing uses non-blocking autosave
  const isPending = createMutation.isPending;

  // Loading state for edit mode
  if (isEditing && skillQuery.isLoading) {
    return (
      <div className="h-full overflow-auto p-6">
        <div className="mx-auto max-w-4xl">
          <div className="mb-3 flex items-center gap-1.5">
            <div className="h-4 w-12 animate-pulse rounded bg-muted" />
            <div className="h-4 w-4 rounded bg-muted" />
            <div className="h-4 w-32 animate-pulse rounded bg-muted" />
          </div>
          <div className="mb-6 h-8 w-48 animate-pulse rounded bg-muted" />
          <div className="space-y-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-20 animate-pulse rounded-lg bg-muted" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  // System skill protection
  if (isEditing && skillQuery.data?.isSystem) {
    return (
      <div className="h-full overflow-auto p-6">
        <div className="mx-auto max-w-4xl">
          <nav className="mb-3 flex items-center gap-1.5">
            <Link
              to="/app/skills"
              className="text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              Skills
            </Link>
            <ChevronRight className="h-4 w-4 text-muted-foreground/50" />
            <span className="text-sm font-medium">Edit</span>
          </nav>
          <div className="flex flex-col items-center justify-center py-16">
            <Text className="mb-4 text-muted-foreground">
              System skills cannot be edited. You can duplicate it to create
              your own version.
            </Text>
            <Button onClick={() => navigate(`/app/skills/${id}`)}>
              Back to Skill
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-auto p-6">
      <div className="mx-auto max-w-5xl">
        {/* Breadcrumb */}
        <nav className="mb-3 flex items-center gap-1.5">
          <Link
            to="/app/skills"
            className="text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            Skills
          </Link>
          <ChevronRight className="h-4 w-4 text-muted-foreground/50" />
          {isEditing && skillQuery.data && (
            <>
              <Link
                to={`/app/skills/${id}`}
                className="text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                {skillQuery.data.name}
              </Link>
              <ChevronRight className="h-4 w-4 text-muted-foreground/50" />
            </>
          )}
          <span className="text-sm font-medium">
            {isEditing ? 'Edit' : 'New Skill'}
          </span>
        </nav>

        {/* Header */}
        <div className="mb-6">
          <Heading as="h1" size="24">
            {isEditing ? 'Edit Skill' : 'Create New Skill'}
          </Heading>
          <Text className="text-muted-foreground">
            Skills are documentation bundles that teach agents how to use tools
          </Text>
        </div>

        {/* Form */}
        <form ref={formRef} onSubmit={handleSubmit} className="space-y-6">
          {errors.submit && (
            <div className="rounded-lg border border-destructive bg-destructive/10 p-4">
              <Text className="text-destructive">{errors.submit}</Text>
            </div>
          )}

          {/* Basic Info */}
          <div className="space-y-4 rounded-lg border p-4">
            <Heading as="h2" size="16">
              Basic Information
            </Heading>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="key">Key</Label>
                <Input
                  id="key"
                  value={key}
                  onChange={(e) => {
                    // Auto-strip invalid characters (only allow lowercase, numbers, hyphens)
                    const sanitized = e.target.value
                      .toLowerCase()
                      .replace(/[^a-z0-9-]/g, '');
                    setKey(sanitized);
                    // Clear key error when user types valid input
                    if (errors.key && /^[a-z0-9-]*$/.test(sanitized)) {
                      setErrors((prev) => {
                        // eslint-disable-next-line @typescript-eslint/no-unused-vars
                        const { key: _, ...rest } = prev;
                        return rest;
                      });
                    }
                  }}
                  onBlur={autosave.trigger}
                  placeholder="my-skill"
                  disabled={isPending}
                />
                {errors.key && (
                  <Text className="text-sm text-destructive">{errors.key}</Text>
                )}
                <Text className="text-xs text-muted-foreground">
                  Unique identifier (lowercase, numbers, hyphens only)
                </Text>
              </div>

              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  onBlur={autosave.trigger}
                  placeholder="My Skill"
                  disabled={isPending}
                />
                {errors.name && (
                  <Text className="text-sm text-destructive">
                    {errors.name}
                  </Text>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                onBlur={autosave.trigger}
                placeholder="Describe what this skill teaches..."
                rows={2}
                disabled={isPending}
              />
              {errors.description && (
                <Text className="text-sm text-destructive">
                  {errors.description}
                </Text>
              )}
            </div>
          </div>

          {/* Files - Split Layout */}
          {errors.files && (
            <Text className="text-sm text-destructive">{errors.files}</Text>
          )}
          <div className="flex min-h-[500px] overflow-hidden rounded-lg border">
            {/* File Tree */}
            <div className="w-56 shrink-0 border-r">
              <EditableFileTree
                files={files}
                selectedPath={selectedPath}
                onFilesChange={handleFilesChange}
                onFileSelect={handleFileSelect}
                defaultFolders={DEFAULT_FOLDERS}
                disabled={isPending}
              />
            </div>

            {/* File Editor */}
            <div className="flex-1">
              {selectedFile ? (
                <FileEditor
                  path={selectedFile.path}
                  content={selectedFile.content}
                  onContentChange={handleContentChange}
                  onBlur={handleEditorBlur}
                  disabled={isPending}
                  placeholder="Enter file content..."
                />
              ) : (
                <div className="flex h-full items-center justify-center bg-muted/30">
                  <Text className="text-muted-foreground">
                    Select a file to edit
                  </Text>
                </div>
              )}
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
