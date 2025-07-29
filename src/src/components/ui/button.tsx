export function Button({ children, ...props }) {
  return (
    <button
      className="px-4 py-2 bg-pink-600 text-white rounded hover:bg-pink-700 focus:outline-none focus:ring-2 focus:ring-pink-500"
      {...props}
    >
      {children}
    </button>
  );
}