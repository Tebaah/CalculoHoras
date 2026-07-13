/**
 * reportes.js - Lógica de la página "Reportes"
 *
 * Coordina la interacción del usuario con el DOM del reporte semanal
 * y conecta con los casos de uso y el store.
 */

import { calculateWeeklyReport } from '../../store/actions/calculatorActions.js';
import { renderReportTotals } from '../render/renderReport.js';
import { initSidebar } from '../components/sidebar.js';
import { getDayTypeFromDate, addDays, toDateInputValue, getDayId, DAY_ID_TO_NAME } from '../../core/utils/dateUtils.js';
import { TIPOS_DIA } from '../../core/constants.js';
import { saveRecord } from '../../store/storageManager.js';

// Elementos del DOM
const reportForm = document.getElementById('reportForm');
const valorHoraSelect = document.getElementById('valorHora');
const horasMinimasSelect = document.getElementById('horasMinimas');
const recargoPorcentajeSelect = document.getElementById('recargoPorcentaje');
const customValueGroup = document.getElementById('customValueGroup');
const customValueInput = document.getElementById('customValue');
const errorDiv = document.getElementById('errorMessage');
const indiceInput = document.getElementById('indiceReporte');
const guardarBtn = document.getElementById('guardarReporteBtn');

// Último reporte calculado para poder guardarlo
let lastCalculatedReport = null;

/**
 * Actualiza el identificador de día (data-dia), el nombre visible,
 * el tipo de día (data-tipo) y la etiqueta visual de una fila
 * según la fecha seleccionada
 *
 * @param {HTMLElement} row - Fila del reporte
 * @param {Date} date - Fecha asociada
 */
function updateRowDayType(row, date) {
    // Actualizar identificador de día según la fecha real
    const dayId = getDayId(date);
    row.dataset.dia = dayId;

    // Actualizar el nombre visible del día
    const dayName = row.querySelector('.day-name');
    if (dayName) {
        dayName.textContent = DAY_ID_TO_NAME[dayId] || dayId;
    }

    // Actualizar tipo de día (normal, sabado, domingoFestivo)
    const dayType = getDayTypeFromDate(date);
    row.dataset.tipo = dayType;

    const dayTag = row.querySelector('.day-tag');
    if (dayType === TIPOS_DIA.NORMAL) {
        dayTag.textContent = 'Normal';
        dayTag.className = 'day-tag';
    } else if (dayType === TIPOS_DIA.SABADO) {
        dayTag.textContent = 'S\u00E1bado';
        dayTag.className = 'day-tag sabado';
    } else {
        dayTag.textContent = 'Festivo';
        dayTag.className = 'day-tag domingo';
    }
}

/**
 * Auto-rellena las fechas de los días siguientes cuando se cambia
 * la fecha del primer día (Lunes)
 */
function handleFirstDateChange() {
    const firstDateInput = document.querySelector('.fecha-dia[data-day-index="0"]');
    if (!firstDateInput || !firstDateInput.value) return;

    const baseDate = new Date(firstDateInput.value + 'T12:00:00');
    const dateInputs = document.querySelectorAll('.fecha-dia');

    dateInputs.forEach((input) => {
        const index = parseInt(input.dataset.dayIndex);
        const newDate = addDays(baseDate, index);
        input.value = toDateInputValue(newDate);

        // Actualizar tipo de día y etiqueta visual
        const row = input.closest('.report-row');
        if (row) {
            updateRowDayType(row, newDate);
        }
    });
}

/**
 * Configura los event listeners de colación para cada fila del reporte
 */
function setupColacionListeners() {
    document.querySelectorAll('.colacion').forEach((select) => {
        select.addEventListener('change', (e) => {
            const tramoSelect = e.target.closest('.report-row').querySelector('.colacion-tramo');
            tramoSelect.style.display = parseInt(e.target.value) > 0 ? 'block' : 'none';
        });
    });
}

/**
 * Configura el auto-relleno de fechas al cambiar el primer día
 */
function setupDateAutoFill() {
    const firstDateInput = document.querySelector('.fecha-dia[data-day-index="0"]');
    if (firstDateInput) {
        firstDateInput.addEventListener('change', handleFirstDateChange);
    }
}

/**
 * Establece las fechas por defecto: desde hoy (Lunes = hoy)
 */
