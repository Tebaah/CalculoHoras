/**
 * renderReport.js - Funciones para renderizar resultados del reporte semanal
 */

import { formatHourRate, formatCurrency, formatHours } from '../../core/utils/formatUtils.js';
import { NOMBRES_DIAS } from '../../core/constants.js';

/**
 * Puebla la tabla de horas diarias en los resultados del reporte
 *
 * @param {Array<Object>} results - Arreglo con resultados de cada día
 */
export function populateDailyHoursTable(results) {
    const tableContainer = document.getElementById('hoursDailyTable');

    let html = '<div class="result-item"><span class="result-label">D\u00EDa</span><span class="result-value">Horas</span></div>';

    results.forEach((r) => {
        const nombreDia = NOMBRES_DIAS[r.dia] || r.dia;
        html += '<div class="result-item">' +
            '<span class="result-label">' + nombreDia + '</span>' +
            '<span class="result-value">' + formatHours(r.horasTotales) + '</span>' +
            '</div>';
    });

    tableContainer.innerHTML = html;
}

/**
 * Renderiza los totales del reporte semanal en el DOM
 *
 * @param {Object} report - Reporte semanal calculado
 * @param {Array} report.results - Resultados por día
 * @param {number} report.totalSinRecargo
 * @param {number} report.totalConRecargo
 * @param {number} report.totalNormalesOp
 * @param {number} report.totalDoblesOp
 * @param {number} report.totalMonto
 * @param {number} report.daysCount
 * @param {number} valorHora - Valor de la hora normal
 */
export function renderReportTotals(report, valorHora) {
    const valorSinRecargo = valorHora;
    const valorConRecargo = valorHora * 1.30;

    // Poblar tabla de horas diarias
    populateDailyHoursTable(report.results);

    // Nombres de los días incluidos
    const diasNombres = report.results
        .map((r) => NOMBRES_DIAS[r.dia] || r.dia)
        .join(', ');

    document.getElementById('diasIncluidos').textContent = diasNombres;
    document.getElementById('totalSinRecargo').textContent = formatHours(report.totalSinRecargo);
    document.getElementById('totalConRecargo').textContent = formatHours(report.totalConRecargo);
    document.getElementById('totalNormalesOp').textContent = formatHours(report.totalNormalesOp);
    document.getElementById('totalDoblesOp').textContent = formatHours(report.totalDoblesOp);
    document.getElementById('totalMonto').textContent = formatCurrency(report.totalMonto);

    // Actualizar etiquetas con valores/hora
    const labels = document.querySelectorAll('#totalResults > .result-item .result-label');
    labels.forEach((label) => {
        if (label.textContent.includes('Total horas sin recargo')) {
            label.textContent = 'Total horas sin recargo ' + formatHourRate(valorSinRecargo) + ' (07:00 - 18:00)';
        }
        if (label.textContent.includes('Total horas con recargo')) {
            label.textContent = 'Total horas con recargo ' + formatHourRate(valorConRecargo) + ' (18:00 - 07:00)';
        }
    });
}