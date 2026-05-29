import { Injectable } from '@angular/core';
import { AuditReport } from '../models/audit.model';

const DB_NAME = 'devaudit_pro_db';
const DB_VERSION = 1;
const STORE = 'audit_reports';

/**
 * IndexedDB wrapper for audit history persistence.
 * Supports gigabytes of storage vs the 5 MB localStorage cap.
 * IndexedDB stores Date objects natively — no serialisation needed.
 */
@Injectable({ providedIn: 'root' })
export class IndexedDbService {
  private dbPromise: Promise<IDBDatabase> | null = null;

  // ── Open / create DB ────────────────────────────────────────────────────────

  private open(): Promise<IDBDatabase> {
    if (this.dbPromise) return this.dbPromise;

    this.dbPromise = new Promise<IDBDatabase>((resolve, reject) => {
      const req = indexedDB.open(DB_NAME, DB_VERSION);

      req.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(STORE)) {
          const store = db.createObjectStore(STORE, { keyPath: 'id' });
          // Index by completedAt so we can fetch newest-first efficiently
          store.createIndex('completedAt', 'completedAt', { unique: false });
        }
      };

      req.onsuccess = () => resolve(req.result);
      req.onerror  = () => { this.dbPromise = null; reject(req.error); };
    });

    return this.dbPromise;
  }

  // ── Public API ──────────────────────────────────────────────────────────────

  async save(report: AuditReport): Promise<void> {
    const db = await this.open();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE, 'readwrite');
      tx.objectStore(STORE).put(report);
      tx.oncomplete = () => resolve();
      tx.onerror    = () => reject(tx.error);
    });
  }

  async getAll(): Promise<AuditReport[]> {
    const db = await this.open();
    return new Promise((resolve, reject) => {
      const tx      = db.transaction(STORE, 'readonly');
      const request = tx.objectStore(STORE).index('completedAt').getAll();
      request.onsuccess = () => {
        // Reverse so newest is first
        resolve((request.result as AuditReport[]).reverse());
      };
      request.onerror = () => reject(request.error);
    });
  }

  async get(id: string): Promise<AuditReport | null> {
    const db = await this.open();
    return new Promise((resolve, reject) => {
      const request = db.transaction(STORE, 'readonly')
                        .objectStore(STORE)
                        .get(id);
      request.onsuccess = () => resolve((request.result as AuditReport) ?? null);
      request.onerror   = () => reject(request.error);
    });
  }

  async delete(id: string): Promise<void> {
    const db = await this.open();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE, 'readwrite');
      tx.objectStore(STORE).delete(id);
      tx.oncomplete = () => resolve();
      tx.onerror    = () => reject(tx.error);
    });
  }

  async clearAll(): Promise<void> {
    const db = await this.open();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE, 'readwrite');
      tx.objectStore(STORE).clear();
      tx.oncomplete = () => resolve();
      tx.onerror    = () => reject(tx.error);
    });
  }

  /** Returns total size estimate in bytes by summing JSON-stringified entries */
  async estimateSize(): Promise<number> {
    const all = await this.getAll();
    return new Blob([JSON.stringify(all)]).size;
  }
}
