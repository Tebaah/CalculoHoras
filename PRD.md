# Documento de Requisitos del Producto (PRD)

## Cálculo de Horas v2.4.0

---

## 1. Resumen Ejecutivo

### 1.1 Propósito

**Cálculo de Horas** es una aplicación web para calcular el costo de servicios de arriendo de maquinaria (grúas y equipos) en función de las horas trabajadas por el personal, considerando diferentes tipos de jornada, recargos legales, horas mínimas garantizadas y descuentos por colación. Está orientada a administradores de facturación de "Multiservice F.L. Ltda.", una empresa chilena de servicios de maquinaria.

### 1.2 Problema que resuelve

El cálculo manual de servicios con distintos tipos de recargo (horas normales vs. con recargo según día y horario) es complejo y propenso a errores. Esta herramienta automatiza el proceso, asegurando consistencia en los cálculos y generando documentación para cobro (liquidaciones en PDF con IVA).

### 1.3 Usuarios objetivo

- Administradores de facturación / jefes de servicio
- Personal administrativo que elabora liquidaciones de pago
- Cualquier usuario que necesite calcular costos de servicios con reglas horarias chilenas

---

## 2. Funcionalidades

### 2.1 Página de Inicio (`index.html`)

- Pantalla de bienvenida con navegación mediante tarjetas hacia las demás secciones.
- Sidebar de navegación presente en toda la aplicación.

### 2.2 Órdenes de Trabajo (`ordenes.html`)

Cálculo individual por día de servicio.

**Campos del formulario:**
| Campo | Descripción | Valores |
|-------|-------------|---------|
| Índice | Identificador único de la orden (ej. nombre del cliente) | Texto libre |
| Fecha | Fecha del servicio | Selector de fecha |
| Tipo de día | Clasificación automática según fecha | Normal / Sábado / Domingo-Festivo |
| Horas mínimas | Garantía de horas mínimas a cobrar | 0, 5, 6, 8, 9 horas |
| % Recargo | Porcentaje de recargo sobre valor hora base | Configurables desde Configuración (por defecto 0%, 10%, 20%, 30%) |
| Hora inicio | Hora de comienzo del servicio | HH:MM |
| Hora término | Hora de fin del servicio | HH:MM |
| Valor hora | Tarifa por hora (CLP) | Valores predefinidos o personalizado |
| Colación | Minutos de descanso | 0, 15, 30, 45, 60 min |
| Tramo colación | Dónde se descuenta la colación | Sin recargo / Con recargo |

**Funcionalidades adicionales:**
- Guardar orden en historial (localStorage)
- Modo edición: recibe datos desde el historial vía `?editar=<indice>`
- Validación de formulario antes de calcular

### 2.3 Reportes Semanales (`reportes.html`)

Cálculo consolidado de lunes a domingo.

**Campos del formulario:**
- **Globales:** índice, valor hora, horas mínimas, % recargo (se aplican a los 7 días)
- **Por día (7 filas, Lun-Dom):**
  - Fecha (al cambiar el lunes se auto-rellenan los demás días)
  - Tipo de día (auto-detectado)
  - Hora inicio / Hora término
  - Colación (minutos y tramo)

**Funcionalidades adicionales:**
- Al menos un día debe tener datos completos para calcular
- Una vez ingresados los tres datos de un día (hora de inicio, hora de término y colación), un modal pregunta si se desea repetir el mismo horario en el día siguiente; la consulta se encadena día a día hasta que el usuario responde que no
- Los horarios repetidos quedan editables: cualquier día puede ajustarse manualmente antes de calcular
- Totales agregados de toda la semana (horas sin recargo, con recargo, monto total)
- Guardar reporte completo en historial

### 2.4 Estados de Pago / Liquidaciones (`pagos.html`)

Agrupación de órdenes y reportes existentes para generar un comprobante de liquidación formal.

**Funcionalidades:**
- Búsqueda de registros existentes por índice para agregarlos al estado de pago
- No se pueden agregar recursivamente otros estados de pago
- Agregar costos extra:
  - Tipos predefinidos: Traslado de contrapesos, Traslado de equipo, Plan de izaje, Otros
  - Cantidad y precio unitario por cada costo
- Cálculo automático de totales con IVA (19%)
- **Logo de empresa:** URL configurable, persistida en localStorage

