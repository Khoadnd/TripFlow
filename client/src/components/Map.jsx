import { MapContainer, TileLayer, Marker, Popup, useMap, Polyline } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Maximize, Minimize } from 'lucide-react';

// Fix for default marker icon
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

function ChangeView({ center, zoom }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, zoom);
  }, [center, zoom]);
  return null;
}

function MapResizer({ isFullScreen }) {
    const map = useMap();
    useEffect(() => {
        setTimeout(() => {
            map.invalidateSize();
        }, 100);
    }, [isFullScreen, map]);
    return null;
}

export default function MapComponent({ center, zoom = 13, markers = [], className = "h-full w-full", connectPoints = false }) {
  const [isFullScreen, setIsFullScreen] = useState(false);
  
  const polylinePositions = markers.map(m => m.position);

  const renderMap = (isFull) => (
    <div className="relative h-full w-full">
        <MapContainer center={center} zoom={zoom} style={{ height: '100%', width: '100%', borderRadius: isFull ? '0' : '1.5rem' }}>
        <ChangeView center={center} zoom={zoom} />
        <MapResizer isFullScreen={isFull} />
        <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {markers.map((marker, idx) => (
            <Marker key={idx} position={marker.position}>
            <Popup>{marker.title || marker.popup}</Popup>
            </Marker>
        ))}
        {connectPoints && markers.length > 1 && (
            <Polyline positions={polylinePositions} color="#3B82F6" dashArray="10, 10" weight={3} opacity={0.6} />
        )}
        </MapContainer>
        <button 
            onClick={() => setIsFullScreen(!isFullScreen)}
            className="absolute top-4 right-4 z-[1000] bg-white p-2 rounded-xl shadow-lg hover:bg-gray-50 transition-all hover:scale-105 text-gray-700"
            title={isFull ? "Exit Full Screen" : "Full Screen"}
        >
            {isFull ? <Minimize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}
        </button>
    </div>
  );

  return (
    <>
        <div className={className}>
            {renderMap(false)}
        </div>
        {isFullScreen && createPortal(
            <div className="fixed inset-0 z-[9999] bg-white animate-in fade-in duration-200">
                {renderMap(true)}
            </div>,
            document.body
        )}
    </>
  );
}
