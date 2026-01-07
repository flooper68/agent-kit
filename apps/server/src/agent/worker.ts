import { randomUUID } from 'crypto';
import type { JobQueueManager } from './job-queue-manager';
import type { EventStreamManager } from './event-stream-manager';
import type { JobRegistryManager } from './job-registry-manager';
import type { StreamingStateManager } from './streaming-state-manager';
import type { PubSubManager, CacheInvalidationService } from '../real-time';
import type { AgentsFeature } from '../features/agents';
import type { ArtifactsFeature } from '../features/artifacts';
import type { ProjectsFeature } from '../features/projects';
import type { TasksFeature } from '../features/tasks';
import type { LocalAgentsFeature } from '../features/local-agents';
import type { AgentSpawner } from './agent-spawner';
import { AgentJobHandler } from './agent-job-handler';

// Maximum concurrent jobs per worker (configurable via environment variable)
const MAX_CONCURRENT_JOBS = parseInt(
  process.env.AGENT_WORKER_MAX_CONCURRENT ?? '10',
  10
);

/**
 * Agent Worker - consumes jobs from the queue and processes them
 * Each job is handled by a new AgentJobHandler instance
 */
export class AgentWorker {
  private jobQueueManager: JobQueueManager;
  private eventStreamManager: EventStreamManager;
  private jobRegistryManager: JobRegistryManager;
  private streamingStateManager: StreamingStateManager;
  private agentsFeature: AgentsFeature;
  private artifactsFeature: ArtifactsFeature;
  private projectsFeature?: ProjectsFeature;
  private tasksFeature?: TasksFeature;
  private localAgentsFeature?: LocalAgentsFeature;
  private agentSpawner?: AgentSpawner;
  private pubsub: PubSubManager;
  private cacheInvalidation: CacheInvalidationService;
  private workerId: string;
  private isRunning = false;

  constructor(
    jobQueueManager: JobQueueManager,
    eventStreamManager: EventStreamManager,
    jobRegistryManager: JobRegistryManager,
    streamingStateManager: StreamingStateManager,
    agentsFeature: AgentsFeature,
    artifactsFeature: ArtifactsFeature,
    pubsub: PubSubManager,
    cacheInvalidation: CacheInvalidationService,
    projectsFeature?: ProjectsFeature,
    tasksFeature?: TasksFeature,
    localAgentsFeature?: LocalAgentsFeature,
    agentSpawner?: AgentSpawner
  ) {
    this.jobQueueManager = jobQueueManager;
    this.eventStreamManager = eventStreamManager;
    this.jobRegistryManager = jobRegistryManager;
    this.streamingStateManager = streamingStateManager;
    this.agentsFeature = agentsFeature;
    this.artifactsFeature = artifactsFeature;
    this.pubsub = pubsub;
    this.cacheInvalidation = cacheInvalidation;
    this.projectsFeature = projectsFeature;
    this.tasksFeature = tasksFeature;
    this.localAgentsFeature = localAgentsFeature;
    this.agentSpawner = agentSpawner;
    this.workerId = `worker-${randomUUID().slice(0, 8)}`;
  }

  async start(): Promise<void> {
    if (this.isRunning) return;
    this.isRunning = true;

    console.log(`[AgentWorker ${this.workerId}] Starting worker...`);

    try {
      // Start consuming jobs concurrently with per-session locking
      // This allows spawned agents (different sessions) to run in parallel
      await this.jobQueueManager.consumeConcurrently(
        'agent-workers',
        this.workerId,
        async (job) => {
          console.log(
            `[AgentWorker ${this.workerId}] Received job: ${job.id} at ${Date.now()}`
          );
          const handler = new AgentJobHandler(
            this.eventStreamManager,
            this.jobRegistryManager,
            this.streamingStateManager,
            this.agentsFeature,
            this.artifactsFeature,
            this.pubsub,
            this.cacheInvalidation,
            this.workerId,
            this.projectsFeature,
            this.tasksFeature,
            this.localAgentsFeature,
            this.agentSpawner
          );
          await handler.handle(job);
        },
        { maxConcurrent: MAX_CONCURRENT_JOBS }
      );
    } catch (error) {
      console.error(`[AgentWorker ${this.workerId}] Worker error:`, error);
      throw error;
    }
  }

  stop(): void {
    this.isRunning = false;
    console.log(`Agent worker ${this.workerId} stopping...`);
  }
}
