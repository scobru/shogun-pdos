/**
 * storage.js - Shared Local Storage Manager with Cloud Sync
 * Uses IndexedDB for local storage + GunDB for cloud sync.
 */

const DB_NAME = 'shogun-db';
const STORE_NAME = 'files';
const DB_VERSION = 1;
const CHUNK_SIZE = 50 * 1024; // 50KB chunks for GunDB
const MAX_SYNC_SIZE = 50 * 1024 * 1024; // 50MB max for sync

class LocalStore {
    constructor() {
        this.db = null;
        this.gun = null;
        this.user = null;
        this.syncEnabled = false;
        this.onSyncUpdate = null; // Callback for UI updates
        this.onProgress = null; // Callback for progress updates
        this.syncQueue = []; // Queue of files being synced
        this.currentSync = null; // Current sync status
    }

    async init() {
        if (this.db) return;
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(DB_NAME, DB_VERSION);

            request.onupgradeneeded = (e) => {
                const db = e.target.result;
                if (!db.objectStoreNames.contains(STORE_NAME)) {
                    db.createObjectStore(STORE_NAME, { keyPath: 'id' });
                }
            };

            request.onsuccess = (e) => {
                this.db = e.target.result;
                resolve(this.db);
            };

            request.onerror = (e) => {
                reject("DB Error: " + e.target.error);
            };
        });
    }

    // --- GunDB Integration ---
    initGun(gunInstance, userInstance) {
        this.gun = gunInstance;
        this.user = userInstance;
    }

    isLoggedIn() {
        return this.user && this.user.is;
    }

    enableSync(callback, progressCallback = null) {
        if (!this.isLoggedIn()) return false;
        this.syncEnabled = true;
        this.onSyncUpdate = callback;
        this.onProgress = progressCallback;
        this._listenForRemote();
        return true;
    }

    disableSync() {
        this.syncEnabled = false;
        // Note: Gun listeners can't be easily removed, but we just ignore updates
    }

    // Get current sync status for UI
    getSyncStatus() {
        return this.currentSync;
    }

    // Report progress to UI
    _reportProgress(fileName, current, total, phase = 'uploading') {
        this.currentSync = {
            fileName,
            current,
            total,
            phase,
            percent: Math.round((current / total) * 100)
        };
        if (this.onProgress) {
            this.onProgress(this.currentSync);
        }
    }

    _listenForRemote() {
        if (!this.isLoggedIn()) return;
        
        this.user.get('drive').get('index').map().on(async (data, id) => {
            if (!data || !this.syncEnabled) return;
            
            // Check if we already have this file locally
            const existing = await this.get(id);
            if (existing) return; // Already have it
            
            console.log('[SYNC] New remote file detected:', id);
            
            // Fetch and decrypt
            try {
                const fileMeta = await this._fetchFileMeta(id);
                if (!fileMeta) return;
                
                const blob = await this._fetchAndDecryptChunks(id, fileMeta.chunkCount);
                if (!blob) return;
                
                // Save locally
                await this._saveLocal({
                    id: id,
                    name: fileMeta.name,
                    type: fileMeta.type,
                    mime: fileMeta.mime,
                    data: blob,
                    date: fileMeta.date,
                    size: blob.size,
                    synced: true
                });
                
                if (this.onSyncUpdate) this.onSyncUpdate('download', fileMeta.name);
            } catch (e) {
                console.error('[SYNC] Error fetching remote file:', e);
            }
        });
    }

    async _fetchFileMeta(id) {
        return new Promise((resolve) => {
            this.user.get('drive').get('index').get(id).once(async (data) => {
                if (!data) return resolve(null);
                try {
                    const pair = this.user._.sea;
                    const decrypted = await SEA.decrypt(data._enc, pair);
                    resolve(decrypted);
                } catch (e) {
                    resolve(null);
                }
            });
        });
    }

    async _fetchAndDecryptChunks(id, chunkCount) {
        const pair = this.user._.sea;
        const chunks = [];
        
        for (let i = 0; i < chunkCount; i++) {
            const chunkData = await new Promise((resolve) => {
                this.user.get('drive').get('chunks').get(id).get(String(i)).once((data) => {
                    resolve(data);
                });
            });
            
            if (!chunkData) return null;
            
            const decrypted = await SEA.decrypt(chunkData, pair);
            if (!decrypted) return null;
            
            // Convert base64 back to array
            const binary = atob(decrypted);
            const bytes = new Uint8Array(binary.length);
            for (let j = 0; j < binary.length; j++) {
                bytes[j] = binary.charCodeAt(j);
            }
            chunks.push(bytes);
        }
        
        // Combine chunks into blob
        return new Blob(chunks);
    }

    // --- Core Methods ---
    async save(fileData, type, customName = null) {
        await this.init();
        const id = Date.now().toString(36) + Math.random().toString(36).substr(2);
        const entry = {
            id: id,
            name: customName || fileData.name || 'Untitled',
            type: type,
            mime: fileData.type,
            data: fileData,
            date: Date.now(),
            size: fileData.size,
            synced: false
        };

        await this._saveLocal(entry);
        console.log('[STORE] Saved locally:', entry.name, 'syncEnabled:', this.syncEnabled, 'size:', fileData.size);

        // Auto-sync if enabled and under size limit
        if (this.syncEnabled && fileData.size <= MAX_SYNC_SIZE) {
            console.log('[STORE] Auto-syncing:', entry.name);
            const result = await this.syncToCloud(id);
            return { id, syncResult: result };
        } else if (this.syncEnabled && fileData.size > MAX_SYNC_SIZE) {
            const maxMB = Math.round(MAX_SYNC_SIZE / 1024 / 1024);
            const fileMB = (fileData.size / 1024 / 1024).toFixed(1);
            console.log('[STORE] File too large for sync:', entry.name, `(${fileMB}MB > ${maxMB}MB limit)`);
            if (this.onSyncUpdate) {
                this.onSyncUpdate('error', entry.name, `File troppo grande per il cloud (${fileMB}MB). Limite: ${maxMB}MB`);
            }
            return { id, syncResult: { success: false, error: 'file_too_large', message: `File troppo grande (${fileMB}MB > ${maxMB}MB)` } };
        } else if (!this.syncEnabled) {
            console.log('[STORE] Sync disabled, not syncing');
        }

        return { id, syncResult: null };
    }

    async _saveLocal(entry) {
        return new Promise((resolve, reject) => {
            const tx = this.db.transaction([STORE_NAME], 'readwrite');
            const store = tx.objectStore(STORE_NAME);
            const req = store.put(entry); // Use put to allow updates
            req.onsuccess = () => resolve(entry.id);
            req.onerror = (e) => reject(e.target.error);
        });
    }

    async syncToCloud(id) {
        if (!this.isLoggedIn()) {
            console.log('[SYNC] Not logged in, skipping sync');
            return { success: false, error: 'not_logged_in' };
        }
        
        const file = await this.get(id);
        if (!file) {
            console.log('[SYNC] File not found:', id);
            return { success: false, error: 'file_not_found' };
        }
        if (file.size > MAX_SYNC_SIZE) {
            const maxMB = Math.round(MAX_SYNC_SIZE / 1024 / 1024);
            const fileMB = (file.size / 1024 / 1024).toFixed(1);
            console.log('[SYNC] File too large:', file.name, `(${fileMB}MB > ${maxMB}MB limit)`);
            return { success: false, error: 'file_too_large', message: `File troppo grande (${fileMB}MB > ${maxMB}MB)` };
        }
        
        console.log('[SYNC] Starting sync for:', file.name);
        this._reportProgress(file.name, 0, 100, 'preparing');
        
        try {
            const pair = this.user._.sea;
            if (!pair) {
                console.log('[SYNC] No SEA pair found');
                return { success: false, error: 'no_keypair' };
            }
            
            // Chunk the blob
            const chunks = await this._chunkBlob(file.data);
            console.log('[SYNC] Created', chunks.length, 'chunks');
            const totalChunks = chunks.length;
            
            this._reportProgress(file.name, 0, totalChunks, 'uploading');
            
            // Encrypt and upload each chunk sequentially for progress tracking
            let uploadedCount = 0;
            for (let i = 0; i < chunks.length; i++) {
                const base64 = btoa(String.fromCharCode(...chunks[i]));
                const encrypted = await SEA.encrypt(base64, pair);
                
                // Upload chunk with promise
                await new Promise((resolve, reject) => {
                    this.user.get('drive').get('chunks').get(id).get(String(i)).put(encrypted, (ack) => {
                        if (ack.err) {
                            console.error('[SYNC] Chunk error:', ack.err);
                            reject(new Error(ack.err));
                        } else {
                            uploadedCount++;
                            this._reportProgress(file.name, uploadedCount, totalChunks, 'uploading');
                            resolve();
                        }
                    });
                });
            }
            
            console.log('[SYNC] All chunks uploaded');
            
            // Store metadata
            const meta = {
                name: file.name,
                type: file.type,
                mime: file.mime,
                date: file.date,
                size: file.size,
                chunkCount: chunks.length
            };
            const encryptedMeta = await SEA.encrypt(meta, pair);
            
            // Wait for meta upload
            await new Promise((resolve) => {
                this.user.get('drive').get('index').get(id).put({ _enc: encryptedMeta }, (ack) => {
                    if (ack.err) console.error('[SYNC] Meta error:', ack.err);
                    resolve();
                });
            });
            
            console.log('[SYNC] Metadata uploaded for:', file.name);
            
            // Mark as synced locally
            file.synced = true;
            await this._saveLocal(file);
            
            if (this.onSyncUpdate) this.onSyncUpdate('upload', file.name);
            this._reportProgress(file.name, 100, 100, 'complete');
            this.currentSync = null;
            
            console.log('[SYNC] Complete:', file.name);
            return { success: true };
        } catch (e) {
            console.error('[SYNC] Error syncing:', e);
            this._reportProgress(file.name, 0, 100, 'error');
            this.currentSync = null;
            if (this.onSyncUpdate) {
                this.onSyncUpdate('error', file.name, e.message || 'Errore durante il caricamento');
            }
            return { success: false, error: 'sync_error', message: e.message };
        }
    }

    async _chunkBlob(blob) {
        const buffer = await blob.arrayBuffer();
        const bytes = new Uint8Array(buffer);
        const chunks = [];
        
        for (let i = 0; i < bytes.length; i += CHUNK_SIZE) {
            chunks.push(bytes.slice(i, i + CHUNK_SIZE));
        }
        
        return chunks;
    }

    async getAll(typeFilter = null) {
        await this.init();
        return new Promise((resolve, reject) => {
            const tx = this.db.transaction([STORE_NAME], 'readonly');
            const store = tx.objectStore(STORE_NAME);
            const req = store.getAll();

            req.onsuccess = () => {
                let results = req.result;
                if (typeFilter) {
                    results = results.filter(item => item.type === typeFilter);
                }
                results.sort((a, b) => b.date - a.date);
                resolve(results);
            };
            req.onerror = (e) => reject(e.target.error);
        });
    }

    async get(id) {
        await this.init();
        return new Promise((resolve, reject) => {
            const tx = this.db.transaction([STORE_NAME], 'readonly');
            const store = tx.objectStore(STORE_NAME);
            const req = store.get(id);
            req.onsuccess = () => resolve(req.result);
            req.onerror = (e) => reject(e.target.error);
        });
    }

    async delete(id) {
        await this.init();
        
        // Also remove from cloud if logged in
        if (this.isLoggedIn()) {
            this.user.get('drive').get('index').get(id).put(null);
            // Note: Chunks are orphaned but Gun will eventually GC them
        }
        
        return new Promise((resolve, reject) => {
            const tx = this.db.transaction([STORE_NAME], 'readwrite');
            const store = tx.objectStore(STORE_NAME);
            const req = store.delete(id);
            req.onsuccess = () => resolve();
            req.onerror = (e) => reject(e.target.error);
        });
    }

    async syncAllToCloud() {
        if (!this.isLoggedIn()) return 0;
        
        const files = await this.getAll();
        let count = 0;
        
        for (const file of files) {
            if (!file.synced && file.size <= MAX_SYNC_SIZE) {
                await this.syncToCloud(file.id);
                count++;
            }
        }
        
        return count;
    }
}

// Global instance
const store = new LocalStore();
