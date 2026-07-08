/**
 * workDay.js - Entidad que representa una jornada laboral
 */

import { TIPOS_DIA } from '../constants.js';

export class WorkDay {
    /**
     * @param {Object} data
     * @param {string} data.dia - Identificador del día
     * @param {string} data.tipoDia - Tipo de día (normal, sabado, domingoFestivo)
     * @param {string} data.horaInicio - Hora inicio en HH:MM
     * @param {string} data.horaTermino - Hora término en HH:MM
     * @param {number} data.colacion - Minutos de colación
     * @param {string} data.colacionTramo - 'sinRecargo' | 'conRecargo'
     * @param {number} data.horasMinimas - Horas mínimas exigidas
     * @param {number} data.valorHora - Valor de la hora normal
     */
    constructor(data = {}) {
        this.dia = data.dia || '';
        this.tipoDia = data.tipoDia || TIPOS_DIA.NORMAL;
        this.horaInicio = data.horaInicio || '';
        this.horaTermino = data.horaTermino || '';
        this.colacion = data.colacion || 0;
        this.colacionTramo = data.colacionTramo || 'sinRecargo';
        this.horasMinimas = data.horasMinimas || 0;
        this.valorHora = data.valorHora || 0;
    }

    /**
     * Verifica si el día tiene datos completos para calcular
     * @returns {boolean}
     */
    hasCompleteData() {
        return !!(this.horaInicio && this.horaTermino);
    }

    /**
     * Crea una copia del WorkDay
     * @returns {WorkDay}
     */
    clone() {
        return new WorkDay({
            dia: this.dia,
            tipoDia: this.tipoDia,
            horaInicio: this.horaInicio,
            horaTermino: this.horaTermino,
            colacion: this.colacion,
            colacionTramo: this.colacionTramo,
            horasMinimas: this.horasMinimas,
            valorHora: this.valorHora,
        });
    }
}