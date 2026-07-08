/**
 * ordenes.js - Lógica de la página "Órdenes de Trabajo"
 *
 * Coordina la interacción del usuario con el DOM y conecta
 * con los casos de uso y el store.
 */

import { calculateSingleDay } from '../../store/actions/calculatorActions.js';
import { renderResults } from '../render/renderResults.js';
import { initSidebar } from '../components/sidebar.js';
import { getDayTypeFromDate } from '../../core/utils/dateUtils.js';

// Elementos del DOM
const form = document.getElementById('calculatorForm');
const fechaDiaInput = document.getElementById('fechaDia');
const tipoDiaSelect = document.getElementById('tipoDia');
const horasMinimasSelect = document.getElementById('horasMinimas');
const horaInicioInput = document.getElementById('horaInicio');
const horaTerminoInput = document.getElementById('horaTermino');
const valorHoraSelect = document.getElementById('valorHora');
const customValueGroup = document.getElementById('customValueGroup');
const customValueInput = document.getElementById('customValue');
const colacionSelect = document.getElementById('colacion');
const colacionTramoGroup = document.getElementById('colacionTramoGroup');
const colacionTramoSelect = document.getElementById('colacionTramo');
const errorDiv = document.getElementById('errorMessage');
const resultsDiv = document.getElementById('results');

/**
 * Actualiza el tipo de día automáticamente según la fecha seleccionada
 */
function updateDayTypeFromDate() {
    const dateValue = fechaDiaInput.value;
    if (!dateValue) return;

    const date = new Date(dateValue + 'T12:00:00');
    const dayType = getDayTypeFromDate(date);
    tipoDiaSelect.value = dayType;
}

/**
 * Obtiene los datos del formulario
 * @returns {Object} Datos del formulario
 */
function getFormData() {
    let valorHora = valorHoraSelect.value;

    if (valorHora === 'custom') {
        valorHora = parseFloat(customValueInput.value);
        if (!valorHora || valorHora <= 0) {
            throw new Error('Por favor ingrese un valor de hora válido y positivo.');
        }
    } else if (!valorHora) {
        throw new Error('Por favor seleccione un valor de hora.');
    }

    return {
        tipoDia: tipoDiaSelect.value,
        fecha: fechaDiaInput.value,
        horaInicio: horaInicioInput.value,
        horaTermino: horaTerminoInput.value,
        valorHora: parseFloat(valorHora),
        colacion: parseInt(colacionSelect.value) || 0,
        colacionTramo: colacionTramoSelect.value || 'sinRecargo',
        horasMinimas: parseInt(horasMinimasSelect.value) || 0,
    };
}

/**
 * Maneja el envío del formulario
 */
function handleSubmit(e) {
    e.preventDefault();
    errorDiv.classList.remove('show');
    resultsDiv.classList.remove('show');

    try {
        const formData = getFormData();

        if (!formData.horaInicio || !formData.horaTermino) {
            throw new Error('Por favor ingrese tanto la hora de inicio como la de término.');
        }

        const result = calculateSingleDay(formData);

        // Agregar valores de hora al resultado para el render
        result.tipoDia = formData.tipoDia;
        result.valorSinRecargo = formData.valorHora;
        result.valorConRecargo = formData.valorHora * 1.30;

        renderResults(result);
        resultsDiv.classList.add('show');

    } catch (error) {
        errorDiv.textContent = '\u274C ' + error.message;
        errorDiv.classList.add('show');
    }
}

/**
 * Inicializa los event listeners de la página
 */
export function initOrdenesPage() {
    initSidebar();

    form.addEventListener('submit', handleSubmit);

    // Detectar tipo de día automáticamente al cambiar la fecha
    fechaDiaInput.addEventListener('change', updateDayTypeFromDate);

    // Establecer fecha por defecto: hoy
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    fechaDiaInput.value = year + '-' + month + '-' + day;
    updateDayTypeFromDate();

    valorHoraSelect.addEventListener('change', (e) => {
        customValueGroup.style.display = e.target.value === 'custom' ? 'block' : 'none';
    });

    colacionSelect.addEventListener('change', (e) => {
        colacionTramoGroup.style.display = parseInt(e.target.value) > 0 ? 'block' : 'none';
    });
}