import type { Meta, StoryObj } from '@storybook/react';
import { CodeBlock } from './CodeBlock';

const meta: Meta<typeof CodeBlock> = {
  title: 'Chat/Code/CodeBlock',
  component: CodeBlock,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
  },
};

export default meta;
type Story = StoryObj<typeof CodeBlock>;

const typescriptCode = `import { useState, useEffect } from 'react';

interface User {
  id: string;
  name: string;
  email: string;
}

export function useUser(userId: string) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchUser() {
      const response = await fetch(\`/api/users/\${userId}\`);
      const data = await response.json();
      setUser(data);
      setLoading(false);
    }
    fetchUser();
  }, [userId]);

  return { user, loading };
}`;

const pythonCode = `def fibonacci(n: int) -> list[int]:
    """Generate Fibonacci sequence up to n terms."""
    if n <= 0:
        return []
    elif n == 1:
        return [0]

    sequence = [0, 1]
    while len(sequence) < n:
        sequence.append(sequence[-1] + sequence[-2])

    return sequence

# Example usage
print(fibonacci(10))`;

export const TypeScript: Story = {
  args: {
    code: typescriptCode,
    language: 'typescript',
    filename: 'useUser.ts',
  },
};

export const Python: Story = {
  args: {
    code: pythonCode,
    language: 'python',
  },
};

export const WithoutLineNumbers: Story = {
  args: {
    code: 'const greeting = "Hello, World!";\nconsole.log(greeting);',
    language: 'javascript',
    showLineNumbers: false,
  },
};

export const ShortSnippet: Story = {
  args: {
    code: 'npm install @agent-kit/ui',
    language: 'bash',
  },
};
