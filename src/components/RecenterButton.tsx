import React from "react";
import "./RecenterButton.css";
import recentralizarIcon from "../assets/recentralizar.png"; // importa a imagem

interface Props {
  onRecenter: () => void;
  bottomOffset?: number; // altura dinâmica da BottomSheet
}

const RecenterButton: React.FC<Props> = ({ onRecenter, bottomOffset = 16 }) => {
  return (
    <button
      className="recenter-button"
      style={{
        bottom: bottomOffset, // ajusta dinamicamente
      }}
      onClick={onRecenter}
      aria-label="Recenter Map"
    >
      <img
        src={recentralizarIcon}
        alt="Recenter"
        className="recenter-icon"
      />
    </button>
  );
};

export default RecenterButton;
