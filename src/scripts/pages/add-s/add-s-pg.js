import MapManager from '../../utils/map.js';
import StoryAPI from '../../data/api.js';

class AddSPg {
    constructor() {
        this.element = this.createView();
        this.mapManager = null;
        this.mediaStream = null;
        this.currentLat = null;
        this.currentLon = null;
        this.selectionMarker = null;
        this.currentPhoto = null;
    }

    createView() {
        const section = document.createElement('section');
        section.className = 'pg add-s-pg';
        
        section.innerHTML = `
            <div class="add-s-cntnr">
                <header class="sh-pg-hdr">
                    <h2>Bagikan Cerita Anda</h2>
                    <p>Isi form di bawah untuk berbagi pengalaman menarik dengan komunitas</p>
                </header>

                <form id="add-s-frm" class="s-frm" novalidate>
                    <div class="frm-grid">
                        <section class="frm-sec frm-sec--photo" aria-labelledby="photo-sec-title">
                            <h3 id="photo-sec-title">Foto Cerita</h3>
                            
                            <div class="upl-cntnr">
                                <div class="upl-opts">
                                    <button type="button" id="upload-btn" class="upl-opt-btn is-active">
                                        📁 Upload File
                                    </button>
                                    <button type="button" id="camera-btn" class="upl-opt-btn">
                                         Ambil Foto
                                    </button>
                                </div>

                                <div id="file-upload-sec" class="upl-sec">
                                    <div class="upl-area" id="file-upl-area">
                                        <div class="upl-placeholder">
                                            <span class="upl-icon">📁</span>
                                            <p>Klik untuk memilih foto atau drag & drop di sini</p>
                                            <small>Format: JPG, PNG, GIF (Maks. 5MB)</small>
                                        </div>
                                        <input 
                                            type="file" 
                                            id="photo-input" 
                                            name="photo" 
                                            accept="image/*" 
                                            class="is-visually-hidden"
                                            aria-describedby="photo-error"
                                        >
                                    </div>
                                    <div class="prv-cntnr is-hidden" id="file-prv">
                                        <img id="file-prv-img" alt="Preview foto yang diupload">
                                        <button type="button" id="remove-file-btn" class="btn-remove" aria-label="Hapus foto">
                                            ×
                                        </button>
                                    </div>
                                </div>

                                <div id="camera-sec" class="upl-sec is-hidden">
                                    <div class="cam-cntnr">
                                        <video id="camera-preview" autoplay muted playsinline 
                                               aria-label="Preview kamera untuk mengambil foto"></video>
                                        <div class="cam-ctrl">
                                            <button type="button" id="cam-capture-btn" class="btn-primary">
                                                 Ambil Foto
                                            </button>
                                            <button type="button" id="cam-switch-btn" class="btn-secondary">
                                                 Switch Kamera
                                            </button>
                                            <button type="button" id="cam-close-btn" class="btn-secondary">
                                                 Tutup Kamera
                                            </button>
                                        </div>
                                    </div>
                                    <div class="prv-cntnr is-hidden" id="camera-prv-result">
                                        <img id="camera-prv-img" alt="Preview foto dari kamera">
                                        <div class="cam-prv-ctrl">
                                            <button type="button" id="cam-retake-btn" class="btn-secondary">
                                                 Ambil Ulang
                                            </button>
                                            <button type="button" id="cam-use-btn" class="btn-primary">
                                                 Gunakan Foto Ini
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                <div id="photo-error" class="error-msg is-hidden" role="alert"></div>
                            </div>
                        </section>

                        <section class="frm-sec frm-sec--details" aria-labelledby="details-sec-title">
                            <h3 id="details-sec-title">Detail Cerita</h3>

                            <div class="frm-group">
                                <label for="description-input" class="is-required">Deskripsi Cerita</label>
                                <textarea 
                                    id="description-input" 
                                    name="description" 
                                    required 
                                    rows="5"
                                    aria-describedby="description-error description-help"
                                    placeholder="Ceritakan pengalaman menarik Anda..."
                                    aria-required="true"
                                ></textarea>
                                <div class="char-count" id="description-help">
                                    <span id="char-count">0</span>/1000 karakter
                                </div>
                                <div id="description-error" class="error-msg is-hidden" role="alert"></div>
                            </div>
                        </section>

                        <section class="frm-sec frm-sec--location" aria-labelledby="location-sec-title">
                            <h3 id="location-sec-title">Lokasi</h3>
                            <p class="sec-desc">Klik pada peta di bawah untuk memilih lokasi cerita Anda</p>

                            <div class="loc-info">
                                <div class="coord-display">
                                    <div class="coord">
                                        <label for="latitude-display">Latitude:</label>
                                        <span id="latitude-display" aria-live="polite">-</span>
                                    </div>
                                    <div class="coord">
                                        <label for="longitude-display">Longitude:</label>
                                        <span id="longitude-display" aria-live="polite">-</span>
                                    </div>
                                </div>
                                <button type="button" id="btn-cur-loc" class="btn-secondary">
                                    📍 Gunakan Lokasi Saya
                                </button>
                            </div>

                            <div class="map-small-cntnr">
                                <div id="location-map" class="map-small" 
                                     aria-label="Peta interaktif untuk memilih lokasi cerita"
                                     role="application"
                                     tabindex="0">
                                </div>
                                <div class="map-instruction">Klik pada peta untuk memilih lokasi</div>
                            </div>
                            <div id="location-error" class="error-msg is-hidden" role="alert"></div>
                        </section>
                    </div>

                    <div id="general-error" class="error-msg is-hidden" role="alert"></div>

                    <div class="frm-act">
                        <button type="button" id="btn-cancel" class="btn-secondary">Batal</button>
                        <button type="submit" id="btn-submit" class="btn-primary" disabled>Bagikan Cerita</button>
                    </div>
                </form>

                <div id="success-mdl" class="mdl is-hidden" role="dialog" aria-labelledby="success-mdl-title">
                    <div class="mdl-cnt">
                        <div class="mdl-icon success-anim">
                            <svg width="80" height="80" viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <circle cx="40" cy="40" r="38" stroke="#10B981" stroke-width="4" fill="none" class="anim-circle"/>
                                <path d="M56 34L36 54L24 42" stroke="#10B981" stroke-width="6" stroke-linecap="round" stroke-linejoin="round" class="anim-check"/>
                            </svg>
                        </div>
                        <h3 id="success-mdl-title">Cerita Berhasil Dibagikan!</h3>
                        <p>Terima kasih telah berbagi pengalaman dengan komunitas.</p>
                        <div class="mdl-act">
                            <button id="btn-home" class="btn-primary">Kembali ke Beranda</button>
                            <button id="btn-add" class="btn-secondary">Tambah Cerita Lain</button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        return section;
    }

    async init() {
        try {
            await this.initializeMap();
            this.setupEventHandlers();
            this.setupFormValidation();
        } catch (error) {
            this.showError('general', 'Gagal memuat halaman: ' + error.message);
        }
    }

    async initializeMap() {
        try {
            await new Promise(resolve => setTimeout(resolve, 100));
            this.mapManager = new MapManager('location-map', {
                center: [-6.2088, 106.8456],
                zoom: 10
            });

            this.mapManager.onMapClick((lat, lon) => {
                this.handleLocationSelect(lat, lon);
            });

            this.mapManager.map.on('click', (e) => {
                this.addSelectionMarker(e.latlng);
            });
        } catch (error) {
            console.error('Gagal menginisialisasi peta:', error);
            this.showError('general', 'Gagal memuat peta. Silakan refresh halaman.');
        }
    }

    setupEventHandlers() {
        this.bindFileUpload();
        this.bindCameraToggle();
        this.bindCameraCapture();
        this.bindFormSubmit();
        this.bindFormCancel();
        this.bindCurrentLocation();
        this.bindModalActions();
    }

    setupFormValidation() {
        this.bindInputValidation();
    }

    bindFileUpload() {
        const fileInput = this.element.querySelector('#photo-input');
        const uploadArea = this.element.querySelector('#file-upl-area');
        const previewContainer = this.element.querySelector('#file-prv');
        const removeBtn = this.element.querySelector('#remove-file-btn');

        uploadArea.addEventListener('click', () => {
            fileInput.click();
        });

        uploadArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            uploadArea.classList.add('is-drag-over');
        });

        uploadArea.addEventListener('dragleave', () => {
            uploadArea.classList.remove('is-drag-over');
        });

        uploadArea.addEventListener('drop', (e) => {
            e.preventDefault();
            uploadArea.classList.remove('is-drag-over');
            const files = e.dataTransfer.files;
            if (files.length > 0) {
                this.handleFileUpload(files[0]);
            }
        });

        fileInput.addEventListener('change', (e) => {
            if (e.target.files.length > 0) {
                this.handleFileUpload(e.target.files[0]);
            }
        });

        removeBtn.addEventListener('click', () => {
            fileInput.value = '';
            previewContainer.classList.add('is-hidden');
            this.element.querySelector('#file-upl-area').classList.remove('is-hidden');
            this.handleFileUpload(null);
        });
    }

    handleFileUpload(file) {
        if (file) {
            const isValid = this.validatePhoto(file);
            if (isValid) {
                this.currentPhoto = file;
                this.displayFilePreview(file);
            } else {
                this.currentPhoto = null;
            }
        } else {
            this.currentPhoto = null;
        }
        this.updateSubmitButton();
    }

    displayFilePreview(file) {
        const previewContainer = this.element.querySelector('#file-prv');
        const previewImg = this.element.querySelector('#file-prv-img');
        const uploadArea = this.element.querySelector('#file-upl-area');

        const reader = new FileReader();
        reader.onload = (e) => {
            previewImg.src = e.target.result;
            previewContainer.classList.remove('is-hidden');
            uploadArea.classList.add('is-hidden');
        };
        reader.readAsDataURL(file);
    }

    bindCameraToggle() {
        const uploadBtn = this.element.querySelector('#upload-btn');
        const cameraBtn = this.element.querySelector('#camera-btn');
        const fileSection = this.element.querySelector('#file-upload-sec');
        const cameraSection = this.element.querySelector('#camera-sec');
        const closeCameraBtn = this.element.querySelector('#cam-close-btn');

        uploadBtn.addEventListener('click', () => {
            uploadBtn.classList.add('is-active');
            cameraBtn.classList.remove('is-active');
            fileSection.classList.remove('is-hidden');
            cameraSection.classList.add('is-hidden');
            this.stopCamera();
        });

        cameraBtn.addEventListener('click', () => {
            cameraBtn.classList.add('is-active');
            uploadBtn.classList.remove('is-active');
            cameraSection.classList.remove('is-hidden');
            fileSection.classList.add('is-hidden');
            this.startCamera();
        });

        closeCameraBtn.addEventListener('click', () => {
            this.stopCamera();
            uploadBtn.classList.add('is-active');
            cameraBtn.classList.remove('is-active');
            fileSection.classList.remove('is-hidden');
            cameraSection.classList.add('is-hidden');
        });
    }

    async startCamera() {
        try {
            const constraints = {
                video: { 
                    facingMode: 'environment',
                    width: { ideal: 1280 },
                    height: { ideal: 720 }
                }
            };

            this.mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
            const video = this.element.querySelector('#camera-preview');
            video.srcObject = this.mediaStream;
        } catch (error) {
            this.showError('photo', 'Tidak dapat mengakses kamera.');
            const uploadBtn = this.element.querySelector('#upload-btn');
            uploadBtn.click();
        }
    }

    stopCamera() {
        if (this.mediaStream) {
            this.mediaStream.getTracks().forEach(track => track.stop());
            this.mediaStream = null;
        }
        const video = this.element.querySelector('#camera-preview');
        if (video) {
            video.srcObject = null;
        }
    }

    bindCameraCapture() {
        const captureBtn = this.element.querySelector('#cam-capture-btn');
        const switchCameraBtn = this.element.querySelector('#cam-switch-btn');
        const retakeBtn = this.element.querySelector('#cam-retake-btn');
        const usePhotoBtn = this.element.querySelector('#cam-use-btn');
        const cameraPreview = this.element.querySelector('#camera-prv-result');
        const cameraImg = this.element.querySelector('#camera-prv-img');
    
        captureBtn.addEventListener('click', () => {
            const video = this.element.querySelector('#camera-preview');
            const canvas = document.createElement('canvas');
            const context = canvas.getContext('2d');
    
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            context.drawImage(video, 0, 0);
    
            canvas.toBlob((blob) => {
                if (!blob) {
                    console.error('Failed to capture image');
                    return;
                }
                
                const file = new File([blob], 'camera-capture.jpg', { type: 'image/jpeg' });
                this.handleCameraCapture(file);
                
                if (cameraImg.src && cameraImg.src.startsWith('blob:')) {
                    URL.revokeObjectURL(cameraImg.src);
                }
                
                const objectURL = URL.createObjectURL(blob);
                cameraImg.src = objectURL;
                cameraPreview.classList.remove('is-hidden');
                this.element.querySelector('.cam-cntnr').classList.add('is-hidden');
            }, 'image/jpeg', 0.8);
        });
    
        usePhotoBtn.addEventListener('click', () => {
            this.stopCamera();
        });
    
        switchCameraBtn.addEventListener('click', async () => {
            await this.switchCamera();
        });
    
        retakeBtn.addEventListener('click', () => {
            if (cameraImg.src && cameraImg.src.startsWith('blob:')) {
                URL.revokeObjectURL(cameraImg.src);
                cameraImg.src = '';
            }
            
            cameraPreview.classList.add('is-hidden');
            this.element.querySelector('.cam-cntnr').classList.remove('is-hidden');
            this.handleCameraCapture(null);
            
            if (!this.mediaStream) {
                this.startCamera();
            }
        });
    }
    
    bindCameraToggle() {
        const uploadBtn = this.element.querySelector('#upload-btn');
        const cameraBtn = this.element.querySelector('#camera-btn');
        const fileSection = this.element.querySelector('#file-upload-sec');
        const cameraSection = this.element.querySelector('#camera-sec');
        const closeCameraBtn = this.element.querySelector('#cam-close-btn');
    
        uploadBtn.addEventListener('click', () => {
            uploadBtn.classList.add('is-active');
            cameraBtn.classList.remove('is-active');
            fileSection.classList.remove('is-hidden');
            cameraSection.classList.add('is-hidden');
            this.stopCamera();
            this.resetCameraPreview();
        });
    
        cameraBtn.addEventListener('click', () => {
            cameraBtn.classList.add('is-active');
            uploadBtn.classList.remove('is-active');
            cameraSection.classList.remove('is-hidden');
            fileSection.classList.add('is-hidden');
            this.startCamera();
        });
    
        closeCameraBtn.addEventListener('click', () => {
            this.stopCamera();
            uploadBtn.classList.add('is-active');
            cameraBtn.classList.remove('is-active');
            fileSection.classList.remove('is-hidden');
            cameraSection.classList.add('is-hidden');
            this.resetCameraPreview();
        });
    }
    
    resetCameraPreview() {
        const cameraPreview = this.element.querySelector('#camera-prv-result');
        const cameraImg = this.element.querySelector('#camera-prv-img');
        const camCntnr = this.element.querySelector('.cam-cntnr');
        
        cameraPreview.classList.add('is-hidden');
        camCntnr.classList.remove('is-hidden');
        
        if (cameraImg.src && cameraImg.src.startsWith('blob:')) {
            URL.revokeObjectURL(cameraImg.src);
            cameraImg.src = '';
        }
        
        this.handleCameraCapture(null);
    }
    async switchCamera() {
        this.stopCamera();
        const currentFacingMode = this.mediaStream?.getVideoTracks()[0]?.getSettings().facingMode;
        const newFacingMode = currentFacingMode === 'user' ? 'environment' : 'user';

        try {
            const constraints = {
                video: { 
                    facingMode: newFacingMode,
                    width: { ideal: 1280 },
                    height: { ideal: 720 }
                }
            };

            this.mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
            const video = this.element.querySelector('#camera-preview');
            video.srcObject = this.mediaStream;
        } catch (error) {
            this.showError('photo', 'Tidak dapat mengganti kamera.');
        }
    }

    handleCameraCapture(file) {
        if (file) {
            const isValid = this.validatePhoto(file);
            if (isValid) {
                this.currentPhoto = file;
                const fileInput = this.element.querySelector('#photo-input');
                const dataTransfer = new DataTransfer();
                dataTransfer.items.add(file);
                fileInput.files = dataTransfer.files;
            } else {
                this.currentPhoto = null;
            }
        } else {
            this.currentPhoto = null;
        }
        this.updateSubmitButton();
    }

    bindFormSubmit() {
        const form = this.element.querySelector('#add-s-frm');
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.handleFormSubmit();
        });
    }

    bindFormCancel() {
        const cancelBtn = this.element.querySelector('#btn-cancel');
        cancelBtn.addEventListener('click', () => {
            if (confirm('Apakah Anda yakin ingin membatalkan? Data yang sudah diisi akan hilang.')) {
                window.location.hash = '#/home';
            }
        });
    }

    bindInputValidation() {
        const descriptionInput = this.element.querySelector('#description-input');
        const charCount = this.element.querySelector('#char-count');

        descriptionInput.addEventListener('input', () => {
            const count = descriptionInput.value.length;
            charCount.textContent = count;
            if (count > 1000) {
                descriptionInput.value = descriptionInput.value.substring(0, 1000);
                charCount.textContent = 1000;
            }
            this.validateDescription();
            this.updateSubmitButton();
        });
    }

    validateDescription() {
        const descriptionInput = this.element.querySelector('#description-input');
        const value = descriptionInput.value.trim();

        if (!value) {
            this.showError('description', 'Deskripsi wajib diisi');
            return false;
        } else if (value.length < 10) {
            this.showError('description', 'Deskripsi minimal 10 karakter');
            return false;
        } else {
            this.hideError('description');
            return true;
        }
    }

    validatePhoto(photo) {
        if (!photo) {
            this.showError('photo', 'Foto wajib diisi');
            return false;
        }
        if (photo.size > 5 * 1024 * 1024) {
            this.showError('photo', 'Ukuran foto maksimal 5MB');
            return false;
        }
        const validTypes = ['image/jpeg', 'image/png', 'image/gif'];
        if (!validTypes.includes(photo.type)) {
            this.showError('photo', 'Format file harus JPG, PNG, atau GIF');
            return false;
        }
        this.hideError('photo');
        return true;
    }

    validateLocation(lat, lon) {
        if (!lat || !lon) {
            this.showError('location', 'Silakan pilih lokasi pada peta');
            return false;
        }
        this.hideError('location');
        return true;
    }

    showError(field, message) {
        const errorElement = this.element.querySelector(`#${field}-error`);
        if (errorElement) {
            errorElement.textContent = message;
            errorElement.classList.remove('is-hidden');
            
            const inputElement = this.element.querySelector(`#${field}-input`) || 
                               this.element.querySelector(`#${field}-upl-area`);
            if (inputElement) {
                inputElement.classList.add('has-error');
            }
        }
    }

