import { itemHandlers } from "@/lib/marketing/sponsors/crud";
import { COLLAB_SCHEMA } from "@/lib/marketing/sponsors/schemas";

export const dynamic = "force-dynamic";

export const { PATCH, DELETE } = itemHandlers("mk_sponsors_collabs", COLLAB_SCHEMA, {
  required: ["creator_name"],
});
