import { Sparkles, Code2, Rocket } from 'lucide-react';
import { Heading, Text } from '@agent-kit/ui';
import { FeatureCard } from './FeatureCard';

const features = [
  {
    icon: Sparkles,
    title: 'AI-Powered',
    description:
      'Build intelligent agents with ease. Leverage the latest AI models to create agents that understand and respond naturally.',
  },
  {
    icon: Code2,
    title: 'Simple Development',
    description:
      'Focus on logic, not infrastructure. Our intuitive SDK handles the complexity so you can ship faster.',
  },
  {
    icon: Rocket,
    title: 'Deploy Anywhere',
    description:
      'One-click deployment to production. Scale automatically and monitor your agents in real-time.',
  },
];

export function FeaturesSection() {
  return (
    <section id="features" className="relative px-4 py-24">
      {/* Background decoration */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute left-1/2 top-0 h-px w-1/2 -translate-x-1/2 bg-gradient-to-r from-transparent via-border to-transparent" />
      </div>

      <div className="mx-auto max-w-6xl">
        {/* Section header */}
        <div className="mb-12 text-center animate-fade-in">
          <Heading size="40" as="h2" className="mb-4">
            Everything you need to build AI agents
          </Heading>
          <Text size="16" variant="muted" className="mx-auto max-w-2xl">
            A complete toolkit designed for developers who want to create
            powerful AI agents without the hassle.
          </Text>
        </div>

        {/* Features grid */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 animate-fade-in [animation-delay:150ms]">
          {features.map((feature) => (
            <FeatureCard key={feature.title} {...feature} />
          ))}
        </div>
      </div>
    </section>
  );
}
