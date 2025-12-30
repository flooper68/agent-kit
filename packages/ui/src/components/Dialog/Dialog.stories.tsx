import type { Meta, StoryObj } from '@storybook/react';
import { Dialog } from './Dialog';
import { Button } from '../Button';

const meta: Meta<typeof Dialog> = {
  title: 'Primitives/Dialog',
  component: Dialog,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
  },
};

export default meta;
type Story = StoryObj<typeof Dialog>;

export const Default: Story = {
  render: () => (
    <Dialog>
      <Dialog.Trigger asChild>
        <Button>Open Dialog</Button>
      </Dialog.Trigger>
      <Dialog.Content>
        <Dialog.Header>
          <Dialog.Title>Dialog Title</Dialog.Title>
          <Dialog.Description>
            This is a description of the dialog content.
          </Dialog.Description>
        </Dialog.Header>
        <div className="py-4">
          <p className="text-sm text-muted-foreground">
            Dialog content goes here. You can put any content inside the dialog.
          </p>
        </div>
        <Dialog.Footer>
          <Dialog.Close asChild>
            <Button variant="outline">Cancel</Button>
          </Dialog.Close>
          <Button>Confirm</Button>
        </Dialog.Footer>
      </Dialog.Content>
    </Dialog>
  ),
};

export const Small: Story = {
  render: () => (
    <Dialog>
      <Dialog.Trigger asChild>
        <Button>Open Small Dialog</Button>
      </Dialog.Trigger>
      <Dialog.Content size="sm">
        <Dialog.Header>
          <Dialog.Title>Small Dialog</Dialog.Title>
        </Dialog.Header>
        <p className="text-sm text-muted-foreground py-4">
          This is a smaller dialog for quick confirmations.
        </p>
        <Dialog.Footer>
          <Dialog.Close asChild>
            <Button>Got it</Button>
          </Dialog.Close>
        </Dialog.Footer>
      </Dialog.Content>
    </Dialog>
  ),
};

export const Large: Story = {
  render: () => (
    <Dialog>
      <Dialog.Trigger asChild>
        <Button>Open Large Dialog</Button>
      </Dialog.Trigger>
      <Dialog.Content size="lg">
        <Dialog.Header>
          <Dialog.Title>Large Dialog</Dialog.Title>
          <Dialog.Description>
            This dialog has more space for detailed content.
          </Dialog.Description>
        </Dialog.Header>
        <div className="py-4 space-y-4">
          <p className="text-sm">
            Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do
            eiusmod tempor incididunt ut labore et dolore magna aliqua.
          </p>
          <p className="text-sm">
            Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris
            nisi ut aliquip ex ea commodo consequat.
          </p>
        </div>
        <Dialog.Footer>
          <Dialog.Close asChild>
            <Button variant="outline">Cancel</Button>
          </Dialog.Close>
          <Button>Save Changes</Button>
        </Dialog.Footer>
      </Dialog.Content>
    </Dialog>
  ),
};

export const SidePanel: Story = {
  render: () => (
    <Dialog>
      <Dialog.Trigger asChild>
        <Button>Open Side Panel</Button>
      </Dialog.Trigger>
      <Dialog.Content position="right" size="md">
        <Dialog.Header>
          <Dialog.Title>Side Panel</Dialog.Title>
          <Dialog.Description>
            This dialog slides in from the right side.
          </Dialog.Description>
        </Dialog.Header>
        <div className="py-4 flex-1">
          <p className="text-sm text-muted-foreground">
            Side panels are useful for secondary content, settings, or detail
            views that don&apos;t require full focus.
          </p>
        </div>
        <Dialog.Footer>
          <Dialog.Close asChild>
            <Button variant="outline">Close</Button>
          </Dialog.Close>
        </Dialog.Footer>
      </Dialog.Content>
    </Dialog>
  ),
};

export const WithForm: Story = {
  render: () => (
    <Dialog>
      <Dialog.Trigger asChild>
        <Button>Edit Profile</Button>
      </Dialog.Trigger>
      <Dialog.Content>
        <Dialog.Header>
          <Dialog.Title>Edit Profile</Dialog.Title>
          <Dialog.Description>
            Make changes to your profile here.
          </Dialog.Description>
        </Dialog.Header>
        <div className="py-4 space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Name</label>
            <input
              type="text"
              className="w-full px-3 py-2 border rounded-md bg-background"
              placeholder="Enter your name"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Email</label>
            <input
              type="email"
              className="w-full px-3 py-2 border rounded-md bg-background"
              placeholder="Enter your email"
            />
          </div>
        </div>
        <Dialog.Footer>
          <Dialog.Close asChild>
            <Button variant="outline">Cancel</Button>
          </Dialog.Close>
          <Button>Save Changes</Button>
        </Dialog.Footer>
      </Dialog.Content>
    </Dialog>
  ),
};
