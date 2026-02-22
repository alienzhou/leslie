import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { AgentsGuideManager } from '../../src/assets/agents-guide-manager.js';

const blockV1 = `<leslie_system_guide version="1.0.0" description="x">\nold\n</leslie_system_guide>`;
const blockV2 = `<leslie_system_guide version="1.1.0" description="x">\nnew\n</leslie_system_guide>`;
const blockV2Major = `<leslie_system_guide version="2.0.0" description="x">\nnew major\n</leslie_system_guide>`;

describe('agents-guide-manager', () => {
  const manager = new AgentsGuideManager();

  it('creates AGENTS.md when missing', async () => {
    const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'leslie-agents-'));
    const filePath = path.join(dir, 'AGENTS.md');
    const result = await manager.upsert({
      agentsFilePath: filePath,
      blockContent: blockV1,
      nextVersion: '1.0.0',
    });
    expect(result.status).toBe('created');
    const content = await fs.readFile(filePath, 'utf-8');
    expect(content).toContain('version="1.0.0"');
  });

  it('updates minor version automatically', async () => {
    const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'leslie-agents-'));
    const filePath = path.join(dir, 'AGENTS.md');
    await fs.writeFile(filePath, blockV1, 'utf-8');

    const result = await manager.upsert({
      agentsFilePath: filePath,
      blockContent: blockV2,
      nextVersion: '1.1.0',
    });
    expect(result.status).toBe('updated');
    const content = await fs.readFile(filePath, 'utf-8');
    expect(content).toContain('version="1.1.0"');
  });

  it('skips major update when user rejects', async () => {
    const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'leslie-agents-'));
    const filePath = path.join(dir, 'AGENTS.md');
    await fs.writeFile(filePath, blockV1, 'utf-8');

    const result = await manager.upsert({
      agentsFilePath: filePath,
      blockContent: blockV2Major,
      nextVersion: '2.0.0',
      confirmMajorUpdate: async () => false,
    });
    expect(result.status).toBe('skipped');
    const content = await fs.readFile(filePath, 'utf-8');
    expect(content).toContain('version="1.0.0"');
  });
});
