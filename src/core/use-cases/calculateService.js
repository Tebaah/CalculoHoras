/**
 * calculateService.js - Caso de uso: Cálculo de horas de servicio
 *
 * Lógica pura de negocio para calcular:
 * - Horas sin recargo
 * - Horas con recargo
 * - Monto total del servicio
 */

import { RANGOS, MULTIPLICADORES, TIPOS_DIA, getMultiplicadorRecargo } from '../constants.js';
import { calculateMinutesInRange, minutesToHours } from '../utils/timeUtils.js';

/**
 * Calcula la distribución de minutos trabajados según el tipo de día
 *
 * @param {number} startMin - Minuto de inicio
 * @param {number} endMin - Minuto de término
 * @param {string} tipoDia - Tipo de día
 * @returns {{ minSinRecargo: number, minConRecargo: number }}
 */
function calculateServiceMinutes(startMin, endMin, tipoDia) {
    const cruzaMedianoche = endMin < startMin;
    const totalMinutos = cruzaMedianoche ? (endMin + 1440 - startMin) : (endMin - startMin);

    let minConRecargo, minSinRecargo;

    if (tipoDia === TIPOS_DIA.NORMAL) {
        minConRecargo = calculateMinutesInRange(
            startMin, endMin,
            RANGOS.CON_RECARGO.inicio,
            RANGOS.CON_RECARGO.fin
        );
        minSinRecargo = totalMinutos - minConRecargo;

    } else if (tipoDia === TIPOS_DIA.SABADO) {
        minConRecargo = calculateMinutesInRange(
            startMin, endMin,
            13 * 60,  // 13:00
            7 * 60    // 07:00 (cruza medianoche)
        );
        minSinRecargo = totalMinutos - minConRecargo;

    } else {
        // Domingo/Festivo: todo el tiempo es con recargo
        minConRecargo = totalMinutos;
        minSinRecargo = 0;
    }

    return { minSinRecargo, minConRecargo, totalMinutos };
}

/**
 * Aplica descuento de colación a los minutos de servicio
 *
 * @param {number} minSinRecargo
 * @param {number} minConRecargo
 * @param {number} minColacion - Minutos de colación
 * @param {string} colacionTramo - 'sinRecargo' | 'conRecargo'
 * @returns {{ minSinRecargo: number, minConRecargo: number }}
 */
function applyColacion(minSinRecargo, minConRecargo, minColacion, colacionTramo) {
    if (minColacion <= 0) {
        return { minSinRecargo, minConRecargo };
    }

    if (colacionTramo === 'sinRecargo') {
        return {
            minSinRecargo: Math.max(0, minSinRecargo - minColacion),
            minConRecargo,
        };
    }

    return {
        minSinRecargo,
        minConRecargo: Math.max(0, minConRecargo - minColacion),
    };
}

/**
 * Determina si la hora inicial esta en el rango sin recargo del dia
 *
 * @param {number} startMin - Minuto de inicio
 * @param {string} tipoDia - Tipo de dia
 * @returns {boolean} true si la hora inicial esta en rango sin recargo
 */
function isStartInSinRecargo(startMin, tipoDia) {
    if (tipoDia === TIPOS_DIA.DOMINGO_FESTIVO) {
        return false;
    }

    if (tipoDia === TIPOS_DIA.SABADO) {
        return startMin >= 7 * 60 && startMin < 13 * 60;
    }

    // Día normal
    return startMin >= RANGOS.SIN_RECARGO.inicio && startMin < RANGOS.SIN_RECARGO.fin;
}

/**
 * Aplica la regla de minimo de horas
 *
 * La diferencia de horas para completar el minimo se incorpora al tramo
 * correspondiente segun donde se encuentre la hora inicial:
 * - Si la hora inicial esta en rango sin recargo, se agrega a sin recargo
 * - Si la hora inicial esta en rango con recargo, se agrega a con recargo
 *
 * @param {number} minConRecargo
 * @param {number} minSinRecargo
 * @param {number} totalMinutosTrabajados
 * @param {string} tipoDia
 * @param {number} horasMinimas
 * @param {number} startMin - Minuto de inicio de la jornada
 * @returns {{ minSinRecargo: number, minConRecargo: number, minutosExtra: number }}
 */
