/**
 * reportes.js - Lógica para el cálculo de reportes semanales
 * 
 * Reutiliza las funciones de negocio de shared.js:
 * - timeToMinutes()
 * - calculateMinutesInRange()
 * - minutesToHours()
 * - formatCurrency()
 * - validateInputs()
 */

// Elementos del DOM
const reportForm = document.getElementById('reportForm');
const valorHoraSelect = document.getElementById('valorHora');
const customValueGroup = document.getElementById('customValueGroup');
const customValueInput = document.getElementById('customValue');
const errorDiv = document.getElementById('errorMessage');

// Event listeners
reportForm.addEventListener('submit', handleReportSubmit);

valorHoraSelect.addEventListener('change', (e) => {
    customValueGroup.style.display = e.target.value === 'custom' ? 'block' : 'none';
});

/**
 * Configura los event listeners de colación para cada fila
 */
function setupColacionListeners() {
    document.querySelectorAll('.colacion').forEach(select => {
        select.addEventListener('change', (e) => {
            const tramoSelect = e.target.closest('.report-row').querySelector('.colacion-tramo');
            tramoSelect.style.display = parseInt(e.target.value) > 0 ? 'block' : 'none';
        });
    });
}

// Inicializar listeners de colación
setupColacionListeners();

/**
 * Obtiene los datos de todos los días del formulario
 * Solo incluye días que tengan hora inicio Y hora término ingresados
 */
function getDaysData() {
    const days = [];
    const rows = document.querySelectorAll('.report-row');

    rows.forEach(row => {
        const dia = row.dataset.dia;
        const tipoDia = row.dataset.tipo;
        const horaInicio = row.querySelector('.hora-inicio').value;
        const horaTermino = row.querySelector('.hora-termino').value;
        const colacion = parseInt(row.querySelector('.colacion').value) || 0;
        const colacionTramoSelect = row.querySelector('.colacion-tramo');
        const colacionTramo = colacionTramoSelect ? colacionTramoSelect.value : 'sinRecargo';

        // Solo incluir días con ambas horas ingresadas
        if (horaInicio && horaTermino) {
            days.push({
                dia,
                tipoDia,
                horaInicio,
                horaTermino,
                colacion,
                colacionTramo
            });
        }
    });

    return days;
}

/**
 * Calcula las horas para un día específico usando la misma lógica de shared.js
 */
