import React, { useState, useRef } from "react";

interface BottomSheetProps {
    children: React.ReactNode;
}

const BottomSheet: React.FC<BottomSheetProps> = ({ children }) => {
    const sheetRef = useRef<HTMLDivElement>(null);
    const startYRef = useRef<number | null>(null);
    const startHeightRef = useRef<number>(0);

    const maxHeight = window.innerHeight * 0.7; // 70% da tela
    const minHeight = 50; // apenas barra de puxar

    const [height, setHeight] = useState(minHeight);

    const onMouseDown = (e: React.MouseEvent) => {
        startYRef.current = e.clientY;
        startHeightRef.current = height;
        document.body.style.userSelect = "none"; // evita seleção de texto
        window.addEventListener("mousemove", onMouseMove);
        window.addEventListener("mouseup", onMouseUp);
    };

    const onTouchStart = (e: React.TouchEvent) => {
        startYRef.current = e.touches[0].clientY;
        startHeightRef.current = height;
        window.addEventListener("touchmove", onTouchMove, { passive: false });
        window.addEventListener("touchend", onTouchEnd);
    };

    const onMouseMove = (e: MouseEvent) => {
        if (startYRef.current === null) return;
        const delta = startYRef.current - e.clientY;
        let newHeight = startHeightRef.current + delta;
        if (newHeight > maxHeight) newHeight = maxHeight;
        if (newHeight < minHeight) newHeight = minHeight;
        setHeight(newHeight);
    };

    const onMouseUp = () => {
        snapHeight();
        startYRef.current = null;
        document.body.style.userSelect = "";
        window.removeEventListener("mousemove", onMouseMove);
        window.removeEventListener("mouseup", onMouseUp);
    };

    const onTouchMove = (e: TouchEvent) => {
        e.preventDefault(); // previne scroll da página
        if (startYRef.current === null) return;
        const delta = startYRef.current - e.touches[0].clientY;
        let newHeight = startHeightRef.current + delta;
        if (newHeight > maxHeight) newHeight = maxHeight;
        if (newHeight < minHeight) newHeight = minHeight;
        setHeight(newHeight);
    };

    const onTouchEnd = () => {
        snapHeight();
        startYRef.current = null;
        window.removeEventListener("touchmove", onTouchMove);
        window.removeEventListener("touchend", onTouchEnd);
    };

    const snapHeight = () => {
        // decide se fecha ou abre a aba
        if (height > maxHeight / 2) setHeight(maxHeight);
        else setHeight(minHeight);
    };

    return (
        <div
            ref={sheetRef}
            className="bottom-sheet"
            style={{ height: `${height}px` }}
        >
            <div
                className="drag-handle"
                onMouseDown={onMouseDown}
                onTouchStart={onTouchStart}
            />
            {children}
        </div>
    );
};

export default BottomSheet;
