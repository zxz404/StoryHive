class PushNotification {
    constructor() {
        this.publicVapidKey = 'BCCs2eonMI-6H2ctvFaWg-UYdDv387Vno_bzUzALpB442r2lCnsHmtrx8biyPi_E-1fSGABK_Qs_GlvPoJJqxbk';
        this.swRegistration = null;
        this.isSubscribed = false;
        this.subscription = null;
    }

    async init() {
        try {
            try {
                const configModule = await import('../config.js');
                if (configModule.VAPID_PUBLIC_KEY) {
                    this.publicVapidKey = configModule.VAPID_PUBLIC_KEY;
                }
            } catch (error) {
                console.log('Using default VAPID key');
            }

            if (!this.publicVapidKey) {
                console.warn('VAPID public key not found');
                return false;
            }

            this.swRegistration = await this._registerServiceWorker();
            
            await this._checkExistingSubscription();
            
            return true;
        } catch (error) {
            console.error('Error initializing push notification:', error);
            return false;
        }
    }

    async _registerServiceWorker() {
        if (!('serviceWorker' in navigator)) {
            throw new Error('Service workers are not supported');
        }

        try {
            const registration = await navigator.serviceWorker.register('/sw.js');
            console.log('Service Worker registered successfully');
            return registration;
        } catch (error) {
            console.error('Service Worker registration failed:', error);
            throw error;
        }
    }

    async _checkExistingSubscription() {
        try {
            this.subscription = await this.swRegistration.pushManager.getSubscription();
            this.isSubscribed = !(this.subscription === null);
            
            console.log('User is subscribed:', this.isSubscribed);
            
            if (this.isSubscribed) {
                await this._sendSubscriptionToServer(this.subscription, 'subscribe');
            }
            
            return this.isSubscribed;
        } catch (error) {
            console.error('Error checking subscription:', error);
            return false;
        }
    }

    async subscribe() {
        if (!('PushManager' in window)) {
            throw new Error('Push notifications are not supported');
        }

        try {
            const permission = await this.requestPermission();
            if (permission !== 'granted') {
                throw new Error('Notification permission denied');
            }

            const subscription = await this.swRegistration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: this._urlBase64ToUint8Array(this.publicVapidKey)
            });

            this.subscription = subscription;
            this.isSubscribed = true;

            console.log('Push notification subscribed successfully');
            
            await this._sendSubscriptionToServer(subscription, 'subscribe');
            
            this._updateUI();
            
            return true;
        } catch (error) {
            console.error('Failed to subscribe to push notifications:', error);
            this.isSubscribed = false;
            this._updateUI();
            throw error;
        }
    }

    async unsubscribe() {
        try {
            if (!this.subscription) {
                this.subscription = await this.swRegistration.pushManager.getSubscription();
            }

            if (this.subscription) {
                await this.subscription.unsubscribe();
                await this._sendSubscriptionToServer(this.subscription, 'unsubscribe');
                
                this.subscription = null;
                this.isSubscribed = false;
                
                console.log('Unsubscribed from push notifications');
            }
            
            this._updateUI();
            
            return true;
        } catch (error) {
            console.error('Error unsubscribing from push notifications:', error);
            throw error;
        }
    }

    async toggleSubscription() {
        try {
            if (this.isSubscribed) {
                await this.unsubscribe();
                return false;
            } else {
                await this.subscribe();
                return true;
            }
        } catch (error) {
            console.error('Error toggling subscription:', error);
            throw error;
        }
    }

    async _sendSubscriptionToServer(subscription, action) {
        try {
            const apiModule = await import('../data/api.js');
            const response = await apiModule.updatePushSubscription(subscription, action);
            
            if (response && response.ok) {
                console.log(`Subscription ${action} sent to server successfully`);
            } else {
                console.error(`Failed to send subscription ${action} to server`);
            }
            
            return response;
        } catch (error) {
            console.error(`Error sending subscription ${action} to server:`, error);
            return null;
        }
    }

    async sendTestNotification(title = 'Test Notification', body = 'This is a test notification', url = '/') {
        try {
            const apiModule = await import('../data/api.js');
            const response = await apiModule.sendTestNotification({ title, body, url });
            
            if (response && response.ok) {
                console.log('Test notification sent successfully');
            } else {
                console.error('Failed to send test notification');
            }
            
            return response;
        } catch (error) {
            console.error('Error sending test notification:', error);
            await this._showLocalNotification(title, body, url);
            throw error;
        }
    }

    async _showLocalNotification(title, body, url) {
        if (this.swRegistration) {
            await this.swRegistration.showNotification(title, {
                body: body,
                icon: '/images/favicon.png',
                badge: '/images/favicon.png',
                data: { url },
                actions: [
                    { action: 'open', title: 'Buka' },
                    { action: 'close', title: 'Tutup' }
                ]
            });
        }
    }

    _urlBase64ToUint8Array(base64String) {
        const padding = '='.repeat((4 - base64String.length % 4) % 4);
        const base64 = (base64String + padding)
            .replace(/\-/g, '+')
            .replace(/_/g, '/');

        const rawData = window.atob(base64);
        const outputArray = new Uint8Array(rawData.length);

        for (let i = 0; i < rawData.length; ++i) {
            outputArray[i] = rawData.charCodeAt(i);
        }
        return outputArray;
    }

    async requestPermission() {
        if (!('Notification' in window)) {
            console.warn('This browser does not support notifications');
            return 'denied';
        }

        try {
            const permission = await Notification.requestPermission();
            console.log('Notification permission:', permission);
            
            this._updateUI();
            
            return permission;
        } catch (error) {
            console.error('Error requesting notification permission:', error);
            return 'denied';
        }
    }

    _updateUI() {
        const status = this.getStatus();
        
        const event = new CustomEvent('pushNotificationStatusUpdate', {
            detail: status
        });
        window.dispatchEvent(event);
    }

    isSupported() {
        return 'PushManager' in window && 'serviceWorker' in navigator;
    }

    getStatus() {
        return {
            isSupported: this.isSupported(),
            isSubscribed: this.isSubscribed,
            permission: Notification.permission,
            subscription: this.subscription
        };
    }

    updateNavigationWithToggle() {
        const status = this.getStatus();
        
        const event = new CustomEvent('pushNotificationStatusUpdate', {
            detail: status
        });
        window.dispatchEvent(event);
    }

    async getCurrentSubscription() {
        if (!this.subscription) {
            this.subscription = await this.swRegistration.pushManager.getSubscription();
        }
        return this.subscription;
    }

    getPermissionState() {
        return Notification.permission;
    }

    isPermissionGranted() {
        return Notification.permission === 'granted';
    }

    isPermissionDenied() {
        return Notification.permission === 'denied';
    }

    isPermissionDefault() {
        return Notification.permission === 'default';
    }

    async resetSubscription() {
        try {
            await this.unsubscribe();
            this.subscription = null;
            this.isSubscribed = false;
            this._updateUI();
            console.log('Subscription reset successfully');
        } catch (error) {
            console.error('Error resetting subscription:', error);
            throw error;
        }
    }

    getSubscriptionInfo() {
        if (!this.subscription) {
            return null;
        }

        const subscriptionJson = this.subscription.toJSON();
        return {
            endpoint: subscriptionJson.endpoint,
            keys: subscriptionJson.keys,
            expirationTime: this.subscription.expirationTime
        };
    }

    validateVapidKey() {
        if (!this.publicVapidKey) {
            return false;
        }

        try {
            this._urlBase64ToUint8Array(this.publicVapidKey);
            return true;
        } catch (error) {
            console.error('Invalid VAPID key:', error);
            return false;
        }
    }

    async isServiceWorkerReady() {
        if (!this.swRegistration) {
            return false;
        }

        try {
            const registration = await navigator.serviceWorker.ready;
            return registration === this.swRegistration;
        } catch (error) {
            return false;
        }
    }

    getServiceWorkerRegistration() {
        return this.swRegistration;
    }

    manualTest(title = 'Manual Test', body = 'Manual test notification') {
        if (this.swRegistration) {
            this.swRegistration.showNotification(title, {
                body: body,
                icon: '/images/favicon.png',
                badge: '/images/favicon.png',
                actions: [
                    { action: 'open', title: 'Open' },
                    { action: 'close', title: 'Close' }
                ]
            });
        }
    }
}

export default PushNotification;