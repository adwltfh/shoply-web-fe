export interface Category {
  name: string;
  slug: string;
  url: string;
}

export interface Product {
  id: number;
  title: string;
  slug: string;
  price: number;
  description: string;
  category: string;
  images: string[];
  creationAt: string;
  updatedAt: string;
}
