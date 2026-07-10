/**
 * pagos.js - Lógica de la página "Estados de Pago"
 *
 * Permite agrupar órdenes de trabajo y reportes semanales existentes
 * en un único estado de pago, mostrando el detalle completo de cada uno
 * y un resumen de totales.
 */

import { initSidebar } from '../components/sidebar.js';
import { getRecordDetail, saveRecord } from '../../store/storageManager.js';
import { formatCurrency, formatHours, formatHourRate } from '../../core/utils/formatUtils.js';
import { NOMBRES_DIAS } from '../../core/constants.js';

// Elementos del DOM
const indicePagoInput = document.getElementById('indicePago');
const buscarIndiceInput = document.getElementById('buscarIndice');
const buscarBtn = document.getElementById('buscarBtn');
const searchResult = document.getElementById('searchResult');
const searchResultContent = document.getElementById('searchResultContent');
const agregarItemBtn = document.getElementById('agregarItemBtn');
const pagoItemsList = document.getElementById('pagoItemsList');
const itemsContainer = document.getElementById('itemsContainer');
const itemsCount = document.getElementById('itemsCount');
const pagoEmptyMessage = document.getElementById('pagoEmptyMessage');
const errorDiv = document.getElementById('errorMessage');
const guardarBtn = document.getElementById('guardarPagoBtn');
const totalResultsDiv = document.getElementById('totalResults');

// Elementos de resultados
const diasIncluidosEl = document.getElementById('diasIncluidos');
const totalSinRecargoEl = document.getElementById('totalSinRecargo');
const totalConRecargoEl = document.getElementById('totalConRecargo');
const totalMontoEl = document.getElementById('totalMonto');
const pagoDetalleItemsEl = document.getElementById('pagoDetalleItems');

// Estado interno
let itemsAgregados = [];
let ultimoResultadoBusqueda = null;

/**
 * Renderiza el detalle de un registro encontrado en la búsqueda
 */
function renderSearchResult(record) {
    let html = '<div class="search-result-card">';
    html += '<div class="search-result-header">';
    const tipoTexto = record.tipo === 'orden' ? '📋 Orden de Trabajo' : '📊 Reporte Semanal';
    html += '<span class="search-result-type">' + tipoTexto + '</span>';
    html += '<span class="search-result-indice">#' + record.indice + '</span>';
    html += '</div>';

    if (record.tipo === 'orden') {
        html += '<div class="search-result-body">';
        html += '<div class="result-item"><span class="result-label">Fecha</span><span class="result-value">' + (record.fecha || '—') + '</span></div>';
        html += '<div class="result-item"><span class="result-label">Horario</span><span class="result-value">' + (record.horaInicio || '—') + ' - ' + (record.horaTermino || '—') + '</span></div>';
        html += '<div class="result-item"><span class="result-label">Colación</span><span class="result-value">' + (record.colacion || 0) + ' min</span></div>';
        html += '<div class="result-item"><span class="result-label">Valor hora</span><span class="result-value">' + formatHourRate(record.valorHora || 0) + '</span></div>';
        html += '<div class="result-item"><span class="result-label">Horas sin recargo</span><span class="result-value">' + formatHours(record.horasSinRecargo || 0) + '</span></div>';
        html += '<div class="result-item"><span class="result-label">Horas con recargo</span><span class="result-value">' + formatHours(record.horasConRecargo || 0) + '</span></div>';
        html += '<div class="result-item total"><span class="result-label">Monto Total</span><span class="result-value">' + formatCurrency(record.montoTotal || 0) + '</span></div>';
        html += '</div>';
    } else {
        // Reporte
        html += '<div class="search-result-body">';
        html += '<div class="result-item"><span class="result-label">Valor hora</span><span class="result-value">' + formatHourRate(record.valorHora || 0) + '</span></div>';

        if (record.dias && record.dias.length > 0) {
            html += '<h3 style="font-size:14px;margin:10px 0 6px;color:var(--color-text-secondary);">Días del reporte</h3>';
            html += '<div class="search-result-dias">';
            record.dias.forEach((dia, i) => {
                const nombreDia = NOMBRES_DIAS[dia.dia] || dia.dia || 'Día ' + (i + 1);
                const fechaStr = dia.fecha ? ' (' + dia.fecha + ')' : '';
                const hSR = formatHours(dia.horasSinRecargo || 0);
                const hCR = formatHours(dia.horasConRecargo || 0);
                html += '<div class="result-item result-item--small">';
                html += '<span class="result-label">' + nombreDia + fechaStr + '</span>';
                html += '<span class="result-value">' + (dia.horaInicio || '—') + ' - ' + (dia.horaTermino || '—') + ' | Col: ' + (dia.colacion || 0) + ' min | SR: ' + hSR + ' / CR: ' + hCR + '</span>';
                html += '</div>';
            });
            html += '</div>';
        }

        const totales = record.totales || {};
        html += '<div class="result-item"><span class="result-label">Total horas sin recargo</span><span class="result-value">' + formatHours(totales.horasSinRecargo || 0) + '</span></div>';
        html += '<div class="result-item"><span class="result-label">Total horas con recargo</span><span class="result-value">' + formatHours(totales.horasConRecargo || 0) + '</span></div>';
        html += '<div class="result-item total"><span class="result-label">Monto Total</span><span class="result-value">' + formatCurrency(totales.montoTotal || 0) + '</span></div>';
        html += '</div>';
    }

    html += '</div>';
    searchResultContent.innerHTML = html;
    searchResult.style.display = 'block';
    agregarItemBtn.style.display = 'inline-flex';
}