**Impresión de PDF (Comprobante de Liquidación de Servicios):**
- Documento formal con membrete "Multiservice F.L. Ltda."
- Tabla detallada por cada jornada incluida
- Tabla resumen: horas sin recargo, horas con recargo, costos extra, subtotal neto, IVA, total
- Pie de página con datos de la empresa y condiciones de pago (plazo de 8 días para observaciones)
- Disparo automático del diálogo de impresión del navegador

### 2.5 Historial (`historial.html`)

CRUD completo de todos los registros almacenados.

**Funcionalidades:**
- Tabla con columnas: índice, tipo, fecha, horas sin recargo, horas con recargo, monto total
- Filtros:
  - Búsqueda por texto (índice)
  - Filtro por tipo (Orden / Reporte / Pago)
- Acciones por fila:
  - **Ver:** despliega detalle completo debajo de la tabla
  - **Editar:** guarda el registro en sessionStorage y redirige a la página correspondiente con `?editar=<indice>`
  - **Eliminar:** confirmación y eliminación del registro
- **Exportar:** descarga todos los registros como archivo JSON
- **Importar:** carga archivo JSON, mergea con registros existentes (actualiza si coincide índice, agrega si es nuevo)

---

## 3. Reglas de Negocio

### 3.1 Rangos horarios por tipo de día

| Tipo de día | Horas sin recargo | Horas con recargo |
|-------------|-------------------|-------------------|
| Normal (Lun-Vie) | 07:00 – 18:00 | 18:00 – 07:00 |
| Sábado | 07:00 – 13:00 | 13:00 – 07:00 |
| Domingo / Festivo | Ninguna | Todo el día |

### 3.2 Horas dobles de operador

Usado para tracking interno del personal.

| Tipo de día | Horas dobles |
|-------------|-------------|
| Normal (Lun-Vie) | Antes de 07:00 + Después de 19:00 |
| Sábado | Antes de 07:00 + Después de 13:00 |
| Domingo / Festivo | Todo el día |

### 3.3 Algoritmo de cálculo de servicio

1. **Calcular minutos base por tipo de día:** intersección del rango [hora inicio, hora término] con los rangos sin/con recargo del tipo de día.
2. **Aplicar colación:** restar minutos de colación del tramo seleccionado (sin recargo o con recargo). El resultado no puede ser negativo.
3. **Aplicar horas mínimas:** si el total de minutos trabajados es menor al umbral de horas mínimas, la diferencia se agrega según:
   - Domingo/Festivo: siempre a horas con recargo
   - Otros días: si la hora de inicio cae en rango sin recargo → se agrega a sin recargo; si no → a con recargo
4. **Recargo 0%:** si el porcentaje de recargo es 0, todas las horas con recargo se mueven a sin recargo.
5. **Cálculo monetario:**
   - `valorConRecargo = valorHora × (1 + recargoPorcentaje / 100)`
   - `montoSinRecargo = horasSinRecargo × valorHora`
   - `montoConRecargo = horasConRecargo × valorConRecargo`
   - `montoTotal = montoSinRecargo + montoConRecargo`

### 3.4 Manejo de jornadas nocturnas (trasnoche)

El algoritmo soporta jornadas que cruzan medianoche mediante matemática modular (minutos desde medianoche, 0-1440). Si el rango cruza medianoche, se divide en dos sub-rangos para el cálculo correcto.

### 3.5 Totales en estados de pago

- Las horas y montos se agrupan por valor hora para el resumen
- IVA = 19% sobre el subtotal neto (monto total + costos extra)
- Total final = subtotal neto + IVA

---

## 4. Arquitectura Técnica

### 4.1 Stack tecnológico

| Capa | Tecnología |
|------|-----------|
| Frontend | HTML5, CSS3, Vanilla JavaScript (ES Modules) |
| Build | Vite 6.3.5 (única devDependency) |
| Persistencia | localStorage del navegador |
| Dependencias runtime | **Ninguna** (zero dependencies) |

### 4.2 Arquitectura limpia (Clean Architecture)

```
src/
├── core/           # Lógica de dominio pura (sin DOM, sin store/UI)
│   ├── constants.js
│   ├── entities/       # Entidad WorkDay
│   ├── use-cases/      # calculateService, calculateOperator, calculateDay
│   └── utils/          # timeUtils, dateUtils, formatUtils
├── store/          # Estado global + persistencia
│   ├── store.js         # Singleton Observer pattern
│   ├── actions/         # calculatorActions
│   └── storageManager.js # localStorage CRUD + export/import
├── ui/             # DOM, eventos, renderizado
│   ├── components/      # sidebar, recargoSelect, confirmModal
│   ├── pages/           # ordenes, reportes, pagos, historial
│   └── render/          # renderResults, renderReport
```

