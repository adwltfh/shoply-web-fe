import type { Metadata } from 'expo-router/server';

export const SITE_NAME = 'Loose Thread Supply';
export const SITE_DESCRIPTION =
  'Small-batch tees, totes, pins, and riso prints from an independent print shop. A demo storefront.';

type PageMetadataOptions = {
  /** Set false for personal or transactional pages (cart, saved, checkout). */
  index?: boolean;
};

/** Static-render metadata for a route. Used from each route's `generateMetadata` export. */
export function pageMetadata(
  title: string | null,
  description: string = SITE_DESCRIPTION,
  { index = true }: PageMetadataOptions = {},
): Metadata {
  return {
    title: title ? `${title} · ${SITE_NAME}` : `${SITE_NAME} — Small batch. Loud print.`,
    description,
    ...(index ? {} : { robots: { index: false, follow: true } }),
  };
}
