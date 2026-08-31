/**
 * configManager.js - Gestor de configuración global (localStorage)
 *
 * Almacena preferencias del sistema:
 *  - Logo de empresa (URL)
 *  - Correlativo de estados de pago (número de inicio y siguiente a asignar)
 */

const CONFIG_KEY = 'calculoHoras_config';
const LEGACY_LOGO_KEY = 'calculoHoras_logoUrl';

function readConfig() {
    try {
        const raw = localStorage.getItem(CONFIG_KEY);
        return raw ? JSON.parse(raw) : {};
    } catch (error) {
        console.error('Error al leer configuración:', error);
        return {};
    }
}

function writeConfig(config) {
    try {
        localStorage.setItem(CONFIG_KEY, JSON.stringify(config));
    } catch (error) {
        console.error('Error al guardar configuración:', error);
    }
}

function toNumber(value) {
    if (value === undefined || value === null || value === '') return null;
    const n = Number(value);
    return Number.isFinite(n) ? n : null;
}

// ── Logo de empresa ────────────────────────────────────────────

/**
 * Obtiene la URL del logo de empresa.
 * Migra la clave anterior (calculoHoras_logoUrl) si es necesario.
 * @returns {string|null}
 */
export function getLogoUrl() {
    const config = readConfig();
    if (config.logoUrl !== undefined) return config.logoUrl || null;

    try {
        const legacy = localStorage.getItem(LEGACY_LOGO_KEY);
        if (legacy) {
            config.logoUrl = legacy;
            writeConfig(config);
            localStorage.removeItem(LEGACY_LOGO_KEY);
            return legacy;
        }
    } catch (error) {
        console.error('Error al migrar logo:', error);
    }
    return null;
}

/**
 * Guarda la URL del logo de empresa.
 * @param {string} url
 */
export function setLogoUrl(url) {
    const config = readConfig();
    config.logoUrl = url;
    writeConfig(config);
}

/**
 * Elimina el logo de empresa.
 */
export function removeLogoUrl() {
    const config = readConfig();
    delete config.logoUrl;
    writeConfig(config);
    try {
        localStorage.removeItem(LEGACY_LOGO_KEY);
    } catch (error) {
        console.error('Error al eliminar logo anterior:', error);
    }
}

// ── Correlativo de estados de pago ─────────────────────────────

/**
 * Obtiene el número desde el cual inicia el correlativo de estados de pago.
 * @returns {number|null}
 */
export function getIndiceInicioPago() {
    return toNumber(readConfig().indiceInicioPago);
}

/**
 * Establece el número de inicio del correlativo.
 * Si el inicio cambia, reinicia el correlativo actual.
 * @param {number} valor
 */
export function setIndiceInicioPago(valor) {
    const config = readConfig();
    const previo = toNumber(config.indiceInicioPago);
    const nuevo = toNumber(valor);

    config.indiceInicioPago = valor;

    if (previo !== nuevo) {
        config.correlativoActual = nuevo;
    } else if (toNumber(config.correlativoActual) === null) {
        config.correlativoActual = nuevo;
    }

    writeConfig(config);
}

/**
 * Obtiene el correlativo actual (siguiente número a asignar a un estado de pago).
 * @returns {number|null}
 */
export function getCorrelativoPago() {
    const config = readConfig();
    const correlativo = toNumber(config.correlativoActual);
    if (correlativo !== null) return correlativo;
    return getIndiceInicioPago();
}

/**
 * Avanza el correlativo (se usa tras guardar un estado de pago).
 * @returns {number|null} El nuevo correlativo.
 */
export function avanzarCorrelativoPago() {
    const config = readConfig();
    const actual = getCorrelativoPago();
    if (actual === null) return null;

    const siguiente = actual + 1;
    config.correlativoActual = siguiente;
    writeConfig(config);
    return siguiente;
}
