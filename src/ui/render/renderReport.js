/**
 * renderReport.js - Funciones para renderizar resultados del reporte semanal
 */

import { formatHourRate, formatCurrency, formatHours } from '../../core/utils/formatUtils.js';
import { NOMBRES_DIAS } from '../../core/constants.js';

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

export function renderReportTotals(report, valorHora, recargoPorcentaje) {
    recargoPorcentaje = recargoPorcentaje || report.recargoPorcentaje || 30;
    const valorSinRecargo = valorHora;
    const multiplicadorRecargo = 1 + (recargoPorcentaje / 100);
    const valorConRecargo = valorHora * multiplicadorRecargo;
    const recargoText = recargoPorcentaje > 0
        ? `(+${recargoPorcentaje}%)`
        : '(sin recargo)';

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
            <span class="result-label">Total horas sin recargo ${formatHourRate(valorSinRecargo)} <small>(07:00 - 18:00)</small></span>
            <span class="result-value">${formatHours(report.totalSinRecargo)}</span>
        </div>
        <div class="result-item">
            <span class="result-label">Total horas con recargo ${formatHourRate(valorConRecargo)} ${recargoText} <small>(18:00 - 07:00)</small></span>
            <span class="result-value">${formatHours(report.totalConRecargo)}</span>
        </div>
        <div class="result-item">
            <span class="result-label">Total horas normales operador</span>
            <span class="result-value">${formatHours(report.totalNormalesOp)}</span>
        </div>
        <div class="result-item">
            <span class="result-label">Total horas dobles operador</span>
            <span class="result-value">${formatHours(report.totalDoblesOp)}</span>
        </div>
        <div class="result-item total">
            <span class="result-label">Monto Total Semanal</span>
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
