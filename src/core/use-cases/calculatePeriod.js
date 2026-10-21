/**
 * calculatePeriod.js - Caso de uso: Cálculo de un servicio de uno o más días
 *
 * Unifica el cálculo de servicios: recibe un arreglo de jornadas (una para un
 * servicio de un día, varias para un período) y devuelve el detalle por día
 * junto con los totales del período.
 */

import { calculateDay } from './calculateDay.js';
import { WorkDay } from '../entities/workDay.js';

/**
 * Redondea a dos decimales para evitar ruido de punto flotante en los totales
 *
 * @param {number} valor
 * @returns {number}
 */
function redondear(valor) {
    return Math.round((Number(valor) || 0) * 100) / 100;
}

/**
 * Calcula el resultado completo de un servicio
 *
 * @param {Array<Object>} daysData - Jornadas del servicio (una o más)
 * @param {number} valorHora - Valor de la hora normal
 * @returns {{
 *   results: Array<Object>,
 *   totalSinRecargo: number,
 *   totalConRecargo: number,
 *   totalNormalesOp: number,
 *   totalDoblesOp: number,
 *   totalMonto: number,
 *   daysCount: number,
 * }}
 */
export function calculatePeriod(daysData, valorHora) {
    const results = (daysData || []).map((dayData) => (
        calculateDay(new WorkDay({ ...dayData }), valorHora)
    ));

    const totales = results.reduce((acumulado, result) => ({
        horasSinRecargo: acumulado.horasSinRecargo + (result.horasSinRecargo || 0),
        horasConRecargo: acumulado.horasConRecargo + (result.horasConRecargo || 0),
        horasNormalesOp: acumulado.horasNormalesOp + (result.horasNormalesOp || 0),
        horasDobles: acumulado.horasDobles + (result.horasDobles || 0),
        montoTotal: acumulado.montoTotal + (result.montoTotal || 0),
    }), {
        horasSinRecargo: 0,
        horasConRecargo: 0,
        horasNormalesOp: 0,
        horasDobles: 0,
        montoTotal: 0,
    });

    return {
        results,
        totalSinRecargo: redondear(totales.horasSinRecargo),
        totalConRecargo: redondear(totales.horasConRecargo),
        totalNormalesOp: redondear(totales.horasNormalesOp),
        totalDoblesOp: redondear(totales.horasDobles),
        totalMonto: redondear(totales.montoTotal),
        daysCount: results.length,
    };
}
