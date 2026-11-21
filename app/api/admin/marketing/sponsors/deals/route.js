import { collectionHandlers, refreshMediaKit } from "@/lib/marketing/sponsors/crud";
import { DEAL_SCHEMA } from "@/lib/marketing/sponsors/schemas";

export const dynamic = "force-dynamic";

export const { GET, POST } = collectionHandlers("mk_sponsors_deals", DEAL_SCHEMA, {
  required: ["brand"],
  order: [["updated_at", false]],
  afterWrite: () => refreshMediaKit(),
});
