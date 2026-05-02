
"use client";


import Logo from "./Logo";
import SearchBar from "./SearchBar";
import NavIcons from "./NavIcons";

export default function Navbar() {
  return (
    <header className="w-full border-b bg-white sticky top-0 z-50">
      <div className="max-w-5xl mx-auto px-4 py-1 flex items-center gap-4">
        <Logo />
        <SearchBar />
        {/* <NavLinks /> */}
        <NavIcons />
      </div>
    </header>
  );
}