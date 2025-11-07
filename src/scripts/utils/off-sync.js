import { idxDB } from './idx-db.js';

class OffSync {
    constructor() {
        this.isOn = navigator.onLine;
        this.setupEvt();
    }

    setupEvt() {
        window.addEventListener('online', () => {
            this.isOn = true;
            this.syncPending();
            this.showOnMsg();
        });

        window.addEventListener('offline', () => {
            this.isOn = false;
            this.showOffMsg();
        });
    }

    async syncPending() {
        if (!this.isOn) return;

        try {
            const pending = await idxDB.getPendingSync();
            console.log(`Syncing ${pending.length} stories...`);

            for (const story of pending) {
                try {
                    const formData = new FormData();
                    formData.append('description', story.localData.description);
                    
                    if (story.localData.photo) {
                        formData.append('photo', story.localData.photo);
                    }

                    const res = await fetch('https://story-api.dicoding.dev/v1/stories', {
                        method: 'POST',
                        headers: {
                            'Authorization': `Bearer ${story.token}`
                        },
                        body: formData
                    });

                    if (res.ok) {
                        await idxDB.markSynced(story.id);
                        console.log(`Synced: ${story.id}`);
                        this.dispatchEvt('storySynced', story);
                    }
                } catch (error) {
                    console.error(`Sync error ${story.id}:`, error);
                }
            }

            if (pending.length > 0) {
                this.dispatchEvt('syncDone', { 
                    count: pending.length 
                });
            }
        } catch (error) {
            console.error('Sync error:', error);
        }
    }

    async createOff(data, token) {
        if (this.isOn) {
            return await this.createOn(data, token);
        } else {
            const offStory = await idxDB.addOffStory(data, token);
            
            if ('serviceWorker' in navigator && 'SyncManager' in window) {
                const reg = await navigator.serviceWorker.ready;
                await reg.sync.register('sync-off-stories');
            }
            
            this.dispatchEvt('storySavedOff', offStory);
            return offStory;
        }
    }

    async createOn(data, token) {
        const formData = new FormData();
        formData.append('description', data.description);
        
        if (data.photo) {
            formData.append('photo', data.photo);
        }

        const res = await fetch('https://story-api.dicoding.dev/v1/stories', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
            },
            body: formData
        });

        if (!res.ok) throw new Error('Create failed');
        return await res.json();
    }

    dispatchEvt(evtName, detail) {
        const evt = new CustomEvent(evtName, { detail });
        window.dispatchEvent(evt);
    }

    showOnMsg() {
        if (typeof app !== 'undefined' && app.showMsg) {
            app.showMsg('Online!', 'success');
        }
    }

    showOffMsg() {
        if (typeof app !== 'undefined' && app.showMsg) {
            app.showMsg('Offline. Saved local.', 'warning');
        }
    }

    async getSyncSts() {
        const pending = await idxDB.getPendingSync();
        const all = await idxDB.getAllFav();
        
        return {
            isOnline: this.isOn,
            pendingSyncCount: pending.length,
            totalFav: all.filter(f => f.isFav).length,
            totalStories: all.length
        };
    }
}

export const offSync = new OffSync();