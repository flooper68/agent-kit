import { ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Heading, Text } from '@agent-kit/ui';

interface AgentFormPageLayoutProps {
  title: string;
  description?: string;
  children: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl';
}

const maxWidthClasses = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
  '2xl': 'max-w-2xl',
  '3xl': 'max-w-3xl',
};

export function AgentFormPageLayout({
  title,
  description,
  children,
  maxWidth = '2xl',
}: AgentFormPageLayoutProps) {
  return (
    <div className="h-full overflow-auto p-6">
      <div className={`mx-auto ${maxWidthClasses[maxWidth]}`}>
        <div className="mb-6">
          {/* Breadcrumb navigation */}
          <nav className="flex items-center gap-1.5 mb-3">
            <Link
              to="/app/agents"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Agents
            </Link>
            <ChevronRight className="h-4 w-4 text-muted-foreground/50" />
            <span className="text-sm font-medium text-foreground">{title}</span>
          </nav>

          {/* Page title and description */}
          <Heading as="h1" size="24">
            {title}
          </Heading>
          {description && (
            <Text className="text-muted-foreground mt-1">{description}</Text>
          )}
        </div>
        {children}
      </div>
    </div>
  );
}
