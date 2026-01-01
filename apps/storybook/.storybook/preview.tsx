import type { Preview } from '@storybook/react';
import { withThemeByClassName } from '@storybook/addon-themes';
import { ThemeProvider } from '../../../packages/ui/src/theme';
import '../../../packages/ui/src/styles/globals.css';

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    backgrounds: {
      disable: true,
    },
    options: {
      storySort: {
        order: [
          'Design System',
          ['Theme', 'Typography'],
          'Primitives',
          'Layout',
          'Components',
          'Chat',
          ['AgentPanel', 'TaskHistorySidebar', 'Components'],
        ],
      },
    },
  },
  decorators: [
    withThemeByClassName({
      themes: {
        light: '',
        dark: 'dark',
      },
      defaultTheme: 'light',
    }),
    // ThemeProvider for useTheme hook
    (Story) => (
      <ThemeProvider>
        <Story />
      </ThemeProvider>
    ),
    // Wrapper to ensure background color is applied
    (Story) => (
      <div className="bg-background text-foreground min-h-screen p-4">
        <Story />
      </div>
    ),
  ],
};

export default preview;
