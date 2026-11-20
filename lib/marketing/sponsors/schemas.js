// Campos editables de cada tabla del área (ver lib/marketing/sponsors/crud.js).
import { NETWORKS } from "@/lib/marketing/constants";
import { STAGES, SLOT_CHANNELS, SLOT_STATUSES, COLLAB_STATUSES, INTERACTION_KINDS, CURRENCIES } from "./constants";

const ids = (list) => list.map((x) => x.id);

export const DEAL_SCHEMA = {
  brand: "text",
  stage: ids(STAGES),
  contact_name: "text",
  contact_email: "text",
  contact_role: "text",
  website: "url",
  amount: "number",
  currency: CURRENCIES,
  notes: "longtext",
  next_step: "text",
  next_step_on: "date",
  closed_on: "date",
  paid_on: "date",
  lost_reason: "text",
  show_in_media_kit: "bool",
  logo_url: "url",
};

export const INTERACTION_SCHEMA = {
  deal_id: "uuid",
  happened_on: "date",
  kind: ids(INTERACTION_KINDS),
  summary: "longtext",
};

export const SLOT_SCHEMA = {
  slot_date: "date",
  channel: ids(SLOT_CHANNELS),
  format: "text",
  deal_id: "uuid",
  brand: "text",
  price: "number",
  currency: CURRENCIES,
  status: ids(SLOT_STATUSES),
  content_id: "uuid",
  notes: "longtext",
};

export const RATE_SCHEMA = {
  name: "text",
  channel: "text",
  description: "longtext",
  price: "number",
  price_to: "number",
  currency: CURRENCIES,
  public: "bool",
  sort_order: "number",
};

export const COLLAB_SCHEMA = {
  creator_name: "text",
  handle: "text",
  network: [...ids(NETWORKS), null],
  idea: "longtext",
  status: ids(COLLAB_STATUSES),
  collab_on: "date",
  contact: "text",
  link: "url",
  notes: "longtext",
};
