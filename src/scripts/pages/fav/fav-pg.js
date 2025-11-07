import { idxDB } from '../../utils/idx-db.js';
import { offSync } from '../../utils/off-sync.js';

class FavPage {
    constructor() {
        this.element = null;
        this.items = [];
        this.filtItems = [];
        this.curFilt = {
            srch: '',
            sort: 'createdAt',
            order: 'desc',
            owner: ''
        };
        this.uniqOwners = [];
    }

    createView() {
        const section = document.createElement('section');
        section.className = 'pg fav-pg';
        
      
        section.innerHTML = `
            <div class="fav-page">
                <div class="page-hdr">
                    <h1> Cerita Favorit</h1>
                    <p>Kelola cerita yang Anda tandai sebagai fav</p>
                </div>

                <div class="sync-sts" id="syncSts"></div>

                <div class="fav-ctrl">
                    <div class="srch-box">
                        <input type="text" id="srchFav" placeholder="Cari cerita favoritmu" 
                               value="${this.curFilt.srch}">
                        <span class="srch-ico">🔍</span>
                    </div>

                    <div class="fltr-ctrl">
                        <select id="sortBy">
                            <option value="createdAt" ${this.curFilt.sort === 'createdAt' ? 'selected' : ''}>By Tanggal</option>
                            <option value="name" ${this.curFilt.sort === 'name' ? 'selected' : ''}>By Nama</option>
                        </select>

                        <select id="sortOrd">
                            <option value="desc" ${this.curFilt.order === 'desc' ? 'selected' : ''}>Terbaru</option>
                            <option value="asc" ${this.curFilt.order === 'asc' ? 'selected' : ''}>Terlama</option>
                        </select>

                        <select id="fltrOwn">
                            <option value="">All Penulis</option>
                            ${this.uniqOwners.map(owner => 
                                `<option value="${owner}" ${this.curFilt.owner === owner ? 'selected' : ''}>${owner}</option>`
                            ).join('')}
                        </select>
                    </div>
                </div>

                <div class="fav-list" id="favList">
                    <div class="loading">Loading fav...</div>
                </div>

                <div class="empty-st" id="emptySt" style="display: none;">
                    <div class="empty-ico">📚</div>
                    <h3>Belum ada cerita fav</h3>
                    <p>Tambahkan cerita ke fav untuk melihat di sini</p>
                </div>
            </div>
        `;

        this.element = section;
        return section;
    }

    async init() {
       
        if (!this.element) {
            this.createView();
        }
        await this.afterRender();
    }

    async afterRender() {
        await this.loadFav();
        this.setupEvt();
        this.setupSyncEvt();
    }

    async loadFav() {
        try {
            this.items = await idxDB.getFav(this.curFilt);
            this.uniqOwners = await idxDB.getUniqOwners();
            this.updateUI();
            this.updateSyncSts();
        } catch (error) {
            console.error('Error load fav:', error);
            this.showErr('Gagal load fav');
        }
    }

    updateUI() {
        if (!this.element) return;
        
        const favList = this.element.querySelector('#favList');
        const emptySt = this.element.querySelector('#emptySt');

        if (!favList || !emptySt) return;

        if (this.items.length === 0) {
            favList.innerHTML = '';
            emptySt.style.display = 'block';
            return;
        }

        emptySt.style.display = 'none';

        favList.innerHTML = this.items.map(story => `
            <div class="fav-item" data-id="${story.id}">
                <div class="item-img">
                    <img src="${story.photoUrl}" 
                         alt="${story.name || 'Story'}" 
                         onerror="this.src='/images/Logo.png'">
                    ${story.pendingSync ? '<span class="sync-bdg">⏳ Offline</span>' : ''}
                </div>
                
                <div class="item-cont">
                    <h3 class="item-title">${story.name || 'No Title'}</h3>
                    <p class="item-desc">${story.description || 'No desc'}</p>
                    
                    <div class="item-meta">
                        <span class="item-own">👤 ${story.owner?.name || 'Unknown'}</span>
                        <span class="item-date">📅 ${new Date(story.createdAt).toLocaleDateString('id-ID')}</span>
                    </div>
                </div>
                
                <div class="item-act">
                    <button class="btn-rmv" data-id="${story.id}" title="Hapus fav">
                        ❌
                    </button>
                </div>
            </div>
        `).join('');

        this.updateOwnFltr();
    }

