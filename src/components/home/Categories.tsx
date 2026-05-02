"use client";

import { useState, useEffect, useRef } from "react";
import { categories } from "@/types/categories";
import { icons, X } from "lucide-react";

const MOBILE_VISIBLE = 4;
const ITEM_MIN_WIDTH = 72;

function CategoryItem({
  name,
  icon,
  active,
  onClick,
}: {
  name: string;
  icon: string;
  active?: boolean;
  onClick?: () => void;
}) {
  const IconComponent = icons[icon as keyof typeof icons];
  if (!IconComponent) return null;

  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center gap-2 group focus:outline-none w-full"
    >
      <div
        className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-200 mx-auto
          ${active
            ? "bg-orange-500 shadow-md shadow-orange-200"
            : "bg-gray-100 group-hover:bg-orange-50 group-hover:shadow-sm"
          }`}
      >
        <IconComponent
          className={`w-6 h-6 transition-colors duration-200 ${
            active ? "text-white" : "text-gray-500 group-hover:text-orange-400"
          }`}
        />
      </div>
      <span
        className={`text-xs font-medium transition-colors duration-200 whitespace-nowrap ${
          active ? "text-orange-500" : "text-gray-500 group-hover:text-gray-700"
        }`}
      >
        {name}
      </span>
    </button>
  );
}

export default function Categories() {
  const [active, setActive] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);
  const [visibleCount, setVisibleCount] = useState(MOBILE_VISIBLE);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function calculate() {
      if (!containerRef.current) return;
      const containerWidth = containerRef.current.offsetWidth;

      if (containerWidth < 640) {
        setVisibleCount(MOBILE_VISIBLE);
        return;
      }

      // Reserve one slot for "More" button, fit the rest
      const fits = Math.floor(containerWidth / ITEM_MIN_WIDTH) - 1;
      const capped = Math.min(Math.max(fits, 1), categories.length);
      setVisibleCount(capped);
    }

    calculate();
    const observer = new ResizeObserver(calculate);
    if (containerRef.current) observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  const hasMore = visibleCount < categories.length;
  const visibleCategories = categories.slice(0, visibleCount);

  const moreButton = (
    <button
      onClick={() => setExpanded(true)}
      className="flex flex-col items-center gap-2 group focus:outline-none w-full"
    >
      <div className="w-14 h-14 rounded-2xl bg-background flex items-center justify-center group-hover:bg-orange-50 transition-all duration-200 mx-auto">
        <span className="text-lg font-bold text-gray-400 group-hover:text-orange-400 leading-none">
          •••
        </span>
      </div>
      <span className="text-xs font-medium text-gray-500 group-hover:text-gray-700">
        More
      </span>
    </button>
  );

  return (
    <section className="mt-8" ref={containerRef}>
      {!expanded ? (
        <div
          className="grid gap-2"
          style={{
            gridTemplateColumns: `repeat(${visibleCategories.length + (hasMore ? 1 : 0)}, 1fr)`,
          }}
        >
          {visibleCategories.map((category) => (
            <CategoryItem
              key={category.name}
              name={category.name}
              icon={category.icon}
              active={active === category.name}
              onClick={() =>
                setActive(active === category.name ? null : category.name)
              }
            />
          ))}
          {hasMore && moreButton}
        </div>
      ) : (
        <div className="relative bg-gray-50 rounded-2xl p-5 animate-in fade-in duration-200">
          <button
            onClick={() => setExpanded(false)}
            className="absolute top-4 right-4 flex items-center gap-1 text-xs text-gray-400 hover:text-orange-500 transition-colors duration-200 focus:outline-none"
          >
            <X className="w-3.5 h-3.5" />
            <span>close</span>
          </button>

          <div className="grid grid-cols-4 sm:grid-cols-6 gap-x-2 gap-y-5 mt-2">
            {categories.map((category) => (
              <CategoryItem
                key={category.name}
                name={category.name}
                icon={category.icon}
                active={active === category.name}
                onClick={() =>
                  setActive(active === category.name ? null : category.name)
                }
              />
            ))}
          </div>
        </div>
      )}
    </section>
  );
}