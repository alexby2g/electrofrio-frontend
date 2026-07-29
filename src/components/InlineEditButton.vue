<template>
  <q-btn
    dense
    flat
    round
    color="primary"
    icon="edit"
    class="inline-edit-button"
    aria-label="Editar registro"
    @click.stop="$emit('edit')"
  >
    <q-tooltip>Editar registro</q-tooltip>
  </q-btn>
</template>

<script setup>
defineEmits(['edit'])
</script>
