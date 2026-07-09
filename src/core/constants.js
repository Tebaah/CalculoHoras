/**
 * constants.js - Constantes de dominio
 * Rangos horarios, multiplicadores y configuraciones globales
 */

// Rangos horarios en minutos desde medianoche
export const RANGOS = {
    SIN_RECARGO: {
        inicio: 7 * 60,   // 07:00
        fin: 18 * 60,     // 18:00
    },
    CON_RECARGO: {
        inicio: 18 * 60,  // 18:00
        fin: 7 * 60,      // 07:00 (cruza medianoche)
    },
    NORMAL_OPERADOR: {
        inicio: 7 * 60,   // 07:00
        fin: 19 * 60,     // 19:00
    },
    DOBLES_OPERADOR: {
        inicio: 19 * 60,  // 19:00
        fin: 7 * 60,      // 07:00 (cruza medianoche)
    },
};

// Multiplicadores de recargo
export const MULTIPLICADORES = {
    RECARGO: 1.30,        // 30% de recargo (defecto)
    DOBLE: 2.0,           // 100% (doble)
};

// Tipos de día
export const TIPOS_DIA = {
    NORMAL: 'normal',
    SABADO: 'sabado',
    DOMINGO_FESTIVO: 'domingoFestivo',
};

// Valores de hora predefinidos
export const VALORES_HORA_PREDEFINIDOS = [
    95000, 110000, 120000, 140000, 165000,
    190000, 210000, 235000, 260000, 265000,
    290000, 345000, 390000, 460000, 495000,
];

// Opciones de mínimo de horas
export const OPCIONES_HORAS_MINIMAS = [0, 5, 6, 8, 9];

// Opciones de colación
export const OPCIONES_COLACION = [0, 15, 30, 45, 60];

// Opciones de porcentaje de recargo (dinámico)
export const OPCIONES_RECARGO = [
    { value: 0, label: 'Sin recargo' },
    { value: 10, label: '10%' },
    { value: 20, label: '20%' },
    { value: 30, label: '30%' },
];

// Porcentaje de recargo por defecto
export const RECARGO_POR_DEFECTO = 30;

/**
 * Calcula el multiplicador de recargo a partir de un porcentaje
 * @param {number} porcentaje - Porcentaje de recargo (ej: 30 para 30%)
 * @returns {number} Multiplicador (ej: 1.30)
 */
export function getMultiplicadorRecargo(porcentaje) {
    return 1 + (porcentaje / 100);
}

// Nombres de días en español
export const NOMBRES_DIAS = {
    lunes: 'Lunes',
    martes: 'Martes',
    miercoles: 'Miércoles',
    jueves: 'Jueves',
    viernes: 'Viernes',
    sabado: 'Sábado',
    domingo: 'Domingo',
};

// Configuración de los días del reporte semanal
export const DIAS_REPORTE = [
    { id: 'lunes', nombre: 'Lunes', tipo: TIPOS_DIA.NORMAL },
    { id: 'martes', nombre: 'Martes', tipo: TIPOS_DIA.NORMAL },
    { id: 'miercoles', nombre: 'Miércoles', tipo: TIPOS_DIA.NORMAL },
    { id: 'jueves', nombre: 'Jueves', tipo: TIPOS_DIA.NORMAL },
    { id: 'viernes', nombre: 'Viernes', tipo: TIPOS_DIA.NORMAL },
    { id: 'sabado', nombre: 'Sábado', tipo: TIPOS_DIA.SABADO },
    { id: 'domingo', nombre: 'Domingo', tipo: TIPOS_DIA.DOMINGO_FESTIVO },
];