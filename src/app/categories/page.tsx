import Link from "next/link";
import {
  Laptop,
  Smartphone,
  Tablet,
  Cpu,
  Shirt,
  Footprints,
  Watch,
  ShoppingBag,
  Gem,
  Sparkles,
  Wind,
  Droplets,
  Armchair,
  Lamp,
  UtensilsCrossed,
  ShoppingBasket,
  Dumbbell,
  Bike,
  Car,
  Glasses,
  Tag,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

type Category = {
  slug: string;
  name: string;
  url: string;
};

type Group = {
  label: string;
  slugs: string[];
};

const CATEGORY_GROUPS: Group[] = [
  {
    label: "Electronics",
    slugs: ["laptops", "smartphones", "tablets", "mobile-accessories"],
  },
  {
    label: "Fashion",
    slugs: [
      "mens-shirts",
      "mens-shoes",
      "mens-watches",
      "tops",
      "womens-bags",
      "womens-dresses",
      "womens-jewellery",
      "womens-shoes",
      "womens-watches",
    ],
  },
  {
    label: "Beauty & Wellness",
    slugs: ["beauty", "fragrances", "skin-care"],
  },
  {
    label: "Home & Living",
    slugs: ["furniture", "home-decoration", "kitchen-accessories"],
  },
  {
    label: "Food & Daily Needs",
    slugs: ["groceries"],
  },
  {
    label: "Sports & Vehicles",
    slugs: ["sports-accessories", "motorcycle", "vehicle", "sunglasses"],
  },
];

const SLUG_ICON_MAP: Record<string, LucideIcon> = {
  laptops: Laptop,
  smartphones: Smartphone,
  tablets: Tablet,
  "mobile-accessories": Cpu,
  "mens-shirts": Shirt,
  "mens-shoes": Footprints,
  "mens-watches": Watch,
  tops: Shirt,
  "womens-bags": ShoppingBag,
  "womens-dresses": Shirt,
  "womens-jewellery": Gem,
  "womens-shoes": Footprints,
  "womens-watches": Watch,
  beauty: Sparkles,
  fragrances: Wind,
  "skin-care": Droplets,
  furniture: Armchair,
  "home-decoration": Lamp,
  "kitchen-accessories": UtensilsCrossed,
  groceries: ShoppingBasket,
  "sports-accessories": Dumbbell,
  motorcycle: Bike,
  vehicle: Car,
  sunglasses: Glasses,
};

async function getCategories(): Promise<Category[]> {
  const res = await fetch("https://dummyjson.com/products/categories", {
    next: { revalidate: 3600 },
  });
  if (!res.ok) throw new Error("Failed to fetch categories");
  return res.json();
}

export default async function CategoriesPage() {
  const categories = await getCategories();
  const categoryBySlug = Object.fromEntries(categories.map((c) => [c.slug, c]));

  // Collect slugs already assigned to a group
  const groupedSlugs = new Set(CATEGORY_GROUPS.flatMap((g) => g.slugs));
  const otherCategories = categories.filter((c) => !groupedSlugs.has(c.slug));

  return (
    <main className="pb-12 pt-6 space-y-8">
      <div>
        <h1 className="text-xl font-semibold text-gray-900">All Categories</h1>
        <p className="text-sm text-gray-400 mt-0.5">
          {categories.length} categories
        </p>
      </div>

      {CATEGORY_GROUPS.map((group) => {
        const items = group.slugs
          .map((slug) => categoryBySlug[slug])
          .filter(Boolean) as Category[];
        if (items.length === 0) return null;

        return (
          <section key={group.label}>
            <h2 className="text-xs font-semibold tracking-widest text-gray-400 uppercase mb-3">
              {group.label}
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
              {items.map((category) => {
                const ItemIcon = SLUG_ICON_MAP[category.slug] ?? Tag;
                return (
                  <Link
                    key={category.slug}
                    href={`/categories/${category.slug}`}
                    className="group flex items-center gap-3 px-4 py-3.5 rounded-xl border border-gray-200 bg-white hover:border-orange-300 hover:bg-orange-50 transition-all duration-150"
                  >
                    <ItemIcon
                      size={17}
                      className="text-gray-500 group-hover:text-orange-500 transition-colors flex-shrink-0"
                    />
                    <span className="text-sm text-gray-700 group-hover:text-gray-900 capitalize">
                      {category.name}
                    </span>
                  </Link>
                );
              })}
            </div>
          </section>
        );
      })}

      {otherCategories.length > 0 && (
        <section>
          <h2 className="text-xs font-semibold tracking-widest text-gray-400 uppercase mb-3">
            Other
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
            {otherCategories.map((category) => (
              <Link
                key={category.slug}
                href={`/categories/${category.slug}`}
                className="group flex items-center gap-3 px-4 py-3.5 rounded-xl border border-gray-200 bg-white hover:border-orange-300 hover:bg-orange-50 transition-all duration-150"
              >
                <Tag
                  size={17}
                  className="text-gray-500 group-hover:text-orange-500 transition-colors flex-shrink-0"
                />
                <span className="text-sm text-gray-700 group-hover:text-gray-900 capitalize">
                  {category.name}
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
