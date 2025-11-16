import { useEffect, useRef } from "react";
import { MapContainer, TileLayer } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

const Buildings = () => {
    const mapRef = useRef<L.Map | null>(null);

    useEffect(() => {
        const OSMBuildings = (window as any).OSMBuildings;
        const map = mapRef.current;

        if (OSMBuildings && map) {
            new OSMBuildings(map).load(
                "https://{s}.data.osmbuildings.org/0.2/SEU_KEY_AQUI/tile/{z}/{x}/{y}.json"
            );
        }
    }, []);

    return (
        <MapContainer
            center={[-30.059103, -51.170969]}
            zoom={18}
            style={{ height: "1000px", width: "100%" }}
            ref={mapRef} // attach the ref
        >
            <TileLayer url="https://tile.openstreetmap.org/{z}/{x}/{y}.png" />
        </MapContainer>
    );
};

export { Buildings };