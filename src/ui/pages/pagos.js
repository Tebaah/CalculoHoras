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
 * Genera e imprime el comprobante de liquidación de servicios.
 *
 * Produce un documento formal con formato de cobro que incluye:
 * - Encabezado institucional con número de documento y fecha de emisión.
 * - Detalle pormenorizado por jornada (día, horario, colación, horas trabajadas).
 * - Tabla resumen de conceptos: horas sin recargo, horas con recargo,
 *   costos adicionales, monto neto, IVA (19 %) y total.
 * - Pie de documento con condiciones de pago y validez tributaria.
 *
 * La paleta cromática se basa en las variables CSS del proyecto:
 *   --color-primary (#065A82), --color-primary-50 (#e6f1f6),
 *   --color-bg-sidebar (#21295C), --color-text-primary (#1a1f2e),
 *   --color-text-secondary (#4a5568), --color-border-light (#e2e8ed),
 *   --color-bg (#f0f4f7).
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

    const fechaEmision = new Date().toLocaleDateString('es-CL', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });

    let html = '<!DOCTYPE html><html lang="es-CL"><head><meta charset="UTF-8">';
    html += '<title>Liquidación ' + indice + '</title>';
    html += '<style>';
    html += ':root {';
    html += '  --c-primary: #065A82;';
    html += '  --c-primary-50: #e6f1f6;';
    html += '  --c-primary-100: #cce3ed;';
    html += '  --c-sidebar: #21295C;';
    html += '  --c-text: #1a1f2e;';
    html += '  --c-text-secondary: #4a5568;';
    html += '  --c-text-muted: #7a8a9a;';
    html += '  --c-border: #c5d0d8;';
    html += '  --c-border-light: #e2e8ed;';
    html += '  --c-bg: #f0f4f7;';
    html += '  --c-bg-card: #ffffff;';
    html += '  --c-success: #5B8E7D;';
    html += '}';
    html += '* { margin: 0; padding: 0; box-sizing: border-box; }';
    html += 'body {';
    html += '  font-family: "Inter", "Segoe UI", system-ui, -apple-system, sans-serif;';
    html += '  font-size: 12px;';
    html += '  line-height: 1.6;';
    html += '  color: var(--c-text);';
    html += '  background: #fff;';
    html += '  -webkit-print-color-adjust: exact;';
    html += '  print-color-adjust: exact;';
    html += '}';
    html += '.page { max-width: 210mm; margin: 0 auto; padding: 15mm 12mm; }';

    // ── Encabezado ──────────────────────────────
    html += '.header {';
    html += '  display: flex;';
    html += '  justify-content: space-between;';
    html += '  align-items: flex-start;';
    html += '  padding-bottom: 20px;';
    html += '  margin-bottom: 24px;';
    html += '  border-bottom: 3px solid var(--c-primary);';
    html += '}';
    html += '.header-left h1 {';
    html += '  font-size: 11px;';
    html += '  font-weight: 600;';
    html += '  letter-spacing: 0.12em;';
    html += '  text-transform: uppercase;';
    html += '  color: var(--c-primary);';
    html += '  margin-bottom: 4px;';
    html += '}';
    html += '.header-left .org {';
    html += '  font-size: 20px;';
    html += '  font-weight: 700;';
    html += '  color: var(--c-sidebar);';
    html += '  line-height: 1.2;';
    html += '}';
    html += '.header-left .org-sub {';
    html += '  font-size: 10px;';
    html += '  color: var(--c-text-muted);';
    html += '  margin-top: 2px;';
    html += '}';
    html += '.header-right {';
    html += '  text-align: right;';
    html += '  font-size: 10px;';
    html += '}';
    html += '.header-right .doc-label {';
    html += '  font-weight: 600;';
    html += '  color: var(--c-text-muted);';
    html += '  letter-spacing: 0.06em;';
    html += '  text-transform: uppercase;';
    html += '}';
    html += '.header-right .doc-number {';
    html += '  font-size: 15px;';
    html += '  font-weight: 700;';
    html += '  color: var(--c-primary);';
    html += '}';
    html += '.header-right .doc-date {';
    html += '  color: var(--c-text-secondary);';
    html += '  margin-top: 6px;';
    html += '}';
    html += '.header-logo {';
    html += '  max-width: 180px;';
    html += '  max-height: 55px;';
    html += '  margin-bottom: 10px;';
    html += '  object-fit: contain;';
    html += '}';

    // ── Tablas de detalle ──────────────────────
    html += '.item-section { margin-bottom: 22px; }';
    html += '.item-title {';
    html += '  font-size: 13px;';
    html += '  font-weight: 700;';
    html += '  color: var(--c-sidebar);';
    html += '  margin-bottom: 8px;';
    html += '  padding-bottom: 6px;';
    html += '  border-bottom: 1px solid var(--c-border-light);';
    html += '}';
    html += 'table { width: 100%; border-collapse: collapse; margin-bottom: 8px; }';
    html += 'th {';
    html += '  background: var(--c-primary-50);';
    html += '  color: var(--c-primary);';
    html += '  font-weight: 700;';
    html += '  font-size: 9px;';
    html += '  letter-spacing: 0.07em;';
    html += '  text-transform: uppercase;';
    html += '  padding: 7px 10px;';
    html += '  text-align: center;';
    html += '  border-bottom: 2px solid var(--c-primary-100);';
    html += '}';
    html += 'td {';
    html += '  padding: 6px 10px;';
    html += '  font-size: 11px;';
    html += '  text-align: center;';
    html += '  color: var(--c-text-secondary);';
    html += '  border-bottom: 1px solid var(--c-border-light);';
    html += '}';
    html += 'tr:nth-child(even) td { background: var(--c-primary-50); }';
    html += 'td:first-child, th:first-child { text-align: left; }';
    html += 'td:last-child, th:last-child { text-align: right; font-weight: 600; }';

    // ── Resumen ──────────────────────────────
    html += '.totals {';
    html += '  margin-top: 28px;';
    html += '  padding-top: 20px;';
    html += '  border-top: 2px solid var(--c-border);';
    html += '}';
    html += '.totals h2 {';
    html += '  font-size: 12px;';
    html += '  font-weight: 600;';
    html += '  text-transform: uppercase;';
    html += '  letter-spacing: 0.08em;';
    html += '  color: var(--c-primary);';
    html += '  margin-bottom: 12px;';
    html += '}';
    html += '.summary-table th {';
    html += '  background: var(--c-sidebar);';
    html += '  color: #ffffff;';
    html += '  font-size: 9px;';
    html += '  letter-spacing: 0.07em;';
    html += '  text-transform: uppercase;';
    html += '  padding: 8px 12px;';
    html += '  border-bottom: none;';
    html += '}';
    html += '.summary-table th:first-child { text-align: left; }';
    html += '.summary-table th:nth-child(2) { text-align: center; }';
    html += '.summary-table th:last-child { text-align: right; }';
    html += '.summary-table td { font-size: 11px; border-bottom: 1px solid var(--c-border-light); }';
    html += '.summary-table td:first-child { text-align: left; color: var(--c-text-secondary); }';
    html += '.summary-table td:nth-child(2) { text-align: center; }';
    html += '.summary-table td:last-child { text-align: right; font-weight: 600; color: var(--c-text); }';
    html += '.summary-table tr.separator td { padding: 4px 0; border-bottom: 2px solid var(--c-border); }';
    html += '.summary-table tr.neto td {';
    html += '  font-size: 13px;';
    html += '  font-weight: 600;';
    html += '  color: var(--c-text);';
    html += '  padding: 10px 12px;';
    html += '}';
    html += '.summary-table tr.neto td:last-child { font-weight: 700; color: var(--c-primary); }';
    html += '.summary-table tr.iva td {';
    html += '  font-size: 12px;';
    html += '  color: var(--c-text-muted);';
    html += '  padding: 8px 12px;';
    html += '}';
    html += '.summary-table tr.iva td:last-child { color: var(--c-text-secondary); }';
    html += '.summary-table tr.final td {';
    html += '  font-size: 15px;';
    html += '  font-weight: 700;';
    html += '  color: var(--c-sidebar);';
    html += '  border-top: 3px double var(--c-primary);';
    html += '  padding: 12px 12px 8px;';
    html += '}';
    html += '.summary-table tr.final td:last-child { font-weight: 800; color: var(--c-primary); }';

    // ── Pie ───────────────────────────────────
    html += '.footer {';
    html += '  margin-top: 36px;';
    html += '  padding-top: 16px;';
    html += '  border-top: 1px solid var(--c-border-light);';
    html += '  font-size: 9px;';
    html += '  color: var(--c-text-muted);';
    html += '  line-height: 1.7;';
    html += '}';
    html += '.footer strong { color: var(--c-text-secondary); }';

    // ── Impresión ─────────────────────────────
    html += '@media print {';
    html += '  @page { margin: 0; size: A4; }';
    html += '  body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }';
    html += '  .page { padding: 12mm 10mm; }';
    html += '}';
    html += '</style></head><body><div class="page">';

    // ══════ CABECERA ═══════════════════════════
    const tipoDoc = 'Comprobante de Liquidación de Servicios';
    html += '<div class="header">';
    html += '<div class="header-left">';
    html += '<img src="/logo-empresa.png" class="header-logo" alt="Logo" onerror="if(!this.dataset.retry){this.dataset.retry=\'1\';this.src=\'/public/logo-empresa.png\'}else{this.style.display=\'none\'}" />';
    html += '<div class="org">Estado de pago</div>';
    html += '<div class="org-sub">Servicios Multiservice Grúas </div>';
    html += '</div>';
    html += '<div class="header-right">';
    html += '<div class="doc-label">' + tipoDoc + '</div>';
    html += '<div class="doc-number">N.° ' + indice + '</div>';
    html += '<div class="doc-date">Emitido el ' + fechaEmision + '</div>';
    html += '</div>';
    html += '</div>';

    // ══════ DETALLE POR ÍTEM ═══════════════════
    itemsAgregados.forEach((item) => {
        const tipoLabel = item.tipo === 'orden'
            ? 'Orden de Trabajo'
            : 'Reporte Semanal';
        html += '<div class="item-section">';
        html += '<div class="item-title">' + tipoLabel + ' — Índice ' + item.indice + '</div>';

        const dias = obtenerDiasReporte(item);
        if (dias.length > 0) {
            html += '<table><thead><tr>';
            html += '<th>Jornada</th><th>Fecha</th><th>Horario</th><th>Colación</th><th>Horas</th>';
            html += '</tr></thead><tbody>';
            dias.forEach((dia) => {
                html += '<tr>';
                html += '<td>' + dia.nombre + '</td>';
                html += '<td>' + dia.fecha + '</td>';
                html += '<td>' + dia.horaInicio + ' — ' + dia.horaTermino + '</td>';
                html += '<td>' + dia.colacion + ' min</td>';
                html += '<td>' + formatHours(dia.horasTotales) + '</td>';
                html += '</tr>';
            });
            html += '</tbody></table>';
        }
        html += '</div>';
    });

    // ══════ CÁLCULO DE MONTOS ═════════════════
    const totalHorasSinR = parseFloat(totalSinRecargoEl.textContent) || 0;
    const totalHorasConR = parseFloat(totalConRecargoEl.textContent) || 0;

    let valorHoraNormal = 0;
    let valorConRecargoUnit = 0;
    if (itemsAgregados.length > 0) {
        const first = itemsAgregados[0];
        valorHoraNormal = first.valorHora || 0;
        valorConRecargoUnit = (first.valorHora || 0) * (1 + ((first.recargoPorcentaje || 30) / 100));
    }

    const montoSinRecargo = totalHorasSinR * valorHoraNormal;
    const montoConRecargo = totalHorasConR * valorConRecargoUnit;

    let totalCostosAdicionales = 0;
    costosAgregados.forEach((costo) => {
        totalCostosAdicionales += (costo.cantidad || 1) * (costo.valor || 0);
    });

    const montoNeto = montoSinRecargo + montoConRecargo + totalCostosAdicionales;
    const iva = montoNeto * 0.19;
    const total = montoNeto + iva;

    // ══════ RESUMEN ════════════════════════════
    html += '<div class="totals">';
    html += '<h2>Liquidación</h2>';
    html += '<table class="summary-table"><thead><tr>';
    html += '<th>Concepto</th><th>Cantidad</th><th>Importe</th>';
    html += '</tr></thead><tbody>';

    html += '<tr>';
    html += '<td>Horas sin recargo (valor hora: ' + formatHourRate(valorHoraNormal) + ')</td>';
    html += '<td>' + formatHours(totalHorasSinR) + '</td>';
    html += '<td>' + formatCurrency(montoSinRecargo) + '</td>';
    html += '</tr>';

    html += '<tr>';
    html += '<td>Horas con recargo (valor hora: ' + formatHourRate(valorConRecargoUnit) + ')</td>';
    html += '<td>' + formatHours(totalHorasConR) + '</td>';
    html += '<td>' + formatCurrency(montoConRecargo) + '</td>';
    html += '</tr>';

    if (costosAgregados.length > 0) {
        costosAgregados.forEach((costo) => {
            const tipoTexto = getCostoLabelText(costo.tipo);
            const cantidad = costo.cantidad || 1;
            const valorUnitario = costo.valor;
            const totalCosto = cantidad * valorUnitario;
            html += '<tr>';
            html += '<td>' + tipoTexto + ' ($' + valorUnitario.toLocaleString('es-CL') + '/u)</td>';
            html += '<td>' + cantidad + ' u</td>';
            html += '<td>' + formatCurrency(totalCosto) + '</td>';
            html += '</tr>';
        });
    }

    html += '<tr class="separator"><td colspan="3"></td></tr>';
    html += '<tr class="neto"><td>Monto Neto</td><td></td><td>' + formatCurrency(montoNeto) + '</td></tr>';
    html += '<tr class="iva"><td>IVA (19 %)</td><td></td><td>' + formatCurrency(iva) + '</td></tr>';
    html += '<tr class="final"><td>Total a Pagar</td><td></td><td>' + formatCurrency(total) + '</td></tr>';
    html += '</tbody></table>';
    html += '</div>';

    // ══════ PIE ════════════════════════════════
    html += '<div class="footer">';
    html += '<strong>Datos comerciales:</strong><br>';
    html += 'Multiservice F.L. Ltda.<br>';
    html += 'Giro: Explotación de arrendamiento de maquinaria.<br>';
    html += 'Dirección: Av. Presidente Jorge Alessandri 13059, San Bernardo.<br>';
    html += 'Fono: 2 2591 5215';
    html += '<br><br>';
    html += '<strong>Condiciones:</strong> Transcurrido un plazo de 8 días en los que no se realice '
        + 'alguna observación o se envíe OC, se llevará a cabo igualmente la facturación.';
    html += '</div>';

    html += '</div></body></html>';

    win.document.write(html);
    win.document.close();

    setTimeout(() => {
        win.print();
    }, 400);
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