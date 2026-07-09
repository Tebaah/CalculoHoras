/**
 * calculatorActions.js - Acciones permitidas sobre el estado de la calculadora
 */

import { store } from '../store.js';
import { calculateDay } from '../../core/use-cases/calculateDay.js';
import { WorkDay } from '../../core/entities/workDay.js';
import { getMultiplicadorRecargo } from '../../core/constants.js';

/**
 * Ejecuta el cálculo completo de una orden de trabajo (un día)
 * y actualiza el store con el resultado.
 *
 * @param {Object} formData - Datos del formulario
 * @returns {Object} Resultado del cálculo
 */
export function calculateSingleDay(formData) {
    const workDay = new WorkDay({
        ...formData,
    });

    const result = calculateDay(workDay, formData.valorHora);

    const multiplicadorRecargo = getMultiplicadorRecargo(formData.recargoPorcentaje || 30);

    store.setState({
        lastCalculation: {
            ...result,
            tipoDia: formData.tipoDia,
            valorHora: formData.valorHora,
            valorSinRecargo: formData.valorHora,
            valorConRecargo: formData.valorHora * multiplicadorRecargo,
            recargoPorcentaje: formData.recargoPorcentaje || 30,
        },
    });

    return result;
}

/**
 * Ejecuta el cálculo completo del reporte semanal
 * y actualiza el store con el resultado.
 *
 * @param {Array<Object>} daysData - Arreglo con datos de cada día
 * @param {number} valorHora - Valor de la hora normal
 * @returns {Object} Totales del reporte semanal
 */
export function calculateWeeklyReport(daysData, valorHora) {
    const results = daysData.map((dayData) => {
        const workDay = new WorkDay({ ...dayData, valorHora });
        return calculateDay(workDay, valorHora);
    });

    // Calcular totales
    const totalSinRecargo = results.reduce((sum, r) => sum + r.horasSinRecargo, 0);
    const totalConRecargo = results.reduce((sum, r) => sum + r.horasConRecargo, 0);
    const totalNormalesOp = results.reduce((sum, r) => sum + r.horasNormalesOp, 0);
    const totalDoblesOp = results.reduce((sum, r) => sum + r.horasDobles, 0);
    const totalMonto = results.reduce((sum, r) => sum + r.montoTotal, 0);

    const report = {
        results,
        totalSinRecargo,
        totalConRecargo,
        totalNormalesOp,
        totalDoblesOp,
        totalMonto,
        daysCount: results.length,
    };

    store.setState({ lastReport: report });

    return report;
}