import { calculateService } from './src/core/use-cases/calculateService.js';
import { TIPOS_DIA } from './src/core/constants.js';

const base = { colacion: 0, colacionTramo: 'sinRecargo', valorHora: 10000, recargoPorcentaje: 30 };

const casos = [
    ['Normal inicio 08:00 sin recargo, diferencia a sin recargo',
        { ...base, startMin: 480, endMin: 600, tipoDia: TIPOS_DIA.NORMAL, horasMinimas: 8 },
        { sin: 8, con: 0 }],
    ['Normal inicio 20:00 con recargo, diferencia a con recargo',
        { ...base, startMin: 1200, endMin: 1320, tipoDia: TIPOS_DIA.NORMAL, horasMinimas: 8 },
        { sin: 0, con: 8 }],
    ['Normal inicio 22:00 cruza medianoche con recargo',
        { ...base, startMin: 1320, endMin: 120, tipoDia: TIPOS_DIA.NORMAL, horasMinimas: 8 },
        { sin: 0, con: 8 }],
    ['Sabado inicio 09:00 sin recargo',
        { ...base, startMin: 540, endMin: 660, tipoDia: TIPOS_DIA.SABADO, horasMinimas: 8 },
        { sin: 8, con: 0 }],
    ['Sabado inicio 14:00 con recargo',
        { ...base, startMin: 840, endMin: 960, tipoDia: TIPOS_DIA.SABADO, horasMinimas: 8 },
        { sin: 0, con: 8 }],
    ['Domingo/Festivo todo a con recargo',
        { ...base, startMin: 600, endMin: 720, tipoDia: TIPOS_DIA.DOMINGO_FESTIVO, horasMinimas: 8 },
        { sin: 0, con: 8 }],
    ['Sin minimo 0 no aplica diferencia',
        { ...base, startMin: 480, endMin: 600, tipoDia: TIPOS_DIA.NORMAL, horasMinimas: 0 },
        { sin: 2, con: 0 }],
];

let ok = true;
for (const [nombre, params, esperado] of casos) {
    const r = calculateService(params);
    const pass = r.horasSinRecargo === esperado.sin && r.horasConRecargo === esperado.con;
    console.log((pass ? 'PASS' : 'FAIL') + ' | ' + nombre);
    console.log('  sin=' + r.horasSinRecargo + ' (esp ' + esperado.sin + '), con=' + r.horasConRecargo + ' (esp ' + esperado.con + '), total=' + r.montoTotal);
    if (!pass) ok = false;
}
console.log(ok ? '\nTODOS LOS TESTS PASARON' : '\nHUBO TESTS FALLIDOS');
process.exit(ok ? 0 : 1);
