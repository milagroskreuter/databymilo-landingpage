// Validador mínimo de JSON Schema para las entradas de las herramientas.
// Con eager_input_streaming la API no valida la entrada de la herramienta,
// así que la validamos acá antes de tocar la base.
// Soporta: type, enum, required, properties, additionalProperties:false,
// items, minItems, maxItems, minLength, maxLength, minimum, maximum, pattern.

function typeOf(v) {
  if (v === null) return "null";
  if (Array.isArray(v)) return "array";
  if (typeof v === "number") return Number.isInteger(v) ? "integer" : "number";
  return typeof v;
}

function matchesType(expected, value) {
  const t = typeOf(value);
  const list = Array.isArray(expected) ? expected : [expected];
  return list.some((e) => e === t || (e === "number" && t === "integer"));
}

function check(schema, value, path, errors) {
  if (schema.type && !matchesType(schema.type, value)) {
    errors.push(`${path || "entrada"}: se esperaba ${[].concat(schema.type).join(" o ")}`);
    return;
  }
  if (value === null) return;
  if (schema.enum && !schema.enum.includes(value)) {
    errors.push(`${path}: valor inválido "${value}" (opciones: ${schema.enum.join(", ")})`);
    return;
  }
  const t = typeOf(value);
  if (t === "string") {
    if (schema.minLength != null && value.trim().length < schema.minLength) errors.push(`${path}: no puede estar vacío`);
    if (schema.maxLength != null && value.length > schema.maxLength) errors.push(`${path}: máximo ${schema.maxLength} caracteres`);
    if (schema.pattern && !new RegExp(schema.pattern).test(value)) errors.push(`${path}: formato inválido`);
  }
  if (t === "integer" || t === "number") {
    if (schema.minimum != null && value < schema.minimum) errors.push(`${path}: mínimo ${schema.minimum}`);
    if (schema.maximum != null && value > schema.maximum) errors.push(`${path}: máximo ${schema.maximum}`);
  }
  if (t === "array") {
    if (schema.minItems != null && value.length < schema.minItems) errors.push(`${path}: mínimo ${schema.minItems} elementos`);
    if (schema.maxItems != null && value.length > schema.maxItems) errors.push(`${path}: máximo ${schema.maxItems} elementos`);
    if (schema.items) value.forEach((item, i) => check(schema.items, item, `${path}[${i}]`, errors));
  }
  if (t === "object") {
    const props = schema.properties || {};
    for (const key of schema.required || []) {
      if (value[key] === undefined) errors.push(`${path ? path + "." : ""}${key}: falta`);
    }
    for (const [key, v] of Object.entries(value)) {
      const sub = props[key];
      if (!sub) {
        if (schema.additionalProperties === false) errors.push(`${path ? path + "." : ""}${key}: campo desconocido`);
        continue;
      }
      if (v === undefined) continue;
      check(sub, v, path ? `${path}.${key}` : key, errors);
    }
  }
}

export function validateInput(schema, value) {
  const errors = [];
  check(schema, value, "", errors);
  return errors;
}
