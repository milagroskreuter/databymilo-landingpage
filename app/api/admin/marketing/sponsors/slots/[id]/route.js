import { itemHandlers, refreshMediaKit } from "@/lib/marketing/sponsors/crud";
import { SLOT_SCHEMA } from "@/lib/marketing/sponsors/schemas";

export const dynamic = "force-dynamic";

export const { PATCH, DELETE } = itemHandlers("mk_sponsors_slots", SLOT_SCHEMA, {
  required: ["slot_date", "channel"],
  afterWrite: () => refreshMediaKit(),
});
