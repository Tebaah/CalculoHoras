/**
 * configManager.js - Gestor de configuración global (localStorage)
 *
 * Almacena preferencias del sistema:
 *  - Logo de empresa (URL)
 *  - Correlativo de estados de pago (número de inicio y siguiente a asignar)
 *  - Porcentajes de recargo disponibles en Órdenes de Trabajo y Reportes
 *  - Mínimos de horas disponibles en Órdenes de Trabajo y Reportes
 *  - Valores de hora normal disponibles en Órdenes de Trabajo y Reportes
 */

import {
    PORCENTAJES_RECARGO_POR_DEFECTO,
    normalizarRecargo,
    normalizarRecargos,
    HORAS_MINIMAS_POR_DEFECTO,
    normalizarOpcionHorasMinimas,
    normalizarOpcionesHorasMinimas,
    VALORES_HORA_POR_DEFECTO,
    normalizarValorHora,
    normalizarValoresHora,
} from '../core/constants.js';

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

// ── Porcentajes de recargo ─────────────────────────────────────

/**
 * Obtiene los porcentajes de recargo configurados.
 * Si aún no hay configuración guardada, usa los valores por defecto.
 * @returns {Array<number>} Porcentajes ordenados de menor a mayor (siempre incluye 0)
 */
export function getRecargos() {
    const config = readConfig();

    if (Array.isArray(config.recargos) && config.recargos.length > 0) {
        return normalizarRecargos(config.recargos);
    }

    return normalizarRecargos(PORCENTAJES_RECARGO_POR_DEFECTO);
}

/**
 * Reemplaza la lista completa de porcentajes de recargo.
 * @param {Array<number|string>} porcentajes
 * @returns {Array<number>} Lista guardada (normalizada)
 */
export function setRecargos(porcentajes) {
    const config = readConfig();
    config.recargos = normalizarRecargos(porcentajes);
    writeConfig(config);
    return config.recargos;
}

/**
 * Agrega un porcentaje de recargo a la configuración.
 * Ignora valores inválidos, el 0 (siempre disponible) y duplicados.
 * @param {number|string} porcentaje
 * @returns {Array<number>} Lista guardada (normalizada)
 */
export function addRecargo(porcentaje) {
    const recargos = getRecargos();
    const nuevo = normalizarRecargo(porcentaje);

    if (nuevo === null || nuevo <= 0 || recargos.includes(nuevo)) return recargos;

    return setRecargos([...recargos, nuevo]);
}

/**
 * Elimina un porcentaje de recargo de la configuración.
 * El porcentaje "Sin recargo" (0) no puede eliminarse.
 * @param {number|string} porcentaje
 * @returns {Array<number>} Lista guardada (normalizada)
 */
export function removeRecargo(porcentaje) {
    const valor = Number(porcentaje);

    if (!Number.isFinite(valor) || valor <= 0) return getRecargos();

    return setRecargos(getRecargos().filter((recargo) => recargo !== valor));
}

/**
 * Restaura los porcentajes de recargo por defecto.
 * @returns {Array<number>} Lista guardada (normalizada)
 */
export function resetRecargos() {
    return setRecargos(PORCENTAJES_RECARGO_POR_DEFECTO);
}

// ── Mínimos de horas ───────────────────────────────────────────

/**
 * Obtiene los mínimos de horas configurados.
 * Si aún no hay configuración guardada, usa los valores por defecto.
 * @returns {Array<number>} Mínimos ordenados de menor a mayor (siempre incluye 0)
 */
export function getHorasMinimas() {
    const config = readConfig();

    if (Array.isArray(config.horasMinimas) && config.horasMinimas.length > 0) {
        return normalizarOpcionesHorasMinimas(config.horasMinimas);
    }

    return normalizarOpcionesHorasMinimas(HORAS_MINIMAS_POR_DEFECTO);
}

/**
 * Reemplaza la lista completa de mínimos de horas.
 * @param {Array<number|string>} opciones
 * @returns {Array<number>} Lista guardada (normalizada)
 */
export function setHorasMinimas(opciones) {
    const config = readConfig();
    config.horasMinimas = normalizarOpcionesHorasMinimas(opciones);
    writeConfig(config);
    return config.horasMinimas;
}

/**
 * Agrega un mínimo de horas a la configuración.
 * Ignora valores inválidos, el 0 (siempre disponible) y duplicados.
 * @param {number|string} horas
 * @returns {Array<number>} Lista guardada (normalizada)
 */
export function addHorasMinimas(horas) {
    const opciones = getHorasMinimas();
    const nueva = normalizarOpcionHorasMinimas(horas);

    if (nueva === null || nueva <= 0 || opciones.includes(nueva)) return opciones;

    return setHorasMinimas([...opciones, nueva]);
}

/**
 * Elimina un mínimo de horas de la configuración.
 * El valor "Sin mínimo" (0) no puede eliminarse.
 * @param {number|string} horas
 * @returns {Array<number>} Lista guardada (normalizada)
 */
export function removeHorasMinimas(horas) {
    const valor = Number(horas);

    if (!Number.isFinite(valor) || valor <= 0) return getHorasMinimas();

    return setHorasMinimas(getHorasMinimas().filter((opcion) => opcion !== valor));
}

/**
 * Restaura los mínimos de horas por defecto.
 * @returns {Array<number>} Lista guardada (normalizada)
 */
export function resetHorasMinimas() {
    return setHorasMinimas(HORAS_MINIMAS_POR_DEFECTO);
}

// ── Valores de hora normal ─────────────────────────────────────

/**
 * Obtiene los valores de hora configurados.
 * Si aún no hay configuración guardada, usa los valores por defecto.
 * Una lista guardada vacía se respeta: el selector solo ofrecerá
 * la opción "Otro valor...".
 *
 * @returns {Array<number>} Valores ordenados de menor a mayor (puede estar vacía)
 */
export function getValoresHora() {
    const config = readConfig();

    if (Array.isArray(config.valoresHora)) {
        return normalizarValoresHora(config.valoresHora);
    }

    return normalizarValoresHora(VALORES_HORA_POR_DEFECTO);
}

/**
 * Reemplaza la lista completa de valores de hora.
 * @param {Array<number|string>} valores
 * @returns {Array<number>} Lista guardada (normalizada)
 */
export function setValoresHora(valores) {
    const config = readConfig();
    config.valoresHora = normalizarValoresHora(valores);
    writeConfig(config);
    return config.valoresHora;
}

/**
 * Agrega un valor de hora a la configuración.
 * Ignora valores inválidos y duplicados.
 * @param {number|string} valor
 * @returns {Array<number>} Lista guardada (normalizada)
 */
export function addValorHora(valor) {
    const valores = getValoresHora();
    const nuevo = normalizarValorHora(valor);

    if (nuevo === null || valores.includes(nuevo)) return valores;

    return setValoresHora([...valores, nuevo]);
}

/**
 * Elimina un valor de hora de la configuración.
 * @param {number|string} valor
 * @returns {Array<number>} Lista guardada (normalizada)
 */
export function removeValorHora(valor) {
    const numero = normalizarValorHora(valor);

    if (numero === null) return getValoresHora();

    return setValoresHora(getValoresHora().filter((opcion) => opcion !== numero));
}

/**
 * Restaura los valores de hora por defecto.
 * @returns {Array<number>} Lista guardada (normalizada)
 */
export function resetValoresHora() {
    return setValoresHora(VALORES_HORA_POR_DEFECTO);
}
