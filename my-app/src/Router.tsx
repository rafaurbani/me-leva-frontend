import { Route, Routes } from 'react-router-dom';
import { Leaflet } from "./pages/Leaflet";
import type { RouteData, UserPosition } from './App'; // Importa UserPosition

interface RouterProps {
    bottomSheetHeight: number;
    route: RouteData | null;
    userPosition: UserPosition | null; // Adiciona a prop
}

const Router = ({ bottomSheetHeight, route, userPosition }: RouterProps) => {
    return (
        <Routes>
            <Route
                path="/"
                element={<Leaflet 
                    route={route} 
                    bottomSheetHeight={bottomSheetHeight} 
                    userPosition={userPosition} // Passa para o Leaflet
                />}
            />
            {/* Adicionar a rota NotFound aqui --> se necessário */}
            {/* <Route path='*' element={<NotFound/>}/> */}
        </Routes>
    )
}

export { Router }