/**
 * test-operator-hours.mjs - Pruebas de horas del operador por tipo de día
 * Ejecutar: node test-operator-hours.mjs
 */

import { calculateOperator } from './src/core/use-cases/calculateOperator.js';
import { TIPOS_DIA } from './src/core/constants.js';

const base = { colacion: 0, colacionTramo: 'sinRecargo' };

const casos = [
    ['Normal 08:00-17:00: sin horas dobles',
        { ...base, startMin: 8 * 60, endMin: 17 * 60, totalMinutos: 9 * 60, tipoDia: TIPOS_DIA.NORMAL },
        { normales: 9, dobles: 0 }],
    ['Normal 20:00-23:00: todo doble',
        { ...base, startMin: 20 * 60, endMin: 23 * 60, totalMinutos: 3 * 60, tipoDia: TIPOS_DIA.NORMAL },
        { normales: 3, dobles: 3 }],
    ['Sábado 08:00-12:00: todo doble',
        { ...base, startMin: 8 * 60, endMin: 12 * 60, totalMinutos: 4 * 60, tipoDia: TIPOS_DIA.SABADO },
        { normales: 4, dobles: 4 }],
    ['Sábado 14:00-18:00: todo doble',
        { ...base, startMin: 14 * 60, endMin: 18 * 60, totalMinutos: 4 * 60, tipoDia: TIPOS_DIA.SABADO },
        { normales: 4, dobles: 4 }],
    ['Sábado 22:00-02:00: cruza medianoche y todo es doble',
        { ...base, startMin: 22 * 60, endMin: 2 * 60, totalMinutos: 4 * 60, tipoDia: TIPOS_DIA.SABADO },
        { normales: 4, dobles: 4 }],
    ['Domingo 08:00-12:00: todo doble',
        { ...base, startMin: 8 * 60, endMin: 12 * 60, totalMinutos: 4 * 60, tipoDia: TIPOS_DIA.DOMINGO_FESTIVO },
        { normales: 4, dobles: 4 }],
];

let ok = true;
for (const [nombre, params, esperado] of casos) {
    const r = calculateOperator(params);
    const pass = r.horasNormalesOp === esperado.normales && r.horasDobles === esperado.dobles;
    console.log((pass ? 'PASS' : 'FAIL') + ' | ' + nombre);
    console.log('  normales=' + r.horasNormalesOp + ' (esp ' + esperado.normales + '), dobles=' + r.horasDobles + ' (esp ' + esperado.dobles + ')');
    if (!pass) ok = false;
}
console.log(ok ? '\nTODOS LOS TESTS PASARON' : '\nHUBO TESTS FALLIDOS');
process.exit(ok ? 0 : 1);
