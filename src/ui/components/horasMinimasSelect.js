/**
 * horasMinimasSelect.js - Componente selector de mínimo de horas
 *
 * Construye dinámicamente las opciones del desplegable "Mínimo de Horas"
 * a partir de los mínimos configurados en la página Configuración.
 * Se utiliza tanto en Órdenes de Trabajo como en Reportes.
 */

import { getHorasMinimas } from '../../store/configManager.js';
import { formatHorasMinimasLabel, HORAS_MINIMAS_MINIMO } from '../../core/constants.js';

/**
 * Reemplaza las opciones del selector con los mínimos configurados.
 * Conserva el valor seleccionado si sigue disponible; en caso contrario
 * selecciona "Sin mínimo" (0).
 *
 * @param {HTMLSelectElement} select - Selector de mínimo de horas
 * @returns {Array<number>} Mínimos utilizados
 */
export function populateHorasMinimasOptions(select) {
    if (!select) return [];

    const opciones = getHorasMinimas();
    const seleccionPrevia = Number(select.value);

    select.innerHTML = opciones
        .map((horas) => '<option value="' + horas + '">' + formatHorasMinimasLabel(horas) + '</option>')
        .join('');

    select.value = String(opciones.includes(seleccionPrevia) ? seleccionPrevia : HORAS_MINIMAS_MINIMO);

    return opciones;
}

/**
 * Asegura que un mínimo de horas exista entre las opciones del selector.
 * Se usa al editar un registro guardado con un mínimo que ya no
 * está configurado, para no perder el dato original.
 *
 * @param {HTMLSelectElement} select - Selector de mínimo de horas
 * @param {number|string} horas - Mínimo de horas a asegurar
 */
export function ensureHorasMinimasOption(select, horas) {
    if (!select || horas === undefined || horas === null || horas === '') return;

    const valor = String(horas);

    if (select.querySelector('option[value="' + valor + '"]')) return;

    const option = document.createElement('option');
    option.value = valor;
    option.textContent = formatHorasMinimasLabel(Number(horas));
    select.appendChild(option);
}
