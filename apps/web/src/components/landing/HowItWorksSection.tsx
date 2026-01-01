import { FileText, Wrench, Zap } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Heading, Text } from '@agent-kit/ui';

interface Step {
  number: number;
  icon: LucideIcon;
  title: string;
  description: string;
}

const steps: Step[] = [
  {
    number: 1,
    icon: FileText,
    title: 'Define Your Agent',
    description:
      'Describe what your agent should do. Define its capabilities, personality, and the tasks it should handle.',
  },
  {
    number: 2,
    icon: Wrench,
    title: 'Build & Test',
    description:
      "Iterate rapidly with live preview. Test your agent in real-time and refine its behavior until it's perfect.",
  },
  {
    number: 3,
    icon: Zap,
    title: 'Deploy',
    description:
      'Ship to production instantly. Your agent is ready to serve users with just one click.',
  },
];

export function HowItWorksSection() {
  return (
    <section id="how-it-works" className="relative px-4 py-24">
      {/* Background */}
      <div className="pointer-events-none absolute inset-0 bg-muted/30" />

      <div className="relative mx-auto max-w-6xl">
        {/* Section header */}
        <div className="mb-16 text-center animate-fade-in">
          <Heading size="40" as="h2" className="mb-4">
            How it Works
          </Heading>
          <Text size="16" variant="muted" className="mx-auto max-w-2xl">
            Get from idea to production in three simple steps
          </Text>
        </div>

        {/* Steps */}
        <div className="grid gap-12 lg:grid-cols-3 lg:gap-8 animate-fade-in [animation-delay:150ms]">
          {steps.map((step, index) => (
            <div key={step.number} className="relative text-center">
              {/* Connector line (desktop) */}
              {index < steps.length - 1 && (
                <div className="absolute left-[calc(50%+32px)] right-[calc(-50%+32px)] top-6 hidden h-px bg-border lg:block" />
              )}

              {/* Number badge with icon inside */}
              <div className="relative mx-auto mb-6 flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground">
                <Text
                  as="span"
                  size="16"
                  variant="strong"
                  className="text-primary-foreground"
                >
                  {step.number}
                </Text>
              </div>

              {/* Icon */}
              <div className="mx-auto mb-4 inline-flex rounded-xl bg-muted p-3 text-foreground">
                <step.icon className="h-6 w-6" />
              </div>

              {/* Content */}
              <Heading size="24" as="h3" className="mb-2">
                {step.title}
              </Heading>
              <Text size="14" variant="muted">
                {step.description}
              </Text>

              {/* Arrow connector (mobile) */}
              {index < steps.length - 1 && (
                <div className="mx-auto my-8 h-8 w-px bg-border lg:hidden" />
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