function applyMinimumHours(minConRecargo, minSinRecargo, totalMinutosTrabajados, tipoDia, horasMinimas, startMin) {
    if (horasMinimas <= 0) {
        return { minSinRecargo, minConRecargo, minutosExtra: 0 };
    }

    const minimoMinutos = horasMinimas * 60;

    if (totalMinutosTrabajados >= minimoMinutos) {
        return { minSinRecargo, minConRecargo, minutosExtra: 0 };
    }

    const minutosExtra = minimoMinutos - totalMinutosTrabajados;

    if (tipoDia === TIPOS_DIA.DOMINGO_FESTIVO) {
        return {
            minSinRecargo,
            minConRecargo: minConRecargo + minutosExtra,
            minutosExtra,
        };
    }

    // Si la hora inicial está en rango sin recargo, la diferencia se agrega ahí
    if (isStartInSinRecargo(startMin, tipoDia)) {
        return {
            minSinRecargo: minSinRecargo + minutosExtra,
            minConRecargo,
            minutosExtra,
        };
    }

    // Si la hora inicial está en rango con recargo, la diferencia se agrega ahí
    return {
        minSinRecargo,
        minConRecargo: minConRecargo + minutosExtra,
        minutosExtra,
    };
}

/**
 * Calcula el resultado completo del servicio para una jornada
 *
 * @param {Object} params
 * @param {number} params.startMin
 * @param {number} params.endMin
 * @param {string} params.tipoDia
 * @param {number} params.colacion
 * @param {string} params.colacionTramo
 * @param {number} params.horasMinimas
 * @param {number} params.valorHora
 * @param {number} [params.recargoPorcentaje=30] - Porcentaje de recargo (0, 10, 20, 30)
 * @returns {Object} Resultado del cálculo del servicio
 */
export function calculateService(params) {
    const {
        startMin,
        endMin,
        tipoDia,
        colacion,
        colacionTramo,
        horasMinimas,
        valorHora,
        recargoPorcentaje = 30,
    } = params;

    // 1. Calcular minutos base según tipo de día
    const { minSinRecargo, minConRecargo, totalMinutos } = calculateServiceMinutes(startMin, endMin, tipoDia);

    // 2. Aplicar descuento de colación
    const afterColacion = applyColacion(minSinRecargo, minConRecargo, colacion, colacionTramo);

    // 3. Aplicar mínimo de horas
    const totalNeto = afterColacion.minSinRecargo + afterColacion.minConRecargo;
    const adjusted = applyMinimumHours(
        afterColacion.minConRecargo,
        afterColacion.minSinRecargo,
        totalNeto,
        tipoDia,
        horasMinimas,
        startMin
    );

    // 4. Si no hay recargo (0%), todas las horas se consideran sin recargo
    let minutosSinRecargo = adjusted.minSinRecargo;
    let minutosConRecargo = adjusted.minConRecargo;
    if (recargoPorcentaje <= 0) {
        minutosSinRecargo += minutosConRecargo;
        minutosConRecargo = 0;
    }

    // 5. Convertir a horas
    const horasSinRecargo = parseFloat(minutesToHours(minutosSinRecargo));
    const horasConRecargo = parseFloat(minutesToHours(minutosConRecargo));

    // 6. Calcular montos con recargo dinámico
    const multiplicadorRecargo = getMultiplicadorRecargo(recargoPorcentaje);
    const valorConRecargo = valorHora * multiplicadorRecargo;
    const montoSinRecargo = horasSinRecargo * valorHora;
    const montoConRecargo = horasConRecargo * valorConRecargo;
    const montoTotal = montoSinRecargo + montoConRecargo;

    return {
        horasSinRecargo,
        horasConRecargo,
        montoSinRecargo,
        montoConRecargo,
        montoTotal,
        valorSinRecargo: valorHora,
        valorConRecargo,
        recargoPorcentaje,
        minutosExtra: adjusted.minutosExtra,
        totalMinutos,
    };
}