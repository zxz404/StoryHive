const DB_NAME = 'StoryHiveDB';
const DB_VER = 1;
const STORE_NAME = 'favStories';

class IdxDB {
    constructor() {
        this.db = null;
        this.init();
    }

    async init() {
        return new Promise((resolve, reject) => {
            const req = indexedDB.open(DB_NAME, DB_VER);

            req.onerror = () => reject(req.error);
            req.onsuccess = () => {
                this.db = req.result;
                resolve(this.db);
            };

            req.onupgradeneeded = (e) => {
                const db = e.target.result;
                
                if (!db.objectStoreNames.contains(STORE_NAME)) {
                    const store = db.createObjectStore(STORE_NAME, { 
                        keyPath: 'id',
                        autoIncrement: false 
                    });
                    
                    store.createIndex('createdAt', 'createdAt', { unique: false });
                    store.createIndex('owner', 'owner.name', { unique: false });
                    store.createIndex('isSynced', 'isSynced', { unique: false });
                }
            };
        });
    }

    async addFav(story) {
        if (!this.db) await this.init();
        
        return new Promise((resolve, reject) => {
            const tx = this.db.transaction([STORE_NAME], 'readwrite');
            const store = tx.objectStore(STORE_NAME);
            
            const favStory = {
                ...story,
                id: story.id,
                isFav: true,
                createdAt: new Date().toISOString(),
                isSynced: true
            };

            const req = store.add(favStory);
            req.onsuccess = () => resolve(favStory);
            req.onerror = () => reject(req.error);
        });
    }

    async addOffStory(data, token) {
        if (!this.db) await this.init();
        
        return new Promise((resolve, reject) => {
            const tx = this.db.transaction([STORE_NAME], 'readwrite');
            const store = tx.objectStore(STORE_NAME);
            
            const offStory = {
                ...data,
                id: `off_${Date.now()}`,
                isFav: false,
                createdAt: new Date().toISOString(),
                isSynced: false,
                pendingSync: true,
                token: token,
                localData: data
            };

            const req = store.add(offStory);
            req.onsuccess = () => resolve(offStory);
            req.onerror = () => reject(req.error);
        });
    }

    async getAllFav() {
        if (!this.db) await this.init();
        
        return new Promise((resolve, reject) => {
            const tx = this.db.transaction([STORE_NAME], 'readonly');
            const store = tx.objectStore(STORE_NAME);
            const req = store.getAll();
            req.onsuccess = () => resolve(req.result);
            req.onerror = () => reject(req.error);
        });
    }

    async getFav({ 
        srch = '', 
        sort = 'createdAt', 
        order = 'desc',
        owner = '' 
    } = {}) {
        const all = await this.getAllFav();
        
        let filt = all.filter(s => s.isFav);

        if (srch) {
            const srchLow = srch.toLowerCase();
            filt = filt.filter(s => 
                s.name?.toLowerCase().includes(srchLow) ||
                s.description?.toLowerCase().includes(srchLow)
            );
        }

        if (owner) {
            filt = filt.filter(s => s.owner?.name === owner);
        }

        filt.sort((a, b) => {
            let aVal = a[sort];
            let bVal = b[sort];

            if (sort === 'createdAt') {
                aVal = new Date(aVal);
                bVal = new Date(bVal);
            }

            if (order === 'asc') {
                return aVal > bVal ? 1 : -1;
            } else {
                return aVal < bVal ? 1 : -1;
            }
        });

        return filt;
    }

    async getPendingSync() {
        const all = await this.getAllFav();
        return all.filter(s => s.pendingSync && !s.isSynced);
    }

    async rmvFav(storyId) {
        if (!this.db) await this.init();
        
        return new Promise((resolve, reject) => {
            const tx = this.db.transaction([STORE_NAME], 'readwrite');
            const store = tx.objectStore(STORE_NAME);
            const req = store.delete(storyId);
            req.onsuccess = () => resolve(storyId);
            req.onerror = () => reject(req.error);
        });
    }

    async markSynced(storyId) {
        if (!this.db) await this.init();
        
        return new Promise(async (resolve, reject) => {
            const tx = this.db.transaction([STORE_NAME], 'readwrite');
            const store = tx.objectStore(STORE_NAME);
            
            const getReq = store.get(storyId);
            
            getReq.onsuccess = () => {
                const s = getReq.result;
                if (s) {
                    s.isSynced = true;
                    s.pendingSync = false;
                    s.syncedAt = new Date().toISOString();
                    
                    const updReq = store.put(s);
                    updReq.onsuccess = () => resolve(s);
                    updReq.onerror = () => reject(updReq.error);
                } else {
                    reject(new Error('Story not found'));
                }
            };
            
            getReq.onerror = () => reject(getReq.error);
        });
    }

    async getUniqOwners() {
        const all = await this.getAllFav();
        const owners = all
            .filter(s => s.isFav && s.owner)
            .map(s => s.owner.name);
        
        return [...new Set(owners)];
    }

    async isFav(storyId) {
        if (!this.db) await this.init();
        
        return new Promise((resolve, reject) => {
            const tx = this.db.transaction([STORE_NAME], 'readonly');
            const store = tx.objectStore(STORE_NAME);
            const req = store.get(storyId);

            req.onsuccess = () => {
                const s = req.result;
                resolve(s && s.isFav);
            };
            req.onerror = () => reject(req.error);
        });
    }
}

export const idxDB = new IdxDB();