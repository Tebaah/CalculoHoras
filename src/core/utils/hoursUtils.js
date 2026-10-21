/**
 * hoursUtils.js - Utilidades de dominio para normalizar tramos de horas
 */

/**
 * Normaliza dos tramos (sin recargo / con recargo) según el porcentaje de
 * recargo aplicado. Si el recargo es 0, todo el tiempo se considera sin
 * recargo.
 *
 * No depende de la unidad: sirve tanto para minutos como para horas.
 *
 * @param {number} sinRecargo - Cantidad del tramo sin recargo
 * @param {number} conRecargo - Cantidad del tramo con recargo
 * @param {number} recargoPorcentaje - Porcentaje de recargo (0, 10, 20, 30...)
 * @returns {{ sinRecargo: number, conRecargo: number }}
 */
export function normalizarTramosPorRecargo(sinRecargo, conRecargo, recargoPorcentaje) {
    const tramoSin = Number(sinRecargo) || 0;
    const tramoCon = Number(conRecargo) || 0;
    const recargo = recargoPorcentaje === undefined || recargoPorcentaje === null
        ? 30
        : Number(recargoPorcentaje);

    if (recargo <= 0) {
        return { sinRecargo: tramoSin + tramoCon, conRecargo: 0 };
    }

    return { sinRecargo: tramoSin, conRecargo: tramoCon };
}

/**
 * Obtiene el porcentaje de recargo de un registro, aplicando el valor por
 * defecto (30 %) cuando no está definido.
 *
 * @param {Object} registro
 * @returns {number}
 */
export function getRecargoPorcentaje(registro) {
    const valor = registro ? registro.recargoPorcentaje : undefined;
    return valor !== undefined && valor !== null ? Number(valor) : 30;
}
