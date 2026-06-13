# ⏱️ Cálculo de Horas

Herramienta web para calcular los costos del servicio de una organización, basada en las horas trabajadas por el personal, considerando distintos tipos de jornada y reglas de recargo.

## 🧠 Problema que Resuelve

En muchas organizaciones, el cálculo de costos de servicios requiere considerar:

- **Días normales, sábados, domingos y festivos**, cada uno con reglas distintas de recargo.
- **Horas sin recargo y con recargo** (recargo del 30% sobre el valor hora base).
- **Horas dobles del operador**, que aplican en horarios específicos (antes de las 07:00, después de las 19:00, o todo el día según el tipo de jornada).
- **Descuentos por colación**, que pueden aplicarse a horas con o sin recargo según se requiera.
- **Jornadas que cruzan la medianoche**, donde el cálculo debe considerar correctamente el paso de un día a otro.
- **Reportes semanales** que consolidan los 7 días de la semana en un solo cálculo con totales generales.

Esta herramienta automatiza todos estos cálculos, evitando errores manuales y entregando resultados precisos al instante.

## 🚀 Funcionalidades

### 📋 Calculadora Individual (Órdenes de Trabajo)
- Selección del tipo de día: Normal, Sábado, o Domingo/Festivo.
- Ingreso de hora de inicio y término (con soporte para jornadas que cruzan medianoche).
- Valor hora seleccionable entre valores predefinidos o personalizado.
- Descuento opcional de tiempo de colación (15, 30, 45 o 60 minutos), aplicable a horas sin recargo o con recargo.
- Cálculo detallado de:
  - Horas sin recargo del servicio.
  - Horas con recargo del servicio (valor hora × 1.30).
  - Horas normales del operador.
  - Horas dobles del operador.
  - Monto total del servicio.

### 📊 Reporte Semanal
- Ingreso de jornada para cada día de la semana (lunes a domingo).
- Cada día se categoriza automáticamente según su tipo (Normal, Sábado, Domingo/Festivo).
- Valor hora global para toda la semana.
- Cálculo consolidado con totales semanales.

## 🛠️ Tecnologías Utilizadas

| Tecnología | Descripción |
|---|---|
| **HTML5** | Estructura de la aplicación (3 páginas: inicio, órdenes, reportes) |
| **CSS3** | Estilos con arquitectura modular: variables, reset, tipografía, layouts, componentes y páginas |
| **JavaScript (Vanilla)** | Lógica de cálculo, manipulación del DOM, manejo de eventos y validaciones |
| **Sin dependencias externas** | Proyecto 100% autónomo, no requiere frameworks ni librerías |

### Estructura del Proyecto

```
📁 CalculoHoras/
├── index.html          # Página de inicio / bienvenida
├── ordenes.html        # Calculadora de horas y costos
├── reportes.html       # Reporte semanal
├── app.js              # Lógica de la calculadora individual
├── reportes.js         # Lógica del reporte semanal
├── shared.js           # Funciones compartidas (cálculos, validaciones, formatos)
├── css/
│   ├── main.css        # Punto de entrada de estilos
│   ├── base/           # Variables, reset, tipografía
│   ├── components/     # Sidebar, formularios, botones, resultados, etc.
│   ├── layouts/        # Estructura de layout principal
│   └── pages/          # Estilos específicos por página
```

## 📖 Reglas de Cálculo

### Servicio
| Tipo | Rango | Factor |
|---|---|---|
| Sin recargo | 07:00 – 18:00 | × 1.0 (valor hora) |
| Con recargo | 18:00 – 07:00 (cruza medianoche) | × 1.30 |

### Operador
| Tipo | Rango |
|---|---|
| Horas normales | Total de horas trabajadas |
| Horas dobles | Antes de las 07:00 y desde las 19:00 |

### Variaciones según tipo de día

| Día | Con recargo desde | Dobles desde |
|---|---|---|
| Normal (lun–vie) | 18:00 | 19:00 y antes 07:00 |
| Sábado | 13:00 | 13:00 |
| Domingo / Festivo | Todo el día | Todo el día |

## 📸 Capturas de Pantalla

### Pantalla de Inicio
![Pantalla de inicio](assets/pantalla%20de%20inicio.png)
Vista principal con el menú lateral y las opciones de navegación.

### Calculadora de Órdenes
![Cálculo de órdenes](assets/calculo%20de%20ordenes.png)
Formulario de cálculo de horas y costos con resultados visibles.

### Reporte Semanal
![Reporte semanal](assets/reporte%20semanal.png)
Reporte semanal con varios días ingresados y totales consolidados.

## 🧑‍💻 Aprendizaje

Este proyecto fue desarrollado como práctica de:

- **JavaScript**: Manipulación del DOM, manejo de eventos (`submit`, `change`), lógica de cálculos con rangos horarios que cruzan medianoche, formateo de moneda y validación de formularios.
- **Estructura de proyecto web**: Separación de responsabilidades en múltiples archivos JavaScript (`app.js` para lógica de órdenes, `reportes.js` para reportes, `shared.js` para funciones compartidas).
- **Organización modular de CSS**: Arquitectura de estilos separada en base, componentes, layouts y páginas, con un único punto de entrada (`main.css`) que importa los módulos necesarios.
- **Cálculos horarios**: Implementación de lógica precisa para determinar intersecciones entre rangos de tiempo, incluso cuando cruzan la medianoche, utilizando el sistema de minutos desde medianoche.

## 🚀 Cómo Usar

1. Clona o descarga el repositorio.
2. Abre `index.html` en tu navegador web.
3. Selecciona **Órdenes de Trabajo** para calcular un servicio individual.
4. Selecciona **Reportes** para generar un reporte semanal consolidado.

No requiere instalación de dependencias ni servidor web — funciona directamente en cualquier navegador moderno.

## 📄 Licencia

Este proyecto es de uso libre.