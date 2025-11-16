import React, { useState, useRef, useEffect } from "react";
import "./BottomSheet.css";
import SearchBar from "./SearchBar.tsx";
import SelectableButton from "./SelectableButton.tsx";
import { fetchBuildings, fetchCompanies, calculatePath, fetchRooms } from "../api/apiRouter.ts";
import type { Product, Company, Room, Area } from "../api/apiRouter.ts";
import type { Building, PathRequest } from "../api/apiRouter";
import type { RouteData, UserPosition } from "../App"; // Importa UserPosition
import L from "leaflet"; // Importa L para usar LatLngBounds

// Funções de busca de dados
const fetchAreas = async (): Promise<Area[]> => {
    try {
        const companies = await fetchCompanies();
        const categoryNames = new Set(companies.map(c => c.category.name));
        return Array.from(categoryNames).sort().map(name => ({ id: name, name }));
    } catch (error) {
        console.error(error);
        return [];
    }
};

const fetchUniqueProducts = async (): Promise<Product[]> => {
    try {
        const companies = await fetchCompanies();
        const allProductNames = companies.flatMap(c => c.products);
        const uniqueNames = new Set(allProductNames);
        return Array.from(uniqueNames).sort().map(name => ({ id: name, name }));
    } catch (error) {
        console.error(error);
        return [];
    }
};

const normalizeText = (text: string) => {
    return text
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");
};

const SNAP_POINTS_PERCENT = [0.1, 0.4, 0.85];

// Limites da área mapeada (copiado de Leaflet.tsx)
const TECNOPUC_BOUNDS: L.LatLngBounds = new L.LatLngBounds(
    [-30.063, -51.175], // Sudoeste
    [-30.057, -51.169]  // Nordeste
);

// Posição padrão (entrada do Tecnopuc) se o usuário estiver fora dos limites
const DEFAULT_START_POSITION: UserPosition = { 
    lat: -30.059762130905092, 
    lng: -51.171838045120246 
};

interface Props {
    onHeightChange?: (height: number) => void;
    onRouteCalculated: (route: RouteData | null) => void;
    userPosition: UserPosition | null; // Recebe a posição do usuário
}

