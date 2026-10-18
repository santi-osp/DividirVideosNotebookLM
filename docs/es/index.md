# Documentación de Splitly (Español)

Bienvenido a la documentación oficial de **Splitly 2.0**, una aplicación web 100% del lado del cliente para dividir videos por tamaño y extraer audio de alta fidelidad para NotebookLM, Discord y aplicaciones de mensajería.

---

## Secciones de la documentación

1. [Primeros Pasos](primeros-pasos.md) — Cómo usar Splitly de inmediato vía web o servidor local.
2. [Guía de Usuario](guia-de-usuario.md) — Instrucciones paso a paso para dividir videos, extraer audio y configurar presets.
3. [Preguntas Frecuentes (FAQ)](preguntas-frecuentes.md) — Privacidad, límites, optimización para NotebookLM y seguridad de archivos.
4. [Solución de Problemas](solucion-de-problemas.md) — Resolución de consumo de memoria, formatos no compatibles y problemas de navegador.
5. [Arquitectura](arquitectura.md) — Ejecución WebAssembly, ciclo de vida del worker y gestión de colas.
6. [Desarrollo](desarrollo.md) — Entorno de desarrollo local, pruebas unitarias y compilación para producción.

---

## Principios fundamentales

- **Privacidad 100% del lado del cliente**: Los archivos se procesan en la memoria local de tu navegador mediante WebAssembly. Cero bytes de video se envían a servidores externos.
- **Optimizado para NotebookLM**: Convierte grabaciones pesadas de varias horas en archivos de audio M4A ultraligeros que caben en una sola fuente de NotebookLM.
- **División rápida por tamaño**: Divide videos respetando los límites de diferentes plataformas (16 MB, 25 MB, 64 MB, 190 MB o tamaño personalizado).
