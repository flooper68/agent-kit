import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Heading, Text } from '@agent-kit/ui';
import { Search, Home, ArrowLeft } from 'lucide-react';

export function NotFoundPage() {
  const navigate = useNavigate();

  useEffect(() => {
    document.title = 'Page Not Found | Agent Kit';
  }, []);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4">
      <div className="mx-auto max-w-md text-center">
        {/* Graphic */}
        <div className="mb-8">
          <div className="inline-flex h-20 w-20 items-center justify-center rounded-full bg-muted">
            <Search className="h-10 w-10 text-muted-foreground" />
          </div>
        </div>

        {/* Content */}
        <Heading as="h1" size="24" className="mb-2">
          Page not found
        </Heading>
        <Text className="text-muted-foreground mb-6">
          The page you&apos;re looking for doesn&apos;t exist.
        </Text>

        {/* Actions */}
        <div className="flex items-center justify-center gap-3">
          <Button onClick={() => navigate('/app')}>
            <Home className="mr-2 h-4 w-4" />
            Dashboard
          </Button>
          <Button variant="outline" onClick={() => navigate(-1)}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Go Back
          </Button>
        </div>
      </div>
    </div>
  );
}
