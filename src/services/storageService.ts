const DB_NAME = 'npk_smart_vision';
const DB_VERSION = 1;

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains('scans')) {
        db.createObjectStore('scans', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('settings')) {
        db.createObjectStore('settings', { keyPath: 'key' });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function saveScanOffline(scan: any): Promise<void> {
  try {
    const db = await openDB();
    const tx = db.transaction('scans', 'readwrite');
    tx.objectStore('scans').put(scan);
    return new Promise((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch {
    // Fallback to localStorage
    const scans = JSON.parse(localStorage.getItem('npk_offline_scans') || '[]');
    scans.push(scan);
    localStorage.setItem('npk_offline_scans', JSON.stringify(scans));
  }
}

export async function getOfflineScans(): Promise<any[]> {
  try {
    const db = await openDB();
    const tx = db.transaction('scans', 'readonly');
    const request = tx.objectStore('scans').getAll();
    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  } catch {
    return JSON.parse(localStorage.getItem('npk_offline_scans') || '[]');
  }
}

export async function syncOfflineData(): Promise<number> {
  try {
    const offlineScans = await getOfflineScans();
    return offlineScans.length;
  } catch {
    return 0;
  }
}

export function isOnline(): boolean {
  return navigator.onLine;
}

export function onConnectivityChange(callback: (online: boolean) => void): () => void {
  const handler = () => callback(navigator.onLine);
  window.addEventListener('online', handler);
  window.addEventListener('offline', handler);
  return () => {
    window.removeEventListener('online', handler);
    window.removeEventListener('offline', handler);
  };
}
