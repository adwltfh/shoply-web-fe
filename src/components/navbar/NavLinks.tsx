const links = ["Home", "Categories", "Deals"];

export default function NavLinks() {
  return (
    <nav className="hidden md:flex gap-6 text-sm text-gray-600">
      {links.map((link) => (
        <a
          key={link}
          href="#"
          className="hover:text-orange-500 transition"
        >
          {link}
        </a>
      ))}
    </nav>
  );
}