const BottomSheet: React.FC<Props> = ({ onHeightChange, onRouteCalculated, userPosition }) => {
    // ... (Hooks de estado: height, viewportHeight, isDragging, selected, data, etc.) ...
    const [height, setHeight] = useState(0);
    const [viewportHeight, setViewportHeight] = useState(0);
    const [isDragging, setIsDragging] = useState(false);
    const [selected, setSelected] = useState<string | null>(null);
    const [buildings, setBuildings] = useState<Building[]>([]);
    const [companies, setCompanies] = useState<Company[]>([]);
    const [products, setProducts] = useState<Product[]>([]);
    const [areas, setAreas] = useState<Area[]>([]);
    const [rooms, setRooms] = useState<Room[]>([]);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const dragInfo = useRef({ startY: 0, initialHeight: 0 });
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
    const [selectedArea, setSelectedArea] = useState<Area | null>(null);
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const scrollPositionRef = useRef(0);
    
    // ... (useEffect de resize, onHeightChange, overflow, fetchData, etc. - sem alterações) ...
        
    useEffect(() => {
        const handleResize = () => setViewportHeight(window.innerHeight);
        handleResize();
        setHeight(SNAP_POINTS_PERCENT[0] * window.innerHeight);
        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, []);

    useEffect(() => onHeightChange?.(height), [height, onHeightChange]);

    useEffect(() => {
        const isExpanded = height > SNAP_POINTS_PERCENT[0] * viewportHeight + 5;
        document.body.style.overflow = isExpanded ? "hidden" : "";
        return () => { document.body.style.overflow = ""; };
    }, [height, viewportHeight]);

    useEffect(() => {
        if (!selected) return;
        setLoading(true);

        const fetchData = async () => {
            try {
                if (selected === "Prédio") setBuildings(await fetchBuildings());
                else if (selected === "Empresa") setCompanies(await fetchCompanies());
                else if (selected === "Sala") setRooms(await fetchRooms());
                else if (selected === "Área") setAreas(await fetchAreas());
                else if (selected === "Produto") setProducts(await fetchUniqueProducts());
            } catch (err) {
                console.error("Fetch error:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [selected]);
    
    useEffect(() => {
        const needsCompanies = selected === 'Produto' || selected === 'Área';
        if (needsCompanies && !companies.length) {
            fetchCompanies().then(setCompanies);
        }
    }, [selected, companies.length]);

    useEffect(() => {
        const shouldRestore = (selected === "Produto" && !selectedProduct) || (selected === "Área" && !selectedArea);
        if (shouldRestore && scrollContainerRef.current) {
            setTimeout(() => {
                if (scrollContainerRef.current) {
                    scrollContainerRef.current.scrollTop = scrollPositionRef.current;
                }
            }, 0);
        }
    }, [selectedProduct, selectedArea, selected]);
    
    // *** INÍCIO DA LÓGICA CORRIGIDA ***
    /**
     * Retorna a posição de partida para o cálculo da rota.
     * De acordo com a regra de negócio, a rota deve SEMPRE
     * começar da entrada padrão do Tecnopuc.
     */
    const getStartPosition = (): UserPosition => {
        // A lógica de verificação agora é usada apenas para fins de log,
        // mas o retorno é sempre a posição padrão.
        if (userPosition && TECNOPUC_BOUNDS.contains([userPosition.lat, userPosition.lng])) {
            console.log("Usuário dentro dos limites. Usando posição padrão (entrada) para rota, conforme solicitado.");
        } else {
             console.warn("Usuário fora dos limites ou localização nula. Usando posição padrão (entrada) para rota.");
        }
        
        // Retorna sempre a posição fixa
        return DEFAULT_START_POSITION;
    };
    // *** FIM DA LÓGICA CORRIGIDA ***

    
    const handleCalculatePathForCompany = async (company: Company) => {
        if (!company.building?.displayName) { alert("A localização do prédio para esta empresa não foi encontrada."); return; }
        
        const startPosition = getStartPosition();
        const payload: PathRequest = { start: startPosition, destinationBuildingName: company.building.displayName };
        
        try { const data = await calculatePath(payload); onRouteCalculated(data); setHeight(SNAP_POINTS_PERCENT[0] * viewportHeight); } catch (error) { console.error("Ocorreu um erro ao calcular a rota para a empresa:", error); onRouteCalculated(null); alert("Ocorreu um erro ao calcular a rota para a empresa."); }
    };
    
    const handleCalculatePath = async (building: Building) => {
        const startPosition = getStartPosition();
        const payload: PathRequest = { start: startPosition, destinationBuildingName: building.displayName };
        
        try { const data = await calculatePath(payload); onRouteCalculated(data); setHeight(SNAP_POINTS_PERCENT[0] * viewportHeight); } catch (error) { console.error("Path calculation failed:", error); onRouteCalculated(null); alert("Ocorreu um erro ao calcular a rota."); }
    };

    const handleCalculatePathForRoom = async (room: Room) => {
        const startPosition = getStartPosition();
        const payload: PathRequest = { start: startPosition, destinationBuildingName: room.building.displayName };

        try { const data = await calculatePath(payload); onRouteCalculated(data); setHeight(SNAP_POINTS_PERCENT[0] * viewportHeight); } catch (error) { console.error("Path calculation for room failed:", error); onRouteCalculated(null); alert("Ocorreu um erro ao calcular a rota para a sala."); }
    };

    // ... (Restante do componente: handleSelectCategory, handleItemSelect, handleBackClick, handleDrag, filtros, JSX) ...
    
    const handleSelectCategory = (label: string) => {
        setSelected(label);
        setSelectedProduct(null);
        setSelectedArea(null);
        setSearchTerm("");
        onRouteCalculated(null);
    };

    const handleItemSelect = (setter: (item: any) => void, item: any) => {
        if (scrollContainerRef.current) {
            scrollPositionRef.current = scrollContainerRef.current.scrollTop;
        }
        setter(item);
    };
    
    const handleBackClick = (setter: (value: null) => void) => {
        setter(null);
    }

    const handleDragStart = (e: React.PointerEvent<HTMLDivElement>) => { setIsDragging(true); dragInfo.current = { startY: e.clientY, initialHeight: height }; e.currentTarget.setPointerCapture(e.pointerId); };
    const handleDragMove = (e: React.PointerEvent<HTMLDivElement>) => { if (!isDragging || viewportHeight === 0) return; const newHeight = dragInfo.current.initialHeight - (e.clientY - dragInfo.current.startY); setHeight(Math.max(SNAP_POINTS_PERCENT[0] * viewportHeight, Math.min(newHeight, SNAP_POINTS_PERCENT[2] * viewportHeight))); };
    const handleDragEnd = (e: React.PointerEvent<HTMLDivElement>) => { if (!isDragging) return; setIsDragging(false); e.currentTarget.releasePointerCapture(e.pointerId); const snapPoints = SNAP_POINTS_PERCENT.map((p) => p * viewportHeight); const targetHeight = snapPoints.reduce((prev, curr) => Math.abs(curr - height) < Math.abs(prev - height) ? curr : prev); setHeight(targetHeight); };
    
    const normalizedSearchTerm = normalizeText(searchTerm);

    const filteredBuildings = buildings.filter(b => normalizeText(`prédio ${b.number} ${b.campus} ${b.displayName}`).includes(normalizedSearchTerm));
    const filteredCompanies = companies.filter(c => { const buildingName = c.building?.displayName || ''; return normalizeText(`${c.name} ${c.category.name} ${c.category.subCategory} ${buildingName}`).includes(normalizedSearchTerm) });
    const filteredProducts = products.filter(p => normalizeText(p.name).includes(normalizedSearchTerm));
    const filteredAreas = areas.filter(a => normalizeText(a.name).includes(normalizedSearchTerm));
    const filteredRooms = rooms.filter(r => normalizeText(`sala ${r.identifier} ${r.building.displayName}`).includes(normalizedSearchTerm));

    const companiesWithSelectedProduct = selectedProduct ? companies.filter(c => c.products.includes(selectedProduct.name) && normalizeText(c.name).includes(normalizedSearchTerm)) : [];
    const companiesInSelectedArea = selectedArea ? companies.filter(c => c.category.name === selectedArea.name && normalizeText(c.name).includes(normalizedSearchTerm)) : [];

    return (
        <div className="bottom-sheet" style={{ height: `${height}px`, transition: isDragging ? "none" : "height 0.3s ease-out" }}>
            <div className="drag-handle" onPointerDown={handleDragStart} onPointerMove={handleDragMove} onPointerUp={handleDragEnd} onPointerCancel={handleDragEnd} />
            <div className="bottom-sheet-content" ref={scrollContainerRef}>
                <SearchBar placeholder="Onde vamos?" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                <div className="button-group">
                    {["Prédio", "Empresa", "Sala", "Área", "Produto"].map((label) => (
                        <SelectableButton key={label} icon={label === "Prédio" ? "🏢" : label === "Empresa" ? "💼" : label === "Sala" ? "🚪" : label === "Área" ? "🧩" : "📦"} label={label} selected={selected === label} onClick={() => handleSelectCategory(label)} />
                    ))}
                </div>
                
                <div style={{ padding: "1rem" }}>
                    {loading && <p>Carregando...</p>}
                    {!loading && selected === "Prédio" && (<div className="list-container">{filteredBuildings.map(b => ( <div key={b.id} className="card-item" onClick={() => handleCalculatePath(b)}> <div className="card-header"> <span className="icon">🏢</span> <div className="card-info"> <h3>{b.number === 0 ? b.displayName : `Prédio ${b.number}`}</h3> <p>{b.campus}</p> {b.wings.length > 0 && <p className="muted">Wings: {b.wings.map(w => w.code).join(", ")}</p>} </div> </div> </div> ))}</div> )}
                    
                    {!loading && selected === "Empresa" && (
                        <div className="list-container">
                            {filteredCompanies.map(c => ( 
                                <div key={c.id} className="card-item" onClick={() => handleCalculatePathForCompany(c)}> 
                                    <div className="card-header"> 
                                        <span className="icon">💼</span> 
                                        <div className="card-info"> 
                                            <h3>{c.name}</h3> 
                                            <p>{c.category.name}</p> 
                                            <p className="muted">{c.category.subCategory}</p> 
                                            {c.building && <p className="muted">Prédio: {c.building.displayName}</p>} 
                                        </div> 
                                    </div> 
                                    {c.products.length > 0 && (
                                        <div className="product-list">
                                            <span className="muted">{c.products.length > 1 ? "Produtos:" : "Produto:"}</span>
                                            {c.products.map(product => (
                                                <p key={product} className="product-name">{product}</p>
                                            ))}
                                        </div>
                                    )} 
                                </div> 
                            ))}
                        </div>
                    )}

                    {!loading && selected === "Sala" && (<div className="list-container">{filteredRooms.map((r) => (<div key={r.id} className="card-item" onClick={() => handleCalculatePathForRoom(r)}><div className="card-header"><span className="icon">🚪</span><div className="card-info"><h3>Sala {r.identifier}</h3><p className="muted">Localizada no: {r.building.displayName}</p></div></div></div>))}</div>)}
                    
                    {!loading && selected === "Produto" && (
                        <>
                            {selectedProduct ? (
                                <>
                                    <div style={{ display: 'flex', alignItems: 'center', marginBottom: '1rem' }}>
                                        <button onClick={() => handleBackClick(setSelectedProduct)} style={{ marginRight: '1rem', background: 'none', border: '1px solid #ccc', borderRadius: '8px', padding: '4px 8px', cursor: 'pointer' }}>← Voltar</button>
                                        <h3 style={{ margin: 0 }}>Empresas com: {selectedProduct.name}</h3>
                                    </div>
                                    <div className="list-container">
                                        {companiesWithSelectedProduct.map(c => ( <div key={c.id} className="card-item" onClick={() => handleCalculatePathForCompany(c)}> <div className="card-header"><span className="icon">💼</span><div className="card-info"><h3>{c.name}</h3><p>{c.category.name}</p>{c.building && <p className="muted">Prédio: {c.building.displayName}</p>}</div></div> </div> ))}
                                    </div>
                                </>
                            ) : (
                                <div className="list-container">
                                    {filteredProducts.map(p => ( <div key={p.id} className="card-item" onClick={() => handleItemSelect(setSelectedProduct, p)}> <div className="card-header"><span className="icon">📦</span><div className="card-info"><h3>{p.name}</h3></div></div> </div> ))}
                                </div>
                            )}
                        </>
                    )}
                    
                    {!loading && selected === "Área" && (
                         <>
                            {selectedArea ? (
                                <>
                                    <div style={{ display: 'flex', alignItems: 'center', marginBottom: '1rem' }}>
                                        <button onClick={() => handleBackClick(setSelectedArea)} style={{ marginRight: '1rem', background: 'none', border: '1px solid #ccc', borderRadius: '8px', padding: '4px 8px', cursor: 'pointer' }}>← Voltar</button>
                                        <h3 style={{ margin: 0 }}>Empresas em: {selectedArea.name}</h3>
                                    </div>
                                    <div className="list-container">
                                        {companiesInSelectedArea.map(c => ( <div key={c.id} className="card-item" onClick={() => handleCalculatePathForCompany(c)}> <div className="card-header"><span className="icon">💼</span><div className="card-info"><h3>{c.name}</h3><p className="muted">{c.category.subCategory}</p>{c.building && <p className="muted">Prédio: {c.building.displayName}</p>}</div></div> </div> ))}
                                    </div>
                                </>
                            ) : (
                                <div className="list-container">
                                    {filteredAreas.map(a => ( <div key={a.id} className="card-item" onClick={() => handleItemSelect(setSelectedArea, a)}> <div className="card-header"><span className="icon">🧩</span><div className="card-info"><h3>{a.name}</h3></div></div> </div> ))}
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default BottomSheet;