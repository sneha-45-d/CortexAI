import redis from "../redis/redis.js";

const inMemoryMemory = new Map();
const MAX_MEMORY_ITEMS = 12;

const normalizeUserId = (userId) => String(userId || "anonymous");

const readRedisMemory = async (userId) => {
  try {
    const value = await redis.get(`memory:${userId}`);
    if (!value) return [];
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const writeRedisMemory = async (userId, entries) => {
  try {
    await redis.set(`memory:${userId}`, JSON.stringify(entries));
  } catch {
    // Ignore storage failures and keep in-memory fallback active.
  }
};

export const getUserMemory = async (userId) => {
  const normalizedUserId = normalizeUserId(userId);

  const redisEntries = await readRedisMemory(normalizedUserId);
  if (redisEntries.length > 0) {
    inMemoryMemory.set(normalizedUserId, redisEntries);
    return redisEntries;
  }

  const existing = inMemoryMemory.get(normalizedUserId) || [];
  return existing;
};

export const addUserMemory = async (userId, text) => {
  const normalizedUserId = normalizeUserId(userId);
  const cleanedText = String(text ?? "").trim();

  if (!cleanedText) {
    return [];
  }

  const current = await getUserMemory(normalizedUserId);
  const next = [...current, {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    text: cleanedText,
    createdAt: new Date().toISOString(),
  }].slice(-MAX_MEMORY_ITEMS);

  inMemoryMemory.set(normalizedUserId, next);
  await writeRedisMemory(normalizedUserId, next);

  return next;
};

export const buildMemoryContext = async (userId) => {
  const memoryEntries = await getUserMemory(userId);
  if (!memoryEntries.length) {
    return "";
  }

  const lines = memoryEntries
    .slice(-6)
    .map((entry) => `- ${entry.text}`)
    .join("\n");

  return `User memory:\n${lines}`;
};
