/**
 * valorHoraSelect.js - Componente selector de Valor Hora Normal
 *
 * Construye dinámicamente las opciones del desplegable "Valor de la Hora
 * Normal" a partir de los valores configurados en la página Configuración.
 * Se utiliza tanto en Órdenes de Trabajo como en Reportes.
 *
 * El selector siempre conserva dos opciones fijas: el placeholder vacío y
 * "Otro valor...", que habilita el ingreso de un valor personalizado.
 */

import { getValoresHora } from '../../store/configManager.js';
import {
    formatValorHoraLabel,
    normalizarValorHora,
    VALOR_HORA_PLACEHOLDER,
    VALOR_HORA_PLACEHOLDER_LABEL,
    VALOR_HORA_PERSONALIZADO,
    VALOR_HORA_PERSONALIZADO_LABEL,
} from '../../core/constants.js';

/**
 * Reemplaza las opciones de valores configurados, manteniendo el placeholder
 * y la opción "Otro valor...". Conserva el valor seleccionado si sigue
 * disponible; en caso contrario vuelve al placeholder.
 *
 * @param {HTMLSelectElement} select - Selector de valor de hora
 * @returns {Array<number>} Valores utilizados
 */
export function populateValorHoraOptions(select) {
    if (!select) return [];

    const valores = getValoresHora();
    const seleccionPrevia = select.value;

    select.innerHTML = '<option value="' + VALOR_HORA_PLACEHOLDER + '">' + VALOR_HORA_PLACEHOLDER_LABEL + '</option>' +
        valores
            .map((valor) => '<option value="' + valor + '">' + formatValorHoraLabel(valor) + '</option>')
            .join('') +
        '<option value="' + VALOR_HORA_PERSONALIZADO + '">' + VALOR_HORA_PERSONALIZADO_LABEL + '</option>';

    const disponible = seleccionPrevia === VALOR_HORA_PERSONALIZADO ||
        valores.some((valor) => String(valor) === seleccionPrevia);

    select.value = disponible ? seleccionPrevia : VALOR_HORA_PLACEHOLDER;

    return valores;
}

/**
 * Asegura que un valor de hora exista entre las opciones del selector.
 * Se usa al editar un registro guardado con un valor que ya no está
 * configurado, para no perder el dato original. Los valores que no son
 * enteros dentro del rango configurable usan la opción "Otro valor...".
 *
 * @param {HTMLSelectElement} select - Selector de valor de hora
 * @param {number|string} valor - Valor de hora a asegurar
 */
export function ensureValorHoraOption(select, valor) {
    if (!select) return;

    const numero = normalizarValorHora(valor);
    if (numero === null) return;

    if (select.querySelector('option[value="' + numero + '"]')) return;

    const option = document.createElement('option');
    option.value = String(numero);
    option.textContent = formatValorHoraLabel(numero);

    // Se inserta antes de "Otro valor..." para mantener el orden de la lista
    const personalizada = select.querySelector('option[value="' + VALOR_HORA_PERSONALIZADO + '"]');

    if (personalizada) {
        select.insertBefore(option, personalizada);
    } else {
        select.appendChild(option);
    }
}
