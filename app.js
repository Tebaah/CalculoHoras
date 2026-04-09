// Constantes de rangos horarios en minutos desde medianoche
const RANGO_SIN_RECARGO = {
    inicio: 7 * 60,      // 07:00
    fin: 18 * 60         // 18:00
};

const RANGO_CON_RECARGO = {
    inicio: 18 * 60,     // 18:00
    fin: 7 * 60          // 07:00 (cruza medianoche)
};

const RANGO_NORMAL_OPERADOR = {
    inicio: 7 * 60,      // 07:00
    fin: 19 * 60         // 19:00
};

const RANGO_DOBLES_OPERADOR = {
    inicio: 19 * 60,     // 19:00
    fin: 7 * 60          // 07:00 (cruza medianoche)
};

// Elementos del DOM
const form = document.getElementById('calculatorForm');
const tipoDiaSelect = document.getElementById('tipoDia');
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

// Event listeners
form.addEventListener('submit', handleSubmit);
valorHoraSelect.addEventListener('change', (e) => {
    customValueGroup.style.display = e.target.value === 'custom' ? 'block' : 'none';
});
colacionSelect.addEventListener('change', (e) => {
    colacionTramoGroup.style.display = parseInt(e.target.value) > 0 ? 'block' : 'none';
});

/**
 * Convierte HH:MM a minutos desde medianoche
 * Ejemplo: 14:30 -> 870 minutos
 */
function timeToMinutes(timeString) {
    const [hours, minutes] = timeString.split(':').map(Number);
    return hours * 60 + minutes;
}

/**
 * Calcula la cantidad de minutos dentro de un rango horario específico.
 *
 * Parámetros:
 * - startMin: minuto de inicio del período trabajado
 * - endMin: minuto de término del período trabajado
 * - rangeStart: inicio del rango a calcular
 * - rangeEnd: fin del rango a calcular
 *
 * La lógica usa minutos extendidos para períodos que cruzan medianoche:
 * - Si endMin < startMin, se suma 1440 (24 horas) a endMin
 * - Los rangos que cruzan medianoche se representan con rangeEnd < rangeStart
 *
 * Maneja correctamente:
 * 1. Períodos que cruzan medianoche (endMin < startMin)
 * 2. Rangos que cruzan medianoche (rangeEnd < rangeStart)
 * 3. Precisión en minutos exactos
 */
function calculateMinutesInRange(startMin, endMin, rangeStart, rangeEnd) {
    // Fase 1: Normalizar período si cruza medianoche
    let periodStart = startMin;
    let periodEnd = endMin;

    if (periodEnd < periodStart) {
        // El período cruza medianoche
        periodEnd += 1440;
    }

    let totalMinutes = 0;

    // Fase 2: Calcular intersección según el tipo de rango

    if (rangeEnd < rangeStart) {
        // CASO A: El rango cruza medianoche
        // Rango = [rangeStart, 1440) ∪ [1440, 1440 + rangeEnd)

        // Subparte 1: Intersección con [rangeStart, 1440)
        const part1Start = Math.max(periodStart, rangeStart);
        const part1End = Math.min(periodEnd, 1440);
        if (part1Start < part1End) {
            totalMinutes += part1End - part1Start;
        }

        // Subparte 2: Intersección con [1440, 1440 + rangeEnd)
        const part2Start = Math.max(periodStart, 1440);
        const part2End = Math.min(periodEnd, 1440 + rangeEnd);
        if (part2Start < part2End) {
            totalMinutes += part2End - part2Start;
        }
    } else {
        // CASO B: El rango NO cruza medianoche
        // Rango = [rangeStart, rangeEnd)

        // Subparte 1: Intersección con [rangeStart, rangeEnd) del mismo día
        const part1Start = Math.max(periodStart, rangeStart);
        let part1End = Math.min(periodEnd, 1440);
        if (part1End < part1Start) part1End = part1Start; // No hay intersección
        if (part1Start < Math.min(part1End, rangeEnd)) {
            totalMinutes += Math.min(part1End, rangeEnd) - part1Start;
        }

        // Subparte 2: Si el período cruza medianoche, intersección con [rangeStart, rangeEnd) del siguiente día
        if (periodEnd > 1440) {
            const part2Start = Math.max(0, rangeStart);
            const part2End = Math.min(periodEnd - 1440, rangeEnd);
            if (part2Start < part2End) {
                totalMinutes += part2End - part2Start;
            }
        }
    }

    return Math.max(0, totalMinutes);
}

/**
 * Convierte minutos a horas con 2 decimales
 * Ejemplo: 390 minutos -> "6.50" horas
 */
function minutesToHours(minutes) {
    return (minutes / 60).toFixed(2);
}

/**
 * Formatea un número como moneda en formato CLP
 */
function formatCurrency(amount) {
    return '$' + Math.round(amount).toLocaleString('es-CL');
}

/**
 * Valida que los datos de entrada sean válidos
 */
