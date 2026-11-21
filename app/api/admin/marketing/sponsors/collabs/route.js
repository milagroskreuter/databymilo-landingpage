import { collectionHandlers } from "@/lib/marketing/sponsors/crud";
import { COLLAB_SCHEMA } from "@/lib/marketing/sponsors/schemas";

export const dynamic = "force-dynamic";

export const { GET, POST } = collectionHandlers("mk_sponsors_collabs", COLLAB_SCHEMA, {
  required: ["creator_name"],
  order: [["collab_on", false], ["created_at", false]],
});
