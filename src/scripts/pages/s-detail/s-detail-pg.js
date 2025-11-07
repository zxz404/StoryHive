import StoryAPI from '../../data/api.js';

class SDetailPg {
    constructor() {
        this.element = this.createView();
        this.map = null;
        this.currentStoryId = null;
        this.currentStory = null;
        this.allStories = [];
        this.currentIndex = -1;
    }

    createView() {
        const section = document.createElement('section');
        section.className = 'pg s-detail-pg';
        
        section.innerHTML = `
            <div class="s-detail-cntnr">
                <nav class="breadcrumb" aria-label="Breadcrumb">
                    <a href="#/home" class="btn-back" aria-label="Kembali ke beranda">
                        ← Kembali ke Beranda
                    </a>
                </nav>

                <div id="loading-indicator" class="is-loading" role="status" aria-live="polite">
                    Memuat detail cerita...
                </div>

                <div id="error-message" class="error-msg is-hidden" role="alert"></div>

                <article id="story-content" class="s-cnt is-hidden" aria-labelledby="s-title">
                    <header class="s-hdr">
                        <div class="s-meta">
                            <h1 id="s-title" class="s-title">Judul Cerita</h1>
                            <div class="author-info">
                                <span class="author-name" id="author-name">Nama Penulis</span>
                                <span class="publish-date" id="publish-date">Tanggal Publikasi</span>
                            </div>
                        </div>
                        <div class="s-actions">
                            <button id="btn-fav" class="btn-fav" 
                                    aria-label="Tambah ke favorit">
                                🤍 Tambah ke Favorit
                            </button>
                        </div>
                    </header>

                    <div class="s-body">
                        <figure class="s-img-cntnr">
                            <img 
                                id="s-img" 
                                src="" 
                                alt="" 
                                class="s-img"
                            >
                            <figcaption class="img-caption" id="img-caption">
                                Gambar ilustrasi cerita
                            </figcaption>
                        </figure>

                        <div class="s-desc-cntnr">
                            <p id="s-desc" class="s-desc">
                                Deskripsi cerita akan ditampilkan di sini...
                            </p>
                        </div>

                        <section class="s-loc" aria-labelledby="location-title">
                            <h2 id="location-title">📍 Lokasi Cerita</h2>
                            <div class="loc-details">
                                <div class="coords">
                                    <div class="coord">
                                        <strong>Latitude:</strong>
                                        <span id="detail-latitude">-</span>
                                    </div>
                                    <div class="coord">
                                        <strong>Longitude:</strong>
                                        <span id="detail-longitude">-</span>
                                    </div>
                                </div>
                                <button id="btn-view-map" class="btn-secondary">
                                    Lihat di Peta Besar
                                </button>
                            </div>
                            <div id="detail-map" class="detail-map" aria-label="Peta lokasi cerita"></div>
                        </section>
                    </div>

                    <footer class="s-footer">
                        <div class="act-btns">
                            <button id="btn-prev" class="btn-secondary" disabled>
                                ← Cerita Sebelumnya
                            </button>
                            <button id="btn-next" class="btn-secondary" disabled>
                                Cerita Selanjutnya →
                            </button>
                        </div>
                    </footer>
                </article>
            </div>
        `;

        return section;
    }

    async init(route = null) {
        try {
            console.log('Initializing story detail with route:', route);
            
            if (route) {
                await this.extractStoryIdFromRoute(route);
            } else {
                await this.extractStoryIdFromHash();
            }
            
            console.log('Story ID:', this.currentStoryId);
            
            await this.loadAllStories();
            await this.loadStoryDetail();
            this.setupEventHandlers();
        } catch (error) {
            this.showError('Gagal memuat detail cerita: ' + error.message);
        }
    }

    async extractStoryIdFromRoute(route) {
        const match = route.match(/\/s\/([^\/]+)/);
        if (match && match[1]) {
            this.currentStoryId = match[1];
        } else {
            throw new Error('ID cerita tidak valid dari route');
        }
    }