function handleSearch() {
    errorDiv.classList.remove('show');
    searchResult.style.display = 'none';
    ultimoResultadoBusqueda = null;

    const indice = buscarIndiceInput.value.trim();
    if (!indice) {
        errorDiv.textContent = '\u274C Debe ingresar un índice de registro.';
        errorDiv.classList.add('show');
        return;
    }

    const record = getRecordDetail(indice);
    if (!record) {
        errorDiv.textContent = '\u274C No se encontró ningún registro con el índice "' + indice + '".';
        errorDiv.classList.add('show');
        return;
    }

    if (record.tipo === 'pago') {
        errorDiv.textContent = '\u274C No se pueden agregar estados de pago dentro de otro estado de pago.';
        errorDiv.classList.add('show');
        return;
    }

    const yaAgregado = itemsAgregados.some(item => item.indice === record.indice);
    if (yaAgregado) {
        errorDiv.textContent = '\u274C Este registro ya está agregado al estado de pago.';
        errorDiv.classList.add('show');
        return;
    }

    ultimoResultadoBusqueda = record;
    renderSearchResult(record);
}

function handleAddItem() {
    if (!ultimoResultadoBusqueda) return;

    itemsAgregados.push(ultimoResultadoBusqueda);
    ultimoResultadoBusqueda = null;

    searchResult.style.display = 'none';
    buscarIndiceInput.value = '';
    actualizarItemsList();
    calcularTotales();
}

function handleRemoveItem(indice) {
    itemsAgregados = itemsAgregados.filter(item => item.indice !== indice);
    actualizarItemsList();
    calcularTotales();
}

/**
 * Obtiene el desglose de horas por día para un reporte
 */
function obtenerDiasReporte(item) {
    if (item.tipo === 'orden') {
        return [{
            nombre: NOMBRES_DIAS[item.tipoDia] || item.tipoDia || 'Día',
            fecha: item.fecha || '—',
            horaInicio: item.horaInicio || '—',
            horaTermino: item.horaTermino || '—',
            colacion: item.colacion || 0,
            horasSinRecargo: item.horasSinRecargo || 0,
            horasConRecargo: item.horasConRecargo || 0,
        }];
    }

    if (item.dias && item.dias.length > 0) {
        return item.dias.map(dia => ({
            nombre: NOMBRES_DIAS[dia.dia] || dia.dia || 'Día',
            fecha: dia.fecha || '—',
            horaInicio: dia.horaInicio || '—',
            horaTermino: dia.horaTermino || '—',
            colacion: dia.colacion || 0,
            horasSinRecargo: dia.horasSinRecargo || 0,
            horasConRecargo: dia.horasConRecargo || 0,
        }));
    }

    return [];
}

