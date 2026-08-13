const DB_NAME = 'pdf_mcq_db_files';
const STORE_NAME = 'uploaded_pdfs';

export class PDFFileStore {
  private static dbPromise: Promise<IDBDatabase> | null = null;

  private static getDB(): Promise<IDBDatabase> {
    if (this.dbPromise) return this.dbPromise;

    this.dbPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, 1);
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        }
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = (err) => reject(err);
    });

    return this.dbPromise;
  }

  public static async savePDFFile(file: File): Promise<void> {
    try {
      const db = await this.getDB();
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const arrayBuffer = await file.arrayBuffer();
      const record = {
        id: 'active_pdf',
        name: file.name,
        type: file.type || 'application/pdf',
        lastModified: file.lastModified,
        data: arrayBuffer,
        savedAt: new Date().toISOString(),
      };
      store.put(record);
      await new Promise((res, rej) => {
        tx.oncomplete = res;
        tx.onerror = rej;
      });
    } catch (err) {
      console.warn('Failed to save PDF to IndexedDB', err);
    }
  }

  public static async getActivePDFFile(): Promise<File | null> {
    try {
      const db = await this.getDB();
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.get('active_pdf');
      const record = await new Promise<any>((res, rej) => {
        req.onsuccess = () => res(req.result);
        req.onerror = () => rej(req.error);
      });

      if (!record || !record.data) return null;
      const file = new File([record.data], record.name, {
        type: record.type || 'application/pdf',
        lastModified: record.lastModified || Date.now(),
      });
      return file;
    } catch (err) {
      console.warn('Failed to retrieve active PDF from IndexedDB', err);
      return null;
    }
  }

  public static async clearActivePDFFile(): Promise<void> {
    try {
      const db = await this.getDB();
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      store.delete('active_pdf');
    } catch (err) {
      console.warn('Failed to clear active PDF from IndexedDB', err);
    }
  }
}
