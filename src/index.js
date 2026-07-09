/**
 * index.js - Punto de entrada principal
 *
 * Este archivo es el entry point para index.html (página de inicio).
 * La página de inicio solo muestra el sidebar, sin calculadora activa.
 * Si en el futuro se añade funcionalidad a index.html, se importa aquí.
 */

import { initSidebar } from './ui/components/sidebar.js';

document.addEventListener('DOMContentLoaded', () => {
    initSidebar();
});