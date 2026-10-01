/**
 * configuracion.js - Lógica de la página "Configuración"
 *
 * Permite configurar el logo de empresa, el número de inicio del
 * correlativo de estados de pago, los porcentajes de recargo y los
 * mínimos de horas disponibles en Órdenes de Trabajo y Reportes.
 */

import { initSidebar } from '../components/sidebar.js';
import {
    getLogoUrl,
    setLogoUrl,
    removeLogoUrl,
    getIndiceInicioPago,
    setIndiceInicioPago,
    getRecargos,
    addRecargo,
    removeRecargo,
    getHorasMinimas,
    addHorasMinimas,
    removeHorasMinimas,
} from '../../store/configManager.js';
import {
    formatRecargoLabel,
    RECARGO_PORCENTAJE_MAXIMO,
    formatHorasMinimasLabel,
    HORAS_MINIMAS_MAXIMO,
} from '../../core/constants.js';

// Elementos del DOM
const logoUrlInput = document.getElementById('logoUrl');
const cargarLogoBtn = document.getElementById('cargarLogoBtn');
const logoPreview = document.getElementById('logoPreview');
const logoPreviewImg = document.getElementById('logoPreviewImg');
const quitarLogoBtn = document.getElementById('quitarLogoBtn');
const logoError = document.getElementById('logoError');

const configForm = document.getElementById('configForm');
const indiceInicioInput = document.getElementById('indiceInicioPago');
const configMessage = document.getElementById('configMessage');

const recargoForm = document.getElementById('recargoForm');
const nuevoRecargoInput = document.getElementById('nuevoRecargo');
const recargoList = document.getElementById('recargoList');
const recargoMessage = document.getElementById('recargoMessage');

const horasMinimasForm = document.getElementById('horasMinimasForm');
const nuevaHoraMinimaInput = document.getElementById('nuevaHoraMinima');
const horasMinimasList = document.getElementById('horasMinimasList');
const horasMinimasMessage = document.getElementById('horasMinimasMessage');

// ── Logo ──────────────────────────────────────────────────────

function mostrarLogoPreview(url) {
    logoPreviewImg.src = url;
    logoPreview.style.display = 'flex';
}

function ocultarLogoPreview() {
    logoPreviewImg.src = '';
    logoPreview.style.display = 'none';
}

function initLogoManager() {
    const storedUrl = getLogoUrl();
    if (storedUrl) {
        logoUrlInput.value = storedUrl;
        mostrarLogoPreview(storedUrl);
    }
}

function handleCargarLogo() {
    const url = logoUrlInput.value.trim();
    logoError.textContent = '';
    logoError.classList.remove('show');

    if (!url) {
        logoError.textContent = 'Ingrese una URL válida.';
        logoError.classList.add('show');
        return;
    }

    const testImg = new Image();
    testImg.onload = () => {
        setLogoUrl(url);
        mostrarLogoPreview(url);
    };
    testImg.onerror = () => {
        logoError.textContent = 'No se pudo cargar la imagen. Verifique la URL.';
        logoError.classList.add('show');
    };
    testImg.src = url;
}

function handleQuitarLogo() {
    removeLogoUrl();
    logoUrlInput.value = '';
    ocultarLogoPreview();
    logoError.textContent = '';
    logoError.classList.remove('show');
}

// ── Mensajes de estado ────────────────────────────────────────

function mostrarMensaje(elemento, texto, tipo) {
    if (!elemento) return;
    elemento.textContent = texto;
    elemento.className = 'config-message' + (tipo ? ' config-message--' + tipo : '');
}

// ── Correlativo ───────────────────────────────────────────────

function handleSaveConfig(e) {
    e.preventDefault();

    const valor = parseInt(indiceInicioInput.value.trim(), 10);

    if (!indiceInicioInput.value.trim() || isNaN(valor) || valor < 1) {
        mostrarMensaje(configMessage, 'Ingrese un número mayor o igual a 1.', 'error');
        return;
    }

    setIndiceInicioPago(valor);
    mostrarMensaje(configMessage, 'Configuración guardada. El correlativo inicia en ' + valor + '.', 'success');
}

// ── Porcentajes de recargo ────────────────────────────────────

/**
 * Dibuja la lista de porcentajes de recargo configurados.
 * El porcentaje "Sin recargo" (0) siempre está disponible y no se elimina.
 */
function renderRecargos() {
    if (!recargoList) return;

    recargoList.innerHTML = getRecargos().map((porcentaje) => {
        const etiqueta = formatRecargoLabel(porcentaje);

        const accion = porcentaje > 0
            ? '<button type="button" class="recargo-item__remove" data-recargo="' + porcentaje +
            '" title="Eliminar ' + etiqueta + '" aria-label="Eliminar recargo ' + etiqueta + '">&#10005;</button>'
            : '<span class="recargo-item__badge" title="Este valor no se puede eliminar">Fijo</span>';

        return '<li class="recargo-item">' +
            '<span class="recargo-item__label">' + etiqueta + '</span>' +
            accion +
            '</li>';
    }).join('');
}

