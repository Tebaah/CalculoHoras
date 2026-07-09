/**
 * calculateOperator.js - Caso de uso: Cálculo de horas del operador
 *
 * Lógica pura de negocio para calcular:
 * - Horas normales del operador
 * - Horas dobles del operador
 */

import { calculateMinutesInRange } from '../utils/timeUtils.js';
import { minutesToHours } from '../utils/timeUtils.js';
import { TIPOS_DIA } from '../constants.js';

/**
 * Calcula los minutos dobles del operador según el tipo de día
 *
 * @param {number} startMin
 * @param {number} endMin
 * @param {string} tipoDia
 * @returns {number} Minutos dobles
 */
function calculateDoubleMinutes(startMin, endMin, tipoDia) {
    if (tipoDia === TIPOS_DIA.NORMAL) {
        const minDoblesManana = calculateMinutesInRange(startMin, endMin, 0, 7 * 60);
        const minDoblesNoche = calculateMinutesInRange(startMin, endMin, 19 * 60, 24 * 60);
        return minDoblesManana + minDoblesNoche;
    }

    if (tipoDia === TIPOS_DIA.SABADO) {
        const minDoblesManana = calculateMinutesInRange(startMin, endMin, 0, 7 * 60);
        const minDoblesNoche = calculateMinutesInRange(startMin, endMin, 13 * 60, 24 * 60);
        return minDoblesManana + minDoblesNoche;
    }

    // Domingo/Festivo: todo es doble
    const cruzaMedianoche = endMin < startMin;
    return cruzaMedianoche ? (endMin + 1440 - startMin) : (endMin - startMin);
}

/**
 * Calcula el resultado completo del operador para una jornada
 *
 * @param {Object} params
 * @param {number} params.startMin
 * @param {number} params.endMin
 * @param {string} params.tipoDia
 * @param {number} params.colacion
 * @param {string} params.colacionTramo
 * @param {number} params.totalMinutos - Total de minutos trabajados (del cálculo de servicio)
 * @returns {Object} Resultado del cálculo del operador
 */
export function calculateOperator(params) {
    const {
        startMin,
        endMin,
        tipoDia,
        colacion,
        colacionTramo,
        totalMinutos,
    } = params;

    // Horas normales del operador = Total de horas trabajadas
    let minNormalesOp = totalMinutos;

    // Calcular minutos dobles
    let minDobles = calculateDoubleMinutes(startMin, endMin, tipoDia);

    // Descuento de colación en horas del operador
    if (colacion > 0) {
        if (colacionTramo === 'conRecargo') {
            minDobles = Math.max(0, minDobles - colacion);
        }
        minNormalesOp = Math.max(0, minNormalesOp - colacion);
    }

    return {
        horasNormalesOp: parseFloat(minutesToHours(minNormalesOp)),
        horasDobles: parseFloat(minutesToHours(minDobles)),
    };
}