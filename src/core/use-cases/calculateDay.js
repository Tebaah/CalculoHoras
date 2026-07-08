/**
 * calculateDay.js - Caso de uso: Cálculo completo de una jornada laboral
 *
 * Coordina calculateService y calculateOperator para producir
 * el resultado completo de un día de trabajo.
 */

import { calculateService } from './calculateService.js';
import { calculateOperator } from './calculateOperator.js';
import { validateInputs } from '../utils/timeUtils.js';
import { WorkDay } from '../entities/workDay.js';

/**
 * Calcula el resultado completo para un día de trabajo
 *
 * @param {WorkDay|Object} dayData - Datos del día
 * @param {number} valorHora - Valor de la hora normal
 * @returns {Object} Resultado completo del día
 */
export function calculateDay(dayData, valorHora) {
    const { startMin, endMin } = validateInputs(dayData.horaInicio, dayData.horaTermino);

    // Calcular servicio
    const serviceResult = calculateService({
        startMin,
        endMin,
        tipoDia: dayData.tipoDia,
        colacion: dayData.colacion,
        colacionTramo: dayData.colacionTramo,
        horasMinimas: dayData.horasMinimas,
        valorHora,
    });

    // Calcular operador
    const operatorResult = calculateOperator({
        startMin,
        endMin,
        tipoDia: dayData.tipoDia,
        colacion: dayData.colacion,
        colacionTramo: dayData.colacionTramo,
        totalMinutos: serviceResult.totalMinutos,
    });

    return {
        dia: dayData.dia,
        tipoDia: dayData.tipoDia,
        horasSinRecargo: serviceResult.horasSinRecargo,
        horasConRecargo: serviceResult.horasConRecargo,
        horasNormalesOp: operatorResult.horasNormalesOp,
        horasDobles: operatorResult.horasDobles,
        horasTotales: serviceResult.horasSinRecargo + serviceResult.horasConRecargo,
        montoTotal: serviceResult.montoTotal,
    };
}