    hideError(field) {
        const errorElement = this.element.querySelector(`#${field}-error`);
        if (errorElement) {
            errorElement.classList.add('is-hidden');
            
            const inputElement = this.element.querySelector(`#${field}-input`) || 
                               this.element.querySelector(`#${field}-upl-area`);
            if (inputElement) {
                inputElement.classList.remove('has-error');
            }
        }
    }

    updateSubmitButton() {
        const submitBtn = this.element.querySelector('#btn-submit');
        const isDescriptionValid = this.validateDescription();
        const isPhotoValid = this.currentPhoto !== null;
        const isLocationValid = this.currentLat !== null && this.currentLon !== null;
        
        submitBtn.disabled = !(isDescriptionValid && isPhotoValid && isLocationValid);
    }

    async handleFormSubmit() {
        const isDescriptionValid = this.validateDescription();
        const isPhotoValid = this.validatePhoto(this.currentPhoto);
        const isLocationValid = this.validateLocation(this.currentLat, this.currentLon);

        if (!isDescriptionValid || !isPhotoValid || !isLocationValid) {
            this.showError('general', 'Harap perbaiki error pada form sebelum mengirim');
            return;
        }

        this.hideError('general');

        try {
            this.showLoading();
            
            const compressedPhoto = await this.compressImage(this.currentPhoto);
            
            const submissionData = {
                description: this.element.querySelector('#description-input').value.trim(),
                photo: compressedPhoto,
                lat: this.currentLat,
                lon: this.currentLon
            };

            await StoryAPI.addStory(submissionData);
            this.hideLoading();
            this.showSuccessModal();
        } catch (error) {
            this.hideLoading();
            this.handleSubmissionError(error);
        }
    }

