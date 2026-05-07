"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import { icons } from "lucide-react";
import { Category } from "@/types/product";

const CATEGORY_ICON_MAP: Record<string, keyof typeof icons> = {
  Beauty: "Sparkles",
  Fragrances: "Wind",
  Furniture: "Armchair",
  Groceries: "ShoppingBasket",
  "Home Decoration": "Lamp",
  "Kitchen Accessories": "UtensilsCrossed",
  Laptops: "Laptop",
  "Mens Shirts": "Shirt",
  "Mens Shoes": "Footprints",
  "Mens Watches": "Watch",
  "Mobile Accessories": "Smartphone",
  Motorcycle: "Bike",
  "Skin Care": "Droplets",
  Smartphones: "Smartphone",
  "Sports Accessories": "Dumbbell",
  Sunglasses: "Glasses",
  Tablets: "Tablet",
  Tops: "Shirt",
  Vehicle: "Car",
  "Womens Bags": "ShoppingBag",
  "Womens Dresses": "Shirt",
  "Womens Jewellery": "Gem",
  "Womens Shoes": "Footprints",
  "Womens Watches": "Watch",
  Electronics: "Cpu",
  Shoes: "Footprints",
  Clothes: "Shirt",
  Miscellaneous: "Package",
};
const DEFAULT_ICON: keyof typeof icons = "Tag";

const DESKTOP_COLS = 9;

function CategoryItem({
  name,
  icon,
  active,
  onClick,
}: {
  name: string;
  icon: keyof typeof icons;
  active?: boolean;
  onClick?: () => void;
}) {
  const IconComponent = icons[icon] || icons[DEFAULT_ICON];
  if (!IconComponent) return null;

  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center gap-2 group w-16 focus:outline-none"
    >
      <div
        className={`w-16 h-16 rounded-full flex items-center justify-center transition-all duration-200 ${
          active
            ? "bg-orange-100 ring-2 ring-orange-300"
            : "bg-gray-100 group-hover:bg-orange-50"
        }`}
      >
        <IconComponent
          className={`w-5 h-5 transition-colors duration-200 ${
            active
              ? "text-orange-500"
              : "text-gray-500 group-hover:text-orange-400"
          }`}
        />
      </div>
      <span
        className={`text-xs transition-colors duration-200 text-center leading-tight ${
          active ? "text-orange-500 font-medium" : "text-gray-500"
        }`}
      >
        {name}
      </span>
    </button>
  );
}

function MoreButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center gap-2 group w-16 focus:outline-none"
    >
      <div className="w-16 h-16 rounded-full bg-gray-100 ring-2 ring-orange-400 flex items-center justify-center group-hover:bg-orange-50 transition-all duration-200">
        <span className="text-sm font-bold text-orange-400 leading-none tracking-widest">
          •••
        </span>
      </div>
      <span className="text-xs text-orange-400 font-medium">More</span>
    </button>
  );
}

interface CategoriesProps {
  categories: Category[];
  isLoading: boolean;
}

export default function Categories({
  categories: rawCategories,
  isLoading,
}: CategoriesProps) {
  const router = useRouter();
  const [active, setActive] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(true);
  const [currentPage, setCurrentPage] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const carouselRef = useRef<HTMLDivElement>(null);
  const isScrollingRef = useRef(false);
  const scrollTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const categories = useMemo(
    () =>
      [...rawCategories]
        .filter((c) => !c.name.includes(" "))
        .sort((a, b) => a.name.localeCompare(b.name)),
    [rawCategories],
  );

  useEffect(() => {
    function calculate() {
      if (!containerRef.current) return;
      setIsMobile(containerRef.current.offsetWidth < 640);
    }
    calculate();
    const observer = new ResizeObserver(calculate);
    if (containerRef.current) observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  const goToPage = (page: number) => {
    if (!carouselRef.current) return;
    isScrollingRef.current = true;
    setCurrentPage(page);
    carouselRef.current.scrollTo({
      left: page * carouselRef.current.offsetWidth,
      behavior: "smooth",
    });
    if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
    scrollTimeoutRef.current = setTimeout(() => {
      isScrollingRef.current = false;
    }, 400);
  };

  const handleScroll = () => {
    if (isScrollingRef.current || !carouselRef.current) return;
    const pageWidth = carouselRef.current.offsetWidth;
    if (!pageWidth) return;
    setCurrentPage(Math.round(carouselRef.current.scrollLeft / pageWidth));
  };

  // Mobile pages
  const page1 = categories.slice(0, 5);
  const page2 = categories.slice(5, 9);
  const totalMobilePages = page2.length > 0 ? 2 : 1;

  // Desktop
  const desktopCats = categories.slice(0, DESKTOP_COLS);

  return (
    <section className="mt-8" ref={containerRef}>
      <p className="text-sm font-medium text-gray-500 mb-4">
        Browse categories
      </p>
      {isLoading ? (
        <div className="flex justify-between px-1">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex flex-col items-center gap-2 w-16">
              <div className="w-16 h-16 rounded-full bg-gray-100 animate-pulse" />
              <div className="h-2.5 w-10 rounded bg-gray-100 animate-pulse" />
            </div>
          ))}
        </div>
      ) : isMobile ? (
        /* ── Mobile: paginated carousel ── */
        <div>
          <div
            ref={carouselRef}
            onScroll={handleScroll}
            className="flex overflow-x-auto scrollbar-hide"
            style={{
              scrollSnapType: "x mandatory",
              WebkitOverflowScrolling: "touch",
            }}
          >
            {/* Page 1: 5 categories */}
            <div className="flex justify-between shrink-0 w-full snap-start px-1">
              {page1.map((category) => (
                <CategoryItem
                  key={category.name}
                  name={category.name}
                  icon={CATEGORY_ICON_MAP[category.name] || DEFAULT_ICON}
                  active={active === category.name}
                  onClick={() =>
                    setActive(active === category.name ? null : category.name)
                  }
                />
              ))}
            </div>

            {/* Page 2: 4 categories + More */}
            {page2.length > 0 && (
              <div className="flex justify-between shrink-0 w-full snap-start px-1">
                {page2.map((category) => (
                  <CategoryItem
                    key={category.name}
                    name={category.name}
                    icon={CATEGORY_ICON_MAP[category.name] || DEFAULT_ICON}
                    active={active === category.name}
                    onClick={() =>
                      setActive(active === category.name ? null : category.name)
                    }
                  />
                ))}
                <MoreButton onClick={() => router.push("/categories")} />
              </div>
            )}
          </div>

          {totalMobilePages > 1 && (
            <div className="flex justify-center gap-1.5 mt-4">
              {Array.from({ length: totalMobilePages }).map((_, i) => (
                <button
                  key={i}
                  onClick={() => goToPage(i)}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    i === currentPage
                      ? "bg-orange-500 w-6"
                      : "bg-gray-200 w-1.5"
                  }`}
                />
              ))}
            </div>
          )}
        </div>
      ) : (
        /* ── Desktop: 6 cols, always visible, More routes to /categories ── */
        <div className="flex flex-col gap-5">
          {/* Row 1: next 5 + More */}
          <div className="flex justify-between">
            {desktopCats.map((category) => (
              <CategoryItem
                key={category.name}
                name={category.name}
                icon={CATEGORY_ICON_MAP[category.name] || DEFAULT_ICON}
                active={active === category.name}
                onClick={() =>
                  setActive(active === category.name ? null : category.name)
                }
              />
            ))}
            <MoreButton onClick={() => router.push("/categories")} />
          </div>
        </div>
      )}
    </section>
  );
}