**Regla de dependencia:** `core/` nunca debe importar de `store/` ni de `ui/`.

### 4.3 Estructura de páginas

5 archivos HTML de entrada (no templados), cada uno con un JS entry point correspondiente:

| HTML | JS Entry | Módulo UI |
|------|----------|-----------|
| `index.html` | `src/index.js` | - |
| `ordenes.html` | `src/ordenes.js` | `src/ui/pages/ordenes.js` |
| `reportes.html` | `src/reportes.js` | `src/ui/pages/reportes.js` |
| `pagos.html` | `src/pagos.js` | `src/ui/pages/pagos.js` |
| `historial.html` | `src/historial.js` | `src/ui/pages/historial.js` |

### 4.4 Comunicación entre páginas

- `sessionStorage` con clave `editarRegistro` para pasar datos entre historial y las páginas de edición
- Parámetro URL `?editar=<indice>` para activar el modo edición

### 4.5 Persistencia

- **localStorage:** clave `calculoHoras_records` (array JSON con todos los registros)
- **localStorage:** clave `calculoHoras_logoUrl` (URL del logo de empresa para pagos)
- **sessionStorage:** clave `editarRegistro` (registro en edición, temporal)

---

## 5. Modelo de Datos

### 5.1 Registro tipo Orden

```json
{
  "indice": "string",
  "tipo": "orden",
  "fecha": "YYYY-MM-DD",
  "horaInicio": "HH:MM",
  "horaTermino": "HH:MM",
  "colacion": 0-60,
  "colacionTramo": "sinRecargo" | "conRecargo",
  "tipoDia": "normal" | "sabado" | "domingoFestivo",
  "valorHora": "number (CLP)",
  "horasMinimas": 0-9,
  "recargoPorcentaje": 0-200,
  "horasSinRecargo": "number",
  "horasConRecargo": "number",
  "montoTotal": "number (CLP)",
  "timestamp": "milliseconds"
}
```

### 5.2 Registro tipo Reporte

```json
{
  "indice": "string",
  "tipo": "reporte",
  "valorHora": "number",
  "horasMinimas": "number",
  "recargoPorcentaje": "number",
  "dias": [
    {
      "dia": "lunes" | "martes" | ... | "domingo",
      "tipoDia": "string",
      "fecha": "YYYY-MM-DD",
      "horaInicio": "HH:MM",
      "horaTermino": "HH:MM",
      "colacion": "number",
      "colacionTramo": "string",
      "horasSinRecargo": "number",
      "horasConRecargo": "number",
      "horasTotales": "number"
    }
  ],
  "totales": {
    "horasSinRecargo": "number",
    "horasConRecargo": "number",
    "horasNormalesOp": "number",
    "horasDobles": "number",
    "montoTotal": "number"
  },
  "timestamp": "milliseconds"
}
```

### 5.3 Registro tipo Pago (Estado de Pago / Liquidación)

```json
{
  "indice": "string",
  "tipo": "pago",
  "items": [ "copia de registros orden/reporte" ],
  "costos": [
    {
      "tipo": "trasladoContrapesos" | "trasladoEquipo" | "planIzaje" | "otros",
      "cantidad": "number",
      "valor": "number (CLP)"
    }
  ],
  "totales": {
    "totalSinRecargo": "number",
    "totalConRecargo": "number",
    "totalMonto": "number",
    "detalleItems": [
      {
        "indice": "string",
        "tipo": "string",
        "horasSinRecargo": "number",
        "horasConRecargo": "number",
        "valorHora": "number",
        "valorConRecargo": "number",
        "recargoPorcentaje": "number",
        "monto": "number"
      }
    ]
  },
  "timestamp": "milliseconds"
}
```

---

## 6. Interfaz de Usuario

### 6.1 Diseño general

- Sidebar de navegación fijo a la izquierda con enlaces a todas las secciones
- Resalta la página activa
- Paleta de colores consistente mediante variables CSS (`--c-primary`, `--c-sidebar`, etc.)
- Todo el texto en español
- Moneda: CLP (peso chileno), formato `es-CL`, montos redondeados al entero más cercano

### 6.2 CSS modular