    updateOwnFltr() {
        if (!this.element) return;
        
        const ownFltr = this.element.querySelector('#fltrOwn');
        if (!ownFltr) return;
        
        ownFltr.innerHTML = `
            <option value="">All Penulis</option>
            ${this.uniqOwners.map(owner => 
                `<option value="${owner}" ${this.curFilt.owner === owner ? 'selected' : ''}>${owner}</option>`
            ).join('')}
        `;
    }

    async updateSyncSts() {
        if (!this.element) return;
        
        const syncSts = this.element.querySelector('#syncSts');
        if (!syncSts) return;
        
        const sts = await offSync.getSyncSts();

        syncSts.innerHTML = `
            <div class="sync-sts-cont ${sts.isOnline ? 'on' : 'off'}">
                <span class="sts-ind"></span>
                <span class="sts-txt">
                    ${sts.isOnline ? '🟢 Online' : '🔴 Offline'} | 
                    ${sts.pendingSyncCount} pending |
                    ${sts.totalFav} favorit
                </span>
            </div>
        `;
    }

    setupEvt() {
        if (!this.element) return;

     
        const srchFav = this.element.querySelector('#srchFav');
        if (srchFav) {
            srchFav.addEventListener('input', (e) => {
                this.curFilt.srch = e.target.value;
                this.debLoadFav();
            });
        }

     
        const sortBy = this.element.querySelector('#sortBy');
        if (sortBy) {
            sortBy.addEventListener('change', (e) => {
                this.curFilt.sort = e.target.value;
                this.loadFav();
            });
        }

        const sortOrd = this.element.querySelector('#sortOrd');
        if (sortOrd) {
            sortOrd.addEventListener('change', (e) => {
                this.curFilt.order = e.target.value;
                this.loadFav();
            });
        }

     
        const fltrOwn = this.element.querySelector('#fltrOwn');
        if (fltrOwn) {
            fltrOwn.addEventListener('change', (e) => {
                this.curFilt.owner = e.target.value;
                this.loadFav();
            });
        }

      
        this.element.addEventListener('click', async (e) => {
            if (e.target.classList.contains('btn-rmv')) {
                const storyId = e.target.dataset.id;
                await this.rmvFav(storyId);
            }
        });
    }

    setupSyncEvt() {
        window.addEventListener('storySynced', (e) => {
            this.showMsg(`Sync success!`, 'success');
            this.loadFav();
        });

        window.addEventListener('syncCompleted', (e) => {
            this.showMsg(`All offline stories synced!`, 'success');
            this.loadFav();
        });

        window.addEventListener('storySavedOffline', (e) => {
            this.showMsg(`Saved offline, will sync later`, 'info');
        });
    }

    async rmvFav(storyId) {
        if (typeof Swal !== 'undefined') {
           
            const result = await Swal.fire({
                title: 'Hapus dari Favorit?',
                text: "Cerita akan dihapus dari daftar favorit Anda",
                icon: 'warning',
                showCancelButton: true,
                confirmButtonColor: '#EF4444',
                cancelButtonColor: '#64748b',
                confirmButtonText: 'Ya, Hapus',
                cancelButtonText: 'Batal'
              
            });
    
            if (result.isConfirmed) {
                try {
                    await idxDB.rmvFav(storyId);
                    this.showMsg('Berhasil dihapus dari favorit', 'success');
                    await this.loadFav();
                } catch (error) {
                    console.error('Error remove fav:', error);
                    this.showMsg('Gagal menghapus dari favorit', 'error');
                }
            }
        } else {
          
            if (confirm('Hapus dari fav?')) {
                try {
                    await idxDB.rmvFav(storyId);
                    this.showMsg('Deleted from fav', 'success');
                    await this.loadFav();
                } catch (error) {
                    console.error('Error remove fav:', error);
                    this.showMsg('Gagal hapus fav', 'error');
                }
            }
        }
    }
    
    showMsg(message, type = 'info') {
        if (typeof Swal !== 'undefined') {
            const Toast = Swal.mixin({
                toast: true,
                position: 'top-end',
                showConfirmButton: false,
                timer: 3000,
                timerProgressBar: true,
              
                didOpen: (toast) => {
                    toast.addEventListener('mouseenter', Swal.stopTimer);
                    toast.addEventListener('mouseleave', Swal.resumeTimer);
                }
            });
    
            Toast.fire({
                icon: type,
                title: message
            });
        } else {
            console.log(`${type}: ${message}`);
        }
    }

    showErr(message) {
        this.showMsg(message, 'error');
    }

    destroy() {
       
    }
}

export default FavPage;