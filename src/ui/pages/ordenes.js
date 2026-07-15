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
import { saveRecord } from '../../store/storageManager.js';

// Elementos del DOM
const form = document.getElementById('calculatorForm');
const fechaDiaInput = document.getElementById('fechaDia');
const tipoDiaSelect = document.getElementById('tipoDia');
const horasMinimasSelect = document.getElementById('horasMinimas');
const recargoPorcentajeSelect = document.getElementById('recargoPorcentaje');
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
const indiceInput = document.getElementById('indiceOrden');
const guardarBtn = document.getElementById('guardarOrdenBtn');

// Último resultado calculado para poder guardarlo
let lastCalculatedResult = null;

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
        recargoPorcentaje: parseInt(recargoPorcentajeSelect.value) || 0,
    };
}

/**
 * Maneja el envío del formulario
 */
function handleSubmit(e) {
    e.preventDefault();
    errorDiv.classList.remove('show');

    try {
        const formData = getFormData();

        if (!formData.horaInicio || !formData.horaTermino) {
            throw new Error('Por favor ingrese tanto la hora de inicio como la de término.');
        }

        const result = calculateSingleDay(formData);

        // Agregar valores de hora al resultado para el render
        result.tipoDia = formData.tipoDia;
        result.valorSinRecargo = formData.valorHora;
        const multiplicadorRecargo = 1 + (formData.recargoPorcentaje / 100);
        result.valorConRecargo = formData.valorHora * multiplicadorRecargo;

        // Guardar el resultado y datos del formulario para poder guardar después
        lastCalculatedResult = {
            formData: { ...formData },
            result: { ...result },
        };

        renderResults(result);

    } catch (error) {
        errorDiv.textContent = '\u274C ' + error.message;
        errorDiv.classList.add('show');
    }
}

/**
 * Maneja el guardado del registro actual
 */
function handleSave() {
    errorDiv.classList.remove('show');

    if (!lastCalculatedResult) {
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
        const { formData, result } = lastCalculatedResult;

        const record = {
            indice,
            tipo: 'orden',
            fecha: formData.fecha,
            horaInicio: formData.horaInicio,
            horaTermino: formData.horaTermino,
            colacion: formData.colacion,
            colacionTramo: formData.colacionTramo,
            tipoDia: formData.tipoDia,
            valorHora: formData.valorHora,
            horasMinimas: formData.horasMinimas,
            recargoPorcentaje: formData.recargoPorcentaje,
            horasSinRecargo: result.horasSinRecargo,
            horasConRecargo: result.horasConRecargo,
            montoTotal: result.montoTotal,
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

    guardarBtn.addEventListener('click', handleSave);

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
        if (record.tipo !== 'orden') return;

        // Poblar el formulario con los datos del registro
        if (record.fecha) fechaDiaInput.value = record.fecha;
        if (record.tipoDia) tipoDiaSelect.value = record.tipoDia;
        if (record.horaInicio) horaInicioInput.value = record.horaInicio;
        if (record.horaTermino) horaTerminoInput.value = record.horaTermino;
        if (record.indice) indiceInput.value = record.indice;
        if (record.colacion !== undefined) {
            colacionSelect.value = String(record.colacion);
            if (record.colacion > 0) {
                colacionTramoGroup.style.display = 'block';
                if (record.colacionTramo) colacionTramoSelect.value = record.colacionTramo;
            }
        }
        if (record.horasMinimas !== undefined) horasMinimasSelect.value = String(record.horasMinimas);
        if (record.recargoPorcentaje !== undefined) recargoPorcentajeSelect.value = String(record.recargoPorcentaje);
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

        // Actualizar tipo de día según la fecha
        updateDayTypeFromDate();

        // Limpiar sessionStorage después de cargar
        sessionStorage.removeItem('editarRegistro');

        // Remover query param de la URL
        window.history.replaceState({}, document.title, window.location.pathname);

    } catch (error) {
        console.error('Error al cargar datos de edición:', error);
    }
}