function validateInputs(horaInicio, horaTermino) {
    const startMin = timeToMinutes(horaInicio);
    const endMin = timeToMinutes(horaTermino);

    if (startMin === endMin) {
        throw new Error('La hora de inicio y término no pueden ser iguales.');
    }

    return { startMin, endMin };
}

/**
 * Maneja el envío del formulario y calcula todos los valores
 */
function handleSubmit(e) {
    e.preventDefault();
    errorDiv.classList.remove('show');
    resultsDiv.classList.remove('show');

    try {
        // Obtener y validar valores del formulario
        const tipoDia = tipoDiaSelect.value;
        const horaInicio = horaInicioInput.value;
        const horaTermino = horaTerminoInput.value;
        let valorHora = valorHoraSelect.value;

        if (!horaInicio || !horaTermino) {
            throw new Error('Por favor ingrese tanto la hora de inicio como la de término.');
        }

        if (valorHora === 'custom') {
            valorHora = parseFloat(customValueInput.value);
            if (!valorHora || valorHora <= 0) {
                throw new Error('Por favor ingrese un valor de hora válido y positivo.');
            }
        } else if (!valorHora) {
            throw new Error('Por favor seleccione un valor de hora.');
        }

        valorHora = parseFloat(valorHora);

        // Validar y obtener minutos
        const { startMin, endMin } = validateInputs(horaInicio, horaTermino);

        // Determinar si el período cruza medianoche
        const cruza_medianoche = endMin < startMin;
        const totalMinutosTrabajados = cruza_medianoche ? (endMin + 1440 - startMin) : (endMin - startMin);

        // Calcular minutos en cada rango horario según el tipo de día
        let minConRecargo, minSinRecargo, minDobles;

        if (tipoDia === 'normal') {
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

        } else if (tipoDia === 'sabado') {
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
        const minColacion = parseInt(colacionSelect.value) || 0;
        const colacionTramo = colacionTramoSelect.value || 'sinRecargo';
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

        // Descuento de colación en horas del operador (independiente del descuento al servicio)
        if (minColacion > 0) {
            if (colacionTramo === 'sinRecargo') {
                // Opción "sin recargo": descontar solo de horas normales
                minNormalesOp = Math.max(0, minNormalesOp - minColacion);
            } else {
                // Opción "con recargo": descontar de horas normales y también de horas dobles
                minNormalesOp = Math.max(0, minNormalesOp - minColacion);
                minDobles = Math.max(0, minDobles - minColacion);
            }
        }

        // Convertir minutos a horas (con 2 decimales)
        const horasSinRecargo = parseFloat(minutesToHours(minSinRecargoFinal));
        const horasConRecargo = parseFloat(minutesToHours(minConRecargoFinal));
        const horasNormalesOp = parseFloat(minutesToHours(minNormalesOp));
        const horasDobles = parseFloat(minutesToHours(minDobles));

        // Calcular monto del servicio
        // Monto = (horas sin recargo × valor) + (horas con recargo × valor × 1.30)
        const montoSinRecargo = horasSinRecargo * valorHora;
        const montoConRecargo = horasConRecargo * (valorHora * 1.30);
        const montoTotal = montoSinRecargo + montoConRecargo;

        // Actualizar etiquetas de resultado según el tipo de día
        if (tipoDia === 'normal') {
            document.getElementById('labelSinRecargo').textContent = 'Horas sin recargo (07:00 - 18:00)';
            document.getElementById('labelConRecargo').textContent = 'Horas con recargo (18:00 - 07:00)';
            document.getElementById('labelDoblesOp').textContent   = 'Horas dobles del operador (antes 07:00 y después 19:00)';
        } else if (tipoDia === 'sabado') {
            document.getElementById('labelSinRecargo').textContent = 'Horas sin recargo (07:00 - 13:00)';
            document.getElementById('labelConRecargo').textContent = 'Horas con recargo (desde 13:00)';
            document.getElementById('labelDoblesOp').textContent   = 'Horas dobles del operador (desde 13:00)';
        } else {
            document.getElementById('labelSinRecargo').textContent = 'Horas sin recargo';
            document.getElementById('labelConRecargo').textContent = 'Horas con recargo (todo el día)';
            document.getElementById('labelDoblesOp').textContent   = 'Horas dobles del operador (todo el día)';
        }

        // Actualizar elementos de resultado
        document.getElementById('horasSinRecargo').textContent = horasSinRecargo.toFixed(2) + ' h';
        document.getElementById('horasConRecargo').textContent = horasConRecargo.toFixed(2) + ' h';
        document.getElementById('horasNormalesOp').textContent = horasNormalesOp.toFixed(2) + ' h';
        document.getElementById('horasDobles').textContent = horasDobles.toFixed(2) + ' h';
        document.getElementById('montoTotal').textContent = formatCurrency(montoTotal);

        // Mostrar sección de resultados
        resultsDiv.classList.add('show');

    } catch (error) {
        errorDiv.textContent = '❌ ' + error.message;
        errorDiv.classList.add('show');
    }
}
