import { WARNING_CODES } from '../errors/error-codes.js';
import { warning } from '../errors/warning.js';
import type { Warning } from '../types/cli-response.js';
import { AssetManager } from './asset-manager.js';
import { RelationsStore } from '../storage/relations-store.js';

function xmlEscape(input: string): string {
  return input
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;');
}

export interface BuildThreadContextResult {
  xml: string;
  warnings: Warning[];
}

export class ThreadContextBuilder {
  public constructor(
    private readonly relationsStore: RelationsStore,
    private readonly assetManager: AssetManager,
  ) {}

  public async build(threadId: string): Promise<BuildThreadContextResult> {
    const relationsData = await this.relationsStore.read();
    const thread = relationsData.threads[threadId];
    if (!thread) {
      return {
        xml: '',
        warnings: [],
      };
    }

    const ownAssets = await this.assetManager.listAssets(threadId);
    const refs = relationsData.relations[threadId]?.references_to ?? [];
    const warnings: Warning[] = [];
    const refXmlBlocks: string[] = [];

    for (const refThreadId of refs) {
      if (!relationsData.threads[refThreadId]) {
        warnings.push(
          warning(
            WARNING_CODES.REFERENCE_TARGET_UNAVAILABLE,
            `Referenced thread '${refThreadId}' not found`,
            { target: refThreadId },
          ),
        );
        continue;
      }
      const assets = await this.assetManager.listAssets(refThreadId);
      const content = assets
        .map((asset) => `    <asset type="${asset.type}" path="${xmlEscape(asset.path)}" />`)
        .join('\n');
      refXmlBlocks.push(`  <ref thread="${xmlEscape(refThreadId)}">\n${content}\n  </ref>`);
    }

    const ownAssetXml = ownAssets
      .map((asset) => `  <asset type="${asset.type}" path="${xmlEscape(asset.path)}" />`)
      .join('\n');

    const refsXml = refXmlBlocks.length > 0 ? `\n${refXmlBlocks.join('\n')}` : '';
    const xml = `<thread_context thread="${xmlEscape(thread.id)}" objective="${xmlEscape(thread.objective)}" relations_file=".leslie/thread_relations.json">\n${ownAssetXml}${refsXml}\n</thread_context>`;

    return {
      xml,
      warnings,
    };
  }
}
