import React from 'react';

export default function Button({ onClick, children, variant = "primary", className = "" }) {
  const baseStyles = "px-4 py-2 rounded font-medium focus:outline-none transition";

  const variants = {
    primary: "bg-pink-600 text-white hover:bg-pink-700",
    outline: "border border-pink-600 text-pink-600 hover:bg-pink-50",
  };

  return (
    <button
      onClick={onClick}
      className={`${baseStyles} ${variants[variant] || ""} ${className}`}
    >
      {children}
    </button>
  );
}
