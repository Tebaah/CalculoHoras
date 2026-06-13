// Elementos del DOM
const form = document.getElementById('calculatorForm');
const tipoDiaSelect = document.getElementById('tipoDia');
const horaInicioInput = document.getElementById('horaInicio');
const horaTerminoInput = document.getElementById('horaTermino');
const valorHoraSelect = document.getElementById('valorHora');
const customValueGroup = document.getElementById('customValueGroup');
const customValueInput = document.getElementById('customValue');
const colacionSelect = document.getElementById('colacion');
const colacionTramoGroup = document.getElementById('colacionTramoGroup');
const colacionTramoSelect = document.getElementById('colacionTramo');
const errorDiv = document.getElementById('errorMessage');
const resultsDiv = document.getElementById('results');

// Event listeners
form.addEventListener('submit', handleSubmit);
valorHoraSelect.addEventListener('change', (e) => {
    customValueGroup.style.display = e.target.value === 'custom' ? 'block' : 'none';
});
colacionSelect.addEventListener('change', (e) => {
    colacionTramoGroup.style.display = parseInt(e.target.value) > 0 ? 'block' : 'none';
});

/**
 * Maneja el envío del formulario y calcula todos los valores
 */
function handleSubmit(e) {
    e.preventDefault();
    errorDiv.classList.remove('show');
    resultsDiv.classList.remove('show');

    try {
        // Obtener y validar valores del formulario
        const tipoDia = tipoDiaSelect.value;
        const horaInicio = horaInicioInput.value;
        const horaTermino = horaTerminoInput.value;
        let valorHora = valorHoraSelect.value;

        if (!horaInicio || !horaTermino) {
            throw new Error('Por favor ingrese tanto la hora de inicio como la de término.');
        }

        if (valorHora === 'custom') {
            valorHora = parseFloat(customValueInput.value);
            if (!valorHora || valorHora <= 0) {
                throw new Error('Por favor ingrese un valor de hora válido y positivo.');
            }
        } else if (!valorHora) {
            throw new Error('Por favor seleccione un valor de hora.');
        }

        valorHora = parseFloat(valorHora);

        // Validar y obtener minutos
        const { startMin, endMin } = validateInputs(horaInicio, horaTermino);

        // Determinar si el período cruza medianoche
        const cruza_medianoche = endMin < startMin;
        const totalMinutosTrabajados = cruza_medianoche ? (endMin + 1440 - startMin) : (endMin - startMin);

        // Calcular minutos en cada rango horario según el tipo de día
        let minConRecargo, minSinRecargo, minDobles;

        if (tipoDia === 'normal') {
            // Día normal: con recargo 18:00–07:00, dobles antes 07:00 y desde 19:00
            minConRecargo = calculateMinutesInRange(
                startMin, endMin,
                RANGO_CON_RECARGO.inicio,    // 18:00
                RANGO_CON_RECARGO.fin        // 07:00 (cruza medianoche)
            );
            minSinRecargo = totalMinutosTrabajados - minConRecargo;

            const minDoblesManana = calculateMinutesInRange(startMin, endMin, 0, 7 * 60);
            const minDoblesNoche  = calculateMinutesInRange(startMin, endMin, 19 * 60, 24 * 60);
            minDobles = minDoblesManana + minDoblesNoche;

        } else if (tipoDia === 'sabado') {
            // Día sábado: con recargo desde 13:00 (cruza medianoche hasta 07:00), dobles desde 13:00
            minConRecargo = calculateMinutesInRange(
                startMin, endMin,
                13 * 60,    // 13:00
                7 * 60      // 07:00 (cruza medianoche)
            );
            minSinRecargo = totalMinutosTrabajados - minConRecargo;

            const minDoblesManana = calculateMinutesInRange(startMin, endMin, 0, 7 * 60);
            const minDoblesNoche  = calculateMinutesInRange(startMin, endMin, 13 * 60, 24 * 60);
            minDobles = minDoblesManana + minDoblesNoche;

        } else {
            // Día domingo y festivo: todo el tiempo es con recargo y doble
            minConRecargo = totalMinutosTrabajados;
            minSinRecargo = 0;
            minDobles = totalMinutosTrabajados;
        }

        // Aplicar descuento de colación
        const minColacion = parseInt(colacionSelect.value) || 0;
        const colacionTramo = colacionTramoSelect.value || 'sinRecargo';
        let minSinRecargoFinal = minSinRecargo;
        let minConRecargoFinal = minConRecargo;
        if (minColacion > 0) {
            if (colacionTramo === 'sinRecargo') {
                minSinRecargoFinal = Math.max(0, minSinRecargo - minColacion);
            } else {
                minConRecargoFinal = Math.max(0, minConRecargo - minColacion);
            }
        }

        // Horas normales del operador = Total de horas trabajadas
        let minNormalesOp = totalMinutosTrabajados;

        // Descuento de colación en horas del operador (independiente del descuento al servicio)
        if (minColacion > 0) {
            if (colacionTramo === 'sinRecargo') {
                // Opción "sin recargo": descontar solo de horas normales
                minNormalesOp = Math.max(0, minNormalesOp - minColacion);
            } else {
                // Opción "con recargo": descontar de horas normales y también de horas dobles
                minNormalesOp = Math.max(0, minNormalesOp - minColacion);
                minDobles = Math.max(0, minDobles - minColacion);
            }
        }

        // Convertir minutos a horas (con 2 decimales)
        const horasSinRecargo = parseFloat(minutesToHours(minSinRecargoFinal));
        const horasConRecargo = parseFloat(minutesToHours(minConRecargoFinal));
        const horasNormalesOp = parseFloat(minutesToHours(minNormalesOp));
        const horasDobles = parseFloat(minutesToHours(minDobles));

        // Calcular monto del servicio
        // Monto = (horas sin recargo × valor) + (horas con recargo × valor × 1.30)
        const montoSinRecargo = horasSinRecargo * valorHora;
        const montoConRecargo = horasConRecargo * (valorHora * 1.30);
        const montoTotal = montoSinRecargo + montoConRecargo;

        // Actualizar etiquetas de resultado según el tipo de día
        if (tipoDia === 'normal') {
            document.getElementById('labelSinRecargo').textContent = 'Horas sin recargo (07:00 - 18:00)';
            document.getElementById('labelConRecargo').textContent = 'Horas con recargo (18:00 - 07:00)';
            document.getElementById('labelDoblesOp').textContent   = 'Horas dobles del operador (antes 07:00 y después 19:00)';
        } else if (tipoDia === 'sabado') {
            document.getElementById('labelSinRecargo').textContent = 'Horas sin recargo (07:00 - 13:00)';
            document.getElementById('labelConRecargo').textContent = 'Horas con recargo (desde 13:00)';
            document.getElementById('labelDoblesOp').textContent   = 'Horas dobles del operador (desde 13:00)';
        } else {
            document.getElementById('labelSinRecargo').textContent = 'Horas sin recargo';
            document.getElementById('labelConRecargo').textContent = 'Horas con recargo (todo el día)';
            document.getElementById('labelDoblesOp').textContent   = 'Horas dobles del operador (todo el día)';
        }

        // Actualizar elementos de resultado
        document.getElementById('horasSinRecargo').textContent = horasSinRecargo.toFixed(2) + ' h';
        document.getElementById('horasConRecargo').textContent = horasConRecargo.toFixed(2) + ' h';
        document.getElementById('horasNormalesOp').textContent = horasNormalesOp.toFixed(2) + ' h';
        document.getElementById('horasDobles').textContent = horasDobles.toFixed(2) + ' h';
        document.getElementById('montoTotal').textContent = formatCurrency(montoTotal);

        // Mostrar sección de resultados
        resultsDiv.classList.add('show');

    } catch (error) {
        errorDiv.textContent = '❌ ' + error.message;
        errorDiv.classList.add('show');
    }
}