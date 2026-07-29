# Electro Frío para Android

La aplicación Android usa la misma interfaz web de Electro Frío y se conecta al
backend de Render y a la base de datos Neon.

## Descargar el APK

1. Abre el repositorio `electrofrio-frontend` en GitHub.
2. Entra a **Actions**.
3. Abre la ejecución verde llamada **Compilar APK Android**.
4. Baja hasta **Artifacts**.
5. Descarga **ElectroFrio-Android**.
6. Descomprime el archivo e instala `app-debug.apk` en el teléfono.

Android puede mostrar una advertencia por instalar una aplicación descargada
fuera de Google Play. Autoriza temporalmente la instalación desde el navegador o
administrador de archivos usado para abrir el APK.

## Actualizaciones

Cada cambio enviado a la rama `release/v13.3` vuelve a compilar automáticamente
el APK. La versión web/PWA de Vercel continúa actualizándose por separado.
