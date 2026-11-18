import fs from "fs";
import path from "path";

const RESOURCES_FILE = path.join(process.cwd(), "content", "resources.json");

function readData() {
  try {
    const raw = fs.readFileSync(RESOURCES_FILE, "utf8");
    return JSON.parse(raw);
  } catch {
    return { free: [], paid: [] };
  }
}

export function getResources() {
  return readData().free;
}

export function getPaidResources() {
  return readData().paid;
}


export function getResourceBySlug(slug) {
  const { free, paid } = readData();
  return [...free, ...paid].find((r) => r.slug === slug) ?? null;
}

export function getAvailableResources() {
  return getResources().filter((r) => r.href);
}
