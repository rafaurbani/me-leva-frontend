import React, { useState, useCallback, useEffect } from "react";
import BottomSheet from "./components/BottomSheet.tsx";
import { BrowserRouter } from "react-router-dom";
import { Router } from "./Router.tsx";
import "./App.css";

export interface RouteData {
    path: [number, number][];
}

// Interface para a posição do usuário
export interface UserPosition {
    lat: number;
    lng: number;
}

const App: React.FC = () => {
    const [bottomSheetHeight, setBottomSheetHeight] = useState(0);
    const [route, setRoute] = useState<RouteData | null>(null);
    const [userPosition, setUserPosition] = useState<UserPosition | null>(null);

    const handleRouteCalculated = useCallback((newRoute: RouteData | null) => {
        setRoute(newRoute);
    }, []);

    // Hook para obter a localização do usuário
    useEffect(() => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    setUserPosition({
                        lat: position.coords.latitude,
                        lng: position.coords.longitude,
                    });
                    console.log("Localização do usuário obtida:", position.coords);
                },
                (err) => {
                    console.warn("Erro ao obter localização. Usando padrão.", err);
                    setUserPosition(null); // Falha ao obter, lógica de fallback será usada
                }
            );
        } else {
            console.warn("Geolocalização não é suportada por este navegador. Usando padrão.");
            setUserPosition(null); // Navegador não suporta, lógica de fallback será usada
        }
    }, []); // Executa apenas uma vez

    return (
        <div className="app-container">
            {/* ... (código do topo azul) ... */}
            <div className="top-blue-rectangle">
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 1440 160"
                    preserveAspectRatio="none"
                    className="top-blue-curve"
                >
                    <path
                        fill="#ffffff"
                        d="M0,90 C480,-10 960,150 1440,70 L1440,0 L0,0 Z"
                    />
                    <path
                        fill="#005187"
                        d="M0,80 C480,-20 960,140 1440,60 L1440,0 L0,0 Z"
                    />
                </svg>
            </div>

            <div className="content">
                <BrowserRouter>
                    {/* Passa a posição do usuário para o Router */}
                    <Router 
                        route={route} 
                        bottomSheetHeight={bottomSheetHeight} 
                        userPosition={userPosition} 
                    />
                </BrowserRouter>
            </div>

            <BottomSheet
                onHeightChange={setBottomSheetHeight}
                onRouteCalculated={handleRouteCalculated}
                userPosition={userPosition} // Passa a posição do usuário
            />
        </div>
    );
};

export default App;