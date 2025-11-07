import '../../styles/styles.css';
import StoryAPI from '../data/api.js';
import PushNotification from '../utils/push-notification.js';
import { idxDB } from '../utils/idx-db.js';
import { offSync } from '../utils/off-sync.js';

class StoryHiveApp {
    constructor() {
        this.currentPage = null;
        this.pushNotification = new PushNotification();
        this.init();
    }

    init() {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                this.setupRouter();
                this.loadInitialView();
                this.updateNavigation();
                this.initializePushNotifications();
                this.setupPushNotificationEvents();
                this.setupPWAInstallation();
            });
        } else {
            this.setupRouter();
            this.loadInitialView();
            this.updateNavigation();
            this.initializePushNotifications();
            this.setupPushNotificationEvents();
            this.setupPWAInstallation();
        }
    }

    setupPushNotificationEvents() {
        window.addEventListener('pushNotificationStatusUpdate', (event) => {
            this.handlePushNotificationStatusUpdate(event.detail);
        });

        window.addEventListener('notificationPermissionChanged', (event) => {
            this.handleNotificationPermissionChanged(event.detail);
        });

        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.addEventListener('message', (event) => {
                if (event.data && event.data.type === 'NAVIGATE_TO_URL') {
                    this.handleNotificationNavigation(event.data.url);
                }
            });
        }
    }

    setupPWAInstallation() {
        console.log('PWA installation setup completed');
    }

    showOnlineMessage() {
        if (typeof Swal !== 'undefined') {
            Swal.fire({
                icon: 'success',
                title: 'Koneksi Pulih',
                text: 'Anda kembali online',
                timer: 2000,
                showConfirmButton: false,
                position: 'top-end'
            });
        }
    }

    showOfflineMessage() {
        console.log('App is offline');
    }

    async preloadStoriesForOffline() {
        try {
            const response = await fetch('https://story-api.dicoding.dev/v1/stories');
            if (response.ok) {
                const data = await response.json();
                localStorage.setItem('offlineStories', JSON.stringify(data.listStory || []));
                localStorage.setItem('storiesLastUpdated', new Date().toISOString());
                console.log('Stories preloaded for offline use');
            }
        } catch (error) {
            console.log('Preload stories failed:', error);
        }
    }

    getOfflineStories() {
        try {
            const stored = localStorage.getItem('offlineStories');
            return stored ? JSON.parse(stored) : [];
        } catch (error) {
            return [];
        }
    }

    isPWAInstalled() {
        return window.matchMedia('(display-mode: standalone)').matches || 
               window.navigator.standalone === true;
    }

    async installPWA() {
        if (window.deferredPrompt) {
            window.deferredPrompt.prompt();
            const { outcome } = await window.deferredPrompt.userChoice;
            console.log(`User response: ${outcome}`);
            window.deferredPrompt = null;
            return outcome === 'accepted';
        }
        return false;
    }

    handleNotificationNavigation(url) {
        console.log('Navigating from notification to:', url);
        const route = url.includes('#') ? url.split('#')[1] : '/home';
        window.location.hash = route;
    }

    handlePushNotificationStatusUpdate(status) {
        console.log('Push notification status updated:', status);
        this.updateNavigation();
    }

    handleNotificationPermissionChanged(detail) {
        console.log('Notification permission changed:', detail);
        this.updateNavigation();
    }

    async initializePushNotifications() {
        if (!this.pushNotification.isSupported()) {
            console.warn('Push notifications are not supported in this browser');
            return;
        }

        try {
            const initialized = await this.pushNotification.init();
            
            if (initialized) {
                console.log('Push notifications initialized successfully');
                this.pushNotification.updateNavigationWithToggle();
                this.setupPushNotificationTest();
            } else {
                console.warn('Push notifications initialization failed');
            }
        } catch (error) {
            console.error('Error initializing push notifications:', error);
        }
    }

    async togglePushNotifications() {
        try {
            const newStatus = await this.pushNotification.toggleSubscription();
            
            if (typeof Swal !== 'undefined') {
                Swal.fire({
                    icon: 'success',
                    title: newStatus ? 'Notifikasi Diaktifkan' : 'Notifikasi Dinonaktifkan',
                    text: newStatus 
                        ? 'Anda akan menerima notifikasi dari StoryHive' 
                        : 'Anda tidak akan menerima notifikasi lagi',
                    confirmButtonColor: '#2563eb'
                });
            }
            
            return newStatus;
        } catch (error) {
            console.error('Error toggling push notifications:', error);
            
            if (typeof Swal !== 'undefined') {
                Swal.fire({
                    icon: 'error',
                    title: 'Gagal Mengubah Pengaturan',
                    text: error.message || 'Terjadi kesalahan saat mengubah pengaturan notifikasi',
                    confirmButtonColor: '#dc2626'
                });
            }
            
            throw error;
        }
    }

    async testPushNotification() {
        try {
            await this.pushNotification.sendTestNotification(
                'Test Notifikasi StoryHive',
                'Ini adalah notifikasi test dari StoryHive. Notifikasi berhasil dikonfigurasi!',
                '#/home'
            );
            
            if (typeof Swal !== 'undefined') {
                Swal.fire({
                    icon: 'success',
                    title: 'Test Notifikasi Dikirim',
                    text: 'Cek notifikasi yang muncul di perangkat Anda',
                    confirmButtonColor: '#2563eb'
                });
            }
        } catch (error) {
            console.error('Error testing push notification:', error);
            
            if (typeof Swal !== 'undefined') {
                Swal.fire({
                    icon: 'error',
                    title: 'Test Gagal',
                    text: 'Gagal mengirim test notifikasi',
                    confirmButtonColor: '#dc2626'
                });
            }
        }
    }

    setupPushNotificationTest() {
        window.testPushNotification = () => this.testPushNotification();
        window.togglePushNotifications = () => this.togglePushNotifications();
        window.getPushStatus = () => this.pushNotification.getStatus();

        console.log('=== Push Notification Debug ===');
        console.log('1. testPushNotification() - Test notifikasi (console only)');
        console.log('2. togglePushNotifications() - Toggle subscription');
        console.log('3. getPushStatus() - Lihat status');
        console.log('4. Chrome DevTools → Application → Service Workers → Push');
        console.log('==============================');
    }

    setupRouter() {
        window.addEventListener('hashchange', () => {
            this.handleRouteChange();
            this.updateNavigation();
        });
    }

    async handleRouteChange() {
        const hash = window.location.hash.slice(1) || '/home';
        await this.loadView(hash);
    }

    async loadInitialView() {
        const hash = window.location.hash.slice(1) || '/home';
        await this.loadView(hash);
    }

    async loadView(route) {
        const cleanRoute = route.replace(/\/$/, '');

        if (this.currentPage) {
            await this.transitionOut(this.currentPage);
        }

        if (!StoryAPI.isLoggedIn() && (cleanRoute === '/add-s' || cleanRoute.startsWith('/s/'))) {
            window.location.hash = '#/auth';
            return;
        }

        if (StoryAPI.isLoggedIn() && (cleanRoute === '/auth' || cleanRoute === '/register')) {
            window.location.hash = '#/home';
            return;
        }

        try {
            if (cleanRoute.startsWith('/s/')) {
                await this.loadStoryDetailView(cleanRoute);
            } else {
                switch (cleanRoute) {
                    case '/home':
                        await this.loadHomeView();
                        break;
                    case '/add-s':
                        await this.loadAddStoryView();
                        break;
                    case '/auth':
                        await this.loadLoginView();
                        break;
                    case '/register':
                        await this.loadRegisterView();
                        break;
                    case '/fav':
                        await this.loadFavView();
                        break;
                    default:
                        await this.loadHomeView();
                        break;
                }
            }
        } catch (error) {
            await this.showErrorView('Gagal memuat halaman: ' + error.message);
        }
    }

    async transitionOut(page) {
        if (page && page.element && page.element instanceof Node) {
            page.element.classList.remove('is-active');
            page.element.classList.add('is-fading');
            await new Promise(resolve => setTimeout(resolve, 300));
            if (typeof page.destroy === 'function') {
                page.destroy();
            }
        }
    }

    async transitionIn(page) {
        if (page && page.element && page.element instanceof Node) {
            page.element.classList.remove('is-fading');
            page.element.classList.add('is-active');
            await new Promise(resolve => setTimeout(resolve, 50));
        }
    }

    async loadHomeView() {
        try {
            const { HomePg } = await import('./home/home-pg.js');
            const page = new HomePg();
            
            if (!page.element || !(page.element instanceof Node)) {
                throw new Error('HomePg element is not valid');
            }
            
            this.currentPage = page;
            await this.showPage(page);
            await page.init();
        } catch (error) {
            throw error;
        }
    }

    async loadAddStoryView() {
        try {
            const { AddSPg } = await import('./add-s/add-s-pg.js');
            const page = new AddSPg();
            
            if (!page.element || !(page.element instanceof Node)) {
                throw new Error('AddSPg element is not valid');
            }
            
            this.currentPage = page;
            await this.showPage(page);
            await page.init();
        } catch (error) {
            throw error;
        }
    }

    async loadStoryDetailView(route) {
        try {
            const { SDetailPg } = await import('./s-detail/s-detail-pg.js');
            const page = new SDetailPg();
            
            if (!page.element || !(page.element instanceof Node)) {
                throw new Error('SDetailPg element is not valid');
            }
            
            this.currentPage = page;
            await this.showPage(page);
            await page.init(route);
        } catch (error) {
            throw error;
        }
    }

    async loadLoginView() {
        try {
            const { LoginPg } = await import('./auth/login-pg.js');
            const page = new LoginPg();
            
            if (!page.element || !(page.element instanceof Node)) {
                throw new Error('LoginPg element is not valid');
            }
            
            this.currentPage = page;
            await this.showPage(page);
            await page.init();
        } catch (error) {
            throw error;
        }
    }

    async loadRegisterView() {
        try {
            const { RegPg } = await import('./auth/reg-pg.js');
            const page = new RegPg();
            
            if (!page.element || !(page.element instanceof Node)) {
                throw new Error('RegPg element is not valid');
            }
            
            this.currentPage = page;
            await this.showPage(page);
            await page.init();
        } catch (error) {
            throw error;
        }
    }

    async loadFavView() {
        try {
            const { default: FavPage } = await import('./fav/fav-pg.js');
            const page = new FavPage();
            
          
            console.log('FavPage created, element:', page.element);
            
           
            if (!page.element && typeof page.init === 'function') {
                console.log('Calling FavPage.init()...');
                await page.init();
                console.log('After init, element:', page.element);
            }
            
          
            if (!page.element && typeof page.createView === 'function') {
                console.log('Calling FavPage.createView()...');
                page.createView();
                console.log('After createView, element:', page.element);
            }
            
         
            if (!page.element || !(page.element instanceof Node)) {
                console.error('FavPage element is invalid:', page.element);
                throw new Error('FavPage element is not valid. Type: ' + typeof page.element);
            }
            
            console.log('FavPage element is valid, showing page...');
            this.currentPage = page;
            await this.showPage(page);
            
        
            if (typeof page.afterRender === 'function') {
                await page.afterRender();
            }
            
        } catch (error) {
            console.error('Error loading fav view:', error);
            throw error;
        }
    }

    async showPage(page) {
        try {
            let container = document.getElementById('view-cntnr');
            
            if (!container) {
                container = document.getElementById('main');
            }
            
            if (!container) {
                container = document.getElementById('app');
            }
            
            if (!container) {
                container = document.body;
            }
            
            if (!container) {
                throw new Error('No container element found in DOM');
            }
            
            if (!page || !page.element || !(page.element instanceof Node)) {
                throw new Error('Page element is not valid');
            }
            
            if (document.startViewTransition) {
                await document.startViewTransition(async () => {
                    container.innerHTML = '';
                    container.appendChild(page.element);
                    await this.transitionIn(page);
                }).ready;
            } else {
                container.innerHTML = '';
                container.appendChild(page.element);
                await this.transitionIn(page);
            }
            
            const mainContent = document.getElementById('main');
            if (mainContent) {
                mainContent.focus();
            }
        } catch (error) {
            throw error;
        }
    }

    async showErrorView(message) {
        let container = document.getElementById('view-cntnr');
        if (!container) container = document.getElementById('main');
        if (!container) container = document.getElementById('app');
        if (!container) container = document.body;
        
        if (container) {
            container.innerHTML = `
                <div class="error-cntnr" style="padding: 2rem; text-align: center;">
                    <h2>Terjadi Kesalahan</h2>
                    <p>${message}</p>
                    <button onclick="window.location.hash = '#/home'" class="btn-primary">
                        Kembali ke Home
                    </button>
                </div>
            `;
        } else {
            const fallbackContainer = document.createElement('div');
            fallbackContainer.innerHTML = `
                <div style="padding: 2rem; text-align: center;">
                    <h2>Terjadi Kesalahan</h2>
                    <p>${message}</p>
                    <button onclick="location.reload()" style="padding: 10px 20px; background: #2563eb; color: white; border: none; border-radius: 5px; cursor: pointer;">
                        Refresh Halaman
                    </button>
                </div>
            `;
            document.body.appendChild(fallbackContainer);
        }
    }

    async addToFav(story) {
        try {
            await idxDB.addFav(story);
            this.showMsg('Cerita ditambahkan ke fav!', 'success');
        } catch (error) {
            console.error('Error adding to fav:', error);
            this.showMsg('Gagal menambahkan ke fav', 'error');
        }
    }

    async createStoryWithOfflineSupport(storyData, token) {
        return await offSync.createOff(storyData, token);
    }

    async isStoryFav(storyId) {
        try {
            return await idxDB.isFav(storyId);
        } catch (error) {
            console.error('Error checking fav status:', error);
            return false;
        }
    }

    async removeFromFav(storyId) {
        try {
            await idxDB.rmvFav(storyId);
            this.showMsg('Cerita dihapus dari fav', 'success');
        } catch (error) {
            console.error('Error removing from fav:', error);
            this.showMsg('Gagal menghapus dari fav', 'error');
        }
    }

    async getSyncStatus() {
        return await offSync.getSyncSts();
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

    updateNavigation() {
        let navbar = document.querySelector('.nav');
        if (!navbar) {
            const header = document.querySelector('.hdr');
            if (header) {
                navbar = document.createElement('nav');
                navbar.className = 'nav';
                header.appendChild(navbar);
            } else {
                return;
            }
        }
    
        const user = StoryAPI.getUser();
        const isLoggedIn = StoryAPI.isLoggedIn();
        const pushStatus = this.pushNotification.getStatus();

        let notificationToggle = '';
        if (isLoggedIn && pushStatus.isSupported) {
            const isSubscribed = pushStatus.isSubscribed;
            const isGranted = pushStatus.permission === 'granted';
            
            if (isGranted) {
                notificationToggle = `
                    <li class="notification-toggle-item">
                        <button class="notification-toggle ${isSubscribed ? 'is-active' : ''}" 
                                onclick="app.togglePushNotifications()"
                                title="${isSubscribed ? 'Nonaktifkan' : 'Aktifkan'} notifikasi">
                            <span class="toggle-icon">🔔</span>
                            <span class="toggle-text">${isSubscribed ? 'Notifikasi Aktif' : 'Notifikasi Nonaktif'}</span>
                        </button>
                    </li>
                `;
            } else if (pushStatus.permission === 'default') {
                notificationToggle = `
                    <li class="notification-toggle-item">
                        <button class="notification-toggle enable-permission" 
                                onclick="app.pushNotification.requestPermission()"
                                title="Aktifkan notifikasi">
                            <span class="toggle-icon">🔕</span>
                            <span class="toggle-text">Aktifkan Notifikasi</span>
                        </button>
                    </li>
                `;
            }
        }

        let favLink = '';
        if (isLoggedIn) {
            favLink = '<li><a href="#/fav">  Cerita Favorit</a></li>';
        }
    
        let authHtml = '';
        if (isLoggedIn && user) {
            authHtml = `
                <li><a href="#/add-s"> Tambah Cerita</a></li>
                ${favLink}
                ${notificationToggle}
                <li class="usr-dd">
                    <button class="usr-dd-toggle" aria-expanded="false">
                        <span class="usr-greet">${user.name}</span>
                    </button>
                    <div class="usr-dd-menu">
                        <button class="usr-dd-item logout" onclick="app.handleLogout()">
                            🚪 Logout
                        </button>
                    </div>
                </li>
            `;
        } else {
            authHtml = `
                <div class="auth-links">
                    <a href="#/auth" class="auth-link login">Login</a>
                    <a href="#/register" class="auth-link register">Daftar</a>
                </div>
            `;
        }
    
        navbar.innerHTML = `
            <div class="nav-brand">
                <a href="#/home" class="nav-brand">
                    <img src="/images/Logo.png" alt="StoryHive Logo" class="nav-brand-img">
                </a>
            </div>
            
            <button class="nav-toggle" aria-label="Toggle menu" aria-expanded="false">
                <span></span>
                <span></span>
                <span></span>
            </button>
    
            <ul class="nav-menu">
                <li><a href="#/home"> Home</a></li>
                ${authHtml}
            </ul>
        `;
    
        this.setupMobileNavigation();
        this.setupDropdowns();
    }

    setupMobileNavigation() {
        const hamburger = document.querySelector('.nav-toggle');
        const navMenu = document.querySelector('.nav-menu');
        
        if (!hamburger || !navMenu) {
            return;
        }
        
        let mobileOverlay = document.querySelector('.overlay');
        if (!mobileOverlay) {
            mobileOverlay = document.createElement('div');
            mobileOverlay.className = 'overlay';
            document.body.appendChild(mobileOverlay);
        }

        hamburger.addEventListener('click', (e) => {
            e.stopPropagation();
            const isExpanded = hamburger.getAttribute('aria-expanded') === 'true';
            
            hamburger.classList.toggle('is-active');
            hamburger.setAttribute('aria-expanded', !isExpanded);
            navMenu.classList.toggle('is-active');
            mobileOverlay.classList.toggle('is-active');
            document.body.style.overflow = navMenu.classList.contains('is-active') ? 'hidden' : '';
        });

        mobileOverlay.addEventListener('click', () => {
            this.closeMobileMenu();
        });

        navMenu.addEventListener('click', (e) => {
            if (e.target.tagName === 'A' || e.target.classList.contains('usr-dd-item')) {
                this.closeMobileMenu();
            }
        });

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeMobileMenu();
            }
        });

        window.addEventListener('resize', () => {
            if (window.innerWidth > 768) {
                this.closeMobileMenu();
            }
        });
    }

    setupDropdowns() {
        const dropdownToggles = document.querySelectorAll('.usr-dd-toggle');
        
        dropdownToggles.forEach(toggle => {
            toggle.addEventListener('click', (e) => {
                e.stopPropagation();
                const dropdown = toggle.nextElementSibling;
                const isExpanded = toggle.getAttribute('aria-expanded') === 'true';
                
                document.querySelectorAll('.usr-dd-menu').forEach(menu => {
                    if (menu !== dropdown) {
                        menu.classList.remove('is-active');
                    }
                });
                document.querySelectorAll('.usr-dd-toggle').forEach(t => {
                    if (t !== toggle) {
                        t.setAttribute('aria-expanded', 'false');
                        t.classList.remove('is-active');
                    }
                });
                
                toggle.setAttribute('aria-expanded', !isExpanded);
                toggle.classList.toggle('is-active');
                dropdown.classList.toggle('is-active');
            });
        });

        document.addEventListener('click', () => {
            document.querySelectorAll('.usr-dd-menu').forEach(menu => {
                menu.classList.remove('is-active');
            });
            document.querySelectorAll('.usr-dd-toggle').forEach(toggle => {
                toggle.setAttribute('aria-expanded', 'false');
                toggle.classList.remove('is-active');
            });
        });

        document.querySelectorAll('.usr-dd-menu').forEach(menu => {
            menu.addEventListener('click', (e) => {
                e.stopPropagation();
            });
        });
    }

    closeMobileMenu() {
        const hamburger = document.querySelector('.nav-toggle');
        const navMenu = document.querySelector('.nav-menu');
        const mobileOverlay = document.querySelector('.overlay');
        
        if (hamburger) hamburger.classList.remove('is-active');
        if (hamburger) hamburger.setAttribute('aria-expanded', 'false');
        if (navMenu) navMenu.classList.remove('is-active');
        if (mobileOverlay) mobileOverlay.classList.remove('is-active');
        document.body.style.overflow = '';
    }

    handleLogout() {
        if (typeof Swal !== 'undefined') {
            Swal.fire({
                title: 'Logout',
                text: 'Apakah Anda yakin ingin logout?',
                icon: 'warning',
                showCancelButton: true,
                confirmButtonColor: '#dc2626',
                cancelButtonColor: '#64748b',
                confirmButtonText: 'Ya, Logout',
                cancelButtonText: 'Batal'
            }).then((result) => {
                if (result.isConfirmed) {
                    this.pushNotification.unsubscribe().catch(console.error);
                    StoryAPI.logout();
                    this.updateNavigation();
                    window.location.hash = '#/home';
                    Swal.fire({
                        icon: 'success',
                        title: 'Logout Berhasil',
                        text: 'Anda telah berhasil logout.',
                        confirmButtonColor: '#2563eb'
                    });
                }
            });
        } else {
            if (confirm('Apakah Anda yakin ingin logout?')) {
                this.pushNotification.unsubscribe().catch(console.error);
                StoryAPI.logout();
                this.updateNavigation();
                window.location.hash = '#/home';
            }
        }
    }
}

const app = new StoryHiveApp();
window.app = app;

window.addToFav = (story) => app.addToFav(story);
window.isStoryFav = (storyId) => app.isStoryFav(storyId);
window.removeFromFav = (storyId) => app.removeFromFav(storyId);
window.createStoryOffline = (storyData, token) => app.createStoryWithOfflineSupport(storyData, token);
window.getSyncStatus = () => app.getSyncStatus();

export default StoryHiveApp;