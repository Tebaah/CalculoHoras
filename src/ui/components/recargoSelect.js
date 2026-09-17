/**
 * recargoSelect.js - Componente selector de porcentaje de recargo
 *
 * Construye dinámicamente las opciones del desplegable "% Recargo"
 * a partir de los porcentajes configurados en la página Configuración.
 * Se utiliza tanto en Órdenes de Trabajo como en Reportes.
 */

import { getRecargos } from '../../store/configManager.js';
import { formatRecargoLabel, RECARGO_POR_DEFECTO } from '../../core/constants.js';

/**
 * Reemplaza las opciones del selector con los porcentajes configurados.
 * Conserva el valor seleccionado si sigue disponible; en caso contrario
 * selecciona el porcentaje por defecto o el mayor configurado.
 *
 * @param {HTMLSelectElement} select - Selector de % de recargo
 * @returns {Array<number>} Porcentajes utilizados
 */
export function populateRecargoOptions(select) {
    if (!select) return [];

    const recargos = getRecargos();
    const seleccionPrevia = Number(select.value);

    select.innerHTML = recargos
        .map((porcentaje) => '<option value="' + porcentaje + '">' + formatRecargoLabel(porcentaje) + '</option>')
        .join('');

    const porDefecto = recargos.includes(RECARGO_POR_DEFECTO)
        ? RECARGO_POR_DEFECTO
        : recargos[recargos.length - 1];

    select.value = String(recargos.includes(seleccionPrevia) ? seleccionPrevia : porDefecto);

    return recargos;
}

/**
 * Asegura que un porcentaje exista entre las opciones del selector.
 * Se usa al editar un registro guardado con un recargo que ya no
 * está configurado, para no perder el dato original.
 *
 * @param {HTMLSelectElement} select - Selector de % de recargo
 * @param {number|string} porcentaje - Porcentaje a asegurar
 */
export function ensureRecargoOption(select, porcentaje) {
    if (!select || porcentaje === undefined || porcentaje === null || porcentaje === '') return;

    const valor = String(porcentaje);

    if (select.querySelector('option[value="' + valor + '"]')) return;

    const option = document.createElement('option');
    option.value = valor;
    option.textContent = formatRecargoLabel(Number(porcentaje));
    select.appendChild(option);
}
