/**
 * calculatorActions.js - Acciones de cálculo de servicios
 *
 * Envuelve los casos de uso del dominio y actualiza el store.
 * Un servicio puede tener una o varias jornadas; el cálculo es el mismo.
 */

import { store } from '../store.js';
import { calculatePeriod } from '../../core/use-cases/calculatePeriod.js';

/**
 * Ejecuta el cálculo completo de un servicio (uno o más días)
 * y actualiza el store con el resultado.
 *
 * @param {Array<Object>} daysData - Datos de cada jornada
 * @param {number} valorHora - Valor de la hora normal
 * @returns {Object} Resultado del servicio (detalle por día + totales)
 */
export function calculateServicePeriod(daysData, valorHora) {
    const service = calculatePeriod(daysData, valorHora);

    store.setState({ lastService: service });

    return service;
}
