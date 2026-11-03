import AsyncStorage from '@react-native-async-storage/async-storage';

import { SUPPORTED_LANGUAGES, type SupportedLanguage } from '../config/constants';
import { DEMO_DAY_COUNT } from '../domain/demo/acceleratedDemo';

export const DEMO_SESSION_STORAGE_KEY = 'partner-cycle:accelerated-demo-session:v1';

export interface AcceleratedDemoSession {
  version: 1;
  runId: string;
  startedAt: number;
  language: SupportedLanguage;
  notificationIds: string[];
}

export interface DemoSessionStore {
  read(): Promise<AcceleratedDemoSession | null>;
  write(session: AcceleratedDemoSession): Promise<void>;
  clear(): Promise<void>;
}

interface DemoKeyValueStorage {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
  removeItem(key: string): Promise<void>;
}

function parseSession(value: unknown): AcceleratedDemoSession | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const session = value as Partial<AcceleratedDemoSession>;
  if (
    session.version !== 1 ||
    typeof session.runId !== 'string' ||
    !/^[a-zA-Z0-9_-]{1,120}$/.test(session.runId) ||
    typeof session.startedAt !== 'number' ||
    !Number.isSafeInteger(session.startedAt) ||
    session.startedAt < 0 ||
    !Number.isFinite(new Date(session.startedAt).getTime()) ||
    !SUPPORTED_LANGUAGES.includes(session.language as SupportedLanguage) ||
    !Array.isArray(session.notificationIds) ||
    session.notificationIds.length > DEMO_DAY_COUNT - 1 ||
    !session.notificationIds.every((id) => typeof id === 'string' && id.length > 0 && id.length <= 200) ||
    new Set(session.notificationIds).size !== session.notificationIds.length
  ) return null;
  return {
    version: 1,
    runId: session.runId,
    startedAt: session.startedAt,
    language: session.language as SupportedLanguage,
    notificationIds: [...session.notificationIds],
  };
}

/** Only the demo key is read or changed; no cycle preferences or selection history. */
export class AcceleratedDemoStore implements DemoSessionStore {
  constructor(private readonly storage: DemoKeyValueStorage = AsyncStorage) {}

  async read(): Promise<AcceleratedDemoSession | null> {
    const saved = await this.storage.getItem(DEMO_SESSION_STORAGE_KEY);
    if (!saved) return null;
    try {
      return parseSession(JSON.parse(saved) as unknown);
    } catch {
      return null;
    }
  }

  async write(session: AcceleratedDemoSession): Promise<void> {
    const safeSession = parseSession(session);
    if (!safeSession) throw new Error('DEMO_SESSION_INVALID');
    await this.storage.setItem(DEMO_SESSION_STORAGE_KEY, JSON.stringify(safeSession));
  }

  async clear(): Promise<void> {
    await this.storage.removeItem(DEMO_SESSION_STORAGE_KEY);
  }
}
