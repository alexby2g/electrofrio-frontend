<template>
  <q-page class="q-pa-md servicios-page">

    <div class="row justify-between items-center q-mb-md page-header">
      <div>
        <div class="text-h5 text-primary text-weight-bold">
          Servicios
        </div>

        <div class="text-caption text-grey-7">
          Mantenimiento, instalación y reparación de aires acondicionados
        </div>
      </div>

      <q-btn
        class="btn-electrofrio btn-page"
        label="Nuevo Servicio"
        icon="add"
        @click="abrirDialog"
      />
    </div>

    <q-card class="filtros-card q-mb-md">
      <q-card-section>
        <div class="row q-col-gutter-md items-center filtros-responsive">

          <div class="col-12 col-md-5">
            <q-input
              v-model="filtro"
              outlined
              dense
              rounded
              clearable
              debounce="300"
              placeholder="Buscar por cliente, técnico, equipo o tipo..."
            >
              <template #prepend>
                <q-icon name="search" />
              </template>
            </q-input>
          </div>

          <div class="col-12 col-md-3">
            <q-select
              v-model="filtroEstado"
              :options="opcionesEstado"
              label="Estado"
              outlined
              dense
              rounded
              emit-value
              map-options
            />
          </div>

          <div class="col-12 col-md-2">
            <q-select
              v-model="filtroTipo"
              :options="opcionesTipo"
              label="Tipo"
              outlined
              dense
              rounded
              emit-value
              map-options
            />
          </div>

          <div class="col-12 col-md-2">
            <q-chip
              color="primary"
              text-color="white"
              icon="build"
              class="q-pa-md chip-total"
            >
              {{ serviciosFiltrados.length }} servicio(s)
            </q-chip>
          </div>

        </div>
      </q-card-section>
    </q-card>

    <q-table
      class="tabla-electrofrio"
      :rows="serviciosFiltrados"
      :columns="columns"
      row-key="id"
      :loading="loading"
      flat
      bordered
      no-data-label="No hay servicios registrados"
      :pagination="pagination"
      :rows-per-page-options="[5, 10, 15, 20, 0]"
    >

      <template #body-cell-orden="props">
        <q-td :props="props">
          <div class="text-weight-bold text-primary">
            #{{ props.row.id }} - {{ props.row.cliente?.nombre || 'S/N' }}
          </div>

          <div class="text-caption text-grey-7">
            {{ textoEquipo(props.row.equipo) }}
          </div>
        </q-td>
      </template>

      <template #body-cell-servicio="props">
        <q-td :props="props">
          <div class="text-weight-bold">
            {{ props.row.tipo_servicio }}
          </div>

          <div class="text-caption text-grey-7">
            Técnico: {{ props.row.tecnico?.nombre || 'S/N' }}
          </div>

          <div class="q-mt-xs">
            <q-badge
              rounded
              color="blue"
              :label="props.row.tipo_servicio || 'Servicio'"
            />
          </div>
        </q-td>
      </template>

      <template #body-cell-fecha_pago="props">
        <q-td :props="props" class="text-center">
          <div>
            {{ props.row.fecha || 'Sin fecha' }}
          </div>

          <div class="text-weight-bold text-green-8">
            {{ Number(props.row.costo || 0).toFixed(2) }} Bs.
          </div>

          <q-badge
            rounded
            :color="colorEstado(props.row.estado)"
            :label="props.row.estado || 'pendiente'"
          />
        </q-td>
      </template>

      <template #body-cell-acciones="props">
        <q-td :props="props" class="q-gutter-xs text-center">
          <q-btn
            size="sm"
            round
            unelevated
            color="primary"
            icon="edit"
            @click="editar(props.row)"
          />

          <q-btn
            size="sm"
            round
            unelevated
            color="negative"
            icon="delete"
            @click="eliminar(props.row.id)"
          />
        </q-td>
      </template>

    </q-table>

    <q-dialog v-model="dialog" persistent>

      <q-card class="dialog-card-servicio">

        <q-card-section class="dialog-header row items-center">
          <div class="text-h6">
            {{ editando ? 'Editar Servicio' : 'Nuevo Servicio' }}
          </div>

          <q-space />

          <q-btn icon="close" flat round dense v-close-popup />
        </q-card-section>

        <q-scroll-area class="dialog-scroll">

          <q-card-section class="q-gutter-md q-pt-lg">

            <q-select
              v-model="form.cliente_id"
              :options="clientes"
              label="Cliente"
              option-label="nombre"
              option-value="id"
              emit-value
              map-options
              outlined
              dense
              @update:model-value="alCambiarCliente"
            />

            <q-select
              v-model="form.equipo_id"
              :options="equiposFiltrados"
              label="Equipo del cliente"
              :option-label="textoEquipo"
              option-value="id"
              emit-value
              map-options
              outlined
              dense
            />

            <q-select
              v-model="form.tecnico_id"
              :options="tecnicos"
              label="Técnico"
              option-label="nombre"
              option-value="id"
              emit-value
              map-options
              outlined
              dense
            />

            <q-select
              v-model="form.tipo_servicio"
              :options="tiposServicio"
              label="Tipo de servicio"
              option-label="nombre"
              option-value="nombre"
              emit-value
              map-options
              outlined
              dense
              @update:model-value="setPrecio"
            />

            <q-input
              v-model.trim="form.descripcion"
              type="textarea"
              label="Descripción / Observaciones"
              outlined
              dense
            />

            <div class="row q-col-gutter-sm form-row-responsive">

              <q-input
                class="col-6"
                v-model="form.fecha"
                type="date"
                label="Fecha"
                outlined
                dense
              />

              <q-input
                class="col-6"
                v-model="form.hora"
                type="time"
                label="Hora"
                outlined
                dense
              />

            </div>

            <div class="row q-col-gutter-sm form-row-responsive">

              <q-input
                class="col-6"
                v-model.number="form.costo"
                type="number"
                label="Costo"
                suffix="Bs."
                outlined
                dense
              />

              <q-select
                class="col-6"
                v-model="form.estado"
                :options="['pendiente', 'en proceso', 'finalizado', 'cancelado']"
                label="Estado"
                outlined
                dense
              />

            </div>

            <div class="q-pb-md"></div>

          </q-card-section>

        </q-scroll-area>

        <q-card-actions align="right" class="dialog-actions">

          <q-btn
            flat
            label="Cancelar"
            color="grey-7"
            v-close-popup
          />

          <q-btn
            class="btn-electrofrio"
            :label="editando ? 'Actualizar' : 'Guardar'"
            @click="guardar"
            :loading="submitting"
          />

        </q-card-actions>

      </q-card>

    </q-dialog>

  </q-page>
