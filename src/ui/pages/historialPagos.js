/**
 * historialPagos.js - Lógica de la página "Historial de Estados de Pago"
 *
 * Muestra y gestiona únicamente los estados de pago guardados. Al eliminar un
 * estado de pago se eliminan también los registros que tiene asociados
 * (órdenes de trabajo y reportes), salvo los que estén compartidos con otro
 * estado de pago, para no acumular información.
 */

import { initSidebar } from '../components/sidebar.js';
import { showConfirmModal } from '../components/confirmModal.js';
import {
    getRecordsSummary,
    getRecordDetail,
    getPagoAsociados,
    deletePagoConAsociados,
} from '../../store/storageManager.js';
import { formatCurrency, formatHours, formatHourRate } from '../../core/utils/formatUtils.js';
import { normalizarTramosPorRecargo } from '../../core/utils/hoursUtils.js';

// Elementos del DOM
const historialPagosBody = document.getElementById('historialPagosBody');
const filtroIndiceInput = document.getElementById('filtroIndice');
const detailResultsDiv = document.getElementById('detailResults');
const detailContentDiv = document.getElementById('detailContent');
const messageDiv = document.getElementById('pagosMessage');

/**
 * Normaliza las horas de un estado de pago según el recargo de sus elementos.
 * Si ningún elemento tiene recargo, todas las horas se consideran sin recargo.
 *
 * @param {Object} record - Estado de pago
 * @returns {{ horasSinRecargo: number, horasConRecargo: number }}
 */
function getHorasPago(record) {
    const totales = record.totales || {};
    let horasSinRecargo = totales.totalSinRecargo || 0;
    let horasConRecargo = totales.totalConRecargo || 0;

    const items = record.items || [];
    const conRecargo = items.filter((it) => {
        const rec = it.recargoPorcentaje !== undefined && it.recargoPorcentaje !== null
            ? it.recargoPorcentaje
            : 30;
        return rec > 0;
    });
    const recargoPorcentaje = items.length > 0 && conRecargo.length === 0 ? 0 : 30;

    const tramos = normalizarTramosPorRecargo(horasSinRecargo, horasConRecargo, recargoPorcentaje);

    return {
        horasSinRecargo: tramos.sinRecargo,
        horasConRecargo: tramos.conRecargo,
    };
}

/**
 * Formatea la fecha de emisión a partir del timestamp del registro
 *
 * @param {number} timestamp
 * @returns {string} Ej: "05-09-2026"
 */
function formatEmitido(timestamp) {
    if (!timestamp) return '—';
    const date = new Date(timestamp);
    if (Number.isNaN(date.getTime())) return '—';
    return date.toLocaleDateString('es-CL', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
    });
}

/**
 * Muestra un mensaje de retroalimentación (éxito o error)
 *
 * @param {string} texto
 * @param {'success'|'error'} tipo
 */
function showMessage(texto, tipo) {
    if (!messageDiv) return;

    messageDiv.textContent = texto;
    messageDiv.classList.remove('historial-message--success', 'historial-message--error');
    messageDiv.classList.add(tipo === 'success' ? 'historial-message--success' : 'historial-message--error');
    messageDiv.classList.add('show');
}

/**
 * Oculta el mensaje de retroalimentación
 */
function hideMessage() {
    if (messageDiv) {
        messageDiv.classList.remove('show');
    }
}

/**
 * Renderiza la tabla de estados de pago
 * @param {Array<Object>} records - Lista de estados de pago
 */
