/**
 * renderServicio.js - Renderizado de resultados del cálculo de servicios
 *
 * Un servicio puede incluir una o varias jornadas; el resultado siempre se
 * presenta como detalle por día + totales del período.
 */

import { formatHourRate, formatCurrency, formatHours } from '../../core/utils/formatUtils.js';
import { NOMBRES_DIAS, getMultiplicadorRecargo } from '../../core/constants.js';

/**
 * Genera la tabla de horas por día
 *
 * @param {Array<Object>} results - Resultado de cada jornada
 * @returns {string} HTML
 */
export function populateDailyHoursTable(results) {
    let html = '<div class="result-item"><span class="result-label">Día</span><span class="result-value">Horas</span></div>';

    results.forEach((r) => {
        const nombreDia = NOMBRES_DIAS[r.dia] || r.dia;
        html += '<div class="result-item">' +
            '<span class="result-label">' + nombreDia + '</span>' +
            '<span class="result-value">' + formatHours(r.horasTotales) + '</span>' +
            '</div>';
    });

    return '<div class="hours-daily-table">' + html + '</div>';
}

/**
 * Renderiza los totales del servicio en el panel de resultados
 *
 * @param {Object} report - Resultado de calculatePeriod
 * @param {number} valorHora - Valor de la hora normal
 * @param {number} [recargoPorcentaje] - Porcentaje de recargo aplicado
 */
export function renderServicioTotals(report, valorHora, recargoPorcentaje) {
    const recargo = recargoPorcentaje !== undefined && recargoPorcentaje !== null
        ? recargoPorcentaje
        : (
            report.recargoPorcentaje !== undefined && report.recargoPorcentaje !== null
                ? report.recargoPorcentaje
                : 30
        );

    const tieneRecargo = recargo > 0 && report.totalConRecargo > 0;
    const valorConRecargo = valorHora * getMultiplicadorRecargo(recargo);
    const recargoText = recargo > 0 ? `(+${recargo}%)` : '(sin recargo)';

    const dailyTableHtml = populateDailyHoursTable(report.results);

    const diasNombres = report.results
        .map((r) => NOMBRES_DIAS[r.dia] || r.dia)
        .join(', ');

    const html = `
        <div class="result-item">
            <span class="result-label">Días incluidos en el cálculo</span>
            <span class="result-value">${diasNombres || 'Ninguno'}</span>
        </div>
        ${dailyTableHtml}
        <div class="result-item">
            <span class="result-label">Total horas sin recargo ${formatHourRate(valorHora)}</span>
            <span class="result-value">${formatHours(report.totalSinRecargo)}</span>
        </div>
        ${tieneRecargo ? `
        <div class="result-item">
            <span class="result-label">Total horas con recargo ${formatHourRate(valorConRecargo)} ${recargoText}</span>
            <span class="result-value">${formatHours(report.totalConRecargo)}</span>
        </div>` : ''}
        <div class="result-item">
            <span class="result-label">Total horas normales operador</span>
            <span class="result-value">${formatHours(report.totalNormalesOp)}</span>
        </div>
        <div class="result-item">
            <span class="result-label">Total horas dobles operador</span>
            <span class="result-value">${formatHours(report.totalDoblesOp)}</span>
        </div>
        <div class="result-item total">
            <span class="result-label">Monto Total del Servicio</span>
            <span class="result-value">${formatCurrency(report.totalMonto)}</span>
        </div>
    `;

    const container = document.getElementById('resultsContent');
    if (container) {
        container.innerHTML = html;
    }

    const actionsArea = document.getElementById('resultActions');
    if (actionsArea) {
        actionsArea.style.display = 'flex';
    }
}