function setDefaultDates() {
    const today = new Date();
    const dateInputs = document.querySelectorAll('.fecha-dia');

    dateInputs.forEach((input) => {
        const index = parseInt(input.dataset.dayIndex);
        const date = addDays(today, index);
        input.value = toDateInputValue(date);

        const row = input.closest('.report-row');
        if (row) {
            updateRowDayType(row, date);
        }
    });
}

/**
 * Obtiene los datos de todos los días del formulario
 * Solo incluye días que tengan hora inicio Y hora término ingresados
 *
 * @returns {Array<Object>} Datos de los días
 */
function getDaysData() {
    const days = [];
    const rows = document.querySelectorAll('.report-row');

    rows.forEach((row) => {
        const dia = row.dataset.dia;
        const tipoDia = row.dataset.tipo;
        const horaInicio = row.querySelector('.hora-inicio').value;
        const horaTermino = row.querySelector('.hora-termino').value;
        const colacion = parseInt(row.querySelector('.colacion').value) || 0;
        const colacionTramoSelect = row.querySelector('.colacion-tramo');
        const colacionTramo = colacionTramoSelect ? colacionTramoSelect.value : 'sinRecargo';

        if (horaInicio && horaTermino) {
            days.push({
                dia,
                tipoDia,
                horaInicio,
                horaTermino,
                colacion,
                colacionTramo,
            });
        }
    });

    return days;
}

/**
 * Maneja el envío del formulario del reporte semanal
 */
function handleReportSubmit(e) {
    e.preventDefault();
    errorDiv.classList.remove('show');
    document.getElementById('totalResults').classList.remove('show');

    try {
        let valorHora = valorHoraSelect.value;

        if (!valorHora) {
            throw new Error('Por favor seleccione un valor de hora.');
        }

        if (valorHora === 'custom') {
            valorHora = parseFloat(customValueInput.value);
            if (!valorHora || valorHora <= 0) {
                throw new Error('Por favor ingrese un valor de hora válido y positivo.');
            }
        }

        valorHora = parseFloat(valorHora);

        const daysData = getDaysData();

        if (daysData.length === 0) {
            throw new Error('Debe ingresar al menos un día con hora de inicio y término.');
        }

        // Asignar mínimo de horas global y recargo a cada día
        const horasMinimas = parseInt(horasMinimasSelect.value) || 0;
        const recargoPorcentaje = parseInt(recargoPorcentajeSelect.value) || 0;
        daysData.forEach((dayData) => {
            dayData.horasMinimas = horasMinimas;
            dayData.recargoPorcentaje = recargoPorcentaje;
        });

        const report = calculateWeeklyReport(daysData, valorHora);

        // Guardar datos para posible guardado posterior
        lastCalculatedReport = {
            daysData: daysData.map(d => ({ ...d })),
            report: {
                results: report.results.map(r => ({ ...r })),
                totalSinRecargo: report.totalSinRecargo,
                totalConRecargo: report.totalConRecargo,
                totalNormalesOp: report.totalNormalesOp,
                totalDoblesOp: report.totalDoblesOp,
                totalMonto: report.totalMonto,
                daysCount: report.daysCount,
            },
            valorHora,
            horasMinimas,
            recargoPorcentaje,
        };

        // Renderizar resultados
        renderReportTotals(report, valorHora, recargoPorcentaje);
        document.getElementById('totalResults').classList.add('show');

        document.getElementById('totalResults').scrollIntoView({ behavior: 'smooth', block: 'start' });

    } catch (error) {
        errorDiv.textContent = '\u274C ' + error.message;
        errorDiv.classList.add('show');
    }
}

/**
 * Maneja el guardado del reporte actual
 */
