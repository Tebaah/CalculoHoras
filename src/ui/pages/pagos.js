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
import { timeToMinutes } from '../../core/utils/timeUtils.js';

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
const totalSinRecargoCalcEl = document.getElementById('totalSinRecargoCalc');
const totalConRecargoCalcEl = document.getElementById('totalConRecargoCalc');
const totalMontoEl = document.getElementById('totalMonto');
const labelSinRecargoEl = document.getElementById('labelSinRecargo');
const labelConRecargoEl = document.getElementById('labelConRecargo');
const pagoDetalleItemsEl = document.getElementById('pagoDetalleItems');

// Elementos de costo dinámico
const costoTipoEl = document.getElementById('costoTipo');
const costoValorEl = document.getElementById('costoValor');
const costoCantidadEl = document.getElementById('costoCantidad');
const agregarCostoBtn = document.getElementById('agregarCostoBtn');
const costosListEl = document.getElementById('costosList');
const costosResultsContainer = document.getElementById('costosResultsContainer');

// Estado interno
let itemsAgregados = [];
let ultimoResultadoBusqueda = null;
let costosAgregados = []; // Array de { tipo, cantidad, valor }

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
 * Calcula las horas totales de un día a partir de hora inicio y término
 * (compatibilidad con registros antiguos que no guardan horas por día)
 */
function calcularHorasDesdeHorario(horaInicio, horaTermino) {
    if (!horaInicio || !horaTermino) return 0;
    try {
        const startMin = timeToMinutes(horaInicio);
        const endMin = timeToMinutes(horaTermino);
        const cruzaMedianoche = endMin < startMin;
        const totalMinutos = cruzaMedianoche ? (endMin + 1440 - startMin) : (endMin - startMin);
        return totalMinutos / 60;
    } catch (e) {
        return 0;
    }
}

/**
 * Obtiene el desglose de horas por día para un reporte
 */
function obtenerDiasReporte(item) {
    if (item.tipo === 'orden') {
        const hr = item.horasSinRecargo || 0;
        const hc = item.horasConRecargo || 0;
        return [{
            nombre: NOMBRES_DIAS[item.tipoDia] || item.tipoDia || 'Día',
            fecha: item.fecha || '—',
            horaInicio: item.horaInicio || '—',
            horaTermino: item.horaTermino || '—',
            colacion: item.colacion || 0,
            horasSinRecargo: hr,
            horasConRecargo: hc,
            horasTotales: hr + hc || calcularHorasDesdeHorario(item.horaInicio, item.horaTermino),
        }];
    }

    if (item.dias && item.dias.length > 0) {
        return item.dias.map(dia => {
            const hr = dia.horasSinRecargo || 0;
            const hc = dia.horasConRecargo || 0;
            return {
                nombre: NOMBRES_DIAS[dia.dia] || dia.dia || 'Día',
                fecha: dia.fecha || '—',
                horaInicio: dia.horaInicio || '—',
                horaTermino: dia.horaTermino || '—',
                colacion: dia.colacion || 0,
                horasSinRecargo: hr,
                horasConRecargo: hc,
                horasTotales: hr + hc || calcularHorasDesdeHorario(dia.horaInicio, dia.horaTermino),
            };
        });
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
        html += '<button type="button" class="btn-remove-item" data-indice="' + item.indice + '" title="Eliminar">🗑️</button>';
        html += '</div>';
        html += '<div class="pago-item-body">';

        // Mostrar cada día con sus horas (solo total de horas por día)
        const dias = obtenerDiasReporte(item);
        dias.forEach((dia) => {
            html += '<div class="result-item result-item--day">';
            html += '<span class="result-label">' + dia.nombre + (dia.fecha !== '—' ? ' (' + dia.fecha + ')' : '') + '</span>';
            html += '<span class="result-value">' + dia.horaInicio + ' - ' + dia.horaTermino + ' | Colación: ' + dia.colacion + ' min | ' + formatHours(dia.horasTotales) + '</span>';
            html += '</div>';
        });

        html += '</div></div>';
    });

    itemsContainer.innerHTML = html;

    itemsContainer.querySelectorAll('.btn-remove-item').forEach((btn) => {
        btn.addEventListener('click', () => handleRemoveItem(btn.dataset.indice));
    });
}

