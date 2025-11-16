import React from "react";
import "./SelectableButton.css";

interface SelectableButtonProps {
  icon: string;
  label: string;
  selected: boolean;
  onClick: () => void;
}

const SelectableButton: React.FC<SelectableButtonProps> = ({ icon, label, selected, onClick }) => {
  return (
    <div
      className={`selectable-button ${selected ? "selected" : ""}`}
      onClick={onClick}
    >
      <span className="icon">{icon}</span>
      <span className="label">{label}</span>
    </div>
  );
};

export default SelectableButton;