function handleSaveReport() {
    errorDiv.classList.remove('show');

    if (!lastCalculatedReport) {
        errorDiv.textContent = '\u274C Primero debe realizar un cálculo antes de guardar.';
        errorDiv.classList.add('show');
        return;
    }

    const indice = indiceInput.value.trim();
    if (!indice) {
        errorDiv.textContent = '\u274C Debe ingresar un índice de almacenamiento.';
        errorDiv.classList.add('show');
        return;
    }

    try {
        const { daysData, report, valorHora, horasMinimas, recargoPorcentaje } = lastCalculatedReport;

        // Obtener fechas de cada día desde el DOM
        const diasConFechas = daysData.map((day, index) => {
            const fechaInputs = document.querySelectorAll('.fecha-dia');
            const fecha = fechaInputs[index] ? fechaInputs[index].value : '';
            // Incluir resultados por día (horas sin/con recargo)
            const result = report.results[index] || {};
            return {
                ...day,
                fecha,
                horasSinRecargo: result.horasSinRecargo || 0,
                horasConRecargo: result.horasConRecargo || 0,
                horasTotales: result.horasTotales || 0,
            };
        });

        const record = {
            indice,
            tipo: 'reporte',
            valorHora,
            horasMinimas,
            recargoPorcentaje,
            dias: diasConFechas,
            totales: {
                horasSinRecargo: report.totalSinRecargo,
                horasConRecargo: report.totalConRecargo,
                horasNormalesOp: report.totalNormalesOp,
                horasDobles: report.totalDoblesOp,
                montoTotal: report.totalMonto,
            },
        };

        saveRecord(record);

        // Feedback visual
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
 * Inicializa los event listeners de la página de reportes
 */
export function initReportesPage() {
    initSidebar();

    reportForm.addEventListener('submit', handleReportSubmit);

    valorHoraSelect.addEventListener('change', (e) => {
        customValueGroup.style.display = e.target.value === 'custom' ? 'block' : 'none';
    });

    setupColacionListeners();
    setupDateAutoFill();
    setDefaultDates();

    guardarBtn.addEventListener('click', handleSaveReport);

    // Cargar datos desde sessionStorage si venimos desde historial (editar)
    loadEditData();
}

/**
 * Carga los datos de edición desde sessionStorage
 */
function loadEditData() {
    const params = new URLSearchParams(window.location.search);
    if (!params.has('editar')) return;

    const storedData = sessionStorage.getItem('editarRegistro');
    if (!storedData) return;

    try {
        const record = JSON.parse(storedData);
        if (record.tipo !== 'reporte') return;

        // Poblar índice
        if (record.indice) indiceInput.value = record.indice;

        // Poblar valor hora
        if (record.valorHora) {
            const valorPreset = document.querySelector('#valorHora option[value="' + record.valorHora + '"]');
            if (valorPreset) {
                valorHoraSelect.value = String(record.valorHora);
            } else {
                valorHoraSelect.value = 'custom';
                customValueGroup.style.display = 'block';
                customValueInput.value = record.valorHora;
            }
        }

        if (record.horasMinimas !== undefined) horasMinimasSelect.value = String(record.horasMinimas);
        if (record.recargoPorcentaje !== undefined) recargoPorcentajeSelect.value = String(record.recargoPorcentaje);

        // Poblar cada día del reporte
        if (record.dias && record.dias.length > 0) {
            const rows = document.querySelectorAll('.report-row');
            record.dias.forEach((diaData, index) => {
                if (index >= rows.length) return;
                const row = rows[index];

                const fechaInput = row.querySelector('.fecha-dia');
                const horaInicioInput = row.querySelector('.hora-inicio');
                const horaTerminoInput = row.querySelector('.hora-termino');
                const colacionSelect = row.querySelector('.colacion');
                const colacionTramoSelect = row.querySelector('.colacion-tramo');

                if (diaData.fecha && fechaInput) fechaInput.value = diaData.fecha;
                if (diaData.horaInicio && horaInicioInput) horaInicioInput.value = diaData.horaInicio;
                if (diaData.horaTermino && horaTerminoInput) horaTerminoInput.value = diaData.horaTermino;
                if (diaData.colacion !== undefined && colacionSelect) {
                    colacionSelect.value = String(diaData.colacion);
                    if (diaData.colacion > 0 && colacionTramoSelect) {
                        colacionTramoSelect.style.display = 'block';
                        if (diaData.colacionTramo) colacionTramoSelect.value = diaData.colacionTramo;
                    }
                }
                if (diaData.fecha && fechaInput) {
                    const date = new Date(diaData.fecha + 'T12:00:00');
                    updateRowDayType(row, date);
                }
            });
        }

        // Limpiar sessionStorage después de cargar
        sessionStorage.removeItem('editarRegistro');

        // Remover query param de la URL
        window.history.replaceState({}, document.title, window.location.pathname);

    } catch (error) {
        console.error('Error al cargar datos de edición:', error);
    }
}
