export function readJSON(key, fallback) {
  try {
    const value = localStorage.getItem(key);
    return value === null ? structuredClone(fallback) : JSON.parse(value);
  } catch (error) {
    console.warn(`No se pudo leer ${key}:`, error);
    return structuredClone(fallback);
  }
}
export function writeJSON(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); return true; }
  catch (error) { console.warn(`No se pudo guardar ${key}:`, error); return false; }
}
