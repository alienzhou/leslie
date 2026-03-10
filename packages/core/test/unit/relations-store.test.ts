import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { RelationsStore } from '../../src/storage/relations-store.js';

describe('relations-store', () => {
  it('initializes and mutates data', async () => {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), 'leslie-relations-'));
    const filePath = path.join(root, '.leslie', 'thread_relations.json');
    const store = new RelationsStore({ relationsFilePath: filePath });
    await store.ensureFileExists();
    const before = await store.read();
    expect(before.version).toBe('1.0');

    const after = await store.mutate((data) => {
      data.threads['thread-a'] = {
        id: 'thread-a',
        title: 't',
        objective: 'obj-1',
        created_at: new Date().toISOString(),
        status: 'active',
        parent_id: null,
        storage_path: '.leslie/threads/thread-a',
        executor: 'agent',
        updated_at: new Date().toISOString(),
      };
      data.relations['thread-a'] = {
        children: [],
        references_to: [],
        referenced_by: [],
        depends_on: [],
      };
    });
    expect(after.metadata.thread_count).toBe(1);
  });

  it('recovers from backup when main file is corrupted', async () => {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), 'leslie-relations-'));
    const filePath = path.join(root, '.leslie', 'thread_relations.json');
    const backupPath = `${filePath}.bak`;
    const store = new RelationsStore({ relationsFilePath: filePath });
    await store.ensureFileExists();
    const content = await fs.readFile(filePath, 'utf-8');
    await fs.writeFile(backupPath, content, 'utf-8');
    await fs.writeFile(filePath, '{ bad json', 'utf-8');

    const recovered = await store.read();
    expect(recovered.version).toBe('1.0');
  });

  it('normalizes legacy pending status to active', async () => {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), 'leslie-relations-'));
    const filePath = path.join(root, '.leslie', 'thread_relations.json');
    const store = new RelationsStore({ relationsFilePath: filePath });
    await store.ensureFileExists();

    const now = new Date().toISOString();
    await fs.writeFile(
      filePath,
      `${JSON.stringify(
        {
          version: '1.0',
          metadata: {
            last_updated: now,
            thread_count: 1,
          },
          threads: {
            'thread-legacy': {
              id: 'thread-legacy',
              title: 'legacy',
              objective: 'obj-legacy',
              created_at: now,
              status: 'pending',
              parent_id: null,
              storage_path: '.leslie/threads/thread-legacy',
              executor: 'agent',
              updated_at: now,
            },
          },
          operations: [],
          relations: {
            'thread-legacy': {
              children: [],
              references_to: [],
              referenced_by: [],
              depends_on: [],
            },
          },
        },
        null,
        2,
      )}\n`,
      'utf-8',
    );

    const data = await store.read();
    expect(data.threads['thread-legacy']?.status).toBe('active');
  });
});
