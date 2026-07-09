/**
 * reportes.js - Lógica de la página "Reportes"
 *
 * Coordina la interacción del usuario con el DOM del reporte semanal
 * y conecta con los casos de uso y el store.
 */

import { calculateWeeklyReport } from '../../store/actions/calculatorActions.js';
import { renderReportTotals } from '../render/renderReport.js';
import { initSidebar } from '../components/sidebar.js';
import { getDayTypeFromDate, addDays, toDateInputValue, getDayId } from '../../core/utils/dateUtils.js';
import { TIPOS_DIA } from '../../core/constants.js';

// Elementos del DOM
const reportForm = document.getElementById('reportForm');
const valorHoraSelect = document.getElementById('valorHora');
const horasMinimasSelect = document.getElementById('horasMinimas');
const recargoPorcentajeSelect = document.getElementById('recargoPorcentaje');
const customValueGroup = document.getElementById('customValueGroup');
const customValueInput = document.getElementById('customValue');
const errorDiv = document.getElementById('errorMessage');

/**
 * Actualiza el tipo de día (data-tipo) y la etiqueta visual de una fila
 * según la fecha seleccionada
 *
 * @param {HTMLElement} row - Fila del reporte
 * @param {Date} date - Fecha asociada
 */
function updateRowDayType(row, date) {
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
}