function calculateDay(diaData, valorHora) {
    const { startMin, endMin } = validateInputs(diaData.horaInicio, diaData.horaTermino);

    // Determinar si el período cruza medianoche
    const cruzaMedianoche = endMin < startMin;
    const totalMinutosTrabajados = cruzaMedianoche ? (endMin + 1440 - startMin) : (endMin - startMin);

    // Calcular minutos en cada rango horario según el tipo de día
    let minConRecargo, minSinRecargo, minDobles;

    if (diaData.tipoDia === 'normal') {
        // Día normal: con recargo 18:00–07:00, dobles antes 07:00 y desde 19:00
        minConRecargo = calculateMinutesInRange(
            startMin, endMin,
            RANGO_CON_RECARGO.inicio,    // 18:00
            RANGO_CON_RECARGO.fin        // 07:00 (cruza medianoche)
        );
        minSinRecargo = totalMinutosTrabajados - minConRecargo;

        const minDoblesManana = calculateMinutesInRange(startMin, endMin, 0, 7 * 60);
        const minDoblesNoche  = calculateMinutesInRange(startMin, endMin, 19 * 60, 24 * 60);
        minDobles = minDoblesManana + minDoblesNoche;

    } else if (diaData.tipoDia === 'sabado') {
        // Día sábado: con recargo desde 13:00 (cruza medianoche hasta 07:00), dobles desde 13:00
        minConRecargo = calculateMinutesInRange(
            startMin, endMin,
            13 * 60,    // 13:00
            7 * 60      // 07:00 (cruza medianoche)
        );
        minSinRecargo = totalMinutosTrabajados - minConRecargo;

        const minDoblesManana = calculateMinutesInRange(startMin, endMin, 0, 7 * 60);
        const minDoblesNoche  = calculateMinutesInRange(startMin, endMin, 13 * 60, 24 * 60);
        minDobles = minDoblesManana + minDoblesNoche;

    } else {
        // Día domingo y festivo: todo el tiempo es con recargo y doble
        minConRecargo = totalMinutosTrabajados;
        minSinRecargo = 0;
        minDobles = totalMinutosTrabajados;
    }

    // Aplicar descuento de colación
    const minColacion = diaData.colacion || 0;
    const colacionTramo = diaData.colacionTramo || 'sinRecargo';
    let minSinRecargoFinal = minSinRecargo;
    let minConRecargoFinal = minConRecargo;
    if (minColacion > 0) {
        if (colacionTramo === 'sinRecargo') {
            minSinRecargoFinal = Math.max(0, minSinRecargo - minColacion);
        } else {
            minConRecargoFinal = Math.max(0, minConRecargo - minColacion);
        }
    }

    // Horas normales del operador = Total de horas trabajadas
    let minNormalesOp = totalMinutosTrabajados;

    // Descuento de colación en horas del operador
    if (minColacion > 0) {
        if (colacionTramo === 'sinRecargo') {
            minNormalesOp = Math.max(0, minNormalesOp - minColacion);
        } else {
            minNormalesOp = Math.max(0, minNormalesOp - minColacion);
            minDobles = Math.max(0, minDobles - minColacion);
        }
    }

    // Convertir minutos a horas
    const horasSinRecargo = parseFloat(minutesToHours(minSinRecargoFinal));
    const horasConRecargo = parseFloat(minutesToHours(minConRecargoFinal));
    const horasNormalesOp = parseFloat(minutesToHours(minNormalesOp));
    const horasDobles = parseFloat(minutesToHours(minDobles));

    // Calcular monto del servicio
    // Monto = (horas sin recargo × valor) + (horas con recargo × valor × 1.30)
    const montoSinRecargo = horasSinRecargo * valorHora;
    const montoConRecargo = horasConRecargo * (valorHora * 1.30);
    const montoTotal = montoSinRecargo + montoConRecargo;

    return {
        dia: diaData.dia,
        horasSinRecargo,
        horasConRecargo,
        horasNormalesOp,
        horasDobles,
        montoTotal
    };
}

/**
 * Maneja el envío del formulario del reporte semanal
 */
function handleReportSubmit(e) {
    e.preventDefault();
    errorDiv.classList.remove('show');
    document.getElementById('totalResults').classList.remove('show');

    try {
        // Obtener valor de hora global
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

        // Obtener datos de los días
        const daysData = getDaysData();

        if (daysData.length === 0) {
            throw new Error('Debe ingresar al menos un día con hora de inicio y término.');
        }

        // Calcular cada día
        const results = daysData.map(dayData => calculateDay(dayData, valorHora));

        // Calcular totales generales
        const totalSinRecargo = results.reduce((sum, r) => sum + r.horasSinRecargo, 0);
        const totalConRecargo = results.reduce((sum, r) => sum + r.horasConRecargo, 0);
        const totalNormalesOp = results.reduce((sum, r) => sum + r.horasNormalesOp, 0);
        const totalDoblesOp = results.reduce((sum, r) => sum + r.horasDobles, 0);
        const totalMonto = results.reduce((sum, r) => sum + r.montoTotal, 0);

        // Actualizar totales generales
        const nombresDias = {
            lunes: 'Lunes', martes: 'Martes', miercoles: 'Miércoles',
            jueves: 'Jueves', viernes: 'Viernes', sabado: 'Sábado', domingo: 'Domingo'
        };
        const diasNombres = daysData.map(d => nombresDias[d.dia] || d.dia);
        document.getElementById('diasIncluidos').textContent = diasNombres.join(', ');
        document.getElementById('totalSinRecargo').textContent = totalSinRecargo.toFixed(2) + ' h';
        document.getElementById('totalConRecargo').textContent = totalConRecargo.toFixed(2) + ' h';
        document.getElementById('totalNormalesOp').textContent = totalNormalesOp.toFixed(2) + ' h';
        document.getElementById('totalDoblesOp').textContent = totalDoblesOp.toFixed(2) + ' h';
        document.getElementById('totalMonto').textContent = formatCurrency(totalMonto);

        // Mostrar resultados
        document.getElementById('totalResults').classList.add('show');

        // Scroll a resultados
        document.getElementById('totalResults').scrollIntoView({ behavior: 'smooth', block: 'start' });

    } catch (error) {
        errorDiv.textContent = '❌ ' + error.message;
        errorDiv.classList.add('show');
    }
}