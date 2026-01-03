import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { Pagination } from './Pagination';

const meta: Meta<typeof Pagination> = {
  title: 'Primitives/Pagination',
  component: Pagination,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

function PaginationDemo() {
  const [page, setPage] = useState(1);
  const totalPages = 5;

  return (
    <div className="w-[400px] space-y-4">
      <div className="text-center text-sm text-muted-foreground">
        Page {page} of {totalPages}
      </div>
      <Pagination
        hasNextPage={page < totalPages}
        hasPreviousPage={page > 1}
        onNextPage={() => setPage((p) => Math.min(p + 1, totalPages))}
        onPreviousPage={() => setPage((p) => Math.max(p - 1, 1))}
      />
    </div>
  );
}

export const Default: Story = {
  render: () => <PaginationDemo />,
};

export const FirstPage: Story = {
  args: {
    hasNextPage: true,
    hasPreviousPage: false,
    onNextPage: () => {},
    onPreviousPage: () => {},
  },
};

export const MiddlePage: Story = {
  args: {
    hasNextPage: true,
    hasPreviousPage: true,
    onNextPage: () => {},
    onPreviousPage: () => {},
  },
};

export const LastPage: Story = {
  args: {
    hasNextPage: false,
    hasPreviousPage: true,
    onNextPage: () => {},
    onPreviousPage: () => {},
  },
};

export const Loading: Story = {
  args: {
    hasNextPage: true,
    hasPreviousPage: true,
    onNextPage: () => {},
    onPreviousPage: () => {},
    isLoading: true,
  },
};
