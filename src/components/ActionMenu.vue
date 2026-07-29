<template>
  <q-btn dense flat round color="grey-8" icon="more_vert" aria-label="Acciones">
    <q-menu
      anchor="bottom right"
      self="top right"
      transition-show="jump-down"
      transition-hide="jump-up"
    >
      <q-list dense class="action-menu-list">
        <q-item v-if="showView" clickable v-close-popup @click="$emit('view')">
          <q-item-section avatar
            ><q-icon color="primary" name="visibility"
          /></q-item-section>
          <q-item-section>Ver detalle</q-item-section>
        </q-item>

        <q-item v-if="showEdit" clickable v-close-popup @click="$emit('edit')">
          <q-item-section avatar
            ><q-icon color="warning" name="edit"
          /></q-item-section>
          <q-item-section>Editar</q-item-section>
        </q-item>

        <q-item
          v-if="showTechnical"
          clickable
          v-close-popup
          @click="$emit('technical')"
        >
          <q-item-section avatar
            ><q-icon color="info" name="engineering"
          /></q-item-section>
          <q-item-section>Detalle técnico</q-item-section>
        </q-item>

        <q-item
          v-if="showDocument"
          clickable
          v-close-popup
          @click="$emit('document')"
        >
          <q-item-section avatar
            ><q-icon color="primary" name="picture_as_pdf"
          /></q-item-section>
          <q-item-section>Proforma / expediente</q-item-section>
        </q-item>

        <q-item
          v-if="showPayment"
          clickable
          v-close-popup
          @click="$emit('payment')"
        >
          <q-item-section avatar>
            <q-icon color="positive" name="payments" />
          </q-item-section>
          <q-item-section>Pago y saldo</q-item-section>
        </q-item>

        <q-item
          v-if="showWhatsApp"
          clickable
          v-close-popup
          @click="$emit('whatsapp')"
        >
          <q-item-section avatar
            ><q-icon color="positive" name="chat"
          /></q-item-section>
          <q-item-section>Enviar WhatsApp</q-item-section>
        </q-item>

        <q-item
          v-if="showFinalize"
          clickable
          v-close-popup
          @click="$emit('finalize')"
        >
          <q-item-section avatar
            ><q-icon color="positive" name="check_circle"
          /></q-item-section>
          <q-item-section>Finalizar</q-item-section>
        </q-item>

        <q-separator v-if="showDelete && hayAccionesPrevias" />

        <q-item
          v-if="showDelete"
          clickable
          v-close-popup
          @click="$emit('delete')"
        >
          <q-item-section avatar
            ><q-icon color="negative" name="delete"
          /></q-item-section>
          <q-item-section class="text-negative">Eliminar</q-item-section>
        </q-item>
      </q-list>
    </q-menu>
  </q-btn>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  showView: { type: Boolean, default: true },
  showEdit: { type: Boolean, default: true },
  showDelete: { type: Boolean, default: true },
  showFinalize: { type: Boolean, default: false },
  showTechnical: { type: Boolean, default: false },
  showDocument: { type: Boolean, default: false },
  showPayment: { type: Boolean, default: false },
  showWhatsApp: { type: Boolean, default: false }
})

defineEmits([
  'view',
  'edit',
  'delete',
  'finalize',
  'technical',
  'document',
  'payment',
  'whatsapp'
])

const hayAccionesPrevias = computed(
  () =>
    props.showView ||
    props.showEdit ||
    props.showFinalize ||
    props.showTechnical ||
    props.showDocument ||
    props.showPayment ||
    props.showWhatsApp
)
</script>