Sistema de cascada en `css/main.css` con orden de importación:
1. `base/` — variables, reset, tipografía
2. `layouts/` — sidebar, estructura de página
3. `components/` — formularios, botones, tablas
4. `pages/` — estilos específicos por página

### 6.3 Estados

- Campos requeridos con validación visual
- Modo edición: formulario pre-rellenado desde datos guardados
- Resultados visibles inmediatamente tras calcular
- Confirmaciones para acciones destructivas (eliminar)
- Modal de confirmación para repetir el horario del reporte en el día siguiente (se encadena hasta responder que no)

---

## 7. Requisitos No Funcionales

### 7.1 Rendimiento
- Cero dependencias externas en runtime
- Cálculos síncronos en el cliente, sin llamadas al servidor
- Persistencia local, sin latencia de red

### 7.2 Compatibilidad
- Navegadores modernos con soporte para ES Modules y localStorage
- Sin requisitos de servidor (SPA estática servible desde cualquier host)

### 7.3 Mantenibilidad
- Arquitectura limpia con separación estricta de capas
- Lógica de dominio aislada en `core/`, sin acoplamiento a UI ni almacenamiento
- Código vanilla JS sin frameworks, minimizando deuda técnica

### 7.4 Portabilidad
- Build con Vite a directorio `dist/` con HTML, JS y CSS estáticos
- Desplegable en cualquier servidor web estático o CDN

---

## 8. Flujos de Trabajo

### 8.1 Crear una orden de trabajo
1. Navegar a "Órdenes de Trabajo"
2. Ingresar índice, fecha, tipo de día (auto-detectado), horas mínimas, % recargo, horas, valor hora, colación
3. Hacer clic en "Calcular"
4. Revisar resultados (horas sin/con recargo, montos)
5. Opcionalmente guardar en historial

### 8.2 Crear un reporte semanal
1. Navegar a "Reportes Semanales"
2. Ingresar índice, valor hora, horas mínimas, % recargo
3. Seleccionar fecha del lunes
4. Completar cada día trabajado: al ingresar hora de inicio, hora de término y colación, el modal pregunta si se desea repetir el horario en el día siguiente y sigue consultando hasta responder que no
5. Ajustar manualmente los días que lo requieran
6. Hacer clic en "Calcular"
7. Revisar totales semanales
8. Opcionalmente guardar en historial

### 8.3 Crear una liquidación
1. Navegar a "Pagos"
2. Opcionalmente configurar URL del logo de empresa
3. Buscar y agregar órdenes/reportes existentes por índice
4. Opcionalmente agregar costos extra
5. Revisar totales con IVA
6. Imprimir PDF del comprobante de liquidación
7. Opcionalmente guardar en historial

### 8.4 Gestionar historial
1. Navegar a "Historial"
2. Usar filtros para encontrar registros
3. Ver detalle, editar, o eliminar según necesidad
4. Exportar/importar datos JSON para respaldo o migración

---

## 9. Limitaciones Conocidas

- Los datos se almacenan exclusivamente en localStorage del navegador (sin backend ni sincronización)
- La edición de reportes y estados de pago desde el historial puede tener limitaciones (no se regeneran cálculos automáticamente)
- Sin autenticación ni multi-usuario
- Sin soporte offline explícito (depende del almacenamiento local del navegador)
- Los festivos deben ser seleccionados manualmente como "Domingo/Festivo" (no hay integración con calendario de feriados)

---

## 10. Glosario

| Término | Definición |
|---------|-----------|
| **Colación** | Período de descanso/almuerzo que se descuenta de las horas trabajadas |
| **Recargo** | Porcentaje adicional sobre el valor hora base, aplicado a horas fuera del horario normal |
| **Sin recargo** | Horas dentro del horario normal, facturadas al valor hora base |
| **Con recargo** | Horas fuera del horario normal, facturadas con el porcentaje de recargo adicional |
| **Horas mínimas** | Garantía de horas a cobrar: si se trabajó menos, se cobra el mínimo igual |
| **Horas dobles** | Horas del operador fuera del horario estándar (tracking interno) |
| **Índice** | Identificador único del registro (típicamente nombre del cliente o referencia) |
| **Trasnoche** | Jornada que comienza un día y termina el día siguiente (cruza medianoche) |
| **IVA** | Impuesto al Valor Agregado (19% en Chile) |
| **CLP** | Peso chileno, moneda de curso legal en Chile |
