import { UserSession } from '../types';

export interface ChatAttachment {
  type: 'audio' | 'image' | 'file';
  name: string;
  dataUrl: string; // Base64 representation of the file
  mimeType: string;
  size: number;
}

export interface ChatMessage {
  id: string;
  senderName: string;
  senderUsername: string;
  senderRole: 'admin' | 'user';
  timestamp: number;
  text: string;
  attachment?: ChatAttachment;
}

const DB_NAME = 'security_team_chat_db';
const STORE_NAME = 'messages';
const DB_VERSION = 1;

let dbInstance: IDBDatabase | null = null;

export const initDb = (): Promise<IDBDatabase> => {
  if (dbInstance) return Promise.resolve(dbInstance);

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = (event) => {
      console.error('IndexedDB open error:', event);
      reject(new Error('Não foi possível inicializar o banco de dados do chat.'));
    };

    request.onsuccess = (event) => {
      dbInstance = (event.target as IDBOpenDBRequest).result;
      resolve(dbInstance);
    };

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };
  });
};

export const saveChatMessage = async (message: ChatMessage): Promise<void> => {
  const db = await initDb();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.add(message);

    request.onsuccess = () => resolve();
    request.onerror = (event) => {
      console.error('IndexedDB save error:', event);
      reject(new Error('Falha ao salvar mensagem.'));
    };
  });
};

export const getAllChatMessages = async (): Promise<ChatMessage[]> => {
  const db = await initDb();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.getAll();

    request.onsuccess = () => {
      const results = request.result as ChatMessage[];
      // Sort by timestamp ascending
      results.sort((a, b) => a.timestamp - b.timestamp);
      resolve(results);
    };

    request.onerror = (event) => {
      console.error('IndexedDB getAll error:', event);
      reject(new Error('Falha ao carregar histórico de mensagens.'));
    };
  });
};

export const clearChatHistory = async (): Promise<void> => {
  const db = await initDb();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.clear();

    request.onsuccess = () => resolve();
    request.onerror = (event) => {
      console.error('IndexedDB clear error:', event);
      reject(new Error('Falha ao limpar histórico do chat.'));
    };
  });
};
