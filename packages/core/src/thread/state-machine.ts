import { LeslieError } from '../errors/cli-error.js';
import { ERROR_CODES } from '../errors/error-codes.js';
import type { LifecycleAction, ThreadStatus } from '../types/thread.js';

const transitionMap: Record<ThreadStatus, Partial<Record<LifecycleAction, ThreadStatus>>> = {
  active: {
    suspend: 'suspended',
    done: 'completed',
    cancel: 'cancelled',
  },
  suspended: {
    resume: 'active',
    done: 'completed',
    cancel: 'cancelled',
  },
  completed: {
    archive: 'archived',
  },
  cancelled: {
    archive: 'archived',
  },
  archived: {},
  frozen: {
    archive: 'archived',
  },
  waiting_human: {
    resume: 'active',
    cancel: 'cancelled',
  },
};

export function nextThreadStatus(current: ThreadStatus, action: LifecycleAction): ThreadStatus {
  const target = transitionMap[current]?.[action];
  if (!target) {
    throw new LeslieError(
      ERROR_CODES.INVALID_STATE_TRANSITION,
      `Invalid state transition from ${current} using action ${action}`,
      {
        from: current,
        action,
      },
    );
  }
  return target;
}
