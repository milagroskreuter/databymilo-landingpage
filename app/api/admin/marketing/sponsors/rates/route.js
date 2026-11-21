import { collectionHandlers, refreshMediaKit } from "@/lib/marketing/sponsors/crud";
import { RATE_SCHEMA } from "@/lib/marketing/sponsors/schemas";

export const dynamic = "force-dynamic";

export const { GET, POST } = collectionHandlers("mk_sponsors_rates", RATE_SCHEMA, {
  required: ["name"],
  order: [["sort_order", true], ["created_at", true]],
  afterWrite: () => refreshMediaKit(),
});
