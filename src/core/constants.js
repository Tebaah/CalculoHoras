/**
 * constants.js - Constantes de dominio
 * Rangos horarios, multiplicadores y configuraciones globales
 */

import { formatCurrency } from './utils/formatUtils.js';

// Rangos horarios en minutos desde medianoche
export const RANGOS = {
    SIN_RECARGO: {
        inicio: 7 * 60,   // 07:00
        fin: 18 * 60,     // 18:00
    },
    CON_RECARGO: {
        inicio: 18 * 60,  // 18:00
        fin: 7 * 60,      // 07:00 (cruza medianoche)
    },
    NORMAL_OPERADOR: {
        inicio: 7 * 60,   // 07:00
        fin: 19 * 60,     // 19:00
    },
    DOBLES_OPERADOR: {
        inicio: 19 * 60,  // 19:00
        fin: 7 * 60,      // 07:00 (cruza medianoche)
    },
};

// Multiplicadores de recargo
export const MULTIPLICADORES = {
    RECARGO: 1.30,        // 30% de recargo (defecto)
    DOBLE: 2.0,           // 100% (doble)
};

// Tipos de día
export const TIPOS_DIA = {
    NORMAL: 'normal',
    SABADO: 'sabado',
    DOMINGO_FESTIVO: 'domingoFestivo',
};

// ── Valores de hora normal ─────────────────────────────────────
// La lista definitiva se administra desde la página Configuración
// (ver src/store/configManager.js). Estos son los valores iniciales.

// Valores de hora disponibles por defecto (CLP)
export const VALORES_HORA_POR_DEFECTO = [
    95000, 110000, 120000, 140000, 165000,
    190000, 210000, 235000, 260000, 265000,
    290000, 345000, 390000, 460000, 495000,
];

// Rango admitido al configurar valores de hora
export const VALOR_HORA_MINIMO = 1;
export const VALOR_HORA_MAXIMO = 10000000;

// Opciones fijas del selector "Valor Hora Normal" (siempre disponibles)
export const VALOR_HORA_PLACEHOLDER = '';
export const VALOR_HORA_PLACEHOLDER_LABEL = 'Seleccione un valor...';
export const VALOR_HORA_PERSONALIZADO = 'custom';
export const VALOR_HORA_PERSONALIZADO_LABEL = 'Otro valor...';

/**
 * Genera la etiqueta visible de un valor de hora
 * @param {number} valor - Valor de hora en CLP (ej: 95000)
 * @returns {string} Ej: "$95.000"
 */
export function formatValorHoraLabel(valor) {
    const numero = Number(valor);
    if (!Number.isFinite(numero)) return String(valor);
    return formatCurrency(numero);
}

/**
 * Normaliza un valor de hora individual
 * @param {number|string} valor
 * @returns {number|null} Valor válido (entero CLP dentro del rango) o null
 */
export function normalizarValorHora(valor) {
    if (valor === null || valor === undefined || valor === '') return null;

    const numero = Number(valor);

    if (!Number.isInteger(numero)) return null;
    if (numero < VALOR_HORA_MINIMO || numero > VALOR_HORA_MAXIMO) return null;

    return numero;
}

/**
 * Normaliza una lista de valores de hora: descarta valores inválidos o fuera
 * de rango, elimina duplicados y ordena de menor a mayor. A diferencia de los
 * recargos y los mínimos de horas, la lista puede quedar vacía (el selector
 * siempre conserva la opción "Otro valor...").
 *
 * @param {Array<number|string>} valores
 * @returns {Array<number>} Lista normalizada (puede estar vacía)
 */
export function normalizarValoresHora(valores) {
    if (!Array.isArray(valores)) return [];

    const validos = valores
        .map(normalizarValorHora)
        .filter((valor) => valor !== null);

    return Array.from(new Set(validos)).sort((a, b) => a - b);
}

// ── Mínimos de horas ───────────────────────────────────────────
// La lista definitiva se administra desde la página Configuración
// (ver src/store/configManager.js). Estos son los valores iniciales.

// Mínimos de horas disponibles por defecto (0 = "Sin mínimo", siempre presente)
export const HORAS_MINIMAS_POR_DEFECTO = [0, 5, 6, 8, 9];

// Rango admitido al configurar mínimos de horas
export const HORAS_MINIMAS_MINIMO = 0;
export const HORAS_MINIMAS_MAXIMO = 24;

/**
 * Genera la etiqueta visible de un mínimo de horas
 * @param {number} horas - Mínimo de horas (ej: 8)
 * @returns {string} Ej: "Sin mínimo" para 0 | "8 horas" para 8
 */
export function formatHorasMinimasLabel(horas) {
    const valor = Number(horas);
    if (!Number.isFinite(valor) || valor <= 0) return 'Sin mínimo';
    return valor === 1 ? '1 hora' : valor + ' horas';
}

