/**
 * shared.js - Funciones y constantes compartidas entre app.js y reportes.js
 */

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