# Electro Frío PWA

Esta versión conserva el frontend Quasar y se conecta con la misma API de
Render y la misma base de datos Neon.

## Publicación en Vercel

1. Reemplazar el contenido de la rama del frontend con esta versión.
2. Subir los cambios a GitHub.
3. Vercel ejecutará `npm run build:pwa` y publicará la carpeta `dist/pwa`.
4. Esperar a que el despliegue indique **Ready**.

## Instalación

### Android o computadora

1. Abrir Electro Frío en Chrome o Edge.
2. Iniciar sesión.
3. Abrir el menú del usuario.
4. Presionar **Instalar aplicación**.
5. Confirmar la instalación que muestra el navegador.

### iPhone o iPad

1. Abrir Electro Frío en Safari.
2. Tocar **Compartir**.
3. Elegir **Agregar a inicio**.
4. Confirmar con **Agregar**.

## Importante

- Los cambios de clientes, equipos, atenciones y pagos siguen guardándose en
  Neon mediante la API de Render.
- La interfaz puede abrirse durante un corte de conexión, pero para consultar o
  guardar datos nuevos se necesita Internet.
- Cuando se publique una actualización, la aplicación descargará la versión
  nueva automáticamente.
