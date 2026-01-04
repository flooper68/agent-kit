export type TimeRange = 'today' | 'week' | 'month' | 'all';

export interface CreateArtifactInput {
  userId: string;
  orgId: string;
  title: string;
  content: string;
  format?: 'markdown';
  sessionId?: string;
  agentId?: string;
  summary?: string;
}

export interface ListArtifactsInput {
  userId: string;
  orgId: string;
  limit: number;
  cursor?: string;
  search?: string;
}

export interface SearchArtifactsInput {
  userId: string;
  orgId: string;
  query: string;
  limit: number;
  offset: number;
}

export interface SearchArtifactsResult {
  results: ArtifactListItem[];
  totalCount: number;
}

export interface ArtifactListItem {
  id: string;
  title: string;
  summary: string | null;
  format: string;
  sizeBytes: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface PaginatedArtifacts {
  items: ArtifactListItem[];
  nextCursor: string | undefined;
}

export interface ArtifactStats {
  totalCount: number;
  totalSizeBytes: number;
}

export interface ArtifactsByAgent {
  agentId: string | null;
  agentName: string;
  count: number;
}

export interface ArtifactsOverTimePoint {
  date: string;
  count: number;
  sizeBytes: number;
}
