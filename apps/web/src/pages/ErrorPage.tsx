import { useEffect } from 'react';
import {
  useRouteError,
  isRouteErrorResponse,
  useNavigate,
} from 'react-router-dom';
import { Button, Heading, Text } from '@agent-kit/ui';
import { AlertTriangle, Home, RefreshCw } from 'lucide-react';

export function ErrorPage() {
  const error = useRouteError();
  const navigate = useNavigate();
  const isRouteError = isRouteErrorResponse(error);

  useEffect(() => {
    document.title = 'Error | Agent Kit';
  }, []);

  // Determine error message
  let errorMessage = 'Something went wrong. Please try again.';

  if (isRouteError) {
    if (error.status === 404) {
      errorMessage = "The page you're looking for doesn't exist.";
    } else if (error.status === 401) {
      errorMessage = "You don't have permission to access this page.";
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4">
      <div className="mx-auto max-w-md text-center">
        {/* Graphic */}
        <div className="mb-8">
          <div className="inline-flex h-20 w-20 items-center justify-center rounded-full bg-destructive/10">
            <AlertTriangle className="h-10 w-10 text-destructive" />
          </div>
        </div>

        {/* Content */}
        <Heading as="h1" size="24" className="mb-2">
          Something went wrong
        </Heading>
        <Text className="text-muted-foreground mb-6">{errorMessage}</Text>

        {/* Actions */}
        <div className="flex items-center justify-center gap-3">
          <Button onClick={() => window.location.reload()}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Try Again
          </Button>
          <Button variant="outline" onClick={() => navigate('/app')}>
            <Home className="mr-2 h-4 w-4" />
            Dashboard
          </Button>
        </div>
      </div>
    </div>
  );
}
