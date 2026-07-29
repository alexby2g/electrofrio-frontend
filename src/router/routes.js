const routes = [
  {
    path: '/',
    component: () => import('layouts/MainLayout.vue'),
    children: [
      { path: '', redirect: '/dashboard' },
      { path: 'dashboard', name: 'dashboard', component: () => import('pages/DashboardPage.vue') },
      { path: 'clientes', name: 'clientes', component: () => import('pages/ClientesPage.vue') },
      { path: 'whatsapp', name: 'whatsapp', component: () => import('pages/WhatsAppPage.vue') },
      { path: 'tecnicos', name: 'tecnicos', component: () => import('pages/TecnicosPage.vue') },
      { path: 'equipos', name: 'equipos', component: () => import('pages/EquiposPage.vue') },
      { path: 'servicios', name: 'servicios', component: () => import('pages/ServiciosPage.vue') },
      { path: 'detalles-tecnicos', name: 'detalles-tecnicos', component: () => import('pages/DetallesTecnicosPage.vue') },
      { path: 'pagos', name: 'pagos', component: () => import('pages/PagosPage.vue') },
      { path: 'historial', name: 'historial', component: () => import('pages/HistorialPage.vue') }
    ]
  },
  {
    path: '/:catchAll(.*)*',
    component: () => import('pages/ErrorNotFound.vue')
  }
]

export default routes
