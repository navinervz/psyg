import { Store as StoreIcon } from "lucide-react";
import { stores } from "@/lib/reference";
import type { Store, StoreId } from "@/lib/types";
import { cn } from "@/lib/cn";

const BY_ID = Object.fromEntries(
  stores.map((store) => [store.id, store]),
) as Record<StoreId, Store>;

/** نام فروشگاه زیر عنوان محصول */
export function StoreTag({
  store,
  className,
}: {
  store: StoreId;
  className?: string;
}) {
  const info = BY_ID[store];

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 text-xs font-medium text-mid",
        className,
      )}
    >
      <StoreIcon className="size-3.5 text-low" strokeWidth={1.8} />
      {info?.displayName ?? store}
    </span>
  );
}

export { BY_ID as storesById };
