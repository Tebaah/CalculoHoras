/**
 * reportes.js - Lógica de la página "Reportes"
 *
 * Coordina la interacción del usuario con el DOM del reporte semanal
 * y conecta con los casos de uso y el store.
 */

import { calculateWeeklyReport } from '../../store/actions/calculatorActions.js';
import { renderReportTotals } from '../render/renderReport.js';
import { initSidebar } from '../components/sidebar.js';

// Elementos del DOM
const reportForm = document.getElementById('reportForm');
const valorHoraSelect = document.getElementById('valorHora');
const horasMinimasSelect = document.getElementById('horasMinimas');
const customValueGroup = document.getElementById('customValueGroup');
const customValueInput = document.getElementById('customValue');
const errorDiv = document.getElementById('errorMessage');

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

        // Asignar mínimo de horas global a cada día
        const horasMinimas = parseInt(horasMinimasSelect.value) || 0;
        daysData.forEach((dayData) => {
            dayData.horasMinimas = horasMinimas;
        });

        const report = calculateWeeklyReport(daysData, valorHora);

        // Renderizar resultados
        renderReportTotals(report, valorHora);
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
}