// IndexedDB 存储工具（用于存储大图片数据）
// localStorage 只有 5-10MB 限制，IndexedDB 通常有 50MB+ 限制

const DB_NAME = 'TaoranDB';
const DB_VERSION = 1;
const STORE_NAME = 'images';

// 检查是否在客户端环境
const isClient = typeof window !== 'undefined' && typeof indexedDB !== 'undefined';

// 打开数据库
const openDB = (): Promise<IDBDatabase> => {
  if (!isClient) {
    return Promise.reject(new Error('IndexedDB 仅在浏览器环境中可用'));
  }
  
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'key' });
      }
    };
  });
};

// 保存图片数据
export const saveImageToDB = async (key: string, imageData: string): Promise<void> => {
  try {
    const db = await openDB();
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    
    return new Promise((resolve, reject) => {
      const request = store.put({ key, data: imageData, timestamp: Date.now() });
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error('保存图片到IndexedDB失败:', error);
    // 降级到 localStorage
    localStorage.setItem(key, imageData);
  }
};

// 获取图片数据
export const getImageFromDB = async (key: string): Promise<string | null> => {
  try {
    const db = await openDB();
    const transaction = db.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    
    return new Promise((resolve, reject) => {
      const request = store.get(key);
      request.onsuccess = () => {
        const result = request.result;
        resolve(result ? result.data : null);
      };
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error('从IndexedDB获取图片失败:', error);
    // 降级到 localStorage
    return localStorage.getItem(key);
  }
};

// 删除图片数据
export const removeImageFromDB = async (key: string): Promise<void> => {
  try {
    const db = await openDB();
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    
    return new Promise((resolve, reject) => {
      const request = store.delete(key);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error('从IndexedDB删除图片失败:', error);
    localStorage.removeItem(key);
  }
};

// 获取存储使用情况（包括 localStorage 和 IndexedDB）
export const getStorageUsage = async (): Promise<{ used: number; total: number; details: Record<string, number> }> => {
  const details: Record<string, number> = {};
  let used = 0;
  
  // 计算 localStorage 使用
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key) {
        const value = localStorage.getItem(key) || '';
        const size = value.length * 2; // UTF-16
        details[`localStorage.${key}`] = size;
        used += size;
      }
    }
  } catch (error) {
    console.error('计算 localStorage 使用失败:', error);
  }
  
  // 计算 IndexedDB 使用
  try {
    const db = await openDB();
    const transaction = db.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    
    const idbItems = await new Promise<Array<{ key: string; data: string }>>((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    
    idbItems.forEach((item) => {
      const size = item.data.length * 2;
      details[`indexedDB.${item.key}`] = size;
      used += size;
    });
  } catch (error) {
    console.error('计算 IndexedDB 使用失败:', error);
  }
  
  // 估算总容量（华为平板 Chrome 通常 50-100MB）
  const total = 50 * 1024 * 1024; // 50MB
  
  return { used, total, details };
};

// 格式化存储大小
export const formatStorageSize = (bytes: number): string => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// 清理所有存储数据
export const clearAllStorage = async (): Promise<void> => {
  // 清理 localStorage
  localStorage.clear();
  
  // 清理 IndexedDB
  try {
    const db = await openDB();
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    await new Promise<void>((resolve, reject) => {
      const request = store.clear();
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error('清理 IndexedDB 失败:', error);
  }
};
