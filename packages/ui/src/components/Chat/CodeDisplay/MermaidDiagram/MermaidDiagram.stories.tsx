import type { Meta, StoryObj } from '@storybook/react';
import { MermaidDiagram } from './MermaidDiagram';

const meta: Meta<typeof MermaidDiagram> = {
  title: 'Chat/Chat Components/MermaidDiagram',
  component: MermaidDiagram,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
  },
};

export default meta;
type Story = StoryObj<typeof MermaidDiagram>;

export const Flowchart: Story = {
  args: {
    chart: `flowchart TD
    A[Start] --> B{Is it working?}
    B -->|Yes| C[Great!]
    B -->|No| D[Debug]
    D --> B`,
  },
};

export const SequenceDiagram: Story = {
  args: {
    chart: `sequenceDiagram
    participant Client
    participant Server
    participant Database
    Client->>Server: Request
    Server->>Database: Query
    Database-->>Server: Results
    Server-->>Client: Response`,
  },
};

export const ClassDiagram: Story = {
  args: {
    chart: `classDiagram
    class Animal {
      +String name
      +int age
      +makeSound()
    }
    class Dog {
      +String breed
      +bark()
    }
    Animal <|-- Dog`,
  },
};

export const GitGraph: Story = {
  args: {
    chart: `gitGraph
    commit
    branch develop
    checkout develop
    commit
    commit
    checkout main
    merge develop
    commit`,
  },
};

export const FallbackCodeBlock: Story = {
  name: 'Fallback Code Block (Invalid Syntax)',
  args: {
    chart: `flowchart INVALID
    This is not valid mermaid syntax [[[]]]`,
  },
};
