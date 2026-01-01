import type { LucideIcon } from 'lucide-react';
import { Heading, Text } from '@agent-kit/ui';

interface FeatureCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
}

export function FeatureCard({
  icon: Icon,
  title,
  description,
}: FeatureCardProps) {
  return (
    <div className="group relative rounded-2xl border border-border/50 bg-card/50 p-6 backdrop-blur-sm transition-all duration-300 hover:border-primary/50 hover:bg-card/80">
      {/* Glow effect on hover */}
      <div className="pointer-events-none absolute inset-0 rounded-2xl bg-gradient-to-r from-primary/5 to-primary/5 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

      <div className="relative z-10">
        {/* Icon */}
        <div className="mb-4 inline-flex rounded-xl bg-primary/10 p-3 text-primary transition-colors group-hover:bg-primary/20">
          <Icon className="h-6 w-6" />
        </div>

        {/* Title */}
        <Heading size="20" as="h3" className="mb-2">
          {title}
        </Heading>

        {/* Description */}
        <Text size="14" variant="muted">
          {description}
        </Text>
      </div>
    </div>
  );
}
