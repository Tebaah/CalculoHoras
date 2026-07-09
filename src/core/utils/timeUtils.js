/**
 * timeUtils.js - Utilidades puras para manejo de tiempo
 */

/**
 * Convierte HH:MM a minutos desde medianoche
 * @param {string} timeString - Hora en formato HH:MM
 * @returns {number} Minutos desde medianoche
 */
export function timeToMinutes(timeString) {
    const [hours, minutes] = timeString.split(':').map(Number);
    return hours * 60 + minutes;
}

/**
 * Convierte minutos a horas con 2 decimales
 * @param {number} minutes
 * @returns {string} Horas formateadas (ej: "6.50")
 */
export function minutesToHours(minutes) {
    return (minutes / 60).toFixed(2);
}

/**
 * Calcula la cantidad de minutos dentro de un rango horario específico.
 *
 * Maneja correctamente:
 * 1. Períodos que cruzan medianoche (endMin < startMin)
 * 2. Rangos que cruzan medianoche (rangeEnd < rangeStart)
 * 3. Precisión en minutos exactos
 *
 * @param {number} startMin - Minuto de inicio del período trabajado
 * @param {number} endMin - Minuto de término del período trabajado
 * @param {number} rangeStart - Inicio del rango a calcular
 * @param {number} rangeEnd - Fin del rango a calcular
 * @returns {number} Minutos dentro del rango
 */
export function calculateMinutesInRange(startMin, endMin, rangeStart, rangeEnd) {
    // Normalizar período si cruza medianoche
    let periodStart = startMin;
    let periodEnd = endMin;

    if (periodEnd < periodStart) {
        periodEnd += 1440;
    }

    let totalMinutes = 0;

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
        if (part1End < part1Start) part1End = part1Start;
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
 * Valida que los datos de entrada sean válidos
 * @param {string} horaInicio - Hora de inicio en HH:MM
 * @param {string} horaTermino - Hora de término en HH:MM
 * @returns {{ startMin: number, endMin: number }}
 * @throws {Error} Si las horas son inválidas
 */
export function validateInputs(horaInicio, horaTermino) {
    const startMin = timeToMinutes(horaInicio);
    const endMin = timeToMinutes(horaTermino);

    if (startMin === endMin) {
        throw new Error('La hora de inicio y término no pueden ser iguales.');
    }

    return { startMin, endMin };
}