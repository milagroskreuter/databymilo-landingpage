import { itemHandlers, refreshMediaKit } from "@/lib/marketing/sponsors/crud";
import { DEAL_SCHEMA } from "@/lib/marketing/sponsors/schemas";
import { todayAR } from "@/lib/marketing/sponsors/constants";

export const dynamic = "force-dynamic";

export const { PATCH, DELETE } = itemHandlers("mk_sponsors_deals", DEAL_SCHEMA, {
  required: ["brand"],
  afterWrite: () => refreshMediaKit(),
  // Al pasar a cerrada/cobrada se completan las fechas si faltan.
  async beforeUpdate(data, supabase, id) {
    if (data.stage === "cerrada" || data.stage === "cobrada") {
      const { data: cur } = await supabase.from("mk_sponsors_deals").select("closed_on, paid_on").eq("id", id).maybeSingle();
      if (!data.closed_on && !cur?.closed_on) data.closed_on = todayAR();
      if (data.stage === "cobrada" && !data.paid_on && !cur?.paid_on) data.paid_on = todayAR();
    }
    return data;
  },
});
