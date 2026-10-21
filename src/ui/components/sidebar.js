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

    const navServicios = document.getElementById('nav-servicios');
    const navPagos = document.getElementById('nav-pagos');
    const navHistorialPagos = document.getElementById('nav-historial-pagos');
    const navHistorial = document.getElementById('nav-historial');
    const navConfiguracion = document.getElementById('nav-configuracion');

    if (navServicios) {
        navServicios.classList.toggle('active', currentPath === 'servicios.html');
    }
    if (navPagos) {
        navPagos.classList.toggle('active', currentPath === 'pagos.html');
    }
    if (navHistorialPagos) {
        navHistorialPagos.classList.toggle('active', currentPath === 'historial-pagos.html');
    }
    if (navHistorial) {
        navHistorial.classList.toggle('active', currentPath === 'historial.html');
    }
    if (navConfiguracion) {
        navConfiguracion.classList.toggle('active', currentPath === 'configuracion.html');
    }
}