/**
 * Renderiza la lista de costos agregados (en la sección de input)
 */
function renderCostosList() {
    if (costosAgregados.length === 0) {
        costosListEl.innerHTML = '<div class="costos-list-empty">No hay costos agregados.</div>';
        return;
    }

    let html = '';
    costosAgregados.forEach((costo, index) => {
        const tipoTexto = getCostoLabelText(costo.tipo);
        html += '<div class="costo-item">';
        html += '<div class="costo-item-info">';
        html += '<span class="costo-item-tipo">' + tipoTexto + '</span>';
        html += '<span class="costo-item-detalle">' + (costo.cantidad || 1) + ' u × $' + formatHourRate(costo.valor) + ' = ' + formatCurrency((costo.cantidad || 1) * costo.valor) + '</span>';
        html += '</div>';
        html += '<button type="button" class="btn-remove-costo" data-index="' + index + '" title="Eliminar costo">🗑️</button>';
        html += '</div>';
    });

    costosListEl.innerHTML = html;

    costosListEl.querySelectorAll('.btn-remove-costo').forEach((btn) => {
        btn.addEventListener('click', () => {
            const index = parseInt(btn.dataset.index, 10);
            costosAgregados.splice(index, 1);
            renderCostosList();
            calcularTotales();
        });
    });
}

function handleAddCosto() {
    const tipo = costoTipoEl.value;
    const valor = parseFloat(costoValorEl.value) || 0;
    const cantidad = parseFloat(costoCantidadEl.value) || 1;

    if (!tipo) {
        errorDiv.textContent = '\u274C Debe seleccionar un tipo de costo.';
        errorDiv.classList.add('show');
        return;
    }

    if (valor <= 0) {
        errorDiv.textContent = '\u274C Debe ingresar un valor unitario mayor a 0.';
        errorDiv.classList.add('show');
        return;
    }

    errorDiv.classList.remove('show');

    costosAgregados.push({ tipo, cantidad, valor });

    // Limpiar campos
    costoTipoEl.value = '';
    costoValorEl.value = '';
    costoCantidadEl.value = '1';

    renderCostosList();
    calcularTotales();
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

    // Calcular montos por tipo de hora
    let valorHoraNormal = 0;
    let valorConRecargoUnit = 0;
    if (detalleItems.length > 0) {
        valorHoraNormal = detalleItems[0].valorHora;
        valorConRecargoUnit = detalleItems[0].valorConRecargo;
    }

    const montoSinRecargo = totalSinRecargo * valorHoraNormal;
    const montoConRecargo = totalConRecargo * valorConRecargoUnit;

    // Sumar costos adicionales al monto total (cantidad × valor unitario)
    const totalCostos = costosAgregados.reduce((sum, c) => sum + (c.cantidad * c.valor), 0);
    totalMonto = montoSinRecargo + montoConRecargo + totalCostos;

    pagoDetalleItemsEl.innerHTML = '';
    diasIncluidosEl.textContent = itemsAgregados.length + ' elemento(s)';

    // Mostrar valor hora en los labels
    if (labelSinRecargoEl && valorHoraNormal > 0) {
        labelSinRecargoEl.textContent = 'Total horas sin recargo ($' + formatHourRate(valorHoraNormal) + '/h)';
    }
    if (labelConRecargoEl && valorConRecargoUnit > 0) {
        labelConRecargoEl.textContent = 'Total horas con recargo ($' + formatHourRate(valorConRecargoUnit) + '/h)';
    }

    totalSinRecargoEl.textContent = formatHours(totalSinRecargo);
    totalConRecargoEl.textContent = formatHours(totalConRecargo);
    totalSinRecargoCalcEl.textContent = formatCurrency(montoSinRecargo);
    totalConRecargoCalcEl.textContent = formatCurrency(montoConRecargo);
    totalMontoEl.textContent = formatCurrency(totalMonto);

    // Mostrar costos adicionales en resultados
    let costosHtml = '';
    costosAgregados.forEach((costo) => {
        const tipoTexto = getCostoLabelText(costo.tipo);
        const valorUnitario = costo.valor;
        const cantidad = costo.cantidad || 1;
        const totalCosto = valorUnitario * cantidad;
        costosHtml += '<div class="result-item result-item--3col result-item--costo">';
        costosHtml += '<span class="result-label">' + tipoTexto + ' ($' + formatHourRate(valorUnitario) + '/u)</span>';
        costosHtml += '<span class="result-value result-value--costo-qty">' + cantidad + ' u</span>';
        costosHtml += '<span class="result-value result-value--costo-total">' + formatCurrency(totalCosto) + '</span>';
        costosHtml += '</div>';
    });
    costosResultsContainer.innerHTML = costosHtml;

    totalResultsDiv.classList.add('show');
}

