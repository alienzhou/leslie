import { LeslieError } from '../../src/errors/cli-error.js';
import { nextThreadStatus } from '../../src/thread/state-machine.js';

describe('state-machine', () => {
  it('supports active -> suspended -> active', () => {
    const suspended = nextThreadStatus('active', 'suspend');
    expect(suspended).toBe('suspended');
    const resumed = nextThreadStatus(suspended, 'resume');
    expect(resumed).toBe('active');
  });

  it('supports done then archive', () => {
    const completed = nextThreadStatus('active', 'done');
    expect(completed).toBe('completed');
    expect(nextThreadStatus(completed, 'archive')).toBe('archived');
  });

  it('throws on invalid transition', () => {
    expect(() => nextThreadStatus('completed', 'resume')).toThrow(LeslieError);
  });
});
