# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

PWA en HTML/CSS/JS sin framework: archivos estáticos, manifest y service worker, sin paso de compilación. Lo eligió el usuario.

## Users

Fisioterapeutas y clínicos de rehabilitación, durante la consulta. El paciente cuenta dónde le duele y el clínico elige esa zona del cuerpo para ver qué opciones de rehabilitación hay. Después le enseña al paciente los vídeos de ejercicios en su propia pantalla, en ese mismo momento.

El paciente ve la pantalla pero no maneja la app.

## Product Purpose

Llevar al clínico de "me duele aquí" a "estos son los ejercicios, mira cómo se hacen" en pocos toques y sin salir de la consulta. Tiene éxito cuando el clínico encuentra rápido las opciones de una zona y puede enseñar el vídeo adecuado sin que la conversación se corte.

## Positioning

Es una herramienta de apoyo a la valoración clínica que se organiza por partes del cuerpo. Se entra por la zona que le duele al paciente, no por un catálogo de ejercicios ni por un programa para hacer en casa.

## Operating Context

- Se usa en directo, en la consulta, con el paciente delante mirando la misma pantalla.
- La parte del cuerpo se elige a partir de lo que dice el paciente, de dos formas que llevan al mismo sitio: una silueta del cuerpo (de frente y de espaldas) y una lista con los nombres de las partes.
- Tiene que funcionar igual de bien en móvil, tablet y ordenador; no hay un dispositivo principal.
- Los vídeos se ven en la consulta, en el dispositivo del clínico. Que el paciente se los lleve a casa no forma parte del alcance confirmado.

## Capabilities and Constraints

- Mapa del cuerpo y lista de partes del cuerpo como formas de entrar al contenido.
- Por cada parte del cuerpo, opciones de rehabilitación con vídeo, ordenadas por fase de rehabilitación.
- Los vídeos son enlaces externos (YouTube, Vimeo u otras plataformas), enlazados o incrustados. La app no aloja vídeo.
- Al ser PWA se puede instalar. Como los vídeos son externos, verlos necesita conexión; qué funciona sin conexión está por decidir.
- Cuatro fases: Pain control, Mobility, Strength y Return to activity.
- Sin cuentas ni datos de pacientes (decidido el 2026-10-26): es una guía solo para el terapeuta.
- El catálogo se mantiene editando `data.js` a petición del usuario y subiéndolo a GitHub (decidido el 2026-10-26). Una pantalla de administración solo si los cambios pasan a ser frecuentes o los hace otra persona.
- La interfaz de la app está en inglés (lo pidió el usuario el 2026-10-23), aunque el trabajo con el usuario se haga en español.

## Brand Commitments

- Paleta fijada por el usuario (2026-10-23): #09251C (verde bosque), #A55704 (ámbar), #F3D2AF (melocotón), #F8EADC (crema). Nada de blanco: los fondos son cálidos y suaves para no cansar la vista durante la consulta.

## Evidence on Hand

El catálogo real llegó el 2026-10-26: 108 ejercicios de demostraciones públicas del NHS (12 por zona, 3 por fase), sacados de los PDF del usuario. También hay icono de la app (columna vertebral). No hay que inventarse ejercicios, indicaciones clínicas, testimonios ni avales profesionales.

## Product Principles

1. **Al ritmo de la conversación.** Ir de la zona al vídeo tiene que ser más rápido que explicarlo de palabra, con el paciente delante.
2. **Una pantalla para dos.** Lo que se enseña lo maneja el clínico, pero el paciente también lo tiene que poder leer y entender.
3. **La parte del cuerpo es el índice.** Todo se encuentra por la zona del cuerpo.
4. **Rigor clínico.** Nada de recomendaciones inventadas. La app muestra el contenido que elige el profesional; no diagnostica.
