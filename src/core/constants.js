/**
 * constants.js - Constantes de dominio
 * Rangos horarios, multiplicadores y configuraciones globales
 */

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

// Valores de hora predefinidos
export const VALORES_HORA_PREDEFINIDOS = [
    95000, 110000, 120000, 140000, 165000,
    190000, 210000, 235000, 260000, 265000,
    290000, 345000, 390000, 460000, 495000,
];

// Opciones de mínimo de horas
export const OPCIONES_HORAS_MINIMAS = [0, 5, 6, 8, 9];

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