function handleAddRecargo(e) {
    e.preventDefault();

    const texto = nuevoRecargoInput.value.trim();
    const valor = Number(texto);

    if (!texto || !Number.isInteger(valor) || valor < 0) {
        mostrarMensaje(recargoMessage, 'Ingrese un porcentaje entero igual o mayor a 0.', 'error');
        return;
    }

    if (valor > RECARGO_PORCENTAJE_MAXIMO) {
        mostrarMensaje(recargoMessage,
            'El porcentaje no puede superar el ' + RECARGO_PORCENTAJE_MAXIMO + '%.', 'error');
        return;
    }

    if (getRecargos().includes(valor)) {
        mostrarMensaje(recargoMessage,
            'El recargo ' + formatRecargoLabel(valor) + ' ya está configurado.', 'error');
        return;
    }

    const recargos = addRecargo(valor);
    nuevoRecargoInput.value = '';
    renderRecargos();
    mostrarMensaje(recargoMessage,
        'Recargo ' + formatRecargoLabel(valor) + ' agregado (' + recargos.length + ' disponibles).', 'success');
}

function handleRemoveRecargo(e) {
    const boton = e.target.closest('.recargo-item__remove');
    if (!boton) return;

    const porcentaje = Number(boton.dataset.recargo);
    const recargos = removeRecargo(porcentaje);

    renderRecargos();
    mostrarMensaje(recargoMessage,
        'Recargo ' + formatRecargoLabel(porcentaje) + ' eliminado (' + recargos.length + ' disponibles).', 'success');
}

// ── Mínimos de horas ──────────────────────────────────────────

/**
 * Dibuja la lista de mínimos de horas configurados.
 * El mínimo "Sin mínimo" (0) siempre está disponible y no se elimina.
 */
function renderHorasMinimas() {
    if (!horasMinimasList) return;

    horasMinimasList.innerHTML = getHorasMinimas().map((horas) => {
        const etiqueta = formatHorasMinimasLabel(horas);

        const accion = horas > 0
            ? '<button type="button" class="horas-minimas-item__remove" data-horas="' + horas +
            '" title="Eliminar ' + etiqueta + '" aria-label="Eliminar mínimo de ' + etiqueta + '">&#10005;</button>'
            : '<span class="horas-minimas-item__badge" title="Este valor no se puede eliminar">Fijo</span>';

        return '<li class="horas-minimas-item">' +
            '<span class="horas-minimas-item__label">' + etiqueta + '</span>' +
            accion +
            '</li>';
    }).join('');
}

function handleAddHorasMinimas(e) {
    e.preventDefault();

    const texto = nuevaHoraMinimaInput.value.trim();
    const valor = Number(texto);

    if (!texto || !Number.isInteger(valor) || valor < 0) {
        mostrarMensaje(horasMinimasMessage, 'Ingrese un número entero de horas igual o mayor a 0.', 'error');
        return;
    }

    if (valor > HORAS_MINIMAS_MAXIMO) {
        mostrarMensaje(horasMinimasMessage,
            'El mínimo de horas no puede superar las ' + HORAS_MINIMAS_MAXIMO + ' horas.', 'error');
        return;
    }

    if (getHorasMinimas().includes(valor)) {
        mostrarMensaje(horasMinimasMessage,
            'El mínimo de ' + formatHorasMinimasLabel(valor) + ' ya está configurado.', 'error');
        return;
    }

    const opciones = addHorasMinimas(valor);
    nuevaHoraMinimaInput.value = '';
    renderHorasMinimas();
    mostrarMensaje(horasMinimasMessage,
        'Mínimo de ' + formatHorasMinimasLabel(valor) + ' agregado (' + opciones.length + ' disponibles).', 'success');
}

function handleRemoveHorasMinimas(e) {
    const boton = e.target.closest('.horas-minimas-item__remove');
    if (!boton) return;

    const horas = Number(boton.dataset.horas);
    const opciones = removeHorasMinimas(horas);

    renderHorasMinimas();
    mostrarMensaje(horasMinimasMessage,
        'Mínimo de ' + formatHorasMinimasLabel(horas) + ' eliminado (' + opciones.length + ' disponibles).', 'success');
}

// ── Inicialización ────────────────────────────────────────────

export function initConfiguracionPage() {
    initSidebar();
    initLogoManager();

    const inicio = getIndiceInicioPago();
    if (inicio !== null) {
        indiceInicioInput.value = inicio;
    }

    cargarLogoBtn.addEventListener('click', handleCargarLogo);
    logoUrlInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleCargarLogo();
        }
    });
    quitarLogoBtn.addEventListener('click', handleQuitarLogo);

    configForm.addEventListener('submit', handleSaveConfig);

    renderRecargos();
    recargoForm.addEventListener('submit', handleAddRecargo);
    recargoList.addEventListener('click', handleRemoveRecargo);

    renderHorasMinimas();
    horasMinimasForm.addEventListener('submit', handleAddHorasMinimas);
    horasMinimasList.addEventListener('click', handleRemoveHorasMinimas);
}
