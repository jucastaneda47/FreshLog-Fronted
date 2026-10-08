// Almacenamiento local (IndexedDB) para trabajar sin internet.
//  - "cache": última respuesta conocida de cada consulta (GET), separada por usuario.
//  - "cola": compras registradas sin conexión que aún no se han enviado al servidor.
// Si el navegador no permite IndexedDB, se usa memoria (la app sigue funcionando,
// pero sin conservar nada al cerrarla).

const NOMBRE_BD = "freshlog";
const VERSION_BD = 1;

let promesaBD = null;
const memoria = { cache: new Map(), cola: new Map() };

function abrir() {
  if (promesaBD) return promesaBD;
  promesaBD = new Promise((resolver) => {
    try {
      if (typeof indexedDB === "undefined") return resolver(null);
      const peticion = indexedDB.open(NOMBRE_BD, VERSION_BD);
      peticion.onupgradeneeded = () => {
        const bd = peticion.result;
        if (!bd.objectStoreNames.contains("cache")) bd.createObjectStore("cache");
        if (!bd.objectStoreNames.contains("cola")) bd.createObjectStore("cola", { keyPath: "cliente_id" });
      };
      peticion.onsuccess = () => resolver(peticion.result);
      peticion.onerror = () => resolver(null);
      peticion.onblocked = () => resolver(null);
    } catch {
      resolver(null);
    }
  });
  return promesaBD;
}

// Ejecuta una operación sobre un almacén y devuelve su resultado
async function operar(almacen, modo, accion) {
  const bd = await abrir();
  if (!bd) return accionEnMemoria(almacen, accion);
  return new Promise((resolver, rechazar) => {
    try {
      const tx = bd.transaction(almacen, modo);
      const resultado = accion(tx.objectStore(almacen));
      tx.oncomplete = () => resolver(resultado && "result" in resultado ? resultado.result : undefined);
      tx.onerror = () => rechazar(tx.error);
      tx.onabort = () => rechazar(tx.error);
    } catch (e) {
      rechazar(e);
    }
  });
}

// Respaldo en memoria con la misma interfaz mínima que usa este archivo
function accionEnMemoria(almacen, accion) {
  const mapa = memoria[almacen];
  const falsa = {
    get: (k) => ({ result: mapa.get(k) }),
    put: (v, k) => {
      mapa.set(almacen === "cola" ? v.cliente_id : k, v);
      return {};
    },
    delete: (k) => {
      mapa.delete(k);
      return {};
    },
    getAll: () => ({ result: [...mapa.values()] }),
    clear: () => {
      mapa.clear();
      return {};
    },
  };
  const r = accion(falsa);
  return Promise.resolve(r && "result" in r ? r.result : undefined);
}

// Envuelve una petición de IndexedDB para poder leer su resultado al terminar la transacción
function conResultado(peticion) {
  // En el respaldo en memoria la "petición" ya trae su resultado
  if (typeof IDBRequest === "undefined" || !(peticion instanceof IDBRequest)) return peticion;
  const caja = {};
  peticion.onsuccess = () => {
    caja.result = peticion.result;
  };
  return caja;
}

// ---------- Caché de consultas ----------
export async function guardarCache(clave, datos) {
  try {
    await operar("cache", "readwrite", (a) => a.put({ datos, guardado: Date.now() }, clave));
  } catch {
    /* sin espacio o sin permiso: simplemente no se guarda */
  }
}

export async function leerCache(clave) {
  try {
    return (await operar("cache", "readonly", (a) => conResultado(a.get(clave)))) ?? null;
  } catch {
    return null;
  }
}

export async function limpiarCache() {
  try {
    await operar("cache", "readwrite", (a) => a.clear());
  } catch {
    /* nada que limpiar */
  }
}

// ---------- Cola de compras pendientes ----------
export async function guardarEnCola(item) {
  await operar("cola", "readwrite", (a) => a.put(item));
}

export async function quitarDeCola(clienteId) {
  await operar("cola", "readwrite", (a) => a.delete(clienteId));
}

export async function listarCola() {
  try {
    const todos = (await operar("cola", "readonly", (a) => conResultado(a.getAll()))) ?? [];
    return todos.sort((a, b) => (a.creada || 0) - (b.creada || 0));
  } catch {
    return [];
  }
}
