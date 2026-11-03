import { EmptyState, LinkButton } from "@/components/ui";

export default function ProductNotFound() {
  return (
    <EmptyState
      title="Product not found"
      description="It may have been removed, or it belongs to a store you cannot access."
      action={<LinkButton href="/products">Back to products</LinkButton>}
    />
  );
}
