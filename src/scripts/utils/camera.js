class CameraManager {
    static async startCamera(videoElement, facingMode = 'environment') {
        try {
            const constraints = {
                video: { 
                    facingMode: facingMode,
                    width: { ideal: 1280 },
                    height: { ideal: 720 }
                }
            };

            const stream = await navigator.mediaDevices.getUserMedia(constraints);
            videoElement.srcObject = stream;
            return stream;
        } catch (error) {
            throw new Error(`Cannot access camera: ${error.message}`);
        }
    }

    static stopCamera(stream) {
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
        }
    }

    static capturePhoto(videoElement) {
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        
        canvas.width = videoElement.videoWidth;
        canvas.height = videoElement.videoHeight;
        context.drawImage(videoElement, 0, 0);
        
        return new Promise((resolve) => {
            canvas.toBlob((blob) => {
                const file = new File([blob], 'camera-capture.jpg', { type: 'image/jpeg' });
                resolve(file);
            }, 'image/jpeg', 0.8);
        });
    }
}

export default CameraManager;