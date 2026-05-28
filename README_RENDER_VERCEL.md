# Configuración para Render + Vercel

## Backend Laravel en Render

Variables necesarias en Render:

```env
APP_NAME=ElectroFrio
APP_ENV=production
APP_KEY=base64:PEGA_AQUI_TU_APP_KEY
APP_DEBUG=false
APP_URL=https://TU-BACKEND.onrender.com
DB_CONNECTION=pgsql
DB_HOST=HOST_DE_TU_POSTGRES
DB_PORT=5432
DB_DATABASE=NOMBRE_DB
DB_USERNAME=USUARIO_DB
DB_PASSWORD=PASSWORD_DB
CACHE_DRIVER=file
QUEUE_CONNECTION=sync
SESSION_DRIVER=file
FRONTEND_URL=https://TU-FRONTEND.vercel.app
```

El Dockerfile ya instala `pdo_pgsql`, ejecuta migraciones y levanta Laravel en el puerto de Render.

## Frontend Quasar en Vercel

Variable necesaria en Vercel:

```env
VITE_API_URL=https://TU-BACKEND.onrender.com/api
```

Comandos de Vercel:

- Install Command: `npm install`
- Build Command: `npm run build`
- Output Directory: `dist/spa`

Después de cambiar variables en Vercel, haz redeploy para que el frontend compile con la nueva URL.
