import path from 'node:path';
import { AgentsGuideManager } from './assets/agents-guide-manager.js';
import { AssetManager } from './assets/asset-manager.js';
import { ThreadContextBuilder } from './assets/context-builder.js';
import { TranscriptWriter, type TranscriptPayload } from './assets/transcript-writer.js';
import { createLogger } from './logging/logger.js';
import { ObjectiveManager } from './objective/objective-manager.js';
import { ObjectivesStore } from './storage/objectives-store.js';
import { RelationsStore } from './storage/relations-store.js';
import { MergeManager, type MergeInput } from './thread/merge-manager.js';
import {
  ReferenceManager,
  type CreateReferenceInput,
} from './thread/reference-manager.js';
import { ThreadManager, type LifecycleResult } from './thread/thread-manager.js';
import { TransferManager, type TransferInput } from './thread/transfer-manager.js';
import type { SpawnInput, SpawnResult, ThreadInfo } from './types/thread.js';
import { buildPaths } from './utils/path.js';
import type { Warning } from './types/cli-response.js';
import { withRetry } from './utils/retry.js';

export interface LeslieCoreOptions {
  workspaceRoot: string;
  debugMode?: boolean;
}

export class LeslieCore {
  private readonly paths: ReturnType<typeof buildPaths>;

  private readonly relationsStore: RelationsStore;

  private readonly objectivesStore: ObjectivesStore;

  private readonly assetManager: AssetManager;

  private readonly objectiveManager: ObjectiveManager;

  private readonly referenceManager: ReferenceManager;

  private readonly threadManager: ThreadManager;

  private readonly mergeManager: MergeManager;

  private readonly transferManager: TransferManager;

  private readonly contextBuilder: ThreadContextBuilder;

  private readonly agentsGuideManager: AgentsGuideManager;

  private readonly transcriptWriter: TranscriptWriter;

  public constructor(private readonly options: LeslieCoreOptions) {
    this.paths = buildPaths(options.workspaceRoot);
    this.relationsStore = new RelationsStore({
      relationsFilePath: this.paths.relationsFile,
    });
    this.objectivesStore = new ObjectivesStore(this.paths.objectivesFile);
    this.assetManager = new AssetManager(this.paths);
    this.objectiveManager = new ObjectiveManager(this.objectivesStore, this.relationsStore);
    this.referenceManager = new ReferenceManager(this.relationsStore, this.assetManager);
    this.threadManager = new ThreadManager(
      this.relationsStore,
      this.objectiveManager,
      this.assetManager,
      this.referenceManager,
    );
    this.mergeManager = new MergeManager(this.relationsStore, this.assetManager);
    this.transferManager = new TransferManager(this.relationsStore);
    this.contextBuilder = new ThreadContextBuilder(this.relationsStore, this.assetManager);
    this.agentsGuideManager = new AgentsGuideManager();
    this.transcriptWriter = new TranscriptWriter((threadId) => this.assetManager.threadDir(threadId));
  }

  public async initProject(): Promise<void> {
    await this.assetManager.ensureBaseDirs();
    await this.relationsStore.ensureFileExists();
    await this.objectivesStore.initIfMissing();
  }

  public async createObjective(title: string): Promise<{ objectiveId: string; title: string }> {
    const objective = await withRetry(() => this.objectiveManager.create(title), {
      retryableCodes: [],
    });
    const logger = await createLogger({
      objectiveId: objective.id,
      debugMode: this.options.debugMode,
    });
    await logger.info('Objective created', { objectiveId: objective.id, title: objective.title });
    return {
      objectiveId: objective.id,
      title: objective.title,
    };
  }

  public async listObjectives() {
    return this.objectiveManager.list();
  }

  public async getObjective(id: string) {
    return this.objectiveManager.get(id);
  }

  public async spawnThread(input: SpawnInput): Promise<{ result: SpawnResult; warnings: Warning[] }> {
    return this.threadManager.spawn(input);
  }

  public async createReference(input: CreateReferenceInput) {
    return this.referenceManager.createReference(input);
  }

  public async lifecycle(
    threadId: string,
    action: 'done' | 'archive' | 'cancel' | 'suspend' | 'resume',
    reason?: string,
  ): Promise<LifecycleResult> {
    return this.threadManager.lifecycle(threadId, action, reason);
  }

  public async listThreads(status?: string): Promise<ThreadInfo[]> {
    return this.threadManager.listThreads(status);
  }

  public async getThread(threadId: string): Promise<ThreadInfo> {
    return this.threadManager.getThread(threadId);
  }

  public async listArtifacts(threadId: string) {
    return this.threadManager.listArtifacts(threadId);
  }

  public async transfer(input: TransferInput) {
    return this.transferManager.transfer(input);
  }

  public async inject(threadId: string, type: string, content: string) {
    return this.threadManager.inject(threadId, type, content);
  }

  public async merge(input: MergeInput) {
    return this.mergeManager.merge(input);
  }

  public async buildThreadContext(threadId: string) {
    return this.contextBuilder.build(threadId);
  }

  public async upsertAgentsGuide(
    agentsFilePath: string,
    blockContent: string,
    version: string,
    confirmMajorUpdate?: (fromVersion: string, toVersion: string) => Promise<boolean>,
  ) {
    return this.agentsGuideManager.upsert({
      agentsFilePath,
      blockContent,
      nextVersion: version,
      confirmMajorUpdate,
    });
  }

  public async writeTranscript(payload: TranscriptPayload): Promise<string> {
    return this.transcriptWriter.write(payload);
  }

  public relationsFilePath(): string {
    return path.posix.join('.leslie', 'thread_relations.json');
  }
}
