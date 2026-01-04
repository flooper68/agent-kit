import { Layers } from 'lucide-react';
import { IconButton } from '../../IconButton';
import { Tooltip } from '../../Tooltip';

export interface SessionResourcesCounts {
  artifactCount: number;
  websiteCount: number;
  previewTitles: string[];
}

export interface SessionResourcesButtonProps {
  counts: SessionResourcesCounts;
  onClick: () => void;
}

export function SessionResourcesButton({
  counts,
  onClick,
}: SessionResourcesButtonProps) {
  const { artifactCount, websiteCount, previewTitles } = counts;
  const total = artifactCount + websiteCount;

  if (total === 0) return null;

  // Build tooltip content
  const countParts: string[] = [];
  if (artifactCount > 0) {
    countParts.push(
      `${artifactCount} artifact${artifactCount !== 1 ? 's' : ''}`
    );
  }
  if (websiteCount > 0) {
    countParts.push(`${websiteCount} website${websiteCount !== 1 ? 's' : ''}`);
  }

  const countText = countParts.join(', ');
  const previewText =
    previewTitles.length > 0
      ? ` \u2022 ${previewTitles.slice(0, 2).join(', ')}${previewTitles.length > 2 ? '...' : ''}`
      : '';

  const tooltipContent = `${countText}${previewText}`;

  return (
    <Tooltip content={tooltipContent} side="top">
      <IconButton
        icon={<Layers className="h-4 w-4" />}
        label="Session resources"
        size="sm"
        onClick={onClick}
      />
    </Tooltip>
  );
}

SessionResourcesButton.displayName = 'SessionResourcesButton';
