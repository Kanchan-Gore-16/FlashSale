import Redis from 'ioredis';

export const redis = new Redis(process.env.REDIS_URL || 'redis://127.0.0.1:6379');

const DEFAULT_LOCK_TTL_MS = 5000;

// Simple Redis distributed lock
export async function withLock(lockKey, fn, ttlMs = DEFAULT_LOCK_TTL_MS) {
  const key = `lock:${lockKey}`;
  const token = `${Date.now()}-${Math.random()}`;

  const acquired = await redis.set(key, token, 'PX', ttlMs, 'NX');
  if (!acquired) {
    const err = new Error('LOCK_NOT_ACQUIRED');
    err.code = 'LOCK_NOT_ACQUIRED';
    throw err;
  }

  try {
    return await fn();
  } finally {
    const current = await redis.get(key);
    if (current === token) {
      await redis.del(key);
    }
  }
}
