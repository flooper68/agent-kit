import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ChevronRight, X, Plus, Save, Trash2 } from 'lucide-react';
import {
  Heading,
  Text,
  Button,
  Input,
  Textarea,
  Label,
  Select,
  Checkbox,
  CronExpressionInput,
  TimezoneSelect,
  useToast,
  Dialog,
} from '@agent-kit/ui';
import { trpc } from '../../lib/trpc';
import {
  useHeaderActions,
  type HeaderAction,
} from '../../contexts/HeaderActionsContext';

export function ScheduledJobEditPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const utils = trpc.useUtils();
  const { addToast } = useToast();
  const { setActions, clearActions } = useHeaderActions();
  const formRef = useRef<HTMLFormElement>(null);
  const isEditing = !!id;

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [cronExpression, setCronExpression] = useState('0 9 * * 1-5');
  const [timezone, setTimezone] = useState('UTC');
  const [agentId, setAgentId] = useState('');
  const [message, setMessage] = useState('');
  const [enabled, setEnabled] = useState(true);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  // Fetch existing job data when editing
  const jobQuery = trpc.scheduledJobs.get.useQuery(
    { id: id! },
    { enabled: isEditing }
  );

  // Fetch agents for the dropdown
  const agentsQuery = trpc.agents.list.useQuery();

  const createMutation = trpc.scheduledJobs.create.useMutation({
    onSuccess: (job) => {
      addToast({ message: 'Job created successfully', variant: 'success' });
      utils.scheduledJobs.list.invalidate();
      navigate(`/app/scheduled-jobs/${job.id}/edit`);
    },
    onError: (error) => {
      setErrors({ submit: error.message });
    },
  });

  const updateMutation = trpc.scheduledJobs.update.useMutation({
    onSuccess: () => {
      addToast({ message: 'Job updated successfully', variant: 'success' });
      utils.scheduledJobs.list.invalidate();
      if (id) {
        utils.scheduledJobs.get.invalidate({ id });
      }
    },
    onError: (error) => {
      addToast({
        message: `Failed to save: ${error.message}`,
        variant: 'error',
      });
    },
  });

  const deleteMutation = trpc.scheduledJobs.delete.useMutation({
    onSuccess: () => {
      addToast({ message: 'Job deleted', variant: 'success' });
      utils.scheduledJobs.list.invalidate();
      navigate('/app/scheduled-jobs');
    },
    onError: (error) => {
      addToast({
        message: `Failed to delete: ${error.message}`,
        variant: 'error',
      });
    },
  });

  // Load existing job data when editing
  useEffect(() => {
    if (jobQuery.data) {
      setName(jobQuery.data.name);
      setDescription(jobQuery.data.description || '');
      setCronExpression(jobQuery.data.cronExpression);
      setTimezone(jobQuery.data.timezone);
      setAgentId(jobQuery.data.agentId);
      setMessage(jobQuery.data.message);
      setEnabled(jobQuery.data.enabled);
    }
  }, [jobQuery.data]);

  useEffect(() => {
    document.title = isEditing
      ? 'Edit Scheduled Job | Agent Kit'
      : 'New Scheduled Job | Agent Kit';
    return () => {
      document.title = 'Agent Kit';
    };
  }, [isEditing]);

  // Set header actions
  useEffect(() => {
    const actions: HeaderAction[] = [
      {
        id: 'cancel',
        label: 'Cancel',
        icon: <X className="h-4 w-4" />,
        onClick: () => navigate('/app/scheduled-jobs'),
        variant: 'outline',
      },
    ];

    if (isEditing) {
      actions.push({
        id: 'delete',
        label: 'Delete',
        icon: <Trash2 className="h-4 w-4" />,
        onClick: () => setShowDeleteDialog(true),
        variant: 'outline',
      });
      actions.push({
        id: 'save',
        label: updateMutation.isPending ? 'Saving...' : 'Save Changes',
        icon: <Save className="h-4 w-4" />,
        onClick: () => formRef.current?.requestSubmit(),
        variant: 'primary',
      });
    } else {
      actions.push({
        id: 'create',
        label: createMutation.isPending ? 'Creating...' : 'Create Job',
        icon: <Plus className="h-4 w-4" />,
        onClick: () => formRef.current?.requestSubmit(),
        variant: 'primary',
      });
    }

    setActions(actions);
    return () => clearActions();
  }, [
    setActions,
    clearActions,
    navigate,
    createMutation.isPending,
    updateMutation.isPending,
    isEditing,
  ]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (!cronExpression.trim()) {
      newErrors.cronExpression = 'Schedule is required';
    }

    if (!agentId) {
      newErrors.agentId = 'Agent is required';
    }

    if (!message.trim()) {
      newErrors.message = 'Message is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    const data = {
      name: name.trim(),
      description: description.trim() || undefined,
      cronExpression: cronExpression.trim(),
      timezone,
      agentId,
      message: message.trim(),
      enabled,
    };

    if (isEditing && id) {
      updateMutation.mutate({ id, ...data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleDelete = () => {
    if (id) {
      deleteMutation.mutate({ id });
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  // Get agent options for select - filter out any agents with empty IDs
  const agentOptions = (agentsQuery.data || [])
    .filter((agent) => agent.id && agent.id.trim() !== '')
    .map((agent) => ({
      value: agent.id,
      label: agent.name,
    }));

  // Loading state for edit mode
  if (isEditing && jobQuery.isLoading) {
    return (
      <div className="flex h-full flex-col overflow-hidden p-6">
        <div className="mx-auto max-w-4xl">
          <div className="mb-3 flex items-center gap-1.5">
            <div className="h-4 w-20 animate-pulse rounded bg-muted" />
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

  return (
    <div className="flex h-full flex-col overflow-hidden p-6">
      <div className="mx-auto w-full max-w-4xl flex-1 overflow-auto">
        {/* Breadcrumb */}
        <nav className="mb-3 flex items-center gap-1.5">
          <Link
            to="/app/scheduled-jobs"
            className="text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            Scheduled Jobs
          </Link>
          <ChevronRight className="h-4 w-4 text-muted-foreground/50" />
          <span className="text-sm font-medium">
            {isEditing ? 'Edit' : 'New Job'}
          </span>
        </nav>

        {/* Header */}
        <div className="mb-6">
          <Heading as="h1" size="24">
            {isEditing ? 'Edit Scheduled Job' : 'Create Scheduled Job'}
          </Heading>
          <Text className="text-muted-foreground">
            Configure a cron-based schedule to automatically spawn an agent
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

            <div className="space-y-2">
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Daily Report Generator"
                disabled={isPending}
              />
              {errors.name && (
                <Text className="text-sm text-destructive">{errors.name}</Text>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Generates daily sales report every weekday"
                rows={2}
                disabled={isPending}
              />
            </div>
          </div>

          {/* Schedule */}
          <div className="space-y-4 rounded-lg border p-4">
            <Heading as="h2" size="16">
              Schedule
            </Heading>

            <div className="space-y-2">
              <Label>Frequency</Label>
              <CronExpressionInput
                value={cronExpression}
                onChange={setCronExpression}
                disabled={isPending}
                showPreview
              />
              {errors.cronExpression && (
                <Text className="text-sm text-destructive">
                  {errors.cronExpression}
                </Text>
              )}
            </div>

            <div className="space-y-2">
              <Label>Timezone</Label>
              <TimezoneSelect
                value={timezone}
                onChange={setTimezone}
                disabled={isPending}
              />
            </div>
          </div>

          {/* Agent Configuration */}
          <div className="space-y-4 rounded-lg border p-4">
            <Heading as="h2" size="16">
              Agent Configuration
            </Heading>

            <div className="space-y-2">
              <Label htmlFor="agent">Agent *</Label>
              <Select
                options={agentOptions}
                value={agentId}
                onValueChange={setAgentId}
                placeholder="Select an agent..."
                disabled={isPending}
                isLoading={agentsQuery.isLoading}
              />
              {errors.agentId && (
                <Text className="text-sm text-destructive">
                  {errors.agentId}
                </Text>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="message">Message *</Label>
              <Textarea
                id="message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Generate the daily sales report for yesterday and send it to the #reports channel."
                rows={4}
                disabled={isPending}
              />
              {errors.message && (
                <Text className="text-sm text-destructive">
                  {errors.message}
                </Text>
              )}
              <Text className="text-xs text-muted-foreground">
                The task or prompt to send to the agent when triggered
              </Text>
            </div>
          </div>

          {/* Status */}
          <div className="space-y-4 rounded-lg border p-4">
            <Heading as="h2" size="16">
              Status
            </Heading>

            <div className="flex items-center gap-2">
              <Checkbox
                id="enabled"
                checked={enabled}
                onChange={(checked) => setEnabled(checked)}
                disabled={isPending}
              />
              <Label htmlFor="enabled" className="cursor-pointer">
                Enabled
              </Label>
            </div>
            <Text className="text-xs text-muted-foreground">
              When enabled, this job will run according to the schedule
            </Text>
          </div>
        </form>
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <Dialog.Content>
          <Dialog.Header>
            <Dialog.Title>Delete Scheduled Job</Dialog.Title>
            <Dialog.Description>
              Are you sure you want to delete this scheduled job? This action
              cannot be undone.
            </Dialog.Description>
          </Dialog.Header>
          <Dialog.Footer>
            <Button
              variant="outline"
              onClick={() => setShowDeleteDialog(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
            </Button>
          </Dialog.Footer>
        </Dialog.Content>
      </Dialog>
    </div>
  );
}
