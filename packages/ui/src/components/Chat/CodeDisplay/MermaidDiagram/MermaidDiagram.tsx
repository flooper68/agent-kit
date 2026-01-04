import { memo, useEffect, useRef, useState, useId } from 'react';
import mermaid from 'mermaid';
import { cn } from '../../../../lib/utils';
import { useTheme } from '../../../../theme';
import { CodeBlock } from '../CodeBlock';

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
      // Skip rendering if chart is empty
      if (!chart) {
        setError('Empty diagram');
        return;
      }
      let isMounted = true;

      const renderDiagram = async () => {
        if (!containerRef.current) return;

        const theme = isDark ? 'dark' : 'default';

        // Only reinitialize mermaid if theme changed
        if (currentTheme !== theme) {
          mermaid.initialize({
            startOnLoad: false,
            theme,
            fontFamily: 'inherit',
            securityLevel: 'strict', // 'strict' can cause text rendering issues
          });
          currentTheme = theme;
        }

        const renderId = `mermaid-${uniqueId}`;

        try {
          const { svg: renderedSvg } = await mermaid.render(renderId, chart);

          if (isMounted) {
            setSvg(renderedSvg);
            setError(null);
          }
        } catch (err) {
          console.error('Mermaid error:', err);
          if (isMounted) {
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
      // Fallback to syntax-highlighted code block when mermaid parsing fails
      return (
        <CodeBlock language="mermaid" isDark={isDark}>
          {chart}
        </CodeBlock>
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