function renderTable(records) {
    if (!historialPagosBody) return;

    if (records.length === 0) {
        historialPagosBody.innerHTML = '<tr><td colspan="7" class="empty-message">No hay estados de pago almacenados.</td></tr>';
        return;
    }

    let html = '';
    records.forEach((record) => {
        const fecha = formatEmitido(record.timestamp);
        const hSinRecargo = formatHours(record.horasSinRecargo || 0);
        const hConRecargo = formatHours(record.horasConRecargo || 0);
        const monto = formatCurrency(record.montoTotal || 0);

        html += '<tr>' +
            '<td class="cell-indice">' + record.indice + '</td>' +
            '<td>' + fecha + '</td>' +
            '<td>' + (record.numElementos || 0) + '</td>' +
            '<td>' + hSinRecargo + '</td>' +
            '<td>' + hConRecargo + '</td>' +
            '<td class="cell-monto">' + monto + '</td>' +
            '<td class="cell-acciones">' +
            '<div class="actions-col">' +
            '<button class="btn-action" title="Ver detalle" data-indice="' + record.indice + '">' +
            '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="15" height="15"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>' +
            'Ver</button>' +
            '<button class="btn-action" title="Modificar" data-indice="' + record.indice + '">' +
            '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="15" height="15"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>' +
            'Editar</button>' +
            '<button class="btn-action btn-danger" title="Eliminar" data-indice="' + record.indice + '">' +
            '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="15" height="15"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>' +
            'Eliminar</button>' +
            '</div>' +
            '</td>' +
            '</tr>';
    });

    historialPagosBody.innerHTML = html;

    // Asignar event listeners a los botones
    historialPagosBody.querySelectorAll('.btn-action[title="Ver detalle"]').forEach((btn) => {
        btn.addEventListener('click', () => handleViewDetail(btn.dataset.indice));
    });

    historialPagosBody.querySelectorAll('.btn-action[title="Modificar"]').forEach((btn) => {
        btn.addEventListener('click', () => handleEdit(btn.dataset.indice));
    });

    historialPagosBody.querySelectorAll('.btn-action[title="Eliminar"]').forEach((btn) => {
        btn.addEventListener('click', () => handleDelete(btn.dataset.indice));
    });
}

/**
 * Muestra el detalle de un estado de pago
 * @param {string} indice
 */
