/**
 * Offline Storage with IndexedDB and Encryption
 * Stores exam answers locally when network is unavailable
 */

import CryptoJS from 'crypto-js';

const DB_NAME = 'ExamOfflineDB';
const DB_VERSION = 1;
const STORE_NAME = 'examAnswers';
const ENCRYPTION_KEY = 'exam-offline-storage-key'; // In production, derive from user token

interface ExamAnswer {
  examId: string;
  questionId: string;
  answer: any;
  timestamp: number;
  synced: boolean;
}

let db: IDBDatabase | null = null;

// Initialize IndexedDB
export const initOfflineStorage = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      console.error('Failed to open IndexedDB');
      reject(new Error('Failed to initialize offline storage'));
    };

    request.onsuccess = () => {
      db = request.result;
      resolve();
    };

    request.onupgradeneeded = (event) => {
      const database = (event.target as IDBOpenDBRequest).result;
      
      if (!database.objectStoreNames.contains(STORE_NAME)) {
        const objectStore = database.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true });
        objectStore.createIndex('examId', 'examId', { unique: false });
        objectStore.createIndex('synced', 'synced', { unique: false });
        objectStore.createIndex('timestamp', 'timestamp', { unique: false });
      }
    };
  });
};

// Encrypt data
const encrypt = (data: any): string => {
  return CryptoJS.AES.encrypt(JSON.stringify(data), ENCRYPTION_KEY).toString();
};

// Decrypt data
const decrypt = (encryptedData: string): any => {
  const bytes = CryptoJS.AES.decrypt(encryptedData, ENCRYPTION_KEY);
  return JSON.parse(bytes.toString(CryptoJS.enc.Utf8));
};

// Save answer offline
export const saveAnswerOffline = async (examId: string, questionId: string, answer: any): Promise<void> => {
  if (!db) {
    await initOfflineStorage();
  }

  return new Promise((resolve, reject) => {
    if (!db) {
      reject(new Error('Database not initialized'));
      return;
    }

    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    
    // Check if answer already exists for this question
    const index = store.index('examId');
    const request = index.openCursor(IDBKeyRange.only(examId));

    request.onsuccess = (event) => {
      const cursor = (event.target as IDBRequest).result;
      let found = false;

      if (cursor) {
        const existing = cursor.value;
        if (existing.questionId === questionId) {
          // Update existing answer
          const encrypted = encrypt(answer);
          const updated: ExamAnswer = {
            ...existing,
            answer: encrypted,
            timestamp: Date.now(),
            synced: false,
          };
          cursor.update(updated);
          found = true;
        }
        cursor.continue();
      }

      if (!found) {
        // Add new answer
        const encrypted = encrypt(answer);
        const newAnswer: ExamAnswer = {
          examId,
          questionId,
          answer: encrypted,
          timestamp: Date.now(),
          synced: false,
        };
        store.add(newAnswer);
      }

      resolve();
    };

    request.onerror = () => {
      reject(new Error('Failed to save answer offline'));
    };
  });
};

// Get all unsynced answers for an exam
export const getUnsyncedAnswers = async (examId: string): Promise<Array<{ questionId: string; answer: any }>> => {
  if (!db) {
    await initOfflineStorage();
  }

  return new Promise((resolve, reject) => {
    if (!db) {
      reject(new Error('Database not initialized'));
      return;
    }

    const transaction = db.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const index = store.index('examId');
    const request = index.getAll(examId);

    request.onsuccess = () => {
      const answers = request.result
        .filter((item: ExamAnswer) => !item.synced)
        .map((item: ExamAnswer) => ({
          questionId: item.questionId,
          answer: decrypt(item.answer),
        }));
      resolve(answers);
    };

    request.onerror = () => {
      reject(new Error('Failed to get unsynced answers'));
    };
  });
};

// Mark answers as synced
export const markAsSynced = async (examId: string, questionIds: string[]): Promise<void> => {
  if (!db) {
    await initOfflineStorage();
  }

  return new Promise((resolve, reject) => {
    if (!db) {
      reject(new Error('Database not initialized'));
      return;
    }

    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const index = store.index('examId');
    const request = index.openCursor(IDBKeyRange.only(examId));

    request.onsuccess = (event) => {
      const cursor = (event.target as IDBRequest).result;
      if (cursor) {
        const item = cursor.value;
        if (questionIds.includes(item.questionId)) {
          item.synced = true;
          cursor.update(item);
        }
        cursor.continue();
      } else {
        resolve();
      }
    };

    request.onerror = () => {
      reject(new Error('Failed to mark answers as synced'));
    };
  });
};

// Clear all offline data for an exam
export const clearOfflineData = async (examId: string): Promise<void> => {
  if (!db) {
    await initOfflineStorage();
  }

  return new Promise((resolve, reject) => {
    if (!db) {
      reject(new Error('Database not initialized'));
      return;
    }

    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const index = store.index('examId');
    const request = index.openKeyCursor(IDBKeyRange.only(examId));

    request.onsuccess = (event) => {
      const cursor = (event.target as IDBRequest).result;
      if (cursor) {
        store.delete(cursor.primaryKey);
        cursor.continue();
      } else {
        resolve();
      }
    };

    request.onerror = () => {
      reject(new Error('Failed to clear offline data'));
    };
  });
};

// Network status monitoring
export const setupNetworkMonitoring = (
  onOnline: () => void,
  onOffline: () => void
) => {
  window.addEventListener('online', () => {
    console.log('Network reconnected');
    onOnline();
  });

  window.addEventListener('offline', () => {
    console.log('Network disconnected');
    onOffline();
  });
};

// Sync all unsynced answers
export const syncOfflineAnswers = async (
  examId: string,
  syncFunction: (questionId: string, answer: any) => Promise<void>
): Promise<void> => {
  if (!navigator.onLine) {
    console.log('Network offline, cannot sync');
    return;
  }

  try {
    const unsynced = await getUnsyncedAnswers(examId);
    
    for (const item of unsynced) {
      try {
        await syncFunction(item.questionId, item.answer);
        await markAsSynced(examId, [item.questionId]);
      } catch (error) {
        console.error('Failed to sync answer:', error);
        // Continue with other answers
      }
    }

    console.log(`Synced ${unsynced.length} offline answers`);
  } catch (error) {
    console.error('Failed to sync offline answers:', error);
  }
};



