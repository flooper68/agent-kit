import type { Config } from 'tailwindcss';
import uiConfig from '../../packages/ui/tailwind.config';

const config: Config = {
  ...uiConfig,
  content: [
    '../../packages/ui/src/**/*.{ts,tsx}',
    './.storybook/**/*.{ts,tsx,mdx}',
  ],
};

export default config;
