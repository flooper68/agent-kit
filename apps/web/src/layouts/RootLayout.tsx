import { Outlet } from 'react-router-dom';
import { ThemeProvider } from '@agent-kit/ui';

export function RootLayout() {
  return (
    <ThemeProvider>
      <div className="h-screen w-screen bg-background font-sans antialiased">
        <Outlet />
      </div>
    </ThemeProvider>
  );
}
