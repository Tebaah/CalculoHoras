/**
 * servicios.js - Lógica de la página "Cálculo de Servicios"
 *
 * Permite calcular un servicio de uno o varios días. Coordina la interacción
 * con el DOM y conecta con el caso de uso de período y el store.
 */

import { calculateServicePeriod } from '../../store/actions/calculatorActions.js';
import { renderServicioTotals } from '../render/renderServicio.js';
import { initSidebar } from '../components/sidebar.js';
import { populateRecargoOptions, ensureRecargoOption } from '../components/recargoSelect.js';
import { populateHorasMinimasOptions, ensureHorasMinimasOption } from '../components/horasMinimasSelect.js';
import { populateValorHoraOptions, ensureValorHoraOption } from '../components/valorHoraSelect.js';
import { showConfirmModal } from '../components/confirmModal.js';
import {
    getDayTypeFromDate,
    addDays,
    toDateInputValue,
    getDayId,
    formatDate,
    DAY_ID_TO_NAME,
} from '../../core/utils/dateUtils.js';
import { TIPOS_DIA, VALOR_HORA_PERSONALIZADO } from '../../core/constants.js';
import { saveRecord } from '../../store/storageManager.js';

// Elementos del DOM
const serviceForm = document.getElementById('servicioForm');
const valorHoraSelect = document.getElementById('valorHora');
const horasMinimasSelect = document.getElementById('horasMinimas');
const recargoPorcentajeSelect = document.getElementById('recargoPorcentaje');
const customValueGroup = document.getElementById('customValueGroup');
const customValueInput = document.getElementById('customValue');
const errorDiv = document.getElementById('errorMessage');
const indiceInput = document.getElementById('indiceServicio');
const guardarBtn = document.getElementById('guardarServicioBtn');

// Último servicio calculado para poder guardarlo
let lastCalculatedService = null;

// Filas para las que ya se consultó si se desea repetir el horario
const repeatAskedRows = new WeakSet();

// Evita cadenas de consulta simultáneas mientras hay un modal abierto
let repeatPromptActive = false;

/**
 * Actualiza el identificador de día (data-dia), el nombre visible,
 * el tipo de día (data-tipo) y la etiqueta visual de una fila
 * según la fecha seleccionada
 *
 * @param {HTMLElement} row - Fila del servicio
 * @param {Date} date - Fecha asociada
 */
function updateRowDayType(row, date) {
    const dayId = getDayId(date);
    row.dataset.dia = dayId;

    const dayName = row.querySelector('.day-name');
    if (dayName) {
        dayName.textContent = DAY_ID_TO_NAME[dayId] || dayId;
    }

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
 * la fecha del primer día
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

        const row = input.closest('.report-row');
        if (row) {
            updateRowDayType(row, newDate);
        }
    });
}

/**
 * Configura los event listeners de colación para cada fila
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
    document.querySelectorAll('.fecha-dia').forEach((input) => {
        input.addEventListener('change', () => {
            // Actualizar el tipo de día de la fila editada
            if (input.value) {
                const row = input.closest('.report-row');
                if (row) {
                    updateRowDayType(row, new Date(input.value + 'T12:00:00'));
                }
            }

            // La primera fecha propaga las fechas a los días siguientes
            if (input.dataset.dayIndex === '0') {
                handleFirstDateChange();
            }
        });
    });
}

/**
 * Establece las fechas por defecto: desde hoy
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
 * Indica si una fila del servicio ya tiene el horario completo
 *
 * @param {HTMLElement} row - Fila del servicio
 * @returns {boolean} true si tiene hora de inicio y de término
 */
function isRowComplete(row) {
    const horaInicio = row.querySelector('.hora-inicio');
    const horaTermino = row.querySelector('.hora-termino');

    return Boolean(horaInicio && horaInicio.value && horaTermino && horaTermino.value);
}

/**
 * Indica si la fila tiene ingresados los tres datos del horario:
 * hora de inicio, hora de término y colación
 *
 * @param {HTMLElement} row - Fila del servicio
 * @returns {boolean} true si los tres datos fueron ingresados
 */
function hasCompleteSchedule(row) {
    return isRowComplete(row) && row.dataset.colacionIngresada === 'true';
}

/**
 * Obtiene la fila del día siguiente dentro de la tabla del servicio
 *
 * @param {HTMLElement} row - Fila actual
 * @returns {HTMLElement|null} Fila siguiente o null si es la última
 */
function getNextRow(row) {
    const nextRow = row.nextElementSibling;

    if (nextRow && nextRow.classList.contains('report-row')) {
        return nextRow;
    }

    return null;
}

/**
 * Copia el horario de una fila (hora inicio, hora término y colación)
 * en la fila del día siguiente
 *
 * @param {HTMLElement} fromRow - Fila de origen
 * @param {HTMLElement} toRow - Fila de destino
 */