function actualizarItemsList() {
    if (itemsAgregados.length === 0) {
        pagoItemsList.style.display = 'none';
        pagoEmptyMessage.style.display = 'block';
        totalResultsDiv.classList.remove('show');
        return;
    }

    pagoItemsList.style.display = 'block';
    pagoEmptyMessage.style.display = 'none';
    itemsCount.textContent = '(' + itemsAgregados.length + ')';

    let html = '';
    itemsAgregados.forEach((item) => {
        const tipoIcono = item.tipo === 'orden' ? '📋' : '📊';
        const tipoLabel = item.tipo === 'orden' ? 'Orden de Trabajo' : 'Reporte Semanal';

        html += '<div class="pago-item-card">';
        html += '<div class="pago-item-header">';
        html += '<span class="pago-item-title">' + tipoIcono + ' ' + tipoLabel + ' #' + item.indice + '</span>';
        html += '<span class="pago-item-valorhora">Valor hora: ' + formatHourRate(item.valorHora || 0) + '</span>';
        html += '<button type="button" class="btn-remove-item" data-indice="' + item.indice + '" title="Eliminar">🗑️</button>';
        html += '</div>';
        html += '<div class="pago-item-body">';

        // Mostrar cada día con sus horas
        const dias = obtenerDiasReporte(item);
        dias.forEach((dia) => {
            html += '<div class="result-item result-item--day">';
            html += '<span class="result-label">' + dia.nombre + (dia.fecha !== '—' ? ' (' + dia.fecha + ')' : '') + '</span>';
            html += '<span class="result-value">' + dia.horaInicio + ' - ' + dia.horaTermino + ' | Col: ' + dia.colacion + ' min | ' + formatHours(dia.horasSinRecargo) + ' SR / ' + formatHours(dia.horasConRecargo) + ' CR</span>';
            html += '</div>';
        });

        html += '</div></div>';
    });

    itemsContainer.innerHTML = html;

    itemsContainer.querySelectorAll('.btn-remove-item').forEach((btn) => {
        btn.addEventListener('click', () => handleRemoveItem(btn.dataset.indice));
    });
}

function calcularTotales() {
    if (itemsAgregados.length === 0) {
        totalResultsDiv.classList.remove('show');
        return;
    }

    let totalSinRecargo = 0;
    let totalConRecargo = 0;
    let totalMonto = 0;
    const detalleItems = [];

    itemsAgregados.forEach((item) => {
        if (item.tipo === 'orden') {
            totalSinRecargo += item.horasSinRecargo || 0;
            totalConRecargo += item.horasConRecargo || 0;
            totalMonto += item.montoTotal || 0;
            const valorConRecargo = (item.valorHora || 0) * (1 + ((item.recargoPorcentaje || 30) / 100));
            detalleItems.push({
                indice: item.indice,
                tipo: 'orden',
                horasSinRecargo: item.horasSinRecargo || 0,
                horasConRecargo: item.horasConRecargo || 0,
                valorHora: item.valorHora || 0,
                valorConRecargo,
                monto: item.montoTotal || 0,
            });
        } else {
            const totales = item.totales || {};
            totalSinRecargo += totales.horasSinRecargo || 0;
            totalConRecargo += totales.horasConRecargo || 0;
            totalMonto += totales.montoTotal || 0;
            const valorConRecargo = (item.valorHora || 0) * (1 + ((item.recargoPorcentaje || 30) / 100));
            detalleItems.push({
                indice: item.indice,
                tipo: 'reporte',
                horasSinRecargo: totales.horasSinRecargo || 0,
                horasConRecargo: totales.horasConRecargo || 0,
                valorHora: item.valorHora || 0,
                valorConRecargo,
                monto: totales.montoTotal || 0,
            });
        }
    });

    // Renderizar detalle por item
    let detalleHtml = '<h3>Detalle por elemento</h3>';
    detalleItems.forEach((det) => {
        const tipoLabel = det.tipo === 'orden' ? '📋 Orden' : '📊 Reporte';
        detalleHtml += '<div class="pago-detalle-item">';
        detalleHtml += '<div class="pago-detalle-item-header">' + tipoLabel + ' #' + det.indice + '</div>';
        detalleHtml += '<div class="result-item"><span class="result-label">Horas sin recargo</span><span class="result-value">' + formatHours(det.horasSinRecargo) + '</span></div>';
        detalleHtml += '<div class="result-item"><span class="result-label">Horas con recargo</span><span class="result-value">' + formatHours(det.horasConRecargo) + '</span></div>';
        detalleHtml += '<div class="result-item"><span class="result-label">Valor hora normal</span><span class="result-value">' + formatHourRate(det.valorHora) + '</span></div>';
        detalleHtml += '<div class="result-item"><span class="result-label">Valor hora con recargo</span><span class="result-value">' + formatHourRate(det.valorConRecargo) + '</span></div>';
        detalleHtml += '<div class="result-item total"><span class="result-label">Monto</span><span class="result-value">' + formatCurrency(det.monto) + '</span></div>';
        detalleHtml += '</div>';
    });

    pagoDetalleItemsEl.innerHTML = detalleHtml;
    diasIncluidosEl.textContent = itemsAgregados.length + ' elemento(s)';
    totalSinRecargoEl.textContent = formatHours(totalSinRecargo);
    totalConRecargoEl.textContent = formatHours(totalConRecargo);
    totalMontoEl.textContent = formatCurrency(totalMonto);

    totalResultsDiv.classList.add('show');
}

