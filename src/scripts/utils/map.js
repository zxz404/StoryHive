class MapManager {
    constructor(containerId, options = {}) {
        this.containerId = containerId;
        this.options = options;
        this.map = null;
        this.markers = {};
        this.activeMarker = null;
        this.tileLayers = {};
        this.init();
    }

    init() {
        this.map = L.map(this.containerId, {
            center: this.options.center || [-6.2088, 106.8456],
            zoom: this.options.zoom || 10,
            zoomControl: false
        });

        L.control.zoom({
            position: 'bottomright'
        }).addTo(this.map);

        this.setupTileLayers();
        this.setupLayerControl();
    }

    setupTileLayers() {
        this.tileLayers.openstreetmap = L.tileLayer(
            'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
            {
                attribution: '© OpenStreetMap contributors',
                maxZoom: 19
            }
        );

        this.tileLayers.satellite = L.tileLayer(
            'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
            {
                attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community',
                maxZoom: 19
            }
        );

        this.tileLayers.openstreetmap.addTo(this.map);
        this.currentTileLayer = 'openstreetmap';
    }

    setupLayerControl() {
        this.layerControl = L.control.layers(this.tileLayers).addTo(this.map);
    }

    addMarker(story, options = {}) {
        const marker = L.marker([story.lat, story.lon], {
            title: story.name
        });

        const popupContent = `
            <div class="story-popup">
                <img src="${story.photoUrl}" alt="${story.description}" style="width: 100px; height: 100px; object-fit: cover; border-radius: 8px;">
                <div style="margin-top: 8px;">
                    <strong>${story.name}</strong>
                    <p style="margin: 4px 0; font-size: 0.9em;">${story.description}</p>
                    <small style="color: #666;">${new Date(story.createdAt).toLocaleDateString('id-ID')}</small>
                </div>
            </div>
        `;

        marker.bindPopup(popupContent);
        marker.addTo(this.map);

        this.markers[story.id] = marker;

        if (options.onClick) {
            marker.on('click', () => options.onClick(story));
        }

        return marker;
    }

    removeMarker(storyId) {
        if (this.markers[storyId]) {
            this.map.removeLayer(this.markers[storyId]);
            delete this.markers[storyId];
        }
    }

    clearMarkers() {
        Object.values(this.markers).forEach(marker => {
            this.map.removeLayer(marker);
        });
        this.markers = {};
    }

    setActiveMarker(storyId) {
        if (this.activeMarker && this.markers[this.activeMarker]) {
            this.markers[this.activeMarker].setIcon(this.getDefaultIcon());
        }

        if (this.markers[storyId]) {
            this.markers[storyId].setIcon(this.getActiveIcon());
            this.activeMarker = storyId;
            this.map.panTo(this.markers[storyId].getLatLng());
            this.markers[storyId].openPopup();
        }
    }

    getDefaultIcon() {
        return L.icon({
            iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
            shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
            iconSize: [25, 41],
            iconAnchor: [12, 41],
            popupAnchor: [1, -34],
            shadowSize: [41, 41]
        });
    }

    getActiveIcon() {
        return L.icon({
            iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
            shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
            iconSize: [25, 41],
            iconAnchor: [12, 41],
            popupAnchor: [1, -34],
            shadowSize: [41, 41]
        });
    }

    onMapClick(callback) {
        this.map.on('click', (e) => {
            callback(e.latlng.lat, e.latlng.lng);
        });
    }

    setView(lat, lon, zoom = 15) {
        this.map.setView([lat, lon], zoom);
    }

    destroy() {
        if (this.map) {
            this.map.remove();
            this.map = null;
        }
    }
}

export default MapManager;