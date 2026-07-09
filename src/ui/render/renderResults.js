/**
 * renderResults.js - Funciones para renderizar resultados de cálculo individual
 */

import { formatHourRate, formatCurrency, formatHours } from '../../core/utils/formatUtils.js';
import { TIPOS_DIA, getMultiplicadorRecargo } from '../../core/constants.js';

/**
 * Obtiene las etiquetas de resultados según el tipo de día
 * @param {string} tipoDia
 * @param {number} valorSinRecargo
 * @param {number} valorConRecargo
 * @returns {{ sinRecargo: string, conRecargo: string, doblesOp: string }}
 */
function getLabelsByDayType(tipoDia, valorSinRecargo, valorConRecargo, recargoPorcentaje) {
    const recargoText = recargoPorcentaje > 0
        ? `(+${recargoPorcentaje}%)`
        : '(sin recargo)';

    const labels = {
        [TIPOS_DIA.NORMAL]: {
            sinRecargo: `Horas sin recargo ${formatHourRate(valorSinRecargo)} (07:00 - 18:00)`,
            conRecargo: `Horas con recargo ${formatHourRate(valorConRecargo)} ${recargoText} (18:00 - 07:00)`,
            doblesOp: 'Horas dobles del operador (antes 07:00 y después 19:00)',
        },
        [TIPOS_DIA.SABADO]: {
            sinRecargo: `Horas sin recargo ${formatHourRate(valorSinRecargo)} (07:00 - 13:00)`,
            conRecargo: `Horas con recargo ${formatHourRate(valorConRecargo)} ${recargoText} (desde 13:00)`,
            doblesOp: 'Horas dobles del operador (desde 13:00)',
        },
        [TIPOS_DIA.DOMINGO_FESTIVO]: {
            sinRecargo: `Horas sin recargo ${formatHourRate(valorSinRecargo)}`,
            conRecargo: `Horas con recargo ${formatHourRate(valorConRecargo)} ${recargoText} (todo el día)`,
            doblesOp: 'Horas dobles del operador (todo el día)',
        },
    };

    return labels[tipoDia] || labels[TIPOS_DIA.NORMAL];
}

/**
 * Renderiza los resultados de un cálculo individual en el DOM
 *
 * @param {Object} result - Resultado del cálculo
 * @param {string} result.tipoDia - Tipo de día
 * @param {number} result.horasSinRecargo
 * @param {number} result.horasConRecargo
 * @param {number} result.horasNormalesOp
 * @param {number} result.horasDobles
 * @param {number} result.montoTotal
 * @param {number} result.valorSinRecargo
 * @param {number} result.valorConRecargo
 */
export function renderResults(result) {
    const labels = getLabelsByDayType(result.tipoDia, result.valorSinRecargo, result.valorConRecargo, result.recargoPorcentaje);

    document.getElementById('labelSinRecargo').textContent = labels.sinRecargo;
    document.getElementById('labelConRecargo').textContent = labels.conRecargo;
    document.getElementById('labelDoblesOp').textContent = labels.doblesOp;

    document.getElementById('horasSinRecargo').textContent = formatHours(result.horasSinRecargo);
    document.getElementById('horasConRecargo').textContent = formatHours(result.horasConRecargo);
    document.getElementById('horasNormalesOp').textContent = formatHours(result.horasNormalesOp);
    document.getElementById('horasDobles').textContent = formatHours(result.horasDobles);
    document.getElementById('montoTotal').textContent = formatCurrency(result.montoTotal);
}