# De token a agente

Presentación web estática e independiente en español sobre fundamentos de IA, LLM, sistemas agénticos y prácticas de desarrollo. No implica afiliación con los proyectos o referencias citados.

[Presentación web](https://statick88.github.io/ai-agentic-course/) · [Curso de Python](https://statick88.github.io/Course_of_python/)

## Abrir localmente

Abra `index.html` directamente en un navegador, o sirva el directorio:

```sh
python3 -m http.server 8080
```

Después visite `http://localhost:8080`.

## Uso y accesibilidad

- Abra **Índice de la presentación** para saltar a una sección o use los botones Anterior/Siguiente.
- En modo diapositivas, el título permanece visible; cada pulsación de **→** o **Siguiente** revela un concepto y solo después avanza. **←** o **Anterior** lo oculta y, al volver, deja completos los conceptos de la diapositiva previa.
- Los enlaces `#id-de-diapositiva`, el índice y las teclas Inicio/Fin son navegación directa: abren la diapositiva solicitada con sus conceptos ya visibles.
- Las flechas, Inicio/Fin no interceptan teclas de controles interactivos ni combinaciones modificadas.
- **Leer todo** cambia a un documento continuo y muestra todos los conceptos sin perder el punto de revelación al volver. El contenido también funciona completo sin JavaScript y al imprimir.
- La vista con JavaScript usa una diapositiva por viewport, con controles en flujo normal (sin superponer contenido), foco visible e interior desplazable en pantallas pequeñas. Las entradas y revelaciones usan una transición breve; `prefers-reduced-motion` desactiva todas las animaciones y transiciones.

## Verificación

No se requieren dependencias ni instalación:

```sh
node --test tests/*.test.js
node --check app.js
node --check navigation.js
```

Las pruebas cubren el contrato de navegación y la estructura/contenido de la presentación.

Para ejecutar la regresión en un navegador Chromium ya instalado, sin instalar paquetes:

```sh
CHROME_BIN="/ruta/al/ejecutable/chromium" node tests/browser.cjs
```

Comprueba navegación, foco, enlaces internos, lectura accesible, fases ODD y ausencia de solapamiento a 320, 390, 768 y 1440 px. Abre un perfil aislado en `.verification/` (ignorado por Git). Las capturas y perfiles de comprobación no se publican. La revisión visual sigue siendo recomendable antes de publicar.

## Tipografía

La presentación usa una composición minimalista oscura con acentos cian y **Fira Code Nerd Font** autoalojada, en regular y negrita. No exige instalar fuentes ni usa un CDN. La [procedencia, revisión fijada, licencia y sumas de integridad](assets/fonts/README.md) acompañan los archivos; el texto conserva una fuente alternativa durante la carga.

## Autor y contacto

**Diego Medardo Saavedra García** · [Sitio personal](https://statick88.github.io)

Repositorio: https://github.com/statick88/ai-agentic-course

GitHub Pages: https://statick88.github.io/ai-agentic-course/

## Material y atribución

La presentación es una explicación original. La referencia pública al capítulo del libro figura como lectura complementaria en `SOURCES.md`; no se reproduce su texto ni ilustraciones. ODD y RDD se atribuyen a la documentación de Gentle AI, no a ese capítulo.

## Publicación

GitHub Pages sirve los archivos estáticos de la raíz de `main`; `.nojekyll` evita transformaciones de Jekyll. No hay compilación ni dependencias de ejecución. Antes de actualizar la publicación, ejecute las pruebas anteriores y compruebe la carga en navegador.

Las imágenes 3D personalizadas quedan pendientes de recibir archivos o enlaces con permiso de uso. Su ausencia no afecta al funcionamiento de esta versión.