    async extractStoryIdFromHash() {
        const hash = window.location.hash;
        const match = hash.match(/\/s\/([^\/]+)/);
        if (match && match[1]) {
            this.currentStoryId = match[1];
        } else {
            throw new Error('ID cerita tidak valid dari hash');
        }
    }

    async loadAllStories() {
        try {
            this.allStories = await StoryAPI.getStories();
        } catch (error) {
            console.error('Error loading stories:', error);
            this.allStories = [];
        }
    }

    async loadStoryDetail() {
        this.showLoading();
        try {
            this.currentStory = await StoryAPI.getStoryDetail(this.currentStoryId);
            this.displayStory(this.currentStory);
            if (this.currentStory.lat && this.currentStory.lon) {
                this.map = this.initializeMap(this.currentStory.lat, this.currentStory.lon);
            }
            this.updateStoryNavigation();
        } catch (error) {
            this.showError('Gagal memuat detail cerita: ' + error.message);
        }
    }

    updateStoryNavigation() {
        if (this.allStories.length === 0) return;
        this.currentIndex = this.allStories.findIndex(story => story.id === this.currentStoryId);
        const hasPrev = this.currentIndex > 0;
        const hasNext = this.currentIndex < this.allStories.length - 1;
        this.updateNavigationButtons(hasPrev, hasNext);
    }

    setupEventHandlers() {
        this.bindBackButton();
        this.bindNavigationButtons();
        this.bindViewOnMap();
        this.setupFavButton();
    }

