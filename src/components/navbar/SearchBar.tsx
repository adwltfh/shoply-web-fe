export default function SearchBar() {
  return (
    <div className="flex-1 flex justify-center">
      <input
        type="text"
        placeholder="Search products..."
        className="w-8/12 border rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
      />
    </div>
  );
}
