import 'leaflet/dist/leaflet.css';
import "../styles.css";
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import { useEffect } from 'react';
import L from 'leaflet';
import MarkerClusterGroup from 'react-leaflet-cluster';

// Custom marker icon
const customIcon = new L.Icon({
    iconUrl: 'radio_icon.png', // Replace with the path to your custom icon
    iconSize: [32, 32], 
    iconAnchor: [16, 32], 
    popupAnchor: [0, -32],
    className: 'transparent-marker'
});

// Component to auto-fit the map bounds to include all markers
function AutoZoom({ markers }) {
    const map = useMap();

    useEffect(() => {
        if (markers.length === 0) return;

        const bounds = L.latLngBounds(markers.map(marker => [marker.latitude, marker.longitude]));
        map.fitBounds(bounds, { padding: [50, 50] });
    }, [markers, map]);

    return null;
}

export default function BasicMap({ markers }) {
    return (
        <MapContainer center={[41.173889, -71.577393]} zoom={13} scrollWheelZoom={false} style={{ height: "500px", width: "100%" }}>
            <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <AutoZoom markers={markers} />
            
            <MarkerClusterGroup chunkedLoading>
                {markers.map((marker) => (
                    <Marker
                        key={marker.stationName}
                        position={[marker.latitude, marker.longitude]}
                        icon={customIcon}
                    >
                        <Popup>
                            {marker.stationName || "Saved Location"}
                        </Popup>
                    </Marker>
                ))}
            </MarkerClusterGroup>
        </MapContainer>
    );
}
