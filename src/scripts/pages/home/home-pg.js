import MapManager from '../../utils/map.js';
import StoryAPI from '../../data/api.js';

class HomePg {
    constructor() {
        this.element = this.createView();
        this.mapManager = null;
        this.stories = [];
        this.filteredStories = [];
        this.favStatus = {}; 
    }

    createView() {
        const section = document.createElement('section');
        section.className = 'pg home-pg';
        
        section.innerHTML = `
            <div class="home-cntnr">
                <section class="banner-sec" aria-labelledby="banner-title">
                    <div class="banner-cnt">
                        <h1 id="banner-title" class="banner-title">Temukan Cerita Menarik di Sekitar Anda</h1>
                        <p class="banner-desc">
                            Jelajahi pengalaman unik dan berbagi kisah inspiratif dari berbagai lokasi
                        </p>
                        <div class="banner-stats">
                            <div class="stat-item">
                                <span class="stat-num" id="stories-count" aria-live="polite">0</span>
                                <span class="stat-label">Cerita Dibagikan</span>
                            </div>
                            <div class="stat-item">
                                <span class="stat-num" id="locations-count" aria-live="polite">0</span>
                                <span class="stat-label">Lokasi Dijelajahi</span>
                            </div>
                        </div>
                    </div>
                    <div class="banner-img">
                        <div class="banner-overlay"></div>
                    </div>
                </section>

                <section class="stories-grid-sec" aria-labelledby="stories-section-title">
                    <div class="sec-hdr">
                        <h2 id="stories-section-title">Cerita Terbaru</h2>
                        <p id="stories-section-desc">Temukan inspirasi cerita di StoryHive</p>
                    </div>

                    <div class="srch-filter-bar">
                        <div class="srch-box">
                            <label for="search-input" class="srch-label is-visually-hidden">
                                Cari cerita berdasarkan judul atau deskripsi
                            </label>
                            <input 
                                type="text" 
                                id="search-input" 
                                name="search"
                                placeholder="Cari cerita berdasarkan judul atau deskripsi..." 
                                aria-label="Cari cerita berdasarkan judul atau deskripsi"
                                aria-describedby="search-help"
                            >
                            <span class="srch-icon" aria-hidden="true">🔍</span>
                        </div>
                        <div class="flt-ctrl">
                            <button id="filter-toggle" class="btn-filter" aria-expanded="false" aria-controls="filter-options">
                                <span>Filter & Urutkan</span>
                                <span class="filter-arrow" aria-hidden="true">▼</span>
                            </button>
                            <div class="flt-opts is-hidden" id="filter-options" role="menu">
                                <div class="flt-group">
                                    <label for="sort-select">Urutkan Berdasarkan:</label>
                                    <select id="sort-select" aria-describedby="sort-help">
                                        <option value="newest">Terbaru</option>
                                        <option value="oldest">Terlama</option>
                                        <option value="name">Nama A-Z</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="stories-grid-cntnr">
                        <div id="loading-indicator" class="is-loading" role="status" aria-live="polite">
                            <div class="loading-spinner" aria-hidden="true"></div>
                            <p>Memuat cerita...</p>
                        </div>
                        
                        <div id="error-message" class="error-msg is-hidden" role="alert" aria-live="assertive"></div>
                        
                        <div class="stories-grid" id="stories-grid" aria-live="polite">
                        </div>

                        <div class="no-s is-hidden" id="no-stories" role="status" aria-live="polite">
                            <div class="no-s-cnt">
                                <div class="no-s-icon" aria-hidden="true">📝</div>
                                <h3>Belum Ada Cerita</h3>
                                <p>Jadilah yang pertama membagikan pengalaman menarik Anda</p>
                                <a href="#/add-s" class="btn-primary" aria-label="Bagikan cerita pertama Anda">Bagikan Cerita Pertama</a>
                            </div>
                        </div>
                    </div>
                </section>

                <section class="map-full-sec" aria-labelledby="map-section-title">
                    <div class="sec-hdr">
                        <h2 id="map-section-title">Peta Lokasi Cerita</h2>
                        <p id="map-section-desc">Jelajahi cerita berdasarkan lokasi di peta interaktif</p>
                    </div>
                    
                    <div class="map-full-cntnr">
                        <div id="map" class="map-full" 
                             aria-label="Peta digital menampilkan lokasi cerita"
                             role="application"
                             tabindex="0">
                        </div>
                        <div class="map-ctrl">
                            <button id="locate-btn" class="map-btn" 
                                    aria-label="Gunakan lokasi saya saat ini" 
                                    title="Lokasi Saya">
                                📍
                            </button>
                            <button id="zoom-in-btn" class="map-btn" 
                                    aria-label="Perbesar peta" 
                                    title="Perbesar">
                                +
                            </button>
                            <button id="zoom-out-btn" class="map-btn" 
                                    aria-label="Perkecil peta" 
                                    title="Perkecil">
                                -
                            </button>
                        </div>
                        <div class="map-info">
                            <p>Klik pada marker di peta untuk melihat detail cerita</p>
                        </div>
                    </div>
                </section>
            </div>
        `;

        return section;
    }

    async init() {
        try {
            await this.loadStories();
            await this.initializeMap();
            this.setupEventHandlers();
            this.updateStats();
        } catch (error) {
            await this.handleLoadError(error);
        }
    }

    async initializeMap() {
        await new Promise(resolve => setTimeout(resolve, 100));
        this.mapManager = new MapManager('map', {
            center: [-6.2088, 106.8456],
            zoom: 10
        });
        this.setupMapControls();
        
        this.filteredStories.forEach(story => {
            if (story.lat && story.lon) {
                this.mapManager.addMarker(story, {
                    onClick: (clickedStory) => {
                        this.navigateToStoryDetail(clickedStory.id);
                    }
                });
            }
        });
    }

    setupMapControls() {
        const locateBtn = this.element.querySelector('#locate-btn');
        const zoomInBtn = this.element.querySelector('#zoom-in-btn');
        const zoomOutBtn = this.element.querySelector('#zoom-out-btn');

        locateBtn.addEventListener('click', () => {
            if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(
                    (position) => {
                        const { latitude, longitude } = position.coords;
                        this.mapManager.setView(latitude, longitude, 15);
                    },
                    (error) => {
                        this.showAlert('Error', 'Tidak dapat mengakses lokasi Anda.');
                    }
                );
            }
        });

        zoomInBtn.addEventListener('click', () => {
            this.mapManager.map.zoomIn();
        });

