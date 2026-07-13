/**
 * sidebar.js - Componente Sidebar
 *
 * Maneja la lógica de navegación y resaltado de página activa.
 */

/**
 * Inicializa el sidebar: resalta la página actual según la URL
 */
export function initSidebar() {
    const currentPath = window.location.pathname.split('/').pop() || 'index.html';

    const navOrdenes = document.getElementById('nav-ordenes');
    const navReportes = document.getElementById('nav-reportes');
    const navPagos = document.getElementById('nav-pagos');
    const navHistorial = document.getElementById('nav-historial');

    if (navOrdenes) {
        navOrdenes.classList.toggle('active', currentPath === 'ordenes.html');
    }
    if (navReportes) {
        navReportes.classList.toggle('active', currentPath === 'reportes.html');
    }
    if (navPagos) {
        navPagos.classList.toggle('active', currentPath === 'pagos.html');
    }
    if (navHistorial) {
        navHistorial.classList.toggle('active', currentPath === 'historial.html');
    }
}
