/**
 * storageManager.js - Gestor de almacenamiento local (localStorage)
 *
 * Permite guardar, recuperar y eliminar registros de cálculo
 * usando localStorage con persistencia.
 */

const STORAGE_KEY = 'calculoHoras_records';

/**
 * Obtiene todos los registros almacenados
 * @returns {Array<Object>}
 */
function getAllRecords() {
    try {
        const data = localStorage.getItem(STORAGE_KEY);
        return data ? JSON.parse(data) : [];
    } catch (error) {
        console.error('Error al leer registros:', error);
        return [];
    }
}

/**
 * Guarda todos los registros en localStorage
 * @param {Array<Object>} records
 */
function saveAllRecords(records) {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
    } catch (error) {
        console.error('Error al guardar registros:', error);
        throw new Error('No se pudieron guardar los registros. El almacenamiento podría estar lleno.');
    }
}

/**
 * Guarda un nuevo registro
 * @param {Object} record - Datos del registro a guardar
 * @returns {Object} Registro guardado
 */
export function saveRecord(record) {
    if (!record.indice || String(record.indice).trim() === '') {
        throw new Error('Debe ingresar un índice para guardar el registro.');
    }

    const records = getAllRecords();

    // Verificar si el índice ya existe
    const existingIndex = records.findIndex(r => r.indice === record.indice);
    if (existingIndex !== -1) {
        // Actualizar registro existente
        records[existingIndex] = { ...records[existingIndex], ...record, timestamp: Date.now() };
    } else {
        // Agregar nuevo registro
        record.timestamp = Date.now();
        records.push(record);
    }

    saveAllRecords(records);
    return record;
}

/**
 * Busca registros por índice
 * @param {string} indice - Índice a buscar
 * @returns {Array<Object>} Registros encontrados
 */
export function getRecordByIndex(indice) {
    const records = getAllRecords();
    return records.filter(r => String(r.indice).includes(String(indice)));
}

/**
 * Obtiene el resumen de todos los registros (sin datos detallados)
 * @returns {Array<Object>} Lista resumida de registros
 */
export function getRecordsSummary() {
    const records = getAllRecords();
    return records.map(r => ({
        indice: r.indice,
        tipo: r.tipo,
        fecha: r.fecha || (r.dias && r.dias.length > 0 ? r.dias[0].fecha : ''),
        horasSinRecargo: r.horasSinRecargo || r.totales?.horasSinRecargo || 0,
        horasConRecargo: r.horasConRecargo || r.totales?.horasConRecargo || 0,
        montoTotal: r.montoTotal || r.totales?.montoTotal || 0,
        timestamp: r.timestamp,
        numDias: r.tipo === 'reporte' ? (r.dias ? r.dias.length : 0) : 1,
    }));
}

/**
 * Elimina un registro por su índice
 * @param {string} indice
 * @returns {boolean} true si se eliminó, false si no existía
 */
export function deleteRecord(indice) {
    const records = getAllRecords();
    const filtered = records.filter(r => r.indice !== indice);

    if (filtered.length === records.length) {
        return false;
    }

    saveAllRecords(filtered);
    return true;
}

/**
 * Obtiene un registro completo por su índice
 * @param {string} indice
 * @returns {Object|null}
 */
export function getRecordDetail(indice) {
    const records = getAllRecords();
    return records.find(r => r.indice === indice) || null;
}

/**
 * Exporta todos los registros como JSON (descarga de archivo)
 */
export function exportRecordsToJSON() {
    const records = getAllRecords();

    if (records.length === 0) {
        throw new Error('No hay registros para exportar.');
    }

    const dataStr = JSON.stringify(records, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    const date = new Date().toISOString().slice(0, 10);
    link.download = `calculo-horas-export-${date}.json`;
    link.href = url;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

/**
 * Importa registros desde un archivo JSON
 * @param {File} file - Archivo JSON a importar
 * @returns {Object} Resultado de la importación
 */
export function importRecordsFromJSON(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = (e) => {
            try {
                const data = JSON.parse(e.target.result);

                if (!Array.isArray(data)) {
                    reject(new Error('El archivo JSON debe contener un arreglo de registros.'));
                    return;
                }

                if (data.length === 0) {
                    reject(new Error('El archivo JSON no contiene registros.'));
                    return;
                }

                // Validar estructura básica
                const validRecords = data.every(r => r.indice && r.tipo);
                if (!validRecords) {
                    reject(new Error('Algunos registros no tienen la estructura válida (falta índice o tipo).'));
                    return;
                }

                const existingRecords = getAllRecords();
                let imported = 0;
                let updated = 0;

                data.forEach((record) => {
                    record.timestamp = Date.now();
                    const existingIndex = existingRecords.findIndex(r => r.indice === record.indice);
                    if (existingIndex !== -1) {
                        existingRecords[existingIndex] = record;
                        updated++;
                    } else {
                        existingRecords.push(record);
                        imported++;
                    }
                });

                saveAllRecords(existingRecords);
                resolve({ imported, updated, total: data.length });

            } catch (parseError) {
                reject(new Error('Error al procesar el archivo JSON: ' + parseError.message));
            }
        };

        reader.onerror = () => {
            reject(new Error('Error al leer el archivo.'));
        };

        reader.readAsText(file);
    });
}
