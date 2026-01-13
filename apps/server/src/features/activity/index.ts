export { ActivityFeature } from './activity-feature';

export type { TimeRange } from './types';
export { DEFAULT_INACTIVITY_THRESHOLD_MINUTES } from './types';

export type {
  RecordHeartbeatInput,
  RecordHeartbeatResult,
  UpdateActivitySessionMetricsInput,
  UpdateActivitySessionMetricsResult,
} from './commands';

export type {
  GetActivitySessionsInput,
  GetActivitySessionsResult,
  ActivitySessionItem,
  GetActivitySessionStatsInput,
  GetActivitySessionStatsResult,
  ActivitySessionStats,
} from './queries';