/**
 * Normaliza un mínimo de horas individual
 * @param {number|string} horas
 * @returns {number|null} Horas válidas (entero dentro del rango) o null
 */
export function normalizarOpcionHorasMinimas(horas) {
    if (horas === null || horas === undefined || horas === '') return null;

    const valor = Number(horas);

    if (!Number.isInteger(valor)) return null;
    if (valor < HORAS_MINIMAS_MINIMO || valor > HORAS_MINIMAS_MAXIMO) return null;

    return valor;
}

/**
 * Normaliza una lista de mínimos de horas: convierte a número entero, descarta
 * valores inválidos o fuera de rango, elimina duplicados y ordena de menor a
 * mayor. El valor "Sin mínimo" (0) siempre está presente.
 *
 * @param {Array<number|string>} opciones
 * @returns {Array<number>} Lista normalizada (nunca vacía)
 */
export function normalizarOpcionesHorasMinimas(opciones) {
    if (!Array.isArray(opciones)) return [HORAS_MINIMAS_MINIMO];

    const validos = opciones
        .map(normalizarOpcionHorasMinimas)
        .filter((horas) => horas !== null);

    const unicos = Array.from(new Set(validos)).sort((a, b) => a - b);

    if (!unicos.includes(HORAS_MINIMAS_MINIMO)) {
        unicos.unshift(HORAS_MINIMAS_MINIMO);
    }

    return unicos;
}

// Opciones de colación
export const OPCIONES_COLACION = [0, 15, 30, 45, 60];

// ── Porcentajes de recargo ─────────────────────────────────────
// La lista definitiva se administra desde la página Configuración
// (ver src/store/configManager.js). Estos son los valores iniciales.

// Porcentajes de recargo disponibles por defecto
export const PORCENTAJES_RECARGO_POR_DEFECTO = [0, 10, 20, 30];

// Porcentaje de recargo por defecto (seleccionado al abrir el formulario)
export const RECARGO_POR_DEFECTO = 30;

// Rango admitido al configurar porcentajes de recargo
export const RECARGO_PORCENTAJE_MINIMO = 0;
export const RECARGO_PORCENTAJE_MAXIMO = 200;

/**
 * Genera la etiqueta visible de un porcentaje de recargo
 * @param {number} porcentaje - Porcentaje de recargo (ej: 30 para 30%)
 * @returns {string} Ej: "Sin recargo" para 0 | "30%" para 30
 */
export function formatRecargoLabel(porcentaje) {
    const valor = Number(porcentaje);
    if (!Number.isFinite(valor) || valor <= 0) return 'Sin recargo';
    return valor + '%';
}

/**
 * Normaliza un porcentaje de recargo individual
 * @param {number|string} porcentaje
 * @returns {number|null} Porcentaje válido (entero dentro del rango) o null
 */
export function normalizarRecargo(porcentaje) {
    if (porcentaje === null || porcentaje === undefined || porcentaje === '') return null;

    const valor = Number(porcentaje);

    if (!Number.isInteger(valor)) return null;
    if (valor < RECARGO_PORCENTAJE_MINIMO || valor > RECARGO_PORCENTAJE_MAXIMO) return null;

    return valor;
}

/**
 * Normaliza una lista de porcentajes de recargo: convierte a número entero,
 * descarta valores inválidos o fuera de rango, elimina duplicados y ordena
 * de menor a mayor. El porcentaje "Sin recargo" (0) siempre está presente.
 *
 * @param {Array<number|string>} porcentajes
 * @returns {Array<number>} Lista normalizada (nunca vacía)
 */
export function normalizarRecargos(porcentajes) {
    if (!Array.isArray(porcentajes)) return [RECARGO_PORCENTAJE_MINIMO];

    const validos = porcentajes
        .map(normalizarRecargo)
        .filter((porcentaje) => porcentaje !== null);

    const unicos = Array.from(new Set(validos)).sort((a, b) => a - b);

    if (!unicos.includes(RECARGO_PORCENTAJE_MINIMO)) {
        unicos.unshift(RECARGO_PORCENTAJE_MINIMO);
    }

    return unicos;
}

// Opciones de porcentaje de recargo por defecto (value + etiqueta visible)
export const OPCIONES_RECARGO = PORCENTAJES_RECARGO_POR_DEFECTO.map((value) => ({
    value,
    label: formatRecargoLabel(value),
}));

/**
 * Calcula el multiplicador de recargo a partir de un porcentaje
 * @param {number} porcentaje - Porcentaje de recargo (ej: 30 para 30%)
 * @returns {number} Multiplicador (ej: 1.30)
 */
export function getMultiplicadorRecargo(porcentaje) {
    return 1 + (porcentaje / 100);
}

