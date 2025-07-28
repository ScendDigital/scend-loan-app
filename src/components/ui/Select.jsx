import React from "react";

export function Select({ children, ...props }) {
  return (
    <select
      className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
      {...props}
    >
      {children}
    </select>
  );
}

export function SelectTrigger({ children, ...props }) {
  // If you want a styled div or button trigger for custom dropdowns
  return (
    <button
      type="button"
      className="w-full flex justify-between items-center px-3 py-2 border border-gray-300 rounded bg-white focus:outline-none focus:ring-2 focus:ring-pink-500"
      {...props}
    >
      {children}
    </button>
  );
}

export function SelectValue({ children }) {
  return <span>{children}</span>;
}

export function SelectContent({ children }) {
  return (
    <div className="absolute bg-white border border-gray-300 rounded shadow mt-1 z-10">
      {children}
    </div>
  );
}

export function SelectItem({ children, ...props }) {
  return (
    <div
      className="px-3 py-2 hover:bg-pink-100 cursor-pointer"
      role="option"
      tabIndex={0}
      {...props}
    >
      {children}
    </div>
  );
}
