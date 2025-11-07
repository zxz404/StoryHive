import StoryAPI from '../../data/api.js';

class RegPg {
    constructor() {
        this.element = this.createView();
    }

    createView() {
        const section = document.createElement('section');
        section.className = 'pg reg-pg';
        
        section.innerHTML = `
            <div class="auth-cntnr">
                <div class="auth-hero">
                    <div class="auth-logo">
                        <img src="../../images/Logo.png" alt="StoryHive Logo">
                    </div>
                    
                    <div class="auth-hero-cnt">
                        <h1 class="auth-hero-title">Join the StoryHive Community</h1>
                        <p class="auth-hero-desc">Buat akunmu dan mulai berbagi momen yang berarti bersama orang lain</p>
                    </div>
                    
                    <div class="auth-dots">
                        <div class="dot is-active"></div>
                        <div class="dot"></div>
                    </div>
                </div>

                <div class="auth-frm-cntnr">
                    <div class="auth-hdr-sec">
                        <h2 class="auth-title">Create Your Account</h2>
                        <p class="auth-subtitle">Already have an account? <a href="#/auth" class="btn-link">Log in</a></p>
                    </div>

                    <form id="reg-frm" class="auth-frm" novalidate>
                        <div id="general-error" class="error-msg is-hidden" role="alert" aria-live="polite"></div>

                        <div class="frm-group">
                            <label for="name-input" class="is-required">Full Name</label>
                            <input 
                                type="text" 
                                id="name-input" 
                                name="name"
                                required
                                placeholder="Enter your full name"
                                aria-describedby="name-error"
                                aria-required="true"
                                autocomplete="name"
                            >
                            <div id="name-error" class="error-msg is-hidden" role="alert" aria-live="polite"></div>
                        </div>

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
                                placeholder="Enter your password (minimum 8 characters)"
                                aria-describedby="password-error"
                                aria-required="true"
                                autocomplete="new-password"
                            >
                            <div id="password-error" class="error-msg is-hidden" role="alert" aria-live="polite"></div>
                        </div>

                        <div class="frm-act">
                            <button type="submit" id="btn-submit" class="btn-primary" aria-label="Create new account">
                                Create Account
                            </button>
                        </div>

                        <div class="auth-switch">
                            <p>
                                Already have an account? 
                                <a href="#/auth" class="btn-link" aria-label="Sign in to existing account">Log in here</a>
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
        const form = this.element.querySelector('#reg-frm');
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.handleRegister();
        });

        const nameInput = this.element.querySelector('#name-input');
        const emailInput = this.element.querySelector('#email-input');
        const passwordInput = this.element.querySelector('#password-input');

        nameInput.addEventListener('input', () => this.validateName());
        emailInput.addEventListener('input', () => this.validateEmail());
        passwordInput.addEventListener('input', () => this.validatePassword());
    }

    async handleRegister() {
        const isValid = this.validateForm();
        
        if (!isValid) {
            return;
        }

        const formData = {
            name: this.element.querySelector('#name-input').value.trim(),
            email: this.element.querySelector('#email-input').value.trim(),
            password: this.element.querySelector('#password-input').value.trim()
        };

        try {
            this.showLoading();
            const result = await StoryAPI.register(formData);
            this.hideLoading();
            
            if (result.error === false) {
                await this.showSuccess('Registrasi Berhasil!', 'Akun Anda telah berhasil dibuat. Silakan login untuk melanjutkan.');
                window.location.hash = '#/auth';
            }
            
        } catch (error) {
            this.hideLoading();
            this.handleRegisterError(error);
        }
    }

    validateForm() {
        return this.validateName() && this.validateEmail() && this.validatePassword();
    }

    validateName() {
        const nameInput = this.element.querySelector('#name-input');
        const value = nameInput.value.trim();
        
        if (!value) {
            this.showError('name', 'Nama wajib diisi');
            return false;
        } else if (value.length < 2) {
            this.showError('name', 'Nama minimal 2 karakter');
            return false;
        } else {
            this.hideError('name');
            return true;
        }
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
        } else if (value.length < 8) {
            this.showError('password', 'Password minimal 8 karakter');
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

    handleRegisterError(error) {
        let errorMessage = 'Terjadi kesalahan saat registrasi. ';
        
        if (error.message.includes('email') || error.message.includes('user')) {
            errorMessage = 'Email sudah terdaftar. Silakan gunakan email lain.';
        } else if (error.message.includes('network') || !navigator.onLine) {
            errorMessage = 'Koneksi internet bermasalah. Silakan periksa koneksi Anda.';
        } else {
            errorMessage = error.message || 'Terjadi kesalahan yang tidak diketahui. Silakan coba lagi.';
        }
        
        this.showErrorAlert('Registrasi Gagal', errorMessage);
    }

    showLoading() {
        const submitBtn = this.element.querySelector('#btn-submit');
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<div class="loading-spinner"></div> Mendaftarkan...';
    }

    hideLoading() {
        const submitBtn = this.element.querySelector('#btn-submit');
        submitBtn.disabled = false;
        submitBtn.textContent = 'Create Account';
    }

    destroy() {
        
    }
}

export { RegPg };