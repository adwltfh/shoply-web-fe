import { useQuery } from '@tanstack/react-query';

import type { Category, Product } from '@/types/product';

export const CATEGORIES: { id: Category; label: string }[] = [
  { id: 'tees', label: 'Tees' },
  { id: 'hoodies', label: 'Hoodies' },
  { id: 'totes', label: 'Totes' },
  { id: 'pins', label: 'Pins' },
  { id: 'prints', label: 'Prints' },
  { id: 'stickers', label: 'Stickers' },
];

const APPAREL_SIZES = ['S', 'M', 'L', 'XL'];

/** Bundled demo catalog. Prices and stock are illustrative. */
export const PRODUCTS: Product[] = [
  {
    slug: 'static-tee',
    name: 'Static Tee',
    category: 'tees',
    price: 3200,
    sizes: APPAREL_SIZES,
    badge: 'new',
    art: { background: 'brand', ink: 'accent', glyph: { ios: 'bolt', android: 'bolt', web: 'bolt' }, label: 'Tee' },
    blurb: 'Two-color screen print of our TV-static lightning bolt on a heavyweight cotton blank.',
    details: ['100% cotton, 220 gsm', 'Hand screen printed', 'Boxy fit, size up for oversized'],
  },
  {
    slug: 'night-shift-hoodie',
    name: 'Night Shift Hoodie',
    category: 'hoodies',
    price: 6400,
    sizes: APPAREL_SIZES,
    badge: 'last-few',
    art: { background: 'accent', ink: 'highlight', glyph: { ios: 'moon.stars', android: 'nightlight', web: 'nightlight' }, label: 'Hood' },
    blurb: 'Brushed-back fleece with a glow-in-the-dark moon on the chest and a tour list on the back.',
    details: ['80% cotton / 20% poly', 'Glow ink chest print', 'Kangaroo pocket'],
  },
  {
    slug: 'canvas-tote',
    name: 'Canvas Tote',
    category: 'totes',
    price: 1800,
    art: { background: 'highlight', ink: 'brand', glyph: { ios: 'bag', android: 'shopping_bag', web: 'shopping_bag' }, label: 'Tote' },
    blurb: 'Big enough for records, groceries, or a laptop. Printed on both sides.',
    details: ['12 oz natural canvas', 'Long handles, over-the-shoulder', '38 × 42 cm'],
  },
  {
    slug: 'misprint-tee',
    name: 'Misprint Tee',
    category: 'tees',
    price: 2800,
    sizes: APPAREL_SIZES,
    badge: 'sold-out',
    art: { background: 'brandSoft', ink: 'brand', glyph: { ios: 'sparkles', android: 'auto_awesome', web: 'auto_awesome' }, label: 'Tee' },
    blurb: 'Every one is off-register on purpose. No two shirts print the same.',
    details: ['100% cotton, 180 gsm', 'Each print is unique', 'Regular fit'],
  },
  {
    slug: 'enamel-pin-set',
    name: 'Enamel Pin Set',
    category: 'pins',
    price: 1200,
    badge: 'new',
    art: { background: 'surface', ink: 'brand', glyph: { ios: 'star', android: 'star', web: 'star' }, label: 'Pins' },
    blurb: 'Three hard-enamel pins: a star, a lightning bolt, and a very small cat.',
    details: ['Hard enamel, gold plating', 'Double rubber clutch backs', 'Approx. 25 mm each'],
  },
  {
    slug: 'riso-poster-004',
    name: 'Riso Poster 004',
    category: 'prints',
    price: 2400,
    art: { background: 'canvas', ink: 'accent', glyph: { ios: 'photo', android: 'image', web: 'image' }, label: 'Print' },
    blurb: 'Two-color risograph print for Drop 004. Numbered edition of 100.',
    details: ['A3, 300 gsm uncoated', 'Pink + blue riso inks', 'Ships rolled in a tube'],
  },
  {
    slug: 'sticker-pack',
    name: 'Sticker Pack',
    category: 'stickers',
    price: 600,
    art: { background: 'highlight', ink: 'accent', glyph: { ios: 'seal', android: 'verified', web: 'verified' }, label: 'Stix' },
    blurb: 'Eight vinyl stickers for laptops, guitar cases, and water bottles.',
    details: ['Weatherproof vinyl', 'Matte finish', '5–8 cm each'],
  },
  {
    slug: 'garden-club-hoodie',
    name: 'Garden Club Hoodie',
    category: 'hoodies',
    price: 6200,
    sizes: APPAREL_SIZES,
    art: { background: 'brand', ink: 'highlight', glyph: { ios: 'leaf', android: 'eco', web: 'eco' }, label: 'Hood' },
    blurb: 'Puff-print flowers on a heavyweight hoodie. Members only (anyone can join).',
    details: ['Heavyweight fleece', 'Puff-ink print', 'Dropped shoulder'],
  },
  {
    slug: 'record-tote',
    name: 'Record Tote',
    category: 'totes',
    price: 2200,
    badge: 'last-few',
    art: { background: 'accent', ink: 'brand', glyph: { ios: 'opticaldisc', android: 'album', web: 'album' }, label: 'Tote' },
    blurb: 'Square-bottom tote sized for twelve-inch LPs. Reinforced handles.',
    details: ['16 oz canvas', 'Fits about 20 LPs', 'Inside pocket'],
  },
  {
    slug: 'tiny-cat-pin',
    name: 'Tiny Cat Pin',
    category: 'pins',
    price: 900,
    art: { background: 'brandSoft', ink: 'accent', glyph: { ios: 'pawprint', android: 'pets', web: 'pets' }, label: 'Pin' },
    blurb: 'A very small cat. Glitter ears.',
    details: ['Soft enamel', 'Glitter fill', '20 mm'],
  },
  {
    slug: 'coffee-zine-print',
    name: 'Coffee Zine Print',
    category: 'prints',
    price: 1600,
    art: { background: 'highlight', ink: 'text', glyph: { ios: 'cup.and.saucer', android: 'local_cafe', web: 'local_cafe' }, label: 'Print' },
    blurb: 'The cover of our coffee zine, reprinted as a small wall print.',
    details: ['A4, 250 gsm', 'Single color riso', 'Signed on the back'],
  },
  {
    slug: 'heart-sticker-sheet',
    name: 'Heart Sticker Sheet',
    category: 'stickers',
    price: 500,
    badge: 'new',
    art: { background: 'surface', ink: 'accent', glyph: { ios: 'heart', android: 'favorite', web: 'favorite' }, label: 'Stix' },
    blurb: 'A full sheet of small hearts in pink and blue. For notebooks and letters.',
    details: ['Paper sticker sheet', 'A6', '30 stickers'],
  },
];

export function getProduct(slug: string | undefined) {
  return PRODUCTS.find((p) => p.slug === slug);
}

export type ProductFilter = {
  category?: Category;
  query?: string;
};

export function filterProducts({ category, query }: ProductFilter = {}) {
  const q = query?.trim().toLowerCase();
  return PRODUCTS.filter(
    (p) =>
      (!category || p.category === category) &&
      (!q || p.name.toLowerCase().includes(q) || p.category.includes(q)),
  );
}

export function isCategory(value: unknown): value is Category {
  return CATEGORIES.some((c) => c.id === value);
}

// Catalog is bundled, so queries resolve immediately; React Query keeps the
// call sites ready for a real API later.
export function useProducts(filter: ProductFilter = {}) {
  return useQuery({
    queryKey: ['products', filter.category ?? null, filter.query ?? ''],
    queryFn: () => filterProducts(filter),
    initialData: () => filterProducts(filter),
  });
}

export function useProduct(slug: string | undefined) {
  return useQuery({
    queryKey: ['product', slug],
    queryFn: () => getProduct(slug) ?? null,
    initialData: () => getProduct(slug) ?? null,
  });
}