function handleViewDetail(indice) {
    const record = getRecordDetail(indice);
    if (!record || record.tipo !== 'pago') {
        detailContentDiv.innerHTML = '<p class="error-msg">Registro no encontrado.</p>';
        detailResultsDiv.classList.add('show');
        return;
    }

    const { horasSinRecargo: hSR, horasConRecargo: hCR } = getHorasPago(record);
    const totales = record.totales || {};
    let html = '<h2>💰 Detalle del Estado de Pago #' + record.indice + '</h2>';

    html += '<div class="result-item">' +
        '<span class="result-label">Emitido</span>' +
        '<span class="result-value">' + formatEmitido(record.timestamp) + '</span>' +
        '</div>' +
        '<div class="result-item">' +
        '<span class="result-label">Elementos incluidos</span>' +
        '<span class="result-value">' + (record.items ? record.items.length : 0) + '</span>' +
        '</div>';

    if (totales.detalleItems && totales.detalleItems.length > 0) {
        html += '<h3>Detalle por elemento</h3>';
        totales.detalleItems.forEach((det) => {
            const tipoLabel = '🧾 Servicio';
            const detRecargo = det.recargoPorcentaje !== undefined && det.recargoPorcentaje !== null
                ? det.recargoPorcentaje
                : 30;
            let detHSR = det.horasSinRecargo || 0;
            let detHCR = det.horasConRecargo || 0;
            if (detRecargo <= 0) {
                detHSR += detHCR;
                detHCR = 0;
            }
            html += '<div class="result-item">' +
                '<span class="result-label">' + tipoLabel + ' #' + det.indice + '</span>' +
                '<span class="result-value">' + formatCurrency(det.monto) + '</span>' +
                '</div>';
            html += '<div class="result-item" style="padding-left: 20px;">' +
                '<span class="result-label">Horas sin/con recargo</span>' +
                '<span class="result-value">' + formatHours(detHSR) + ' / ' + formatHours(detHCR) + '</span>' +
                '</div>';
            html += '<div class="result-item" style="padding-left: 20px;">' +
                '<span class="result-label">Valor hora normal / con recargo</span>' +
                '<span class="result-value">' + formatHourRate(det.valorHora || 0) + ' / ' + formatHourRate(det.valorConRecargo || 0) + '</span>' +
                '</div>';
        });
    }

    html += '<div class="result-item">' +
        '<span class="result-label">Total horas sin recargo</span>' +
        '<span class="result-value">' + formatHours(hSR) + '</span>' +
        '</div>' +
        (hCR > 0
            ? '<div class="result-item">' +
            '<span class="result-label">Total horas con recargo</span>' +
            '<span class="result-value">' + formatHours(hCR) + '</span>' +
            '</div>'
            : '') +
        '<div class="result-item total">' +
        '<span class="result-label">Monto Total</span>' +
        '<span class="result-value">' + formatCurrency(totales.totalMonto || 0) + '</span>' +
        '</div>';

    detailContentDiv.innerHTML = html;
    detailResultsDiv.classList.add('show');
    detailResultsDiv.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

/**
 * Redirige a la página de estados de pago con los datos del registro para editar
 * @param {string} indice
 */
function handleEdit(indice) {
    const record = getRecordDetail(indice);
    if (!record) {
        showMessage('❌ Registro no encontrado.', 'error');
        return;
    }

    // Usar sessionStorage para pasar los datos del registro a la otra página
    sessionStorage.setItem('editarRegistro', JSON.stringify(record));
    window.location.href = 'pagos.html?editar=' + indice;
}

/**
 * Elimina un estado de pago y, en cascada, los registros que tiene asociados.
 * Los registros compartidos con otro estado de pago se conservan.
 *
 * @param {string} indice
 */
async function handleDelete(indice) {
    hideMessage();

    const record = getRecordDetail(indice);
    if (!record || record.tipo !== 'pago') {
        showMessage('❌ Registro no encontrado.', 'error');
        return;
    }

    const { propios, compartidos } = getPagoAsociados(indice);

    const detalle = [];
    if (propios.length > 0) {
        detalle.push('También se eliminarán los registros asociados: #' + propios.join(', #') + '.');
    }
    if (compartidos.length > 0) {
        detalle.push('Se conservarán (compartidos con otros estados de pago): #' + compartidos.join(', #') + '.');
    }

    const confirmado = await showConfirmModal({
        title: 'Eliminar estado de pago',
        message: '¿Está seguro de eliminar el estado de pago #' + indice + '?',
        detail: detalle.join('\n'),
        confirmText: 'Eliminar',
        cancelText: 'Cancelar',
    });

    if (!confirmado) return;

    const resultado = deletePagoConAsociados(indice);

    if (!resultado.ok) {
        showMessage('❌ No se pudo eliminar el estado de pago. Intente nuevamente.', 'error');
        return;
    }

    applyFilters();
    detailResultsDiv.classList.remove('show');

    let mensaje = '✅ Estado de pago #' + indice + ' eliminado.';
    if (propios.length > 0) {
        mensaje += ' Se eliminaron ' + propios.length + ' registro(s) asociado(s).';
    }
    if (compartidos.length > 0) {
        mensaje += ' Se conservaron ' + compartidos.length + ' registro(s) compartido(s).';
    }
    showMessage(mensaje, 'success');
}

/**
 * Aplica el filtro por índice y renderiza la tabla
 */
function applyFilters() {
    let records = getRecordsSummary().filter(r => r.tipo === 'pago');

    const indiceFilter = filtroIndiceInput ? filtroIndiceInput.value.trim() : '';
    if (indiceFilter) {
        records = records.filter(r => String(r.indice).includes(indiceFilter));
    }

    renderTable(records);
}

/**
 * Inicializa los event listeners de la página de historial de estados de pago
 */
export function initHistorialPagosPage() {
    initSidebar();

    applyFilters();

    if (filtroIndiceInput) {
        filtroIndiceInput.addEventListener('input', applyFilters);
    }
}
