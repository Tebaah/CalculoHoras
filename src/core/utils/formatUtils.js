/**
 * formatUtils.js - Utilidades de formato
 */

/**
 * Formatea un número como moneda en formato CLP
 * @param {number} amount
 * @returns {string} Ej: "$15.000"
 */
export function formatCurrency(amount) {
    return '$' + Math.round(amount).toLocaleString('es-CL');
}

/**
 * Formatea un número como precio/hora en formato CLP
 * @param {number} amount
 * @returns {string} Ej: "$95.000/h"
 */
export function formatHourRate(amount) {
    return '$' + Math.round(amount).toLocaleString('es-CL') + '/h';
}

/**
 * Formatea horas con 2 decimales y sufijo "h"
 * @param {number} hours
 * @returns {string} Ej: "6.50 h"
 */
export function formatHours(hours) {
    return hours.toFixed(2) + ' h';
}