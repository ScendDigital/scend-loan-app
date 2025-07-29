import DropdownMenu from "./DropdownMenu";

export default function Navbar() {
  return (
    <div className="p-6">
      <h1 className="text-xl font-bold mb-4">Welcome to Scend</h1>
      <DropdownMenu />
    </div>
  );
}