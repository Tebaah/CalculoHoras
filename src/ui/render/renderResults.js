/**
 * renderResults.js - Funciones para renderizar resultados de cálculo individual
 */

import { formatHourRate, formatCurrency, formatHours } from '../../core/utils/formatUtils.js';
import { TIPOS_DIA } from '../../core/constants.js';

function getLabelsByDayType(tipoDia, valorSinRecargo, valorConRecargo, recargoPorcentaje) {
    const recargoText = recargoPorcentaje > 0
        ? `(+${recargoPorcentaje}%)`
        : '(sin recargo)';

    const labels = {
        [TIPOS_DIA.NORMAL]: {
            sinRecargo: `Horas sin recargo ${formatHourRate(valorSinRecargo)} <small>(07:00 - 18:00)</small>`,
            conRecargo: `Horas con recargo ${formatHourRate(valorConRecargo)} ${recargoText} <small>(18:00 - 07:00)</small>`,
            doblesOp: 'Horas dobles del operador <small>(antes 07:00 y después 19:00)</small>',
        },
        [TIPOS_DIA.SABADO]: {
            sinRecargo: `Horas sin recargo ${formatHourRate(valorSinRecargo)} <small>(07:00 - 13:00)</small>`,
            conRecargo: `Horas con recargo ${formatHourRate(valorConRecargo)} ${recargoText} <small>(desde 13:00)</small>`,
            doblesOp: 'Horas dobles del operador <small>(desde 13:00)</small>',
        },
        [TIPOS_DIA.DOMINGO_FESTIVO]: {
            sinRecargo: `Horas sin recargo ${formatHourRate(valorSinRecargo)}`,
            conRecargo: `Horas con recargo ${formatHourRate(valorConRecargo)} ${recargoText} <small>(todo el día)</small>`,
            doblesOp: 'Horas dobles del operador <small>(todo el día)</small>',
        },
    };

    return labels[tipoDia] || labels[TIPOS_DIA.NORMAL];
}

export function renderResults(result) {
    const labels = getLabelsByDayType(result.tipoDia, result.valorSinRecargo, result.valorConRecargo, result.recargoPorcentaje);

    const html = `
        <div class="result-item">
            <span class="result-label">${labels.sinRecargo}</span>
            <span class="result-value">${formatHours(result.horasSinRecargo)}</span>
        </div>
        <div class="result-item">
            <span class="result-label">${labels.conRecargo}</span>
            <span class="result-value">${formatHours(result.horasConRecargo)}</span>
        </div>
        <div class="result-item">
            <span class="result-label">Horas normales del operador <small>(total horas trabajadas)</small></span>
            <span class="result-value">${formatHours(result.horasNormalesOp)}</span>
        </div>
        <div class="result-item">
            <span class="result-label">${labels.doblesOp}</span>
            <span class="result-value">${formatHours(result.horasDobles)}</span>
        </div>
        <div class="result-item total">
            <span class="result-label">Monto Total del Servicio</span>
            <span class="result-value">${formatCurrency(result.montoTotal)}</span>
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
