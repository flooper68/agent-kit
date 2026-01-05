import type { Meta, StoryObj } from '@storybook/react';
import {
  Bot,
  Upload,
  MoreVertical,
  FileText,
  Check,
  Copy,
  RefreshCw,
  Pencil,
  Power,
  PowerOff,
  Trash2,
  Settings,
} from 'lucide-react';
import { ActionCard } from './ActionCard';
import { IconButton } from '../IconButton';
import { Button } from '../Button';
import { DropdownMenu } from '../DropdownMenu';

const meta: Meta<typeof ActionCard> = {
  title: 'Components/ActionCard',
  component: ActionCard,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'A flexible card component with header, content, and footer sections. Supports icons, menus, and action buttons.',
      },
    },
  },
  argTypes: {
    disabled: {
      control: 'boolean',
    },
  },
};

export default meta;
type Story = StoryObj<typeof ActionCard>;

export const Default: Story = {
  render: () => (
    <div className="max-w-md">
      <ActionCard>
        <ActionCard.Header
          icon={<Bot className="h-5 w-5" />}
          title="My Agent"
        />
        <ActionCard.Separator />
        <ActionCard.Content>
          <p className="text-sm text-muted-foreground">
            A helpful assistant for daily tasks.
          </p>
        </ActionCard.Content>
      </ActionCard>
    </div>
  ),
};

export const WithMenu: Story = {
  render: () => (
    <div className="max-w-md">
      <ActionCard>
        <ActionCard.Header
          icon={<Bot className="h-5 w-5" />}
          title="My Agent"
          rightContent="3 hours ago"
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
                <DropdownMenu.Item>
                  <Pencil className="h-4 w-4" />
                  Edit
                </DropdownMenu.Item>
                <DropdownMenu.Item>
                  <Settings className="h-4 w-4" />
                  Settings
                </DropdownMenu.Item>
                <DropdownMenu.Separator />
                <DropdownMenu.Item variant="destructive">
                  <Trash2 className="h-4 w-4" />
                  Delete
                </DropdownMenu.Item>
              </DropdownMenu.Content>
            </DropdownMenu>
          }
        />
        <ActionCard.Separator />
        <ActionCard.Content>
          <p className="text-sm text-muted-foreground">
            A helpful assistant for daily tasks.
          </p>
        </ActionCard.Content>
      </ActionCard>
    </div>
  ),
};

export const FileUploadStyle: Story = {
  render: () => (
    <div className="max-w-lg">
      <ActionCard>
        <ActionCard.Header
          icon={<Upload className="h-5 w-5" />}
          title="File Uploaded"
          rightContent="3 hours ago"
          menuContent={
            <IconButton
              icon={<MoreVertical className="h-4 w-4" />}
              label="More options"
              size="sm"
              variant="ghost"
            />
          }
        />
        <ActionCard.Separator />
        <ActionCard.Content>
          <p className="text-sm text-muted-foreground mb-3">
            Uploaded &quot;Invoice.pdf&quot; to Reports
          </p>
          <p className="font-medium mb-2">Uploading done</p>
          <div className="flex items-center gap-3 rounded-lg border border-border bg-muted/30 p-3">
            <div className="rounded-md bg-amber-500/20 p-2 text-amber-500">
              <FileText className="h-5 w-5" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium">Invoice.pdf</p>
              <p className="text-sm text-muted-foreground">
                My Drive {'>'} Reports
              </p>
            </div>
            <span className="text-sm text-muted-foreground">3.2 MB</span>
          </div>
        </ActionCard.Content>
        <ActionCard.Footer
          leftActions={<Check className="h-6 w-6 text-green-500" />}
          rightActions={
            <Button variant="outline">
              <FileText className="h-4 w-4 mr-2" />
              Rename File
            </Button>
          }
        />
      </ActionCard>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Example matching the file upload notification pattern.',
      },
    },
  },
};

export const AgentCardStyle: Story = {
  render: () => (
    <div className="max-w-sm">
      <ActionCard>
        <ActionCard.Header
          icon={<Bot className="h-5 w-5" />}
          title="Research Assistant"
          badge={
            <span className="text-xs px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
              Disabled
            </span>
          }
        />
        <ActionCard.Content className="pt-0">
          <p className="text-sm text-muted-foreground line-clamp-2">
            Helps with research tasks and data analysis
          </p>
        </ActionCard.Content>
        {/* Secret key display */}
        <div className="mx-4 mb-3 flex items-center gap-2 rounded border border-border px-2 py-1.5 bg-muted/50">
          <code className="text-xs font-mono text-muted-foreground flex-1 truncate">
            ak_local_••••••••
          </code>
          <IconButton
            icon={<Copy className="h-3 w-3" />}
            label="Copy key"
            size="sm"
            variant="ghost"
          />
          <IconButton
            icon={<RefreshCw className="h-3 w-3" />}
            label="Regenerate key"
            size="sm"
            variant="ghost"
          />
        </div>
        <ActionCard.Footer
          leftActions={
            <IconButton
              icon={<Pencil className="h-4 w-4" />}
              label="Edit"
              size="sm"
              variant="outline"
            />
          }
          rightActions={
            <IconButton
              icon={<Power className="h-4 w-4" />}
              label="Enable"
              size="sm"
              variant="outline"
            />
          }
        />
      </ActionCard>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Example of an agent card with secret key display and actions.',
      },
    },
  },
};

