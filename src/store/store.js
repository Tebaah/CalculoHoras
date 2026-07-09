/**
 * store.js - Estado global de la aplicación (Patrón Observer)
 *
 * Mantiene el estado centralizado y notifica a los suscriptores
 * cuando ocurren cambios.
 */

class Store {
    constructor() {
        this._state = {
            currentPage: 'ordenes',
            lastCalculation: null,
            lastReport: null,
            valorHora: null,
            horasMinimas: 0,
        };
        this._subscribers = new Map();
        this._subscriberId = 0;
    }

    /**
     * Obtiene el estado actual
     * @returns {Object}
     */
    getState() {
        return { ...this._state };
    }

    /**
     * Actualiza parcialmente el estado y notifica
     * @param {Object} updates - Cambios parciales al estado
     */
    setState(updates) {
        this._state = { ...this._state, ...updates };
        this._notify();
    }

    /**
     * Suscribe una función a los cambios de estado
     * @param {Function} callback
     * @returns {number} ID de suscripción
     */
    subscribe(callback) {
        const id = ++this._subscriberId;
        this._subscribers.set(id, callback);
        return id;
    }

    /**
     * Elimina una suscripción
     * @param {number} id
     */
    unsubscribe(id) {
        this._subscribers.delete(id);
    }

    /**
     * Notifica a todos los suscriptores
     * @private
     */
    _notify() {
        const state = this.getState();
        this._subscribers.forEach((callback) => {
            try {
                callback(state);
            } catch (error) {
                console.error('Error en suscriptor del store:', error);
            }
        });
    }
}

// Singleton
export const store = new Store();