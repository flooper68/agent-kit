import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { Heading, Text, buttonVariants, cn } from '@agent-kit/ui';

export function CTASection() {
  return (
    <section className="relative px-4 py-24">
      {/* Background effects */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute left-1/2 top-1/2 h-[400px] w-[600px] -translate-x-1/2 -translate-y-1/2 animate-pulse rounded-full bg-primary/10 blur-[100px]" />
      </div>

      <div className="relative mx-auto max-w-3xl text-center animate-fade-in">
        {/* Heading */}
        <Heading size="40" as="h2" className="mb-4">
          Ready to build your first agent?
        </Heading>
        <Text size="20" variant="muted" className="mb-8">
          Join hundreds of developers who are already building the future with
          Agent Kit.
        </Text>

        {/* CTA Button */}
        <Link
          to="/sign-up"
          className={cn(buttonVariants({ size: 'lg' }), 'group min-w-[200px]')}
        >
          Start Building
          <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
        </Link>

        {/* Additional info */}
        <Text size="14" variant="muted" className="mt-4">
          Free to start. No credit card required.
        </Text>
      </div>
    </section>
  );
}
