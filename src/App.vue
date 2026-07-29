<template>
  <router-view />
</template>

<script setup>
import { aplicarTema, obtenerTema } from './services/theme.js'

aplicarTema(obtenerTema())
</script>