function copySchedule(fromRow, toRow) {
    const horaInicio = fromRow.querySelector('.hora-inicio').value;
    const horaTermino = fromRow.querySelector('.hora-termino').value;
    const colacionSelect = fromRow.querySelector('.colacion');
    const colacionTramoSelect = fromRow.querySelector('.colacion-tramo');
    const colacion = colacionSelect ? colacionSelect.value : '0';

    toRow.querySelector('.hora-inicio').value = horaInicio;
    toRow.querySelector('.hora-termino').value = horaTermino;

    const destinoColacion = toRow.querySelector('.colacion');
    if (destinoColacion) {
        destinoColacion.value = colacion;
        toRow.dataset.colacionIngresada = 'true';
    }

    const destinoTramo = toRow.querySelector('.colacion-tramo');
    if (destinoTramo) {
        destinoTramo.value = colacionTramoSelect ? colacionTramoSelect.value : 'sinRecargo';
        destinoTramo.style.display = parseInt(colacion) > 0 ? 'block' : 'none';
    }

    toRow.classList.add('report-row--repeated');
    setTimeout(() => toRow.classList.remove('report-row--repeated'), 2000);
}

/**
 * Pregunta al usuario si desea repetir el horario ingresado en el día siguiente
 *
 * @param {HTMLElement} currentRow - Fila con el horario ya ingresado
 * @param {HTMLElement} nextRow - Fila del día siguiente
 * @returns {Promise<boolean>} true si el usuario desea repetir el horario
 */
function askRepeatForNextDay(currentRow, nextRow) {
    const dayNameEl = nextRow.querySelector('.day-name');
    const fechaInput = nextRow.querySelector('.fecha-dia');

    const dayName = dayNameEl ? dayNameEl.textContent.trim() : 'día siguiente';
    const fecha = fechaInput && fechaInput.value
        ? ' (' + formatDate(new Date(fechaInput.value + 'T12:00:00')) + ')'
        : '';

    const horaInicio = currentRow.querySelector('.hora-inicio').value;
    const horaTermino = currentRow.querySelector('.hora-termino').value;
    const colacion = parseInt(currentRow.querySelector('.colacion').value) || 0;

    const detalleSobrescritura = isRowComplete(nextRow)
        ? ' \u00B7 El horario de ese día ya está ingresado y será reemplazado'
        : '';

    return showConfirmModal({
        title: 'Repetir horario',
        message: '¿Desea repetir este horario el ' + dayName + fecha + '?',
        detail: 'Hora inicio ' + horaInicio + ' \u00B7 Hora término ' + horaTermino +
            ' \u00B7 Colación ' + colacion + ' min' + detalleSobrescritura,
        confirmText: 'Sí, repetir',
        cancelText: 'No, continuar',
    });
}

/**
 * Consulta día a día si se desea repetir el horario, hasta que el usuario
 * indique que no desea continuar o se alcance el último día
 *
 * @param {HTMLElement} startRow - Fila desde la cual comienza la repetición
 * @returns {Promise<void>}
 */
async function repeatScheduleForFollowingDays(startRow) {
    let currentRow = startRow;

    while (true) {
        const nextRow = getNextRow(currentRow);
        if (!nextRow) break;

        const repeat = await askRepeatForNextDay(currentRow, nextRow);
        if (!repeat) break;

        copySchedule(currentRow, nextRow);
        repeatAskedRows.add(nextRow);
        currentRow = nextRow;
    }
}

/**
 * Maneja el ingreso de un dato de horario en una fila y ofrece repetirlo
 * en el día siguiente cuando están ingresados inicio, término y colación
 *
 * @param {HTMLElement} row - Fila modificada
 * @param {string} fieldName - Campo modificado
 * @returns {Promise<void>}
 */
async function handleScheduleInput(row, fieldName) {
    if (repeatPromptActive) return;

    if (fieldName === 'colacion') {
        row.dataset.colacionIngresada = 'true';
    }

    if (!hasCompleteSchedule(row)) {
        repeatAskedRows.delete(row);
        return;
    }

    if (repeatAskedRows.has(row)) return;

    repeatAskedRows.add(row);
    repeatPromptActive = true;

    try {
        await repeatScheduleForFollowingDays(row);
    } finally {
        repeatPromptActive = false;
    }
}

/**
 * Configura la consulta de repetición de horario en cada fila
 */
function setupRepeatScheduleListeners() {
    document.querySelectorAll('.report-row').forEach((row) => {
        ['hora-inicio', 'hora-termino', 'colacion'].forEach((claseInput) => {
            const input = row.querySelector('.' + claseInput);
            if (input) {
                input.addEventListener('change', () => handleScheduleInput(row, claseInput));
            }
        });
    });
}

