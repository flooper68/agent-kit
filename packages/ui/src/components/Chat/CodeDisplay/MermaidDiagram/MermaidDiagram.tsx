import { memo, useEffect, useRef, useState, useId } from 'react';
import mermaid from 'mermaid';
import { cn } from '../../../../lib/utils';

export interface MermaidDiagramProps
  extends React.HTMLAttributes<HTMLDivElement> {
  chart: string;
}

export const MermaidDiagram = memo(
  ({ chart, className, ...props }: MermaidDiagramProps) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const [svg, setSvg] = useState<string>('');
    const [error, setError] = useState<string | null>(null);
    const uniqueId = useId().replace(/:/g, '-');

    useEffect(() => {
      const renderDiagram = async () => {
        if (!containerRef.current) return;

        // Detect dark mode
        const isDark =
          typeof window !== 'undefined' &&
          document.documentElement.classList.contains('dark');

        // Initialize mermaid with current theme
        mermaid.initialize({
          startOnLoad: false,
          theme: isDark ? 'dark' : 'default',
          fontFamily: 'var(--font-sans)',
          securityLevel: 'strict',
        });

        try {
          const { svg: renderedSvg } = await mermaid.render(
            `mermaid-${uniqueId}`,
            chart.trim()
          );
          setSvg(renderedSvg);
          setError(null);
        } catch (err) {
          console.error('Mermaid rendering error:', err);
          setError(
            err instanceof Error ? err.message : 'Failed to render diagram'
          );
          setSvg('');
        }
      };

      renderDiagram();
    }, [chart, uniqueId]);

    if (error) {
      return (
        <div
          className={cn(
            'not-prose my-2 p-4 rounded-lg border border-destructive/50 bg-destructive/10 text-destructive text-sm',
            className
          )}
          {...props}
        >
          <div className="font-medium mb-1">Diagram Error</div>
          <pre className="text-xs overflow-x-auto whitespace-pre-wrap">
            {error}
          </pre>
          <details className="mt-2">
            <summary className="cursor-pointer text-xs text-muted-foreground">
              View source
            </summary>
            <pre className="mt-1 text-xs overflow-x-auto">{chart}</pre>
          </details>
        </div>
      );
    }

    return (
      <div
        ref={containerRef}
        className={cn(
          'not-prose my-2 flex justify-center overflow-x-auto',
          '[&_svg]:max-w-full [&_svg]:h-auto',
          className
        )}
        dangerouslySetInnerHTML={{ __html: svg }}
        {...props}
      />
    );
  }
);

MermaidDiagram.displayName = 'MermaidDiagram';
