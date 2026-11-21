import { itemHandlers, refreshMediaKit } from "@/lib/marketing/sponsors/crud";
import { RATE_SCHEMA } from "@/lib/marketing/sponsors/schemas";

export const dynamic = "force-dynamic";

export const { PATCH, DELETE } = itemHandlers("mk_sponsors_rates", RATE_SCHEMA, {
  required: ["name"],
  afterWrite: () => refreshMediaKit(),
});
