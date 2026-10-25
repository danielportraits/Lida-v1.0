# LIDA

**LIDA** es un prototipo de aplicación web progresiva (PWA) con identidad visual oscura y acentos verde neón.

> **Estado:** versión base de demostración. No es todavía un servicio de producción. El perfil y los mensajes se guardan localmente en este navegador. No hay cuentas compartidas, backend, sincronización entre usuarios, salas multijugador, notificaciones push reales ni un proveedor de IA conectado.

## Contenido

- Navegación entre Inicio, Comunidad, Mensajes, Games y Perfil.
- Un único chat inicial de bienvenida de LIDA.
- Mensajes de demostración guardados localmente.
- Perfil local editable.
- Guía interactiva de seis pasos, omitible y reabrible desde Perfil → Ayuda y guía.
- Comunidad con estado vacío honesto; el descubrimiento real requiere backend.
- Minijuegos locales: Tres en raya para dos personas en el mismo dispositivo y Luz camina.
- Interfaz de LIDA AI con respuestas de demostración claramente identificadas.
- PWA con manifiesto, service worker y recursos de marca.
- Documentación técnica y hoja de ruta.

## Abrir en GitHub

### Opción 1: subirlo a un repositorio

1. Descarga el ZIP de esta versión y descomprímelo.
2. En GitHub, crea un repositorio nuevo (por ejemplo, `LIDA`).
3. Sube **el contenido de esta carpeta** a la raíz del repositorio. Debes incluir también la carpeta oculta `.github/workflows/`.
4. Ve a **Settings → Pages**.
5. En **Build and deployment**, selecciona **GitHub Actions**.
6. Ve a **Actions** y espera a que termine el flujo **Deploy LIDA to GitHub Pages**. También puedes iniciarlo manualmente desde **Run workflow**.
7. La URL publicada aparecerá en **Settings → Pages** cuando finalice el despliegue.

El flujo de trabajo está ubicado en `.github/workflows/deploy-pages.yml`, que es la ubicación que GitHub Actions requiere para detectarlo.

### Opción 2: probar localmente

Se necesita un servidor estático porque se utiliza JavaScript modular y un service worker.

```bash
python -m http.server 8000
```

Abre `http://localhost:8000`.

En Windows también puedes ejecutar `INICIAR-LIDA.bat`.

## Estructura

```text
LIDA/
├── .github/workflows/deploy-pages.yml
├── index.html
├── app.js
├── navigation.js
├── dialogs.js
├── storage.js
├── demo-data.js
├── tokens.css
├── base.css
├── components.css
├── manifest.webmanifest
├── sw.js
├── lida-logo-original.png
├── lida-mark.svg
└── documentación (*.md)
```

## Funciones pendientes antes de producción

- Backend, cuentas reales y recuperación segura.
- Sincronización entre usuarios y dispositivos.
- Mensajería en tiempo real.
- Salas multijugador, reconexión y resultados validados en servidor.
- Moderación, reportes y controles de seguridad completos.
- Notificaciones push, llamadas y medios reales.
- Servicio de IA conectado.

No introduzcas claves privadas, contraseñas ni secretos en archivos públicos del repositorio. Para una aplicación real, los permisos y resultados deben validarse en el servidor.


## Contactos (implementación local)
La sección Comunidad permite guardar, buscar y eliminar contactos por nombre y @usuario, y abrir un chat local asociado. Esta función guarda datos en el navegador actual; no verifica que el usuario exista ni entrega solicitudes o mensajes a otras cuentas. Para amistades y mensajería entre dispositivos hace falta configurar el backend descrito en `ARCHITECTURE.md`.