    async compressImage(file, maxWidth = 800, quality = 0.7) {
        return new Promise((resolve, reject) => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            const img = new Image();

            img.onload = () => {
                let width = img.width;
                let height = img.height;

                if (width > maxWidth) {
                    height = (height * maxWidth) / width;
                    width = maxWidth;
                }

                canvas.width = width;
                canvas.height = height;

                ctx.drawImage(img, 0, 0, width, height);

                canvas.toBlob(
                    (blob) => {
                        if (!blob) {
                            reject(new Error('Gagal mengkompresi gambar'));
                            return;
                        }

                        const compressedFile = new File([blob], file.name, {
                            type: 'image/jpeg',
                            lastModified: Date.now()
                        });

                        console.log(`Ukuran asli: ${(file.size / 1024 / 1024).toFixed(2)}MB`);
                        console.log(`Ukuran setelah kompresi: ${(compressedFile.size / 1024 / 1024).toFixed(2)}MB`);
                        
                        resolve(compressedFile);
                    },
                    'image/jpeg',
                    quality
                );
            };

            img.onerror = () => {
                reject(new Error('Gagal memuat gambar'));
            };

            const reader = new FileReader();
            reader.onload = (e) => {
                img.src = e.target.result;
            };
            reader.onerror = () => {
                reject(new Error('Gagal membaca file'));
            };
            reader.readAsDataURL(file);
        });
    }

    handleLocationSelect(lat, lon) {
        this.setSelectedLocation(lat, lon);
        this.addSelectionMarker({ lat, lng: lon });
    }

    setSelectedLocation(lat, lon) {
        this.currentLat = lat;
        this.currentLon = lon;
        const latDisplay = this.element.querySelector('#latitude-display');
        const lonDisplay = this.element.querySelector('#longitude-display');
        latDisplay.textContent = lat.toFixed(6);
        lonDisplay.textContent = lon.toFixed(6);
        this.validateLocation(lat, lon);
        this.updateSubmitButton();
    }

    addSelectionMarker(latlng) {
        if (!this.mapManager || !this.mapManager.map) {
            console.warn('Map manager belum siap');
            return;
        }

        if (this.selectionMarker) {
            this.mapManager.map.removeLayer(this.selectionMarker);
        }

        this.selectionMarker = L.marker(latlng, {
            icon: L.icon({
                iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
                shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
                iconSize: [25, 41],
                iconAnchor: [12, 41],
                popupAnchor: [1, -34],
                shadowSize: [41, 41]
            })
        }).addTo(this.mapManager.map);

        this.mapManager.map.panTo(latlng);
    }

    bindCurrentLocation() {
        const currentLocationBtn = this.element.querySelector('#btn-cur-loc');
        currentLocationBtn.addEventListener('click', () => {
            this.handleCurrentLocation();
        });
    }

    async handleCurrentLocation() {
        if (!navigator.geolocation) {
            this.showError('location', 'Browser tidak mendukung geolocation');
            return;
        }

        try {
            const position = await new Promise((resolve, reject) => {
                navigator.geolocation.getCurrentPosition(resolve, reject, {
                    enableHighAccuracy: true,
                    timeout: 10000,
                    maximumAge: 60000
                });
            });

            const { latitude, longitude } = position.coords;
            this.handleLocationSelect(latitude, longitude);
            
            if (this.mapManager && this.mapManager.map) {
                this.mapManager.setView(latitude, longitude, 15);
            }

        } catch (error) {
            let errorMessage = 'Tidak dapat mendapatkan lokasi saat ini. ';
            switch (error.code) {
                case error.PERMISSION_DENIED:
                    errorMessage += 'Izin lokasi ditolak.';
                    break;
                case error.POSITION_UNAVAILABLE:
                    errorMessage += 'Informasi lokasi tidak tersedia.';
                    break;
                case error.TIMEOUT:
                    errorMessage += 'Permintaan lokasi timeout.';
                    break;
                default:
                    errorMessage += 'Terjadi kesalahan yang tidak diketahui.';
                    break;
            }
            this.showError('location', errorMessage);
        }
    }

    bindModalActions() {
        const homeBtn = this.element.querySelector('#btn-home');
        const addAnotherBtn = this.element.querySelector('#btn-add');

        homeBtn.addEventListener('click', () => this.handleModalAction('home'));
        addAnotherBtn.addEventListener('click', () => this.handleModalAction('add-another'));
    }

    handleModalAction(action) {
        this.hideSuccessModal();
        if (action === 'home') {
            window.location.hash = '#/home';
        } else if (action === 'add-another') {
            this.resetForm();
            this.cleanupSelectionMarker();
            const uploadBtn = this.element.querySelector('#upload-btn');
            uploadBtn.click();
            this.element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }

    showSuccessModal() {
        const modal = this.element.querySelector('#success-mdl');
        modal.classList.remove('is-hidden');
        modal.setAttribute('aria-hidden', 'false');
        this.element.querySelector('#btn-home').focus();
    }

    hideSuccessModal() {
        const modal = this.element.querySelector('#success-mdl');
        modal.classList.add('is-hidden');
        modal.setAttribute('aria-hidden', 'true');
    }

    showLoading() {
        const submitBtn = this.element.querySelector('#btn-submit');
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<div class="loading-spinner"></div> Mengunggah...';
    }

    hideLoading() {
        const submitBtn = this.element.querySelector('#btn-submit');
        submitBtn.disabled = false;
        submitBtn.textContent = 'Bagikan Cerita';
    }

    handleSubmissionError(error) {
        let errorMessage = 'Gagal mengirim cerita. ';
        if (error.message.includes('network') || !navigator.onLine) {
            errorMessage += 'Periksa koneksi internet Anda.';
        } else if (error.message.includes('size') || error.message.includes('1000000')) {
            errorMessage += 'Ukuran foto terlalu besar. Coba gunakan foto dengan ukuran lebih kecil.';
        } else if (error.message.includes('format')) {
            errorMessage += 'Format foto tidak didukung.';
        } else if (error.message.includes('PNG')) {
            errorMessage += 'Format PNG mungkin tidak didukung. Coba gunakan format JPG.';
        } else {
            errorMessage += error.message || 'Terjadi kesalahan yang tidak diketahui.';
        }
        
        this.showError('general', errorMessage);
        this.element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    resetForm() {
        const form = this.element.querySelector('#add-s-frm');
        form.reset();
        this.element.querySelector('#file-prv').classList.add('is-hidden');
        this.element.querySelector('#file-upl-area').classList.remove('is-hidden');
        this.element.querySelector('#camera-prv-result').classList.add('is-hidden');
        this.element.querySelector('.cam-cntnr').classList.remove('is-hidden');
        this.currentLat = null;
        this.currentLon = null;
        this.element.querySelector('#latitude-display').textContent = '-';
        this.element.querySelector('#longitude-display').textContent = '-';
        this.currentPhoto = null;
        
        this.hideError('description');
        this.hideError('photo');
        this.hideError('location');
        this.hideError('general');
        
        this.stopCamera();
        this.updateSubmitButton();
    }

    cleanupSelectionMarker() {
        if (this.mapManager && this.mapManager.map && this.selectionMarker) {
            this.mapManager.map.removeLayer(this.selectionMarker);
            this.selectionMarker = null;
        }
    }

    destroy() {
        this.stopCamera();
        
        this.cleanupSelectionMarker();
        
        if (this.mapManager) {
            this.mapManager.destroy();
            this.mapManager = null;
        }
    }
}

export { AddSPg };