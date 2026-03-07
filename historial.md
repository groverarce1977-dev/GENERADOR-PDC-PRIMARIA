# Historial de Proyecto: Generador de PDC Inteligente (Primaria Exclusivo)

Este archivo contiene el contexto del proyecto tras la reestructuración radical realizada el 7 de marzo de 2026.

## Estado del Proyecto (Actualizado al 7 de marzo de 2026)
- **Nivel:** Exclusivo EDUCACIÓN PRIMARIA COMUNITARIA VOCACIONAL.
- **Contenidos:** Currículo actualizado de 1ro a 6to de Primaria (Base de datos completa en `curriculumData.ts`).
- **Lógica Pedagógica:** 12 temas por trimestre (4 por mes), integración de Lengua Originaria (LO) y Lengua Extranjera (LE) en cada trimestre, y progresión de dificultad de menor a mayor.
- **Interfaz:** Limpia y minimalista. Se eliminaron barras laterales, selectores de otros niveles y botones innecesarios (Ejemplos 2023, Plantilla Excel).

## Cambios Realizados Hoy
1.  **Limpieza Radical:** Eliminación de todos los archivos y lógicas relacionadas con Inicial, Secundaria y Multigrado.
2.  **Actualización de Base de Datos:** Carga manual y desglosada de los contenidos oficiales de 1ro a 6to de Primaria.
3.  **Rediseño de UI:** La aplicación ahora abre directamente en el entorno de trabajo de Primaria.
4.  **Optimización de Exportación:** El generador de Word (`wordGenerator.ts`) fue simplificado para el formato único de Primaria.
5.  **Sincronización IA:** Los prompts de Gemini fueron ajustados para enfocarse 100% en la pedagogía de Primaria (Ley 070).

## Estructura de Archivos Actual
- `src/App.tsx`: Interfaz principal y lógica de estado.
- `src/curriculumData.ts`: Base de datos maestra de contenidos (1ro-6to Primaria).
- `src/types.ts`: Definiciones de tipos exclusivas para Primaria.
- `src/services/wordGenerator.ts`: Generador de documentos Word.
- `src/services/geminiService.ts`: Integración con IA Gemini.

## Instrucciones para Continuar
El sistema está listo para generar PDCs profesionales de Primaria. Para usarlo, simplemente selecciona el grado y las áreas en la pestaña "Generador de Prompt IA" o trabaja directamente en el "Editor Manual".
