import { randomUUID } from 'crypto';
import type { JobQueueManager } from './job-queue-manager';
import type { EventStreamManager } from '../shared/event-stream-manager';
import type { JobRegistryManager } from './job-registry-manager';
import type { StreamingStateManager } from './streaming-state-manager';
import type { PubSubManager, CacheInvalidationService } from '../../real-time';
import type { AgentsFeature } from '../../features/agents';
import type { ArtifactsFeature } from '../../features/artifacts';
import type { ProjectsFeature } from '../../features/projects';
import type { TasksFeature } from '../../features/tasks';
import type { SkillsFeature } from '../../features/skills';
import type { AgentSpawner } from '../shared/spawner';
import { AgentJobHandler } from './job-handler';

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
  private skillsFeature: SkillsFeature;
  private agentSpawner: AgentSpawner;
  private pubsub: PubSubManager;
  private cacheInvalidation: CacheInvalidationService;
  private projectsFeature?: ProjectsFeature;
  private tasksFeature?: TasksFeature;
  private workerId: string;
  private isRunning = false;

  constructor(
    jobQueueManager: JobQueueManager,
    eventStreamManager: EventStreamManager,
    jobRegistryManager: JobRegistryManager,
    streamingStateManager: StreamingStateManager,
    agentsFeature: AgentsFeature,
    artifactsFeature: ArtifactsFeature,
    skillsFeature: SkillsFeature,
    agentSpawner: AgentSpawner,
    pubsub: PubSubManager,
    cacheInvalidation: CacheInvalidationService,
    projectsFeature?: ProjectsFeature,
    tasksFeature?: TasksFeature
  ) {
    this.jobQueueManager = jobQueueManager;
    this.eventStreamManager = eventStreamManager;
    this.jobRegistryManager = jobRegistryManager;
    this.streamingStateManager = streamingStateManager;
    this.agentsFeature = agentsFeature;
    this.artifactsFeature = artifactsFeature;
    this.skillsFeature = skillsFeature;
    this.agentSpawner = agentSpawner;
    this.pubsub = pubsub;
    this.cacheInvalidation = cacheInvalidation;
    this.projectsFeature = projectsFeature;
    this.tasksFeature = tasksFeature;
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
            this.skillsFeature,
            this.agentSpawner,
            this.pubsub,
            this.cacheInvalidation,
            this.workerId,
            this.projectsFeature,
            this.tasksFeature
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
