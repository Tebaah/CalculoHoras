/**
 * configuracion.js - Lógica de la página "Configuración"
 *
 * Permite configurar el logo de empresa y el número de inicio del
 * correlativo de estados de pago.
 */

import { initSidebar } from '../components/sidebar.js';
import {
    getLogoUrl,
    setLogoUrl,
    removeLogoUrl,
    getIndiceInicioPago,
    setIndiceInicioPago,
} from '../../store/configManager.js';

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

// ── Correlativo ───────────────────────────────────────────────

function mostrarMensaje(texto, tipo) {
    configMessage.textContent = texto;
    configMessage.className = 'config-message' + (tipo ? ' config-message--' + tipo : '');
}

function handleSaveConfig(e) {
    e.preventDefault();

    const valor = parseInt(indiceInicioInput.value.trim(), 10);

    if (!indiceInicioInput.value.trim() || isNaN(valor) || valor < 1) {
        mostrarMensaje('Ingrese un número mayor o igual a 1.', 'error');
        return;
    }

    setIndiceInicioPago(valor);
    mostrarMensaje('Configuración guardada. El correlativo inicia en ' + valor + '.', 'success');
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
}
