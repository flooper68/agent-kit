import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { Heading, Text, buttonVariants, cn } from '@agent-kit/ui';

export function HeroSection() {
  return (
    <section className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 pt-16">
      {/* Animated background effects */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        {/* Primary glow */}
        <div className="absolute left-1/2 top-1/2 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 animate-pulse rounded-full bg-primary/20 blur-[120px]" />

        {/* Secondary glows */}
        <div className="absolute left-1/4 top-1/3 h-[400px] w-[400px] animate-pulse rounded-full bg-info/10 blur-[100px] [animation-delay:1s]" />
        <div className="absolute right-1/4 top-2/3 h-[350px] w-[350px] animate-pulse rounded-full bg-primary/10 blur-[100px] [animation-delay:2s]" />

        {/* Light rays */}
        <div className="absolute left-1/2 top-1/2 h-[800px] w-[2px] -translate-x-1/2 -translate-y-1/2 rotate-45 bg-gradient-to-b from-transparent via-primary/20 to-transparent" />
        <div className="absolute left-1/2 top-1/2 h-[800px] w-[2px] -translate-x-1/2 -translate-y-1/2 -rotate-45 bg-gradient-to-b from-transparent via-primary/20 to-transparent" />

        {/* Grid pattern */}
        <div
          className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage: `linear-gradient(to right, currentColor 1px, transparent 1px), linear-gradient(to bottom, currentColor 1px, transparent 1px)`,
            backgroundSize: '60px 60px',
          }}
        />
      </div>

      {/* Content */}
      <div className="relative z-10 mx-auto max-w-4xl text-center">
        {/* Badge */}
        <div className="mb-6 inline-flex animate-slide-up items-center gap-2 rounded-full border border-border/50 bg-muted/50 px-4 py-1.5 opacity-0 backdrop-blur-sm [animation-delay:100ms] [animation-fill-mode:forwards]">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-success" />
          </span>
          <Text as="span" size="14" variant="muted">
            Now in beta
          </Text>
        </div>

        {/* Headline */}
        <Heading
          size="56"
          as="h1"
          className="mb-6 animate-slide-up opacity-0 sm:text-heading-64 lg:text-heading-72 [animation-delay:200ms] [animation-fill-mode:forwards]"
        >
          Your Personal{' '}
          <span className="bg-gradient-to-r from-info via-primary to-info bg-clip-text text-transparent">
            AI Agent Kit
          </span>
        </Heading>

        {/* Subheading */}
        <Text
          size="20"
          variant="muted"
          className="mx-auto mb-8 max-w-2xl animate-slide-up opacity-0 [animation-delay:300ms] [animation-fill-mode:forwards]"
        >
          Build and deploy AI agents in minutes, not months. A simple
          development kit for creating intelligent agents without the
          complexity.
        </Text>

        {/* CTA Buttons */}
        <div className="flex flex-col items-center justify-center gap-4 animate-slide-up opacity-0 [animation-delay:400ms] [animation-fill-mode:forwards] sm:flex-row">
          <Link
            to="/sign-up"
            className={cn(
              buttonVariants({ size: 'lg' }),
              'group min-w-[200px]'
            )}
          >
            Get Started
            <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
          <a
            href="#features"
            className={cn(
              buttonVariants({ variant: 'outline', size: 'lg' }),
              'min-w-[200px]'
            )}
          >
            Learn More
          </a>
        </div>

        {/* Social proof */}
        <div className="mt-12 flex items-center justify-center gap-8 animate-slide-up opacity-0 [animation-delay:500ms] [animation-fill-mode:forwards]">
          <div className="flex items-center gap-2">
            <div className="flex -space-x-2">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-background bg-muted text-xs font-medium"
                >
                  {String.fromCharCode(64 + i)}
                </div>
              ))}
            </div>
            <Text as="span" size="14" variant="muted">
              Join 500+ developers
            </Text>
          </div>
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2">
        <div className="flex h-10 w-6 items-start justify-center rounded-full border border-border/50 p-2">
          <div className="h-2 w-1 animate-bounce rounded-full bg-muted-foreground" />
        </div>
      </div>
    </section>
  );
}