function handleSavePago() {
    errorDiv.classList.remove('show');

    const indice = indicePagoInput.value.trim();
    if (!indice) {
        errorDiv.textContent = '\u274C Debe ingresar un índice de almacenamiento.';
        errorDiv.classList.add('show');
        return;
    }

    if (itemsAgregados.length === 0) {
        errorDiv.textContent = '\u274C Debe agregar al menos un elemento al estado de pago.';
        errorDiv.classList.add('show');
        return;
    }

    try {
        let totalSinRecargo = 0;
        let totalConRecargo = 0;
        let totalMonto = 0;
        const detalleItems = [];

        itemsAgregados.forEach((item) => {
            if (item.tipo === 'orden') {
                totalSinRecargo += item.horasSinRecargo || 0;
                totalConRecargo += item.horasConRecargo || 0;
                totalMonto += item.montoTotal || 0;
                const valorConRecargo = (item.valorHora || 0) * (1 + ((item.recargoPorcentaje || 30) / 100));
                detalleItems.push({
                    indice: item.indice,
                    tipo: 'orden',
                    horasSinRecargo: item.horasSinRecargo || 0,
                    horasConRecargo: item.horasConRecargo || 0,
                    valorHora: item.valorHora || 0,
                    valorConRecargo,
                    monto: item.montoTotal || 0,
                });
            } else {
                const totales = item.totales || {};
                totalSinRecargo += totales.horasSinRecargo || 0;
                totalConRecargo += totales.horasConRecargo || 0;
                totalMonto += totales.montoTotal || 0;
                const valorConRecargo = (item.valorHora || 0) * (1 + ((item.recargoPorcentaje || 30) / 100));
                detalleItems.push({
                    indice: item.indice,
                    tipo: 'reporte',
                    horasSinRecargo: totales.horasSinRecargo || 0,
                    horasConRecargo: totales.horasConRecargo || 0,
                    valorHora: item.valorHora || 0,
                    valorConRecargo,
                    monto: totales.montoTotal || 0,
                });
            }
        });

        const record = {
            indice,
            tipo: 'pago',
            items: itemsAgregados.map(item => ({ ...item })),
            totales: {
                totalSinRecargo,
                totalConRecargo,
                totalMonto,
                detalleItems,
            },
        };

        saveRecord(record);

        const originalText = guardarBtn.textContent;
        guardarBtn.textContent = '\u2705 Guardado';
        setTimeout(() => {
            guardarBtn.textContent = originalText;
        }, 2000);

    } catch (error) {
        errorDiv.textContent = '\u274C ' + error.message;
        errorDiv.classList.add('show');
    }
}

export function initPagosPage() {
    initSidebar();

    document.getElementById('pagoForm').addEventListener('submit', (e) => {
        e.preventDefault();
    });

    buscarBtn.addEventListener('click', handleSearch);
    buscarIndiceInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleSearch();
        }
    });
    agregarItemBtn.addEventListener('click', handleAddItem);

    guardarBtn.addEventListener('click', handleSavePago);

    loadEditData();
}

function loadEditData() {
    const params = new URLSearchParams(window.location.search);
    if (!params.has('editar')) return;

    const storedData = sessionStorage.getItem('editarRegistro');
    if (!storedData) return;

    try {
        const record = JSON.parse(storedData);
        if (record.tipo !== 'pago') return;

        if (record.indice) indicePagoInput.value = record.indice;

        if (record.items && record.items.length > 0) {
            itemsAgregados = record.items.map(item => ({ ...item }));
            actualizarItemsList();
            calcularTotales();
        }

        sessionStorage.removeItem('editarRegistro');
        window.history.replaceState({}, document.title, window.location.pathname);

    } catch (error) {
        console.error('Error al cargar datos de edición:', error);
    }
}