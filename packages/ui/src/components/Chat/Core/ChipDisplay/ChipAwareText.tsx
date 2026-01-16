import { memo, useMemo } from 'react';
import {
  parseMessageWithChips,
  hasChipMarkers,
} from '../../utils/slash-commands';
import { ChipInlineDisplay } from './ChipInlineDisplay';
import { MarkdownRenderer } from '../../CodeDisplay/MarkdownRenderer';

export interface ChipAwareTextProps {
  /** The message content that may contain chip markers */
  content: string;
  /** Whether to render non-chip text as markdown (default: true) */
  renderMarkdown?: boolean;
  /** Additional class names for the container */
  className?: string;
}

/**
 * ChipAwareText - Renders text content with inline chip displays.
 *
 * Parses chip markers from the content and renders them as inline chip
 * components, with the remaining text rendered normally or as markdown.
 *
 * Marker format: ««CHIP:key:name»»prompt text««/CHIP»»
 */
export const ChipAwareText = memo(function ChipAwareText({
  content,
  renderMarkdown = true,
  className,
}: ChipAwareTextProps) {
  const segments = useMemo(() => {
    if (!hasChipMarkers(content)) {
      return null; // No chips, render normally
    }
    return parseMessageWithChips(content);
  }, [content]);

  // No chip markers found - render content directly
  if (!segments) {
    if (renderMarkdown) {
      return <MarkdownRenderer content={content} />;
    }
    return <span className={className}>{content}</span>;
  }

  // Render segments with chips
  return (
    <div className={className}>
      {segments.map((segment, index) => {
        if (segment.type === 'chip') {
          return (
            <ChipInlineDisplay
              key={`chip-${index}`}
              commandKey={segment.key}
              name={segment.name}
              prompt={segment.prompt}
            />
          );
        }

        // Text segment - render as markdown or plain text
        const textContent = segment.content;

        // Skip empty or whitespace-only segments between chips
        if (!textContent.trim()) {
          // Preserve line breaks
          if (textContent.includes('\n')) {
            return <br key={`br-${index}`} />;
          }
          return null;
        }

        if (renderMarkdown) {
          return (
            <MarkdownRenderer key={`text-${index}`} content={textContent} />
          );
        }

        return <span key={`text-${index}`}>{textContent}</span>;
      })}
    </div>
  );
});

ChipAwareText.displayName = 'ChipAwareText';