export const Disabled: Story = {
  render: () => (
    <div className="max-w-md">
      <ActionCard disabled>
        <ActionCard.Header
          icon={<Bot className="h-5 w-5" />}
          title="Disabled Agent"
          badge={
            <span className="text-xs px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
              Disabled
            </span>
          }
        />
        <ActionCard.Separator />
        <ActionCard.Content>
          <p className="text-sm text-muted-foreground">
            This agent is currently disabled.
          </p>
        </ActionCard.Content>
        <ActionCard.Footer
          rightActions={
            <IconButton
              icon={<Power className="h-4 w-4" />}
              label="Enable"
              size="sm"
              variant="outline"
            />
          }
        />
      </ActionCard>
    </div>
  ),
};

export const SolidSeparator: Story = {
  render: () => (
    <div className="max-w-md">
      <ActionCard>
        <ActionCard.Header
          icon={<Bot className="h-5 w-5" />}
          title="Solid Separator"
        />
        <ActionCard.Separator variant="solid" />
        <ActionCard.Content>
          <p className="text-sm text-muted-foreground">
            This card uses a solid separator line.
          </p>
        </ActionCard.Content>
      </ActionCard>
    </div>
  ),
};

export const WithoutIcon: Story = {
  render: () => (
    <div className="max-w-md">
      <ActionCard>
        <ActionCard.Header title="Card Without Icon" rightContent="Just now" />
        <ActionCard.Separator />
        <ActionCard.Content>
          <p className="text-sm text-muted-foreground">
            This card has no icon in the header.
          </p>
        </ActionCard.Content>
      </ActionCard>
    </div>
  ),
};

export const MultipleCards: Story = {
  render: () => (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 max-w-4xl">
      <ActionCard>
        <ActionCard.Header
          icon={<Bot className="h-5 w-5" />}
          title="Code Assistant"
        />
        <ActionCard.Content className="pt-0">
          <p className="text-sm text-muted-foreground line-clamp-2">
            Helps with coding tasks
          </p>
        </ActionCard.Content>
        <ActionCard.Footer
          leftActions={
            <IconButton
              icon={<Pencil className="h-4 w-4" />}
              label="Edit"
              size="sm"
              variant="outline"
            />
          }
          rightActions={
            <IconButton
              icon={<PowerOff className="h-4 w-4" />}
              label="Disable"
              size="sm"
              variant="destructive"
            />
          }
        />
      </ActionCard>

      <ActionCard>
        <ActionCard.Header
          icon={<Bot className="h-5 w-5" />}
          title="Research Bot"
        />
        <ActionCard.Content className="pt-0">
          <p className="text-sm text-muted-foreground line-clamp-2">
            Research and analysis helper
          </p>
        </ActionCard.Content>
        <ActionCard.Footer
          leftActions={
            <IconButton
              icon={<Pencil className="h-4 w-4" />}
              label="Edit"
              size="sm"
              variant="outline"
            />
          }
          rightActions={
            <IconButton
              icon={<PowerOff className="h-4 w-4" />}
              label="Disable"
              size="sm"
              variant="destructive"
            />
          }
        />
      </ActionCard>

      <ActionCard disabled>
        <ActionCard.Header
          icon={<Bot className="h-5 w-5" />}
          title="Writing Helper"
          badge={
            <span className="text-xs px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
              Disabled
            </span>
          }
        />
        <ActionCard.Content className="pt-0">
          <p className="text-sm text-muted-foreground line-clamp-2">
            Content writing assistant
          </p>
        </ActionCard.Content>
        <ActionCard.Footer
          leftActions={
            <IconButton
              icon={<Pencil className="h-4 w-4" />}
              label="Edit"
              size="sm"
              variant="outline"
            />
          }
          rightActions={
            <IconButton
              icon={<Power className="h-4 w-4" />}
              label="Enable"
              size="sm"
              variant="outline"
            />
          }
        />
      </ActionCard>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Multiple cards in a responsive grid layout.',
      },
    },
  },
};
