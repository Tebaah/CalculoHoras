/**
 * historial.js - Lógica de la página "Historial"
 *
 * Muestra y gestiona los registros almacenados.
 */

import { initSidebar } from '../components/sidebar.js';
import { getRecordsSummary, getRecordDetail, deleteRecord, exportRecordsToJSON, importRecordsFromJSON } from '../../store/storageManager.js';
import { formatCurrency, formatHours, formatHourRate } from '../../core/utils/formatUtils.js';

// Elementos del DOM
const historialBody = document.getElementById('historialBody');
const filtroIndiceInput = document.getElementById('filtroIndice');
const filtroTipoSelect = document.getElementById('filtroTipo');
const detailResultsDiv = document.getElementById('detailResults');
const detailContentDiv = document.getElementById('detailContent');
const exportarBtn = document.getElementById('exportarBtn');
const importarBtn = document.getElementById('importarBtn');
const fileInput = document.getElementById('fileInput');

/**
 * Renderiza la tabla de registros
 * @param {Array<Object>} records - Lista de registros
 */
function renderTable(records) {
    if (records.length === 0) {
        historialBody.innerHTML = '<tr><td colspan="7" class="empty-message">No se encontraron registros.</td></tr>';
        return;
    }

    let html = '';
    records.forEach((record) => {
        let tipoLabel;
        if (record.tipo === 'orden') {
            tipoLabel = 'Orden';
        } else if (record.tipo === 'pago') {
            tipoLabel = 'Pago';
        } else {
            tipoLabel = 'Reporte';
        }
        const fecha = record.fecha || '—';
        const hSinRecargo = formatHours(record.horasSinRecargo || 0);
        const hConRecargo = formatHours(record.horasConRecargo || 0);
        const monto = formatCurrency(record.montoTotal || 0);

        html += '<tr>' +
            '<td class="cell-indice">' + record.indice + '</td>' +
            '<td>' + tipoLabel + '</td>' +
            '<td>' + fecha + '</td>' +
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

    historialBody.innerHTML = html;

    // Asignar event listeners a los botones
    historialBody.querySelectorAll('.btn-action[title="Ver detalle"]').forEach((btn) => {
        btn.addEventListener('click', () => handleViewDetail(btn.dataset.indice));
    });

    historialBody.querySelectorAll('.btn-action[title="Modificar"]').forEach((btn) => {
        btn.addEventListener('click', () => handleEdit(btn.dataset.indice));
    });

    historialBody.querySelectorAll('.btn-action[title="Eliminar"]').forEach((btn) => {
        btn.addEventListener('click', () => handleDelete(btn.dataset.indice));
    });
}

/**
 * Muestra el detalle de un registro
 * @param {string} indice
 */
function handleViewDetail(indice) {
    const record = getRecordDetail(indice);
    if (!record) {
        detailContentDiv.innerHTML = '<p class="error-msg">Registro no encontrado.</p>';
        detailResultsDiv.classList.add('show');
        return;
    }

    let html = '<h2>📄 Detalle del Registro #' + record.indice + '</h2>';

    if (record.tipo === 'pago') {
        const totales = record.totales || {};
        html += '<div class="result-item">' +
            '<span class="result-label">Tipo</span>' +
            '<span class="result-value">💰 Estado de Pago</span>' +
            '</div>' +
            '<div class="result-item">' +
            '<span class="result-label">Elementos incluidos</span>' +
            '<span class="result-value">' + (record.items ? record.items.length : 0) + '</span>' +
            '</div>';

        if (totales.detalleItems && totales.detalleItems.length > 0) {
            html += '<h3>Detalle por elemento</h3>';
            totales.detalleItems.forEach((det) => {
                const tipoLabel = det.tipo === 'orden' ? '📋 Orden' : '📊 Reporte';
                html += '<div class="result-item">' +
                    '<span class="result-label">' + tipoLabel + ' #' + det.indice + '</span>' +
                    '<span class="result-value">' + formatCurrency(det.monto) + '</span>' +
                    '</div>';
                html += '<div class="result-item" style="padding-left: 20px;">' +
                    '<span class="result-label">Horas sin/con recargo</span>' +
                    '<span class="result-value">' + formatHours(det.horasSinRecargo) + ' / ' + formatHours(det.horasConRecargo) + '</span>' +
                    '</div>';
                html += '<div class="result-item" style="padding-left: 20px;">' +
                    '<span class="result-label">Valor hora normal / con recargo</span>' +
                    '<span class="result-value">' + formatHourRate(det.valorHora || 0) + ' / ' + formatHourRate(det.valorConRecargo || 0) + '</span>' +
                    '</div>';
            });
        }

        html += '<div class="result-item">' +
            '<span class="result-label">Total horas sin recargo</span>' +
            '<span class="result-value">' + formatHours(totales.totalSinRecargo || 0) + '</span>' +
            '</div>' +
            '<div class="result-item">' +
            '<span class="result-label">Total horas con recargo</span>' +
            '<span class="result-value">' + formatHours(totales.totalConRecargo || 0) + '</span>' +
            '</div>' +
            '<div class="result-item total">' +
            '<span class="result-label">Monto Total</span>' +
            '<span class="result-value">' + formatCurrency(totales.totalMonto || 0) + '</span>' +
            '</div>';
    } else if (record.tipo === 'orden') {
        html += '<div class="result-item">' +
            '<span class="result-label">Tipo</span>' +
            '<span class="result-value">Orden de Trabajo</span>' +
            '</div>' +
            '<div class="result-item">' +
            '<span class="result-label">Fecha del servicio</span>' +
            '<span class="result-value">' + (record.fecha || '—') + '</span>' +
            '</div>' +
            '<div class="result-item">' +
            '<span class="result-label">Hora Inicio</span>' +
            '<span class="result-value">' + (record.horaInicio || '—') + '</span>' +
            '</div>' +
            '<div class="result-item">' +
            '<span class="result-label">Hora Término</span>' +
            '<span class="result-value">' + (record.horaTermino || '—') + '</span>' +
            '</div>' +
            '<div class="result-item">' +
            '<span class="result-label">Colación</span>' +
            '<span class="result-value">' + (record.colacion || 0) + ' min</span>' +
            '</div>' +
            '<div class="result-item">' +
            '<span class="result-label">Horas sin recargo</span>' +
            '<span class="result-value">' + formatHours(record.horasSinRecargo) + '</span>' +
            '</div>' +
            '<div class="result-item">' +
            '<span class="result-label">Horas con recargo</span>' +
            '<span class="result-value">' + formatHours(record.horasConRecargo) + '</span>' +
            '</div>' +
            '<div class="result-item total">' +
            '<span class="result-label">Monto Total del Servicio</span>' +
            '<span class="result-value">' + formatCurrency(record.montoTotal) + '</span>' +
            '</div>';
    } else {
        // Reporte
        const totales = record.totales || {};
        html += '<div class="result-item">' +
            '<span class="result-label">Tipo</span>' +
            '<span class="result-value">Reporte Semanal</span>' +
            '</div>' +
            '<div class="result-item">' +
            '<span class="result-label">Días incluidos</span>' +
            '<span class="result-value">' + (record.dias ? record.dias.length : 0) + '</span>' +
            '</div>';

        // Mostrar cada día
        if (record.dias && record.dias.length > 0) {
            html += '<h3>Días del reporte</h3>';
            record.dias.forEach((dia, i) => {
                const nombreDia = dia.dia ? dia.dia.charAt(0).toUpperCase() + dia.dia.slice(1) : 'Día ' + (i + 1);
                html += '<div class="result-item">' +
                    '<span class="result-label">' + nombreDia + ' (' + (dia.fecha || '—') + ')</span>' +
                    '<span class="result-value">' + (dia.horaInicio || '—') + ' - ' + (dia.horaTermino || '—') + ' | Col: ' + (dia.colacion || 0) + ' min</span>' +
                    '</div>';
            });
        }

        html += '<div class="result-item">' +
            '<span class="result-label">Total horas sin recargo</span>' +
            '<span class="result-value">' + formatHours(totales.horasSinRecargo || 0) + '</span>' +
            '</div>' +
            '<div class="result-item">' +
            '<span class="result-label">Total horas con recargo</span>' +
            '<span class="result-value">' + formatHours(totales.horasConRecargo || 0) + '</span>' +
            '</div>' +
            '<div class="result-item total">' +
            '<span class="result-label">Monto Total Semanal</span>' +
            '<span class="result-value">' + formatCurrency(totales.montoTotal || 0) + '</span>' +
            '</div>';
    }

    detailContentDiv.innerHTML = html;
    detailResultsDiv.classList.add('show');
    detailResultsDiv.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

/**
 * Redirige a la página correspondiente con los datos del registro para editar
 * @param {string} indice
 */
function handleEdit(indice) {
    const record = getRecordDetail(indice);
    if (!record) {
        alert('Registro no encontrado.');
        return;
    }

    // Usar sessionStorage para pasar los datos del registro a la otra página
    sessionStorage.setItem('editarRegistro', JSON.stringify(record));

    if (record.tipo === 'orden') {
        window.location.href = 'ordenes.html?editar=' + indice;
    } else if (record.tipo === 'pago') {
        window.location.href = 'pagos.html?editar=' + indice;
    } else {
        window.location.href = 'reportes.html?editar=' + indice;
    }
}

/**
 * Maneja la eliminación de un registro
 * @param {string} indice
 */
function handleDelete(indice) {
    if (!confirm('¿Está seguro de eliminar el registro con índice ' + indice + '?')) {
        return;
    }

    const deleted = deleteRecord(indice);
    if (deleted) {
        applyFilters();
        // Si el detalle está visible y corresponde al registro eliminado, ocultarlo
        detailResultsDiv.classList.remove('show');
    } else {
        alert('No se pudo eliminar el registro. Intente nuevamente.');
    }
}

/**
 * Aplica los filtros actuales y renderiza la tabla
 */
function applyFilters() {
    let records = getRecordsSummary();

    // Filtro por tipo
    const tipoFilter = filtroTipoSelect.value;
    if (tipoFilter !== 'todos') {
        records = records.filter(r => r.tipo === tipoFilter);
    }

    // Filtro por índice
    const indiceFilter = filtroIndiceInput.value.trim();
    if (indiceFilter) {
        records = records.filter(r => String(r.indice).includes(indiceFilter));
    }

    renderTable(records);
}

/**
 * Maneja la exportación de registros a JSON
 */
function handleExport() {
    try {
        exportRecordsToJSON();
    } catch (error) {
        alert('\u274C ' + error.message);
    }
}

/**
 * Maneja la importación de registros desde JSON
 */
function handleImport() {
    fileInput.click();
}

/**
 * Procesa el archivo seleccionado para importar
 */
function handleFileSelected(e) {
    const file = e.target.files[0];
    if (!file) return;

    importRecordsFromJSON(file)
        .then((result) => {
            let msg = '✅ Importación completada:\n';
            msg += '   • Nuevos registros: ' + result.imported + '\n';
            msg += '   • Registros actualizados: ' + result.updated + '\n';
            msg += '   • Total procesados: ' + result.total;
            alert(msg);
            applyFilters();
        })
        .catch((error) => {
            alert('\u274C ' + error.message);
        })
        .finally(() => {
            fileInput.value = '';
        });
}

/**
 * Inicializa los event listeners de la página de historial
 */
export function initHistorialPage() {
    initSidebar();

    applyFilters();

    filtroIndiceInput.addEventListener('input', applyFilters);
    // Agregar opción "Pagos" al filtro si no existe
    const optionExiste = filtroTipoSelect.querySelector('option[value="pago"]');
    if (!optionExiste) {
        const pagoOption = document.createElement('option');
        pagoOption.value = 'pago';
        pagoOption.textContent = '💰 Estados de Pago';
        filtroTipoSelect.appendChild(pagoOption);
    }

    filtroTipoSelect.addEventListener('change', applyFilters);

    exportarBtn.addEventListener('click', handleExport);
    importarBtn.addEventListener('click', handleImport);
    fileInput.addEventListener('change', handleFileSelected);
}