    async setupFavButton() {
        const favBtn = this.element.querySelector('#btn-fav');
        if (!favBtn || !this.currentStory) return;

        const isFav = await this.isStoryFav(this.currentStory.id);
        this.updateFavButton(isFav);

        favBtn.addEventListener('click', async () => {
            await this.toggleFav();
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

    async toggleFav() {
        try {
            if (!this.currentStory) return;

            const isFav = await this.isStoryFav(this.currentStory.id);
            
            if (isFav) {
                await app.removeFromFav(this.currentStory.id);
            } else {
                await app.addToFav(this.currentStory);
            }
            
            this.updateFavButton(!isFav);
        } catch (error) {
            console.error('Error toggling favorite:', error);
            this.showAlert('Error', 'Gagal mengubah status favorit', 'error');
        }
    }

    updateFavButton(isFav) {
        const favBtn = this.element.querySelector('#btn-fav');
        if (favBtn) {
            favBtn.classList.toggle('is-fav', isFav);
            favBtn.innerHTML = isFav ? '❤️ Di Favorit' : '🤍 Tambah ke Favorit';
            favBtn.setAttribute('aria-label', isFav ? 'Hapus dari favorit' : 'Tambah ke favorit');
        }
    }

    displayStory(story) {
        const loadingIndicator = this.element.querySelector('#loading-indicator');
        const errorMessage = this.element.querySelector('#error-message');
        const storyContent = this.element.querySelector('#story-content');

        loadingIndicator.classList.add('is-hidden');
        errorMessage.classList.add('is-hidden');
        storyContent.classList.remove('is-hidden');

        this.element.querySelector('#s-title').textContent = story.name;
        this.element.querySelector('#author-name').textContent = story.name;
        this.element.querySelector('#publish-date').textContent = this.formatDate(story.createdAt);
        this.element.querySelector('#s-desc').textContent = story.description;
        
        const storyImage = this.element.querySelector('#s-img');
        storyImage.src = story.photoUrl;
        storyImage.alt = story.description;
        this.element.querySelector('#img-caption').textContent = story.description;

        this.element.querySelector('#detail-latitude').textContent = story.lat?.toFixed(6) || '-';
        this.element.querySelector('#detail-longitude').textContent = story.lon?.toFixed(6) || '-';
    }

    showLoading() {
        const loadingIndicator = this.element.querySelector('#loading-indicator');
        const errorMessage = this.element.querySelector('#error-message');
        const storyContent = this.element.querySelector('#story-content');

        loadingIndicator.classList.remove('is-hidden');
        errorMessage.classList.add('is-hidden');
        storyContent.classList.add('is-hidden');
    }

    showError(message) {
        const loadingIndicator = this.element.querySelector('#loading-indicator');
        const errorMessage = this.element.querySelector('#error-message');
        const storyContent = this.element.querySelector('#story-content');

        loadingIndicator.classList.add('is-hidden');
        errorMessage.textContent = message;
        errorMessage.classList.remove('is-hidden');
        storyContent.classList.add('is-hidden');
    }

    bindBackButton() {
        const backButton = this.element.querySelector('.btn-back');
        backButton.addEventListener('click', (e) => {
            e.preventDefault();
            window.location.hash = '#/home';
        });
    }

    bindNavigationButtons() {
        const prevBtn = this.element.querySelector('#btn-prev');
        const nextBtn = this.element.querySelector('#btn-next');

        prevBtn.addEventListener('click', () => this.handlePrevStory());
        nextBtn.addEventListener('click', () => this.handleNextStory());
    }

    updateNavigationButtons(hasPrev, hasNext) {
        const prevBtn = this.element.querySelector('#btn-prev');
        const nextBtn = this.element.querySelector('#btn-next');

        prevBtn.disabled = !hasPrev;
        nextBtn.disabled = !hasNext;

        prevBtn.setAttribute('aria-label', hasPrev ? 'Baca cerita sebelumnya' : 'Tidak ada cerita sebelumnya');
        nextBtn.setAttribute('aria-label', hasNext ? 'Baca cerita selanjutnya' : 'Tidak ada cerita selanjutnya');
    }

    handlePrevStory() {
        if (this.currentIndex > 0) {
            const prevStory = this.allStories[this.currentIndex - 1];
            this.navigateToStory(prevStory.id);
        }
    }

    handleNextStory() {
        if (this.currentIndex < this.allStories.length - 1) {
            const nextStory = this.allStories[this.currentIndex + 1];
            this.navigateToStory(nextStory.id);
        }
    }

    navigateToStory(storyId) {
        window.location.hash = `#/s/${storyId}`;
    }

    initializeMap(lat, lon) {
        const mapContainer = this.element.querySelector('#detail-map');
        
        if (!lat || !lon) {
            mapContainer.innerHTML = `
                <div class="no-loc-msg">
                    <p>Lokasi tidak tersedia untuk cerita ini</p>
                </div>
            `;
            return null;
        }

        const map = L.map('detail-map').setView([lat, lon], 13);

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors',
            maxZoom: 18
        }).addTo(map);

        L.marker([lat, lon])
            .addTo(map)
            .bindPopup(`
                <div class="map-popup">
                    <strong>Lokasi Cerita</strong><br>
                    ${this.element.querySelector('#s-title').textContent}
                </div>
            `)
            .openPopup();

        return map;
    }

    bindViewOnMap() {
        const viewOnMapBtn = this.element.querySelector('#btn-view-map');
        viewOnMapBtn.addEventListener('click', () => {
            if (this.currentStory?.lat && this.currentStory?.lon) {
                window.location.hash = `#/home?focus=${this.currentStory.id}`;
            }
        });
    }

    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('id-ID', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    showAlert(title, message, icon = 'error') {
        if (typeof Swal !== 'undefined') {
            Swal.fire({
                icon: icon,
                title: title,
                text: message,
                confirmButtonText: 'OK',
                confirmButtonColor: icon === 'error' ? '#dc2626' : '#2563eb'
            });
        } else {
            alert(`${title}: ${message}`);
        }
    }

    destroy() {
        const mapContainer = this.element.querySelector('#detail-map');
        if (mapContainer._leaflet_map) {
            mapContainer._leaflet_map.remove();
        }
    }
}

export { SDetailPg };