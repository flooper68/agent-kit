import type { Config } from 'tailwindcss';
import uiConfig from '@agent-kit/ui/tailwind.config';

const config: Config = {
  presets: [uiConfig],
  content: [
    './src/**/*.{ts,tsx}',
    './index.html',
    '../../packages/ui/src/**/*.{ts,tsx}',
  ],
};

export default config;
