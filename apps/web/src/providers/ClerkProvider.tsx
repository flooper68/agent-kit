import { ClerkProvider as ClerkReactProvider } from '@clerk/clerk-react';
import { useNavigate } from 'react-router-dom';

const publishableKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

if (!publishableKey) {
  throw new Error('Missing VITE_CLERK_PUBLISHABLE_KEY environment variable');
}

interface ClerkProviderProps {
  children: React.ReactNode;
}

export function ClerkProvider({ children }: ClerkProviderProps) {
  const navigate = useNavigate();

  return (
    <ClerkReactProvider
      publishableKey={publishableKey}
      routerPush={(to) => navigate(to)}
      routerReplace={(to) => navigate(to, { replace: true })}
    >
      {children}
    </ClerkReactProvider>
  );
}
