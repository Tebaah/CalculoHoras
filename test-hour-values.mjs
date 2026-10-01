/**
 * test-hour-values.mjs - Pruebas de la configuración de valores de hora normal
 * Ejecutar: node test-hour-values.mjs
 */

// Stub mínimo de localStorage para ejecutar el store fuera del navegador
const almacen = new Map();
globalThis.localStorage = {
    getItem: (clave) => (almacen.has(clave) ? almacen.get(clave) : null),
    setItem: (clave, valor) => almacen.set(clave, String(valor)),
    removeItem: (clave) => almacen.delete(clave),
    clear: () => almacen.clear(),
};

const {
    VALORES_HORA_POR_DEFECTO,
    VALOR_HORA_MINIMO,
    VALOR_HORA_MAXIMO,
    formatValorHoraLabel,
    normalizarValorHora,
    normalizarValoresHora,
} = await import('./src/core/constants.js');

const {
    getValoresHora,
    setValoresHora,
    addValorHora,
    removeValorHora,
    resetValoresHora,
} = await import('./src/store/configManager.js');

let ok = true;

function check(nombre, condicion, detalle) {
    console.log((condicion ? 'PASS' : 'FAIL') + ' | ' + nombre + (condicion ? '' : ' -> ' + detalle));
    if (!condicion) ok = false;
}

// ── Etiquetas visibles ─────────────────────────────────────────
check('formato CLP 95000', formatValorHoraLabel(95000) === '$95.000', formatValorHoraLabel(95000));
check('formato CLP 1000000', formatValorHoraLabel(1000000) === '$1.000.000', formatValorHoraLabel(1000000));
check('valor no numérico devuelve el texto original',
    formatValorHoraLabel('abc') === 'abc', formatValorHoraLabel('abc'));

// ── Normalización individual ───────────────────────────────────
check('acepta entero dentro del rango', normalizarValorHora(95000) === 95000, normalizarValorHora(95000));
check('acepta string numérico', normalizarValorHora('120000') === 120000, normalizarValorHora('120000'));
check('acepta el valor mínimo', normalizarValorHora(VALOR_HORA_MINIMO) === VALOR_HORA_MINIMO, normalizarValorHora(VALOR_HORA_MINIMO));
check('rechaza decimales', normalizarValorHora(95000.5) === null, normalizarValorHora(95000.5));
check('rechaza 0', normalizarValorHora(0) === null, normalizarValorHora(0));
check('rechaza negativos', normalizarValorHora(-95000) === null, normalizarValorHora(-95000));
check('rechaza sobre el máximo', normalizarValorHora(VALOR_HORA_MAXIMO + 1) === null, normalizarValorHora(VALOR_HORA_MAXIMO + 1));
check('rechaza texto', normalizarValorHora('abc') === null, normalizarValorHora('abc'));
check('rechaza vacío, null y undefined',
    normalizarValorHora('') === null && normalizarValorHora(null) === null && normalizarValorHora(undefined) === null,
    'valor inesperado');

// ── Normalización de listas ────────────────────────────────────
check('ordena de menor a mayor',
    JSON.stringify(normalizarValoresHora([120000, 95000, 110000])) === JSON.stringify([95000, 110000, 120000]),
    JSON.stringify(normalizarValoresHora([120000, 95000, 110000])));
check('elimina duplicados',
    JSON.stringify(normalizarValoresHora([95000, 95000, '95000'])) === JSON.stringify([95000]),
    JSON.stringify(normalizarValoresHora([95000, 95000, '95000'])));
check('descarta inválidos',
    JSON.stringify(normalizarValoresHora([0, -1, 'abc', null, 12.5, 95000])) === JSON.stringify([95000]),
    JSON.stringify(normalizarValoresHora([0, -1, 'abc', null, 12.5, 95000])));
check('lista vacía se respeta',
    JSON.stringify(normalizarValoresHora([])) === '[]', JSON.stringify(normalizarValoresHora([])));
check('valor que no es lista devuelve lista vacía',
    JSON.stringify(normalizarValoresHora('valor')) === '[]', JSON.stringify(normalizarValoresHora('valor')));

// ── Gestión desde el store ─────────────────────────────────────
check('sin configuración usa los valores por defecto',
    JSON.stringify(getValoresHora()) === JSON.stringify(VALORES_HORA_POR_DEFECTO), JSON.stringify(getValoresHora()));

setValoresHora([120000, 95000]);
check('setValoresHora guarda normalizado',
    JSON.stringify(getValoresHora()) === JSON.stringify([95000, 120000]), JSON.stringify(getValoresHora()));

check('addValorHora agrega',
    JSON.stringify(addValorHora(110000)) === JSON.stringify([95000, 110000, 120000]), JSON.stringify(getValoresHora()));
check('addValorHora ignora duplicados',
    JSON.stringify(addValorHora(110000)) === JSON.stringify([95000, 110000, 120000]), JSON.stringify(getValoresHora()));
check('addValorHora ignora inválidos',
    JSON.stringify(addValorHora('abc')) === JSON.stringify([95000, 110000, 120000]), JSON.stringify(getValoresHora()));

check('removeValorHora elimina',
    JSON.stringify(removeValorHora(110000)) === JSON.stringify([95000, 120000]), JSON.stringify(getValoresHora()));
check('removeValorHora ignora valores inexistentes',
    JSON.stringify(removeValorHora(999999)) === JSON.stringify([95000, 120000]), JSON.stringify(getValoresHora()));

setValoresHora([]);
check('lista vacía se persiste tal cual',
    JSON.stringify(getValoresHora()) === '[]', JSON.stringify(getValoresHora()));

check('resetValoresHora restaura los valores por defecto',
    JSON.stringify(resetValoresHora()) === JSON.stringify(VALORES_HORA_POR_DEFECTO), JSON.stringify(getValoresHora()));

almacen.set('calculoHoras_config', JSON.stringify({ valoresHora: 'no-es-lista' }));
check('configuración corrupta cae a los valores por defecto',
    JSON.stringify(getValoresHora()) === JSON.stringify(VALORES_HORA_POR_DEFECTO), JSON.stringify(getValoresHora()));

console.log(ok ? '\nTODOS LOS TESTS DE VALORES DE HORA PASARON' : '\nHUBO TESTS FALLIDOS');
process.exit(ok ? 0 : 1);
