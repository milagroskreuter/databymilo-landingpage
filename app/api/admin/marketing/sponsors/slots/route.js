import { collectionHandlers, refreshMediaKit } from "@/lib/marketing/sponsors/crud";
import { SLOT_SCHEMA } from "@/lib/marketing/sponsors/schemas";

export const dynamic = "force-dynamic";

export const { GET, POST } = collectionHandlers("mk_sponsors_slots", SLOT_SCHEMA, {
  required: ["slot_date", "channel"],
  order: [["slot_date", true]],
  afterWrite: () => refreshMediaKit(),
});