/**
 * Convierte el key interno de tipo de costo a texto legible
 */
function getCostoLabelText(tipo) {
    const labels = {
        'trasladoContrapesos': 'Traslado de contrapesos',
        'trasladoEquipo': 'Traslado de equipo',
        'planIzaje': 'Plan izaje',
        'otros': 'Otros',
    };
    return labels[tipo] || tipo;
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

        // Sumar costos adicionales al monto total (cantidad × valor unitario)
        const totalCostos = costosAgregados.reduce((sum, c) => sum + (c.cantidad * c.valor), 0);
        totalMonto += totalCostos;

        const record = {
            indice,
            tipo: 'pago',
            items: itemsAgregados.map(item => ({ ...item })),
            costos: costosAgregados.length > 0 ? costosAgregados.map(c => ({ ...c })) : undefined,
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

/**
 * Genera e imprime un PDF con el detalle del estado de pago
 */
function handlePrintPDF() {
    if (itemsAgregados.length === 0) {
        errorDiv.textContent = '\u274C No hay elementos para imprimir. Agregue registros al estado de pago.';
        errorDiv.classList.add('show');
        return;
    }

    const indice = indicePagoInput.value.trim() || 'N/D';
    const win = window.open('', '_blank');
    if (!win) {
        errorDiv.textContent = '\u274C No se pudo abrir la ventana de impresión. Permita ventanas emergentes.';
        errorDiv.classList.add('show');
        return;
    }

    let html = '<!DOCTYPE html><html><head><meta charset="UTF-8">';
    html += '<title>Estado de Pago #' + indice + '</title>';
    html += '<style>';
    html += 'body { font-family: Arial, sans-serif; margin: 30px; color: #333; }';
    html += 'h1 { font-size: 22px; border-bottom: 2px solid #2b6cb0; padding-bottom: 10px; color: #2b6cb0; }';
    html += 'h2 { font-size: 17px; margin-top: 25px; color: #444; border-bottom: 1px solid #ddd; padding-bottom: 6px; }';
    html += 'table { width: 100%; border-collapse: collapse; margin: 10px 0; }';
    html += 'th, td { padding: 8px 10px; text-align: left; border-bottom: 1px solid #eee; font-size: 14px; }';
    html += 'th { background: #f5f5f5; font-weight: 600; }';
    html += '.item-header { font-weight: 600; font-size: 15px; margin-top: 15px; color: #2b6cb0; }';
    html += '.totals { margin-top: 25px; border-top: 2px solid #2b6cb0; padding-top: 10px; }';
    html += '.total-row { display: flex; justify-content: space-between; padding: 6px 0; font-size: 15px; }';
    html += '.total-row.final { font-weight: 700; font-size: 18px; color: #2b6cb0; border-top: 2px solid #333; padding-top: 10px; margin-top: 5px; }';
    html += '.value-hora { color: #666; font-size: 13px; }';
    html += '@media print { body { margin: 15px; } }';
    html += '</style></head><body>';

    html += '<h1>\uD83D\uDCB0 Estado de Pago #' + indice + '</h1>';
    html += '<p style="color:#666;font-size:14px;">Fecha: ' + new Date().toLocaleDateString('es-CL') + '</p>';

    // Detalle de cada item
    itemsAgregados.forEach((item) => {
        const tipoLabel = item.tipo === 'orden' ? '\uD83D\uDCCB Orden de Trabajo' : '\uD83D\uDCCA Reporte Semanal';
        html += '<div class="item-header">' + tipoLabel + ' #' + item.indice + '</div>';

        const dias = obtenerDiasReporte(item);
        if (dias.length > 0) {
            html += '<table><thead><tr><th>D\u00EDa</th><th>Fecha</th><th>Horario</th><th>Colaci\u00F3n</th><th>Horas</th></tr></thead><tbody>';
            dias.forEach((dia) => {
                html += '<tr>';
                html += '<td>' + dia.nombre + '</td>';
                html += '<td>' + dia.fecha + '</td>';
                html += '<td>' + dia.horaInicio + ' - ' + dia.horaTermino + '</td>';
                html += '<td>' + dia.colacion + ' min</td>';
                html += '<td>' + formatHours(dia.horasTotales) + '</td>';
                html += '</tr>';
            });
            html += '</tbody></table>';
        }
    });

    // Totales
    const totalSinRecargo = parseFloat(totalSinRecargoEl.textContent) || 0;
    const totalConRecargo = parseFloat(totalConRecargoEl.textContent) || 0;
    const totalMonto = totalMontoEl.textContent || '$0';

    let valorHoraNormal = 0;
    let valorConRecargoUnit = 0;
    if (itemsAgregados.length > 0) {
        const first = itemsAgregados[0];
        valorHoraNormal = first.valorHora || 0;
        valorConRecargoUnit = (first.valorHora || 0) * (1 + ((first.recargoPorcentaje || 30) / 100));
    }

    // Calcular montos
    const totalHorasSinR = parseFloat(totalSinRecargoEl.textContent) || 0;
    const totalHorasConR = parseFloat(totalConRecargoEl.textContent) || 0;
    const montoSinRecargo = totalHorasSinR * valorHoraNormal;
    const montoConRecargo = totalHorasConR * valorConRecargoUnit;

    html += '<div class="totals">';
    html += '<h2>Totales del Estado de Pago</h2>';
    html += '<div class="total-row"><span>Total horas sin recargo (' + formatHourRate(valorHoraNormal) + ')</span><span>' + totalSinRecargoEl.textContent + '</span><span>' + formatCurrency(montoSinRecargo) + '</span></div>';
    html += '<div class="total-row"><span>Total horas con recargo (' + formatHourRate(valorConRecargoUnit) + ')</span><span>' + totalConRecargoEl.textContent + '</span><span>' + formatCurrency(montoConRecargo) + '</span></div>';

    // Mostrar costos en PDF
    costosAgregados.forEach((costo) => {
        const tipoTexto = getCostoLabelText(costo.tipo);
        const cantidad = costo.cantidad || 1;
        const valorUnitario = costo.valor;
        const totalCosto = cantidad * valorUnitario;
        html += '<div class="total-row"><span>' + tipoTexto + ' ($' + formatHourRate(valorUnitario) + '/u)</span><span>' + cantidad + ' u</span><span>' + formatCurrency(totalCosto) + '</span></div>';
    });

    html += '<div class="total-row final"><span>Monto Total</span><span style="grid-column:span 2;text-align:right;">' + totalMonto + '</span></div>';
    html += '</div>';

    html += '</body></html>';

    win.document.write(html);
    win.document.close();

    // Esperar a que cargue el contenido y luego imprimir
    setTimeout(() => {
        win.print();
    }, 300);
}

export function initPagosPage() {
    initSidebar();

    document.getElementById('pagoForm').addEventListener('submit', (e) => {
        e.preventDefault();
    });

    agregarCostoBtn.addEventListener('click', handleAddCosto);

    buscarBtn.addEventListener('click', handleSearch);
    buscarIndiceInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleSearch();
        }
    });
    agregarItemBtn.addEventListener('click', handleAddItem);

    guardarBtn.addEventListener('click', handleSavePago);

    const imprimirBtn = document.getElementById('imprimirPdfBtn');
    if (imprimirBtn) {
        imprimirBtn.addEventListener('click', handlePrintPDF);
    }

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

        // Restaurar costos adicionales guardados
        if (record.costos && record.costos.length > 0) {
            costosAgregados = record.costos.map(c => ({ ...c }));
            renderCostosList();
        }

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