/**
 * dateUtils.js - Utilidades para manejo de fechas y determinación del tipo de día
 */

import { TIPOS_DIA } from '../constants.js';

/**
 * Determina el tipo de día laboral según la fecha
 *
 * @param {Date} date - Fecha a evaluar
 * @returns {string} 'normal' | 'sabado' | 'domingoFestivo'
 */
export function getDayTypeFromDate(date) {
    const dayOfWeek = date.getDay(); // 0=Dom, 1=Lun, ..., 6=Sáb

    if (dayOfWeek === 6) { // Sábado
        return TIPOS_DIA.SABADO;
    }
    if (dayOfWeek === 0) { // Domingo
        return TIPOS_DIA.DOMINGO_FESTIVO;
    }

    return TIPOS_DIA.NORMAL; // Lunes a Viernes
}

/**
 * Obtiene el nombre del día de la semana en español
 *
 * @param {Date} date
 * @returns {string} Ej: 'Lunes', 'Martes', etc.
 */
export function getDayNameInSpanish(date) {
    const dias = [
        'domingo', 'lunes', 'martes', 'miércoles',
        'jueves', 'viernes', 'sábado',
    ];
    return dias[date.getDay()];
}

/**
 * Formatea una fecha como DD.MM.YYYY
 *
 * @param {Date} date
 * @returns {string} Ej: "01.07.2026"
 */
export function formatDate(date) {
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return day + '.' + month + '.' + year;
}

/**
 * Clona una fecha
 *
 * @param {Date} date
 * @returns {Date}
 */
function cloneDate(date) {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

/**
 * Obtiene la fecha después de sumar N días
 *
 * @param {Date} date - Fecha base
 * @param {number} days - Número de días a sumar
 * @returns {Date} Nueva fecha
 */
export function addDays(date, days) {
    const result = cloneDate(date);
    result.setDate(result.getDate() + days);
    return result;
}

/**
 * Convierte una fecha a string YYYY-MM-DD para input type="date"
 *
 * @param {Date} date
 * @returns {string} Ej: "2026-07-01"
 */
export function toDateInputValue(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return year + '-' + month + '-' + day;
}

/**
 * Obtiene el identificador de día (lunes, martes, etc.) a partir de la fecha
 *
 * @param {Date} date
 * @returns {string} Ej: 'lunes', 'martes', etc.
 */
export function getDayId(date) {
    const dias = [
        'domingo', 'lunes', 'martes', 'miercoles',
        'jueves', 'viernes', 'sabado',
    ];
    return dias[date.getDay()];
}

/**
 * Mapea el identificador de día al nombre en español
 */
export const DAY_ID_TO_NAME = {
    lunes: 'Lunes',
    martes: 'Martes',
    miercoles: 'Miércoles',
    jueves: 'Jueves',
    viernes: 'Viernes',
    sabado: 'Sábado',
    domingo: 'Domingo',
};