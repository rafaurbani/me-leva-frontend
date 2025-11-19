import { useState, useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, Polyline, Polygon, useMapEvents, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import RecenterButton from "../components/RecenterButton";
import type { RouteData, UserPosition } from "../App"; // Importa UserPosition

interface LeafletProps {
    bottomSheetHeight: number;
    route: RouteData | null;
    userPosition: UserPosition | null; // Adiciona a prop
}

const DEFAULT_CENTER: L.LatLngExpression = [-30.059103, -51.170969];

// Ícone azul para a localização do usuário
const userIcon = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

const FitBoundsToRoute: React.FC<{ leafletCoords: [number, number][] }> = ({ leafletCoords }) => {
    const map = useMap();
    useEffect(() => {
        if (leafletCoords.length > 0) {
            map.flyToBounds(leafletCoords, { padding: [50, 50] });
        }
    }, [leafletCoords, map]);
    return null;
};

const Leaflet: React.FC<LeafletProps> = ({ bottomSheetHeight, route, userPosition }) => {
    const [routeCoordinates, setRouteCoordinates] = useState<[number, number][]>([]);

    useEffect(() => {
        if (route && route.path && route.path.length > 0) {
            console.log("Rota válida. Coordenadas da API (lng, lat):", route.path);
            const leafletCoords = route.path.map(coord => [coord[1], coord[0]] as [number, number]);
            setRouteCoordinates(leafletCoords);
        } else {
            setRouteCoordinates([]);
        }
    }, [route]);

    const maxBounds: L.LatLngBounds = new L.LatLngBounds(
        [-30.063, -51.175], // Sudoeste
        [-30.057, -51.169]  // Nordeste
    );

    const color = { color: "purple" };

    function ClickPopup() {
        const [position, setPosition] = useState<L.LatLng | null>(null);
        useMapEvents({ click(e) { setPosition(e.latlng); } });
        if (!position) return null;
        return (<Popup position={position}><div><p>[{position.lat}, {position.lng}],</p></div></Popup>);
    }

    function MapController({ bottomOffset }: { bottomOffset: number }) {
        const map = useMap();
        const handleRecenter = () => { map.flyTo(DEFAULT_CENTER, map.getZoom()); };
        return <RecenterButton onRecenter={handleRecenter} bottomOffset={bottomOffset} />;
    }

    return (
        <MapContainer
            center={DEFAULT_CENTER}
            style={{ height: "100%", width: "100%" }}
            scrollWheelZoom={true}
            zoom={18}
            maxBounds={maxBounds}
            maxBoundsViscosity={1.0}
        >
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" maxZoom={20} minZoom={18} />
            <ClickPopup />
            
            {/* Marcador antigo (DEFAULT_CENTER) - Pode ser removido ou mantido se desejar */}
            {/* <Marker position={DEFAULT_CENTER}><Popup>Você está aqui</Popup></Marker> */}

            {/* Marcador da Posição Atual do Usuário */}
            {userPosition && (
                <Marker position={[userPosition.lat, userPosition.lng]} icon={userIcon}>
                    <Popup>Sua localização</Popup>
                </Marker>
            )}
            
            {routeCoordinates.length > 0 && (
                <Polyline pathOptions={{ color: "blue", weight: 5 }} positions={routeCoordinates} />
            )}
            <FitBoundsToRoute leafletCoords={routeCoordinates} />
            <MapController bottomOffset={bottomSheetHeight + 16} />
        </MapContainer>
    );
};

export { Leaflet };