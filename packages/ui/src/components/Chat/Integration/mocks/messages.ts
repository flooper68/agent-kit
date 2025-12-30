import type {
  TaskMessage,
  TextPart,
  ToolInvocationPart,
  ToolResultPart,
  ReasoningPart,
  ImagePart,
  MessagePart,
} from '../../../../types/chat';

// Utility to generate unique IDs
let idCounter = 0;
export const generateId = () => `id_${++idCounter}_${Date.now()}`;

// Factory functions for creating message parts
export const createTextPart = (content: string): TextPart => ({
  id: generateId(),
  type: 'text',
  content,
});

export const createReasoningPart = (
  content: string,
  isCollapsed = true
): ReasoningPart => ({
  id: generateId(),
  type: 'reasoning',
  content,
  isCollapsed,
});

export const createToolInvocationPart = (
  toolName: string,
  args: Record<string, unknown>,
  state: ToolInvocationPart['state'] = 'pending'
): ToolInvocationPart => ({
  id: generateId(),
  type: 'tool_invocation',
  toolName,
  toolCallId: generateId(),
  args,
  state,
});

export const createToolResultPart = (
  toolCallId: string,
  result: unknown,
  isError = false
): ToolResultPart => ({
  id: generateId(),
  type: 'tool_result',
  toolCallId,
  result,
  isError,
});

export const createImagePart = (url: string, alt?: string): ImagePart => ({
  id: generateId(),
  type: 'image',
  url,
  alt,
});

// Helper to create a message
export const createMessage = (
  role: TaskMessage['role'],
  parts: MessagePart[],
  metadata?: TaskMessage['metadata']
): TaskMessage => ({
  id: generateId(),
  role,
  parts,
  createdAt: new Date(),
  metadata,
});

// Helper to get text content from a message
export const getTextContent = (message: TaskMessage): string => {
  return message.parts
    .filter((p): p is TextPart => p.type === 'text')
    .map((p) => p.content)
    .join('\n');
};

// ============================================
// Predefined Conversations
// ============================================

export const simpleConversation: TaskMessage[] = [
  createMessage('user', [createTextPart('What is TypeScript?')]),
  createMessage(
    'assistant',
    [
      createTextPart(
        'TypeScript is a strongly typed programming language that builds on JavaScript, giving you better tooling at any scale. It adds optional static typing and class-based object-oriented programming to the language.'
      ),
    ],
    { model: 'claude-3-sonnet', tokensUsed: 45 }
  ),
  createMessage('user', [createTextPart('Can you show me a simple example?')]),
  createMessage(
    'assistant',
    [
      createTextPart(
        'Here\'s a simple TypeScript example:\n\n```typescript\ninterface User {\n  name: string;\n  age: number;\n}\n\nfunction greet(user: User): string {\n  return `Hello, ${user.name}!`;\n}\n\nconst user: User = { name: "Alice", age: 30 };\nconsole.log(greet(user));\n```\n\nThis demonstrates type annotations and interfaces.'
      ),
    ],
    { model: 'claude-3-sonnet', tokensUsed: 120 }
  ),
];

export const conversationWithCode: TaskMessage[] = [
  createMessage('user', [createTextPart('Create a React button component')]),
  createMessage(
    'assistant',
    [
      createTextPart(
        "I'll create a React button component with TypeScript and Tailwind CSS:\n\n```tsx\nimport { forwardRef } from 'react';\nimport { cn } from '@/lib/utils';\n\ninterface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {\n  variant?: 'primary' | 'secondary' | 'ghost';\n  size?: 'sm' | 'md' | 'lg';\n}\n\nexport const Button = forwardRef<HTMLButtonElement, ButtonProps>(\n  ({ variant = 'primary', size = 'md', className, children, ...props }, ref) => {\n    return (\n      <button\n        ref={ref}\n        className={cn(\n          'rounded-lg font-medium transition-colors',\n          variant === 'primary' && 'bg-blue-500 text-white hover:bg-blue-600',\n          variant === 'secondary' && 'bg-gray-200 text-gray-900 hover:bg-gray-300',\n          variant === 'ghost' && 'hover:bg-gray-100',\n          size === 'sm' && 'px-3 py-1.5 text-sm',\n          size === 'md' && 'px-4 py-2',\n          size === 'lg' && 'px-6 py-3 text-lg',\n          className\n        )}\n        {...props}\n      >\n        {children}\n      </button>\n    );\n  }\n);\n\nButton.displayName = 'Button';\n```\n\nThis component supports multiple variants and sizes with full TypeScript support."
      ),
    ],
    { model: 'claude-3-sonnet', tokensUsed: 280 }
  ),
];

export const conversationWithToolCalls: TaskMessage[] = [
  createMessage('user', [createTextPart("developer's landing page / blog")]),
  createMessage('assistant', [
    createReasoningPart(
      'The user wants to create a developer landing page or blog. Let me think about the structure:\n\n1. Hero section with introduction\n2. Featured projects/posts\n3. Skills/technologies section\n4. Contact information\n\nI should create a clean, modern design with good typography.',
      false
    ),
  ]),
  createMessage('assistant', [
    createTextPart(
      "I see the issue - there's no `app/page.tsx` file yet. Let me create a simple page so you can see the color changes in the preview:"
    ),
    {
      ...createToolInvocationPart(
        'create_file',
        { path: 'app/page.tsx', content: '// Landing page component...' },
        'completed'
      ),
      toolCallId: 'call_create_1',
    } as ToolInvocationPart,
  ]),
  createMessage('assistant', [
    createTextPart(
      "Perfect! I've created a simple home page that showcases the new blue color scheme. You should now see the preview with the updated primary blue color and light blue accent color displayed in sample cards. This gives us a foundation to build the actual chat interface on top of."
    ),
  ]),
];

export const conversationWithReasoning: TaskMessage[] = [
  createMessage('user', [
    createTextPart('Help me optimize this database query'),
  ]),
  createMessage('assistant', [
    createReasoningPart(
      "Let me analyze the query optimization request:\n\n1. First, I need to understand the current query structure\n2. Check for missing indexes\n3. Look for N+1 query patterns\n4. Consider caching strategies\n5. Evaluate if denormalization would help\n\nThe user hasn't provided the actual query yet, so I should ask for more details.",
      false
    ),
    createTextPart(
      "I'd be happy to help optimize your database query! To provide the best recommendations, could you share:\n\n1. The current query you're using\n2. The database system (PostgreSQL, MySQL, etc.)\n3. Approximate table sizes\n4. Current execution time"
    ),
  ]),
];

export const streamingMessage: TaskMessage = createMessage('assistant', [
  createTextPart(
    "I'm analyzing your request and preparing a detailed response..."
  ),
]);

export const emptyAssistantMessage: TaskMessage = createMessage('assistant', [
  createTextPart(''),
]);