// ── Tipos de costo (Estados de Pago) ───────────────────────────
// La lista definitiva se administra desde la página Configuración
// (ver src/store/configManager.js). Estos son los valores iniciales.

// Tipos de costo adicional disponibles por defecto ({ id, label })
export const TIPOS_COSTO_POR_DEFECTO = [
    { id: 'trasladoContrapesos', label: 'Traslado de contrapesos' },
    { id: 'trasladoEquipo', label: 'Traslado de equipo' },
    { id: 'planIzaje', label: 'Plan izaje' },
    { id: 'otros', label: 'Otros' },
];

// Largo máximo permitido para la etiqueta de un tipo de costo
export const TIPO_COSTO_LABEL_MAXIMO = 60;

/**
 * Normaliza la etiqueta visible de un tipo de costo
 * @param {string} label - Etiqueta ingresada por el usuario
 * @returns {string|null} Etiqueta recortada y acotada, o null si es inválida
 */
export function normalizarLabelTipoCosto(label) {
    if (label === null || label === undefined) return null;

    const texto = String(label).trim();
    if (!texto) return null;

    return texto.slice(0, TIPO_COSTO_LABEL_MAXIMO);
}

/**
 * Normaliza un tipo de costo individual
 * @param {{ id?: string, label?: string }} item
 * @returns {{ id: string, label: string }|null} Tipo válido o null
 */
export function normalizarTipoCosto(item) {
    if (!item || typeof item !== 'object') return null;

    const id = typeof item.id === 'string' ? item.id.trim() : '';
    const label = normalizarLabelTipoCosto(item.label);

    if (!id || !label) return null;

    return { id, label };
}

/**
 * Normaliza una lista de tipos de costo: descarta entradas inválidas y
 * elimina duplicados por id (conserva el primero). La lista puede quedar
 * vacía (los estados de pago simplemente no ofrecerán costos adicionales).
 *
 * @param {Array<{ id: string, label: string }>} tipos
 * @returns {Array<{ id: string, label: string }>} Lista normalizada
 */
export function normalizarTiposCosto(tipos) {
    if (!Array.isArray(tipos)) return [];

    const vistos = new Set();
    const resultado = [];

    tipos.forEach((item) => {
        const tipo = normalizarTipoCosto(item);
        if (!tipo || vistos.has(tipo.id)) return;

        vistos.add(tipo.id);
        resultado.push(tipo);
    });

    return resultado;
}

/**
 * Genera un identificador único y legible a partir de la etiqueta de un tipo
 * de costo. Se usa como key interna del registro guardado en el estado de pago.
 *
 * @param {string} label - Etiqueta visible (ej: "Traslado de grúa")
 * @param {Array<{ id: string }>} [existentes] - Tipos ya configurados
 * @returns {string} Identificador en camelCase único (ej: "trasladoDeGrua")
 */
export function generarIdTipoCosto(label, existentes = []) {
    const base = String(label)
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, ' ')
        .trim()
        .split(' ')
        .filter(Boolean)
        .map((palabra, index) => index === 0
            ? palabra
            : palabra.charAt(0).toUpperCase() + palabra.slice(1))
        .join('') || 'costo';

    const idsExistentes = new Set(existentes.map((tipo) => tipo.id));
    if (!idsExistentes.has(base)) return base;

    let sufijo = 2;
    while (idsExistentes.has(base + sufijo)) sufijo += 1;

    return base + sufijo;
}

// Nombres de días en español
export const NOMBRES_DIAS = {
    lunes: 'Lunes',
    martes: 'Martes',
    miercoles: 'Miércoles',
    jueves: 'Jueves',
    viernes: 'Viernes',
    sabado: 'Sábado',
    domingo: 'Domingo',
};

// Nombres de meses en español (en minúscula, para redacción de textos)
export const NOMBRES_MESES = [
    'enero',
    'febrero',
    'marzo',
    'abril',
    'mayo',
    'junio',
    'julio',
    'agosto',
    'septiembre',
    'octubre',
    'noviembre',
    'diciembre',
];

// Configuración de los días del reporte semanal
export const DIAS_REPORTE = [
    { id: 'lunes', nombre: 'Lunes', tipo: TIPOS_DIA.NORMAL },
    { id: 'martes', nombre: 'Martes', tipo: TIPOS_DIA.NORMAL },
    { id: 'miercoles', nombre: 'Miércoles', tipo: TIPOS_DIA.NORMAL },
    { id: 'jueves', nombre: 'Jueves', tipo: TIPOS_DIA.NORMAL },
    { id: 'viernes', nombre: 'Viernes', tipo: TIPOS_DIA.NORMAL },
    { id: 'sabado', nombre: 'Sábado', tipo: TIPOS_DIA.SABADO },
    { id: 'domingo', nombre: 'Domingo', tipo: TIPOS_DIA.DOMINGO_FESTIVO },
];