        zoomOutBtn.addEventListener('click', () => {
            this.mapManager.map.zoomOut();
        });
    }

    async loadStories() {
        this.showLoading();

        try {
            this.stories = await StoryAPI.getStories();
            this.filteredStories = [...this.stories];
            
         
            await this.loadAllFavStatus();
            
            this.displayStories();
        } catch (error) {
            await this.handleLoadError(error);
        }
    }

    async loadAllFavStatus() {
        this.favStatus = {};
        for (const story of this.stories) {
            try {
                this.favStatus[story.id] = await this.isStoryFav(story.id);
            } catch (error) {
                console.error(`Error loading fav status for ${story.id}:`, error);
                this.favStatus[story.id] = false;
            }
        }
    }

    updateStats() {
        const storiesCount = this.element.querySelector('#stories-count');
        const locationsCount = this.element.querySelector('#locations-count');
        
        if (storiesCount) {
            storiesCount.textContent = this.stories.length;
        }
        
        if (locationsCount) {
            const uniqueLocations = new Set(
                this.stories
                    .filter(story => story.lat && story.lon)
                    .map(story => `${story.lat},${story.lon}`)
            ).size;
            locationsCount.textContent = uniqueLocations;
        }
    }

    async handleLoadError(error) {
        let errorMessage = 'Gagal memuat cerita. ';
        
        if (error.message.includes('network') || !navigator.onLine) {
            errorMessage = 'Koneksi internet bermasalah. Silakan periksa koneksi Anda.';
        } else if (error.message.includes('token') || error.message.includes('auth')) {
            errorMessage = 'Sesi Anda telah berakhir. Silakan login kembali.';
            setTimeout(() => {
                window.location.hash = '#/auth';
            }, 2000);
        } else {
            errorMessage = error.message || 'Terjadi kesalahan yang tidak diketahui.';
        }
        
        this.showError(errorMessage);
        await this.showAlert('Gagal Memuat Cerita', errorMessage, 'error');
    }

    showError(message) {
        const loadingIndicator = this.element.querySelector('#loading-indicator');
        const storiesGrid = this.element.querySelector('#stories-grid');
        const errorMessage = this.element.querySelector('#error-message');

        loadingIndicator.classList.add('is-hidden');
        storiesGrid.innerHTML = '';
        errorMessage.textContent = message;
        errorMessage.classList.remove('is-hidden');
    }

    showLoading() {
        const loadingIndicator = this.element.querySelector('#loading-indicator');
        const storiesGrid = this.element.querySelector('#stories-grid');
        const errorMessage = this.element.querySelector('#error-message');
        const noStories = this.element.querySelector('#no-stories');

        loadingIndicator.classList.remove('is-hidden');
        storiesGrid.innerHTML = '';
        errorMessage.classList.add('is-hidden');
        noStories.classList.add('is-hidden');
    }

    async showAlert(title, message, icon = 'error') {
        if (typeof Swal !== 'undefined') {
            try {
                await Swal.fire({
                    icon: icon,
                    title: title,
                    text: message,
                    confirmButtonText: 'OK',
                    confirmButtonColor: icon === 'error' ? '#dc2626' : '#2563eb'
                });
            } catch (swalError) {
                alert(`${title}: ${message}`);
            }
        } else {
            alert(`${title}: ${message}`);
        }
    }

    displayStories() {
        const storiesGrid = this.element.querySelector('#stories-grid');
        const loadingIndicator = this.element.querySelector('#loading-indicator');
        const errorMessage = this.element.querySelector('#error-message');
        const noStories = this.element.querySelector('#no-stories');

        loadingIndicator.classList.add('is-hidden');
        errorMessage.classList.add('is-hidden');

        if (this.filteredStories.length === 0) {
            storiesGrid.innerHTML = '';
            noStories.classList.remove('is-hidden');
            return;
        }

        noStories.classList.add('is-hidden');

        storiesGrid.innerHTML = this.filteredStories.map(story => {
            const isFav = this.favStatus[story.id] || false;
            return `
            <article class="s-card" data-story-id="${story.id}" aria-labelledby="story-title-${story.id}">
                <div class="s-img">
                    <img 
                        src="${story.photoUrl}" 
                        alt="${story.description}" 
                        loading="lazy"
                    >
                    <div class="s-overlay">
                        <button class="btn-detail" data-story-id="${story.id}" aria-label="Lihat detail cerita ${story.name}">
                            Lihat Detail
                        </button>
                        <button class="btn-fav ${isFav ? 'is-fav' : ''}" 
                                data-story-id="${story.id}"
                                aria-label="${isFav ? 'Hapus dari favorit' : 'Tambah ke favorit'}">
                            ${isFav ? '❤️' : '🤍'}
                        </button>
                    </div>
                </div>
                <div class="s-cnt">
                    <h3 id="story-title-${story.id}" class="s-title">${story.name}</h3>
                    <p class="s-desc">${this.truncateDescription(story.description)}</p>
                    <div class="s-meta">
                        <span class="s-date">
                            ${new Date(story.createdAt).toLocaleDateString('id-ID', {
                                day: 'numeric',
                                month: 'long',
                                year: 'numeric'
                            })}
                        </span>
                        ${story.lat && story.lon ? `
                            <button class="btn-location" data-story-id="${story.id}" 
                                    aria-label="Lihat lokasi cerita ${story.name} di peta" 
                                    title="Lihat di peta">
                                📍
                            </button>
                        ` : ''}
                    </div>
                </div>
            </article>
            `;
        }).join('');
    }

    truncateDescription(description) {
        return description.length > 120 
            ? description.substring(0, 120) + '...' 
            : description;
    }

    setupEventHandlers() {
        this.element.addEventListener('click', async (event) => {
            const viewDetailBtn = event.target.closest('.btn-detail');
            if (viewDetailBtn) {
                const storyId = viewDetailBtn.dataset.storyId;
                this.navigateToStoryDetail(storyId);
                return;
            }

            const favBtn = event.target.closest('.btn-fav');
            if (favBtn) {
                const storyId = favBtn.dataset.storyId;
                await this.toggleFav(storyId);
                return;
            }

            const locationBtn = event.target.closest('.btn-location');
            if (locationBtn) {
                const storyId = locationBtn.dataset.storyId;
                this.focusOnStoryMap(storyId);
                return;
            }

            const storyCard = event.target.closest('.s-card');
            if (storyCard && !event.target.closest('.btn-detail') && 
                !event.target.closest('.btn-fav') && !event.target.closest('.btn-location')) {
                const storyId = storyCard.dataset.storyId;
                this.navigateToStoryDetail(storyId);
            }
        });

        const searchInput = this.element.querySelector('#search-input');
        let timeoutId;
        searchInput.addEventListener('input', (event) => {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => {
                this.handleSearch(event.target.value);
            }, 300);
        });

        const filterToggle = this.element.querySelector('#filter-toggle');
        const filterOptions = this.element.querySelector('#filter-options');
        filterToggle.addEventListener('click', () => {
            const isExpanded = filterToggle.getAttribute('aria-expanded') === 'true';
            filterToggle.setAttribute('aria-expanded', !isExpanded);
            filterOptions.classList.toggle('is-hidden');
        });

        const sortSelect = this.element.querySelector('#sort-select');
        sortSelect.addEventListener('change', (event) => {
            this.handleSort(event.target.value);
        });

        document.addEventListener('click', (event) => {
            if (!event.target.closest('.flt-ctrl')) {
                filterOptions.classList.add('is-hidden');
                filterToggle.setAttribute('aria-expanded', 'false');
            }
        });
    }

    async isStoryFav(storyId) {
        try {
            if (typeof app !== 'undefined' && typeof app.isStoryFav === 'function') {
                return await app.isStoryFav(storyId);
            }
            return false;
        } catch (error) {
            console.error('Error checking fav status:', error);
            return false;
        }
    }

    async toggleFav(storyId) {
        try {
            const story = this.filteredStories.find(s => s.id === storyId);
            if (!story) return;

            const isFav = this.favStatus[storyId] || false;
            
            if (isFav) {
                await app.removeFromFav(storyId);
                this.favStatus[storyId] = false;
            } else {
                await app.addToFav(story);
                this.favStatus[storyId] = true;
            }
            
            this.updateFavButton(storyId, !isFav);
        } catch (error) {
            console.error('Error toggling favorite:', error);
            this.showAlert('Error', 'Gagal mengubah status favorit', 'error');
        }
    }

    updateFavButton(storyId, isFav) {
        const favBtn = this.element.querySelector(`.btn-fav[data-story-id="${storyId}"]`);
        if (favBtn) {
            favBtn.classList.toggle('is-fav', isFav);
            favBtn.innerHTML = isFav ? '❤️' : '🤍';
            favBtn.setAttribute('aria-label', isFav ? 'Hapus dari favorit' : 'Tambah ke favorit');
        }
    }

    navigateToStoryDetail(storyId) {
        if (!StoryAPI.isLoggedIn()) {
            if (typeof Swal !== 'undefined') {
                Swal.fire({
                    icon: 'warning',
                    title: 'Login Diperlukan',
                    text: 'Anda harus login terlebih dahulu untuk melihat detail cerita.',
                    confirmButtonText: 'Login',
                    confirmButtonColor: '#2563eb',
                    showCancelButton: true,
                    cancelButtonText: 'Batal'
                }).then((result) => {
                    if (result.isConfirmed) {
                        window.location.hash = '#/auth';
                    }
                });
            } else {
                if (confirm('Anda harus login terlebih dahulu untuk melihat detail cerita. Login sekarang?')) {
                    window.location.hash = '#/auth';
                }
            }
            return;
        }

        window.location.hash = `#/s/${storyId}`;
    }

    focusOnStoryMap(storyId) {
        const story = this.filteredStories.find(s => s.id === storyId);
        if (story && story.lat && story.lon && this.mapManager) {
            this.mapManager.setView(story.lat, story.lon, 15);
            this.mapManager.setActiveMarker(storyId);
            
            const mapSection = this.element.querySelector('.map-full-sec');
            mapSection.scrollIntoView({ behavior: 'smooth' });
        }
    }

    handleSearch(searchTerm) {
        if (!searchTerm.trim()) {
            this.filteredStories = [...this.stories];
        } else {
            const term = searchTerm.toLowerCase();
            this.filteredStories = this.stories.filter(story =>
                story.name.toLowerCase().includes(term) ||
                story.description.toLowerCase().includes(term)
            );
        }
        this.displayStories();
        this.updateMapMarkers();
    }

    handleSort(sortType) {
        this.filteredStories.sort((a, b) => {
            switch (sortType) {
                case 'newest':
                    return new Date(b.createdAt) - new Date(a.createdAt);
                case 'oldest':
                    return new Date(a.createdAt) - new Date(b.createdAt);
                case 'name':
                    return a.name.localeCompare(b.name);
                default:
                    return 0;
            }
        });
        this.displayStories();
    }

    updateMapMarkers() {
        if (this.mapManager) {
            this.mapManager.clearMarkers();
            this.filteredStories.forEach(story => {
                if (story.lat && story.lon) {
                    this.mapManager.addMarker(story, {
                        onClick: (clickedStory) => {
                            this.navigateToStoryDetail(clickedStory.id);
                        }
                    });
                }
            });
        }
    }

    destroy() {
        if (this.mapManager) {
            this.mapManager.destroy();
            this.mapManager = null;
        }
    }
}

export { HomePg };