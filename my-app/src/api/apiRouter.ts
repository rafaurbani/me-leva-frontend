// src/api/apiRouter.ts

// Tipos que serão compartilhados entre a API e o componente
export interface Wing {
    code: string;
    centroid?: any;
}

export interface Building {
    id: string;
    number: number;
    campus: string;
    wings: Wing[];
}

export interface Company {
    id: string;
    name: string;
    category: { name: string; subCategory: string };
    products: string[];
    building: {
        displayName: string;
    } | null;
}

// --- ATUALIZAÇÃO AQUI ---
// Simplificamos a interface do Produto para o novo fluxo
export interface Product {
    id: string;
    name: string;
}

export interface Area {
    id: string;
    name: string;
    description?: string;
}

export interface Room {
    id: string;
    identifier: string;
    building: {
        displayName: string;
    };
}

export interface PathRequest {
    start: { lat: number; lng: number };
    destinationBuildingName: string;
}

const API_BASE_URL = "http://localhost:3000/api";

/**
 * Busca a lista de prédios da API.
 */
export const fetchBuildings = async (): Promise<Building[]> => {
    try {
        const res = await fetch(`${API_BASE_URL}/buildings`);
        if (!res.ok) {
            throw new Error(`HTTP error! status: ${res.status}`);
        }
        return await res.json();
    } catch (error) {
        console.error("Failed to fetch buildings:", error);
        throw error;
    }
};

/**
 * Busca a lista de empresas da API.
 */
export const fetchCompanies = async (): Promise<Company[]> => {
    try {
        const res = await fetch(`${API_BASE_URL}/companies`);
        if (!res.ok) {
            throw new Error(`HTTP error! status: ${res.status}`);
        }
        return await res.json();
    } catch (error)
    {
        console.error("Failed to fetch companies:", error);
        throw error;
    }
};

/**
 * Busca a lista de salas da API.
 */
export const fetchRooms = async (): Promise<Room[]> => {
    try {
        const res = await fetch(`${API_BASE_URL}/rooms`);
        if (!res.ok) {
            throw new Error(`HTTP error! status: ${res.status}`);
        }
        return await res.json();
    } catch (error) {
        console.error("Failed to fetch rooms:", error);
        throw error;
    }
};

/**
 * Envia uma requisição para calcular a rota para um prédio.
 * @param payload - Os dados da requisição, incluindo ponto de partida e destino.
 */
export const calculatePath = async (payload: PathRequest): Promise<any> => {
    try {
        const res = await fetch(`${API_BASE_URL}/paths/calculate`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
        });
        if (!res.ok) {
            throw new Error(`HTTP error! status: ${res.status}`);
        }
        return await res.json();
    } catch (error) {
        console.error("Path calculation failed:", error);
        throw error;
    }
};