import { cn } from '../../lib/utils';

export interface FormCardProps {
  children: React.ReactNode;
  title: string;
  description?: string;
  footer?: React.ReactNode;
  className?: string;
}

export function FormCard({
  children,
  title,
  description,
  footer,
  className,
}: FormCardProps) {
  return (
    <div
      className={cn(
        'mx-auto w-full max-w-md',
        'rounded-lg border border-border bg-card p-6 shadow-sm',
        className
      )}
    >
      <div className="mb-6 space-y-1.5 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        {description && (
          <p className="text-sm text-muted-foreground">{description}</p>
        )}
      </div>
      {children}
      {footer && (
        <div className="mt-6 text-center text-sm text-muted-foreground">
          {footer}
        </div>
      )}
    </div>
  );
}