/**
 * Obtiene los datos de todos los días del formulario.
 * Solo incluye días que tengan hora inicio Y hora término ingresados.
 *
 * @returns {Array<Object>} Datos de los días
 */
function getDaysData() {
    const days = [];
    const rows = document.querySelectorAll('.report-row');

    rows.forEach((row) => {
        const dia = row.dataset.dia;
        const tipoDia = row.dataset.tipo;
        const fechaInput = row.querySelector('.fecha-dia');
        const fecha = fechaInput ? fechaInput.value : '';
        const horaInicio = row.querySelector('.hora-inicio').value;
        const horaTermino = row.querySelector('.hora-termino').value;
        const colacion = parseInt(row.querySelector('.colacion').value) || 0;
        const colacionTramoSelect = row.querySelector('.colacion-tramo');
        const colacionTramo = colacionTramoSelect ? colacionTramoSelect.value : 'sinRecargo';

        if (horaInicio && horaTermino) {
            days.push({
                dia,
                tipoDia,
                fecha,
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
 * Maneja el envío del formulario de cálculo de servicio
 */
function handleServiceSubmit(e) {
    e.preventDefault();
    errorDiv.classList.remove('show');

    try {
        let valorHora = valorHoraSelect.value;

        if (!valorHora) {
            throw new Error('Por favor seleccione un valor de hora.');
        }

        if (valorHora === VALOR_HORA_PERSONALIZADO) {
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

        const service = calculateServicePeriod(daysData, valorHora);

        lastCalculatedService = {
            daysData: daysData.map((d) => ({ ...d })),
            service: {
                results: service.results.map((r) => ({ ...r })),
                totalSinRecargo: service.totalSinRecargo,
                totalConRecargo: service.totalConRecargo,
                totalNormalesOp: service.totalNormalesOp,
                totalDoblesOp: service.totalDoblesOp,
                totalMonto: service.totalMonto,
                daysCount: service.daysCount,
            },
            valorHora,
            horasMinimas,
            recargoPorcentaje,
        };

        renderServicioTotals(service, valorHora, recargoPorcentaje);

    } catch (error) {
        errorDiv.textContent = '\u274C ' + error.message;
        errorDiv.classList.add('show');
    }
}

/**
 * Maneja el guardado del servicio actual
 */
function handleSaveService() {
    errorDiv.classList.remove('show');

    if (!lastCalculatedService) {
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
        const { daysData, service, valorHora, horasMinimas, recargoPorcentaje } = lastCalculatedService;

        const diasConResultados = daysData.map((day, index) => {
            const result = service.results[index] || {};
            return {
                ...day,
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
            dias: diasConResultados,
            totales: {
                horasSinRecargo: service.totalSinRecargo,
                horasConRecargo: service.totalConRecargo,
                horasNormalesOp: service.totalNormalesOp,
                horasDobles: service.totalDoblesOp,
                montoTotal: service.totalMonto,
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
 * Inicializa los event listeners de la página de servicios
 */
export function initServiciosPage() {
    initSidebar();

    populateRecargoOptions(recargoPorcentajeSelect);
    populateHorasMinimasOptions(horasMinimasSelect);
    populateValorHoraOptions(valorHoraSelect);

    serviceForm.addEventListener('submit', handleServiceSubmit);

    valorHoraSelect.addEventListener('change', (e) => {
        customValueGroup.style.display = e.target.value === VALOR_HORA_PERSONALIZADO ? 'block' : 'none';
    });

    setupColacionListeners();
    setupRepeatScheduleListeners();
    setupDateAutoFill();
    setDefaultDates();

    guardarBtn.addEventListener('click', handleSaveService);

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

        if (record.indice) indiceInput.value = record.indice;

        if (record.valorHora) {
            ensureValorHoraOption(valorHoraSelect, record.valorHora);
            valorHoraSelect.value = String(record.valorHora);

            if (valorHoraSelect.value !== String(record.valorHora)) {
                valorHoraSelect.value = VALOR_HORA_PERSONALIZADO;
                customValueGroup.style.display = 'block';
                customValueInput.value = record.valorHora;
            }
        }

        if (record.horasMinimas !== undefined) {
            ensureHorasMinimasOption(horasMinimasSelect, record.horasMinimas);
            horasMinimasSelect.value = String(record.horasMinimas);
        }
        if (record.recargoPorcentaje !== undefined) {
            ensureRecargoOption(recargoPorcentajeSelect, record.recargoPorcentaje);
            recargoPorcentajeSelect.value = String(record.recargoPorcentaje);
        }

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

                if (diaData.horaInicio && diaData.horaTermino && diaData.colacion !== undefined) {
                    row.dataset.colacionIngresada = 'true';
                }
            });
        }

        sessionStorage.removeItem('editarRegistro');
        window.history.replaceState({}, document.title, window.location.pathname);

    } catch (error) {
        console.error('Error al cargar datos de edición:', error);
    }
}
