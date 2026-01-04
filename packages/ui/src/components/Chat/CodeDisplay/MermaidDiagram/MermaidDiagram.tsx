import { memo, useEffect, useRef, useState, useId } from 'react';
import mermaid from 'mermaid';
import DOMPurify from 'dompurify';
import { cn } from '../../../../lib/utils';
import { useTheme } from '../../../../theme';

export interface MermaidDiagramProps
  extends Omit<
    React.HTMLAttributes<HTMLDivElement>,
    'dangerouslySetInnerHTML' | 'children'
  > {
  chart: string;
}

// Track mermaid initialization state at module level
let currentTheme: string | null = null;

export const MermaidDiagram = memo(
  ({ chart, className, ...props }: MermaidDiagramProps) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const [svg, setSvg] = useState<string>('');
    const [error, setError] = useState<string | null>(null);
    const uniqueId = useId().replace(/:/g, '-');

    // Use theme context for reactive dark mode detection
    const { resolvedTheme } = useTheme();
    const isDark = resolvedTheme === 'dark';

    useEffect(() => {
      let isMounted = true;

      const renderDiagram = async () => {
        if (!containerRef.current) return;

        const theme = isDark ? 'dark' : 'default';

        // Only reinitialize mermaid if theme changed
        if (currentTheme !== theme) {
          mermaid.initialize({
            startOnLoad: false,
            theme,
            fontFamily: 'var(--font-sans)',
            securityLevel: 'strict',
          });
          currentTheme = theme;
        }

        try {
          const { svg: renderedSvg } = await mermaid.render(
            `mermaid-${uniqueId}`,
            chart.trim()
          );

          // Sanitize SVG as defense-in-depth against XSS
          const sanitizedSvg = DOMPurify.sanitize(renderedSvg, {
            USE_PROFILES: { svg: true, svgFilters: true },
          });

          if (isMounted) {
            setSvg(sanitizedSvg);
            setError(null);
          }
        } catch (err) {
          if (isMounted) {
            console.error('Mermaid rendering error:', err);
            setError(
              err instanceof Error ? err.message : 'Failed to render diagram'
            );
            setSvg('');
          }
        }
      };

      renderDiagram();

      return () => {
        isMounted = false;
      };
    }, [chart, uniqueId, isDark]);

    if (error) {
      return (
        <div
          role="alert"
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
        role="img"
        aria-label="Mermaid diagram"
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
