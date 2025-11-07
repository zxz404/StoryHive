import StoryAPI from '../../data/api.js';

class LoginPg {
    constructor() {
        this.element = this.createView();
    }

    createView() {
        const section = document.createElement('section');
        section.className = 'pg login-pg';
        
        section.innerHTML = `
            <div class="auth-cntnr">
                <div class="auth-hero">
                    <div class="auth-logo">
                        <img src="../../images/Logo.png" alt="StoryHive Logo">
                    </div>
                    
                    <div class="auth-hero-cnt">
                        <h1 class="auth-hero-title">Every Moment Has a Story</h1>
                        <p class="auth-hero-desc">Baikan pengalamanmu. Biarkan dunia mengenal perjalananmu.</p>
                    </div>
                    
                    <div class="auth-dots">
                        <div class="dot"></div>
                        <div class="dot is-active"></div>
                    </div>
                </div>

                <div class="auth-frm-cntnr">
                    <div class="auth-hdr-sec">
                        <h2 class="auth-title">Sign In to Your Account</h2>
                        <p class="auth-subtitle">Don't have an account? <a href="#/register" class="btn-link">Sign up</a></p>
                    </div>

                    <form id="login-frm" class="auth-frm" novalidate>
                        <div id="general-error" class="error-msg is-hidden" role="alert" aria-live="polite"></div>

                        <div class="frm-group">
                            <label for="email-input" class="is-required">Email Address</label>
                            <input 
                                type="email" 
                                id="email-input" 
                                name="email"
                                required
                                placeholder="Enter your email address"
                                aria-describedby="email-error"
                                aria-required="true"
                                autocomplete="email"
                            >
                            <div id="email-error" class="error-msg is-hidden" role="alert" aria-live="polite"></div>
                        </div>

                        <div class="frm-group">
                            <label for="password-input" class="is-required">Password</label>
                            <input 
                                type="password" 
                                id="password-input" 
                                name="password"
                                required
                                placeholder="Enter your password"
                                aria-describedby="password-error"
                                aria-required="true"
                                autocomplete="current-password"
                            >
                            <div id="password-error" class="error-msg is-hidden" role="alert" aria-live="polite"></div>
                        </div>

                        <div class="frm-act">
                            <button type="submit" id="btn-submit" class="btn-primary" aria-label="Sign in to your account">
                                Sign In
                            </button>
                        </div>

                        <div class="auth-switch">
                            <p>
                                Don't have an account? 
                                <a href="#/register" class="btn-link" aria-label="Create a new account">Sign up here</a>
                            </p>
                        </div>
                    </form>
                </div>
            </div>
        `;

        return section;
    }

    async init() {
        this.setupEventHandlers();
    }

    setupEventHandlers() {
        const form = this.element.querySelector('#login-frm');
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.handleLogin();
        });

        const emailInput = this.element.querySelector('#email-input');
        const passwordInput = this.element.querySelector('#password-input');

        emailInput.addEventListener('input', () => this.validateEmail());
        passwordInput.addEventListener('input', () => this.validatePassword());
    }

    async handleLogin() {
        const isValid = this.validateForm();
        
        if (!isValid) {
            return;
        }

        const formData = {
            email: this.element.querySelector('#email-input').value.trim(),
            password: this.element.querySelector('#password-input').value.trim()
        };

        try {
            this.showLoading();
            const result = await StoryAPI.login(formData);
            this.hideLoading();
            
            if (result.loginResult) {
                await this.showSuccess('Login Berhasil!', `Selamat datang kembali, ${result.loginResult.name}!`);
                window.location.hash = '#/home';
            }
            
        } catch (error) {
            this.hideLoading();
            this.handleLoginError(error);
        }
    }

    validateForm() {
        return this.validateEmail() && this.validatePassword();
    }

    validateEmail() {
        const emailInput = this.element.querySelector('#email-input');
        const value = emailInput.value.trim();
        
        if (!value) {
            this.showError('email', 'Email wajib diisi');
            return false;
        } else if (!this.isValidEmail(value)) {
            this.showError('email', 'Format email tidak valid');
            return false;
        } else {
            this.hideError('email');
            return true;
        }
    }

    validatePassword() {
        const passwordInput = this.element.querySelector('#password-input');
        const value = passwordInput.value.trim();
        
        if (!value) {
            this.showError('password', 'Password wajib diisi');
            return false;
        } else {
            this.hideError('password');
            return true;
        }
    }

    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    showError(field, message) {
        const errorElement = this.element.querySelector(`#${field}-error`);
        if (errorElement) {
            errorElement.textContent = message;
            errorElement.classList.remove('is-hidden');
        }
        
        const inputElement = this.element.querySelector(`#${field}-input`);
        if (inputElement) {
            inputElement.classList.add('has-error');
        }
    }

    hideError(field) {
        const errorElement = this.element.querySelector(`#${field}-error`);
        if (errorElement) {
            errorElement.classList.add('is-hidden');
        }
        
        const inputElement = this.element.querySelector(`#${field}-input`);
        if (inputElement) {
            inputElement.classList.remove('has-error');
        }
    }

    async showSuccess(title, message) {
        if (typeof Swal !== 'undefined') {
            await Swal.fire({
                icon: 'success',
                title: title,
                text: message,
                confirmButtonText: 'OK',
                confirmButtonColor: '#2563eb'
            });
        } else {
            alert(`${title}: ${message}`);
        }
    }

    async showErrorAlert(title, message) {
        if (typeof Swal !== 'undefined') {
            await Swal.fire({
                icon: 'error',
                title: title,
                text: message,
                confirmButtonText: 'OK',
                confirmButtonColor: '#dc2626'
            });
        } else {
            alert(`${title}: ${message}`);
        }
    }

    handleLoginError(error) {
        let errorMessage = 'Terjadi kesalahan saat login. ';
        
        if (error.message.includes('email') || error.message.includes('user') || error.message.includes('password')) {
            errorMessage = 'Email atau password salah. Silakan periksa kembali.';
        } else if (error.message.includes('network') || !navigator.onLine) {
            errorMessage = 'Koneksi internet bermasalah. Silakan periksa koneksi Anda.';
        } else {
            errorMessage = error.message || 'Terjadi kesalahan yang tidak diketahui. Silakan coba lagi.';
        }
        
        this.showErrorAlert('Login Gagal', errorMessage);
    }

    showLoading() {
        const submitBtn = this.element.querySelector('#btn-submit');
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<div class="loading-spinner"></div> Masuk...';
    }

    hideLoading() {
        const submitBtn = this.element.querySelector('#btn-submit');
        submitBtn.disabled = false;
        submitBtn.textContent = 'Sign In';
    }

    destroy() {
       
    }
}

export { LoginPg };