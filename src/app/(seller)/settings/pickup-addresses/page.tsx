import type { Metadata } from "next";
import { Suspense } from "react";

import { PageHeader, PageSkeleton } from "@/components/ui";
import { canManageCatalog, getSellerContext } from "@/lib/auth/dal";
import { listPickupAddresses } from "@/lib/catalog/queries";

import { PickupAddressManager } from "./pickup-address-manager";

export const metadata: Metadata = { title: "Pickup addresses" };

export default function PickupAddressesPage() {
  return (
    <>
      <PageHeader
        title="Pickup addresses"
        description="Shipment origins used for courier quotes. This does not book a courier pickup. Street address and phone are never shown to buyers."
      />
      <Suspense fallback={<PageSkeleton label="Loading addresses…" />}>
        <Addresses />
      </Suspense>
    </>
  );
}

async function Addresses() {
  const ctx = await getSellerContext();
  const addresses = await listPickupAddresses(ctx);
  return <PickupAddressManager addresses={addresses} canManage={canManageCatalog(ctx)} />;
}