</template>

<style scoped>
.servicios-page {
  min-height: 100vh;
}

.filtros-card {
  border-radius: 22px;
  box-shadow: 0 12px 30px rgba(13, 71, 161, 0.10);
}

.chip-total {
  width: 100%;
  justify-content: center;
  font-weight: 800;
}

.tabla-electrofrio {
  border-radius: 22px;
  overflow: hidden;
  box-shadow: 0 12px 30px rgba(13, 71, 161, 0.12);
}

.tabla-electrofrio :deep(.q-table thead tr) {
  background: linear-gradient(135deg, #0d47a1, #c62828);
  color: white;
}

.tabla-electrofrio :deep(.q-table tbody tr:hover) {
  background: #eef4ff;
}

.dialog-card-servicio {
  width: 540px;
  max-width: 95vw;
  max-height: 92vh;
  border-radius: 22px;
  overflow: hidden;
}

.dialog-scroll {
  height: 430px;
  max-height: 68vh;
}

.dialog-actions {
  padding: 12px 18px 18px 18px;
  background: white;
  border-top: 1px solid #eeeeee;
}

.dialog-header {
  background: linear-gradient(135deg, #0d47a1, #c62828);
  color: white;
}

@media (max-width: 600px) {

  .servicios-page {
    padding: 10px;
  }

  .page-header {
    gap: 12px;
  }

  .btn-page {
    width: 100%;
  }

  .filtros-responsive {
    display: flex;
    flex-direction: column;
  }

  .filtros-responsive > div {
    width: 100% !important;
    max-width: 100% !important;
    flex: 0 0 100% !important;
  }

  .dialog-card-servicio {
    width: 95vw;
    max-width: 95vw;
    max-height: 95vh;
    border-radius: 18px;
  }

  .dialog-scroll {
    height: auto;
    max-height: 70vh;
  }

  .form-row-responsive {
    display: flex;
    flex-direction: column;
  }

  .form-row-responsive > div,
  .form-row-responsive .col-6 {
    width: 100% !important;
    max-width: 100% !important;
    flex: 0 0 100% !important;
  }

  .dialog-actions {
    flex-wrap: wrap;
    gap: 10px;
  }

  .dialog-actions .q-btn {
    flex: 1;
  }

  .tabla-electrofrio {
    border-radius: 16px;
  }

}
</style>