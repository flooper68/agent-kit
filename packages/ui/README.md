# @agent-kit/ui

Shared React UI components for Agent Kit with light/dark theme support.

## Installation

```bash
bun add @agent-kit/ui
```

## Theme System

The component library includes a comprehensive theme system with support for light, dark, and system preference modes.

### Setup

1. Import the global styles in your app entry:

```tsx
import '@agent-kit/ui/styles/globals.css';
```

2. Wrap your app with ThemeProvider:

```tsx
import { ThemeProvider, ThemeScript } from '@agent-kit/ui';

function App() {
  return (
    <>
      <ThemeScript />
      <ThemeProvider defaultTheme="system">
        <YourApp />
      </ThemeProvider>
    </>
  );
}
```

### Theme Toggle

Add a theme toggle button for users to switch themes:

```tsx
import { ThemeToggle } from '@agent-kit/ui';

function Header() {
  return (
    <header>
      <ThemeToggle />
    </header>
  );
}
```

### Programmatic Access

Access and control theme state with the `useTheme` hook:

```tsx
import { useTheme } from '@agent-kit/ui';

function MyComponent() {
  const { theme, resolvedTheme, setTheme } = useTheme();

  return (
    <div>
      <p>Setting: {theme}</p>
      <p>Active: {resolvedTheme}</p>
      <button onClick={() => setTheme('dark')}>Dark Mode</button>
    </div>
  );
}
```

### Available Themes

- `light` - Light mode
- `dark` - Dark mode
- `system` - Follows OS preference (default)

## Components

### Primitives

- `Button` - Primary button component with variants
- `IconButton` - Icon-only button
- `Dialog` - Modal dialog
- `Avatar` - User avatar
- `Textarea` - Multi-line text input
- `Collapsible` - Expandable content section

### Theme

- `ThemeProvider` - Theme context provider
- `ThemeToggle` - Theme switcher button
- `ThemeScript` - FOUC prevention script
- `useTheme` - Theme access hook

### Chat Components

Full suite of chat UI components including:

- Message display and lists
- Chat input with attachments
- Code blocks with syntax highlighting
- Tool call displays
- Loading and error states
- Chat history sidebar

## CSS Variables

All colors use CSS custom properties for easy customization:

```css
/* Core colors */
--background, --foreground
--primary, --primary-foreground
--secondary, --secondary-foreground
--muted, --muted-foreground
--accent, --accent-foreground
--destructive, --destructive-foreground
--border, --input, --ring

/* Code block specific */
--code-background, --code-foreground
--code-header, --code-border
--code-line-number
--code-copy-button, --code-copy-button-hover
```

## Storybook

Run Storybook to explore components:

```bash
bun run dev:storybook
```

See the "Design System/Theme" page for complete theme documentation and color palettes.

## Development

```bash
# Install dependencies
bun install

# Run Storybook
bun run dev:storybook

# Build package
bun run build

# Type check
bun run typecheck
```
