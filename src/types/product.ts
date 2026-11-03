import type { SymbolViewProps } from 'expo-symbols';

import type { ColorToken } from '@/design-system';

export type Category = 'tees' | 'hoodies' | 'totes' | 'pins' | 'prints' | 'stickers';

export type ProductBadge = 'new' | 'last-few' | 'sold-out';

/** Recipe for the code-drawn placeholder image (no image files yet). */
export type ProductArtRecipe = {
  background: ColorToken;
  /** Second ink for the misregistered label and halftone dots. */
  ink: ColorToken;
  glyph: SymbolViewProps['name'];
  /** Short word printed on the tile, e.g. "TEE". */
  label: string;
};

export type Product = {
  slug: string;
  name: string;
  category: Category;
  /** Price in cents. */
  price: number;
  /** Omitted for one-size items. */
  sizes?: string[];
  badge?: ProductBadge;
  art: ProductArtRecipe;
  blurb: string;
  details: string[];
};
