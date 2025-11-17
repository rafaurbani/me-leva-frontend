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
    displayName: string;
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

// Use Vercel proxy by default (relative `/api`) so browser requests come from
// the same origin and avoid CORS issues. Override with `VITE_API_BASE` in
// environment if you need to point elsewhere (e.g. local backend during dev).
const API_BASE_URL = (import.meta.env.VITE_API_BASE as string) || "/api";

// Temporary runtime debug to confirm which base URL the built client uses.
// Remove this after confirming production behavior.
console.warn("Using API_BASE_URL =", API_BASE_URL);

/**
 * Resolve the final fetch URL for a given API path.
 * - If `API_BASE_URL` is a relative path (starts with `/`) we use it directly.
 * - If it's an absolute URL and we're running on localhost, keep the absolute URL
 *   (so local development continues to call a local backend).
 * - If it's an absolute URL but a different origin from the page, convert it to
 *   a relative path using the absolute URL's pathname so the browser will call
 *   the same origin (and Vercel's rewrite/proxy will forward to the backend).
 */
const resolveApiUrl = (path: string): string => {
    // ensure path starts with '/'
    const ensurePath = (p: string) => (p.startsWith('/') ? p : `/${p}`);

    if (API_BASE_URL.startsWith('/')) {
        return `${API_BASE_URL.replace(/\/$/, '')}${ensurePath(path)}`;
    }

    try {
        const parsed = new URL(API_BASE_URL);
        const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

        if (isLocalhost) {
            // keep absolute URL for local development
            return `${API_BASE_URL.replace(/\/$/, '')}${ensurePath(path)}`;
        }

        if (parsed.origin === window.location.origin) {
            // same origin absolute URL — safe to use as-is
            return `${API_BASE_URL.replace(/\/$/, '')}${ensurePath(path)}`;
        }

        // different origin — convert to a relative path using the absolute URL's pathname
        const basePath = parsed.pathname.replace(/\/$/, '');
        return `${basePath}${ensurePath(path)}`;
    } catch (err) {
        // fallback — use API_BASE_URL directly
        return `${API_BASE_URL.replace(/\/$/, '')}${ensurePath(path)}`;
    }
};

/**
 * Busca a lista de prédios da API.
 */
export const fetchBuildings = async (): Promise<Building[]> => {
    try {
        const res = await fetch(resolveApiUrl('/buildings'));
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
        const res = await fetch(resolveApiUrl('/companies'));
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
        const res = await fetch(resolveApiUrl('/rooms'));
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
        const res = await fetch(resolveApiUrl('/paths/calculate'), {
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