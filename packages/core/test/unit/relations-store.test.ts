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
});
