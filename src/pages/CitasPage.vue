<template>
  <q-page class="q-pa-md page-shell">
    <div class="row items-center justify-between q-mb-md q-col-gutter-md">
      <div>
        <div class="text-h4 text-weight-bold text-primary">Atenciones</div>
        <div class="text-subtitle2 text-grey-7">
          Desde la llamada del cliente hasta el pago y la garantía, en un solo
          lugar
        </div>
      </div>
      <div class="q-gutter-sm">
        <q-btn
          color="primary"
          icon="add"
          label="Nueva atención"
          @click="abrirCrear"
        />
        <q-btn
          color="primary"
          outline
          icon="refresh"
          label="Actualizar"
          @click="cargarCitas"
        />
      </div>
    </div>

    <q-card class="content-card workflow-map q-mb-md">
      <q-card-section>
        <div class="text-subtitle1 text-weight-bold q-mb-md">
          Flujo real de atención
        </div>
        <div class="workflow-map__grid">
          <button
            v-for="(paso, index) in flujoEtapas"
            :key="paso.value"
            type="button"
            class="workflow-step"
            :class="{ 'workflow-step--active': estadoFiltro === paso.value }"
            @click="filtrarPorEstado(paso.value)"
          >
            <span class="workflow-step__number">{{ index + 1 }}</span>
            <q-icon :name="paso.icon" :color="paso.color" size="26px" />
            <span class="workflow-step__copy">
              <strong>{{ paso.label }}</strong>
              <small>{{ paso.caption }}</small>
            </span>
          </button>
        </div>
      </q-card-section>
    </q-card>

    <q-card class="content-card q-mb-md">
      <q-card-section class="row q-col-gutter-md items-center">
        <div class="col-12 col-md-5">
          <q-input
            v-model="buscar"
            outlined
            dense
            clearable
            debounce="400"
            label="Buscar por cliente, técnico, equipo, servicio o descripción"
            @update:model-value="cargarCitas"
          >
            <template #prepend><q-icon name="search" /></template>
          </q-input>
        </div>
        <div class="col-12 col-md-3">
          <q-select
            v-model="estadoFiltro"
            outlined
            dense
            clearable
            label="Filtrar etapa"
            :options="flujoEtapas"
            emit-value
            map-options
            @update:model-value="cargarCitas"
          />
        </div>
        <div class="col-12 col-md-3">
          <q-select
            v-model="vistaFiltro"
            outlined
            dense
            clearable
            label="Vista del panel"
            :options="vistaOptions"
            emit-value
            map-options
          />
        </div>
        <div class="col-12 col-md-1 text-md-right">
          <q-chip outline color="primary" icon="event_available">
            {{ citasVisibles.length }}
          </q-chip>
        </div>
      </q-card-section>
    </q-card>

    <q-banner v-if="error" class="bg-red-1 text-red q-mb-md rounded-borders">
      {{ error }}
    </q-banner>

    <q-banner
      class="bg-blue-1 text-primary q-mb-md rounded-borders fast-flow-banner"
    >
      <template #avatar><q-icon name="bolt" color="primary" /></template>
      Cada atención avanza en orden. Si el cliente rechaza la propuesta, se
      cierra; si acepta, se habilitan el servicio, el cobro y la garantía.
    </q-banner>

    <div class="row q-col-gutter-md q-mb-md">
      <div
        v-for="estado in resumenEstados"
        :key="estado.value"
        class="col-12 col-sm-6 col-md-3 col-lg"
      >
        <q-card
          class="workflow-mini-card q-pa-sm"
          :class="{
            'workflow-mini-card--active': estadoFiltro === estado.value
          }"
          @click="filtrarPorEstado(estado.value)"
        >
          <div class="row items-center no-wrap">
            <q-icon
              :name="estado.icon"
              :color="estado.color"
              size="28px"
              class="q-mr-sm"
            />
            <div>
              <div class="text-caption text-grey-7">{{ estado.label }}</div>
              <div class="text-h6 text-weight-bold">{{ estado.total }}</div>
            </div>
          </div>
        </q-card>
      </div>
    </div>

    <q-card class="content-card">
      <q-table
        title="Agenda de atenciones"
        :rows="citasVisibles"
        :columns="columns"
        row-key="id"
        :loading="loading"
        :rows-per-page-options="[10, 20, 50, 0]"
        no-data-label="No hay citas registradas"
      >
        <template #body-cell-equipo="props">
          <q-td :props="props">
            <div class="text-weight-medium">{{
              resumenEquipo(props.row.equipo)
            }}</div>
            <div
              v-if="props.row.equipo?.ubicacion"
              class="text-caption text-grey-7"
            >
              {{ props.row.equipo.ubicacion }}
            </div>
          </q-td>
        </template>

        <template #body-cell-detalle="props">
          <q-td :props="props">
            <q-chip
              dense
              :color="
                props.row.detalle_tecnico || props.row.detalleTecnico
                  ? 'positive'
                  : 'grey-5'
              "
              text-color="white"
              :icon="
                props.row.detalle_tecnico || props.row.detalleTecnico
                  ? 'task_alt'
                  : 'pending_actions'
              "
            >
              {{
                props.row.detalle_tecnico || props.row.detalleTecnico
                  ? 'Listo'
                  : 'Pendiente'
              }}
            </q-chip>
          </q-td>
        </template>

        <template #body-cell-total="props">
          <q-td :props="props">
            <span class="money-pill"
              >Bs {{ Number(props.row.total || 0).toFixed(2) }}</span
            >
          </q-td>
        </template>

        <template #body-cell-pago="props">
          <q-td :props="props">
            <q-chip
              dense
              :color="saldoCita(props.row) <= 0 ? 'positive' : 'warning'"
              text-color="white"
              :icon="saldoCita(props.row) <= 0 ? 'paid' : 'pending_actions'"
            >
              {{
                saldoCita(props.row) <= 0
                  ? 'Pagado'
                  : `Saldo Bs ${saldoCita(props.row).toFixed(2)}`
              }}
            </q-chip>
          </q-td>
        </template>

        <template #body-cell-etapa="props">
          <q-td :props="props">
            <q-chip
              dense
              :color="colorEtapa(etapaCita(props.row))"
              text-color="white"
              :icon="iconoEtapa(etapaCita(props.row))"
            >
              {{ textoEtapa(etapaCita(props.row)) }}
            </q-chip>
            <q-linear-progress
              class="q-mt-xs"
              rounded
              size="5px"
              :value="progresoEtapa(etapaCita(props.row))"
              :color="colorEtapa(etapaCita(props.row))"
              track-color="grey-3"
            />
          </q-td>
        </template>

        <template #body-cell-decision="props">
          <q-td :props="props">
            <q-chip
              dense
              outline
              :color="colorDecision(props.row.decision_cliente)"
              :icon="iconoDecision(props.row.decision_cliente)"
            >
              {{ textoDecision(props.row.decision_cliente) }}
            </q-chip>
          </q-td>
        </template>

        <template #body-cell-acciones="props">
          <q-td :props="props" class="table-actions">
            <ActionMenu
              show-technical
              show-document
              show-payment
              show-whats-app
              :show-finalize="
                props.row.decision_cliente === 'aceptado' &&
                !estadosFinales.includes(props.row.estado)
              "
              @view="abrirVer(props.row)"
              @edit="abrirEditar(props.row)"
              @technical="abrirDetalleTecnico(props.row)"
              @document="abrirDocumento(props.row)"
              @payment="abrirPagoAtencion(props.row)"
              @whatsapp="enviarWhatsappDesdeFila(props.row)"
              @finalize="finalizarCita(props.row)"
              @delete="eliminarCita(props.row)"
            />
          </q-td>
        </template>
      </q-table>
    </q-card>

    <q-dialog
      v-model="dialogo"
      persistent
      maximized
      transition-show="slide-left"
      transition-hide="slide-right"
    >
      <q-card class="workspace-dialog attention-dialog">
        <q-card-section class="bg-primary text-white">
          <div class="row items-center justify-between no-wrap">
            <div>
              <div class="text-h6">{{ tituloDialogo }}</div>
              <div class="text-caption text-blue-1">
                Solicitud → cita → diagnóstico → decisión → servicio → pago →
                garantía
              </div>
            </div>
            <q-btn flat round dense icon="close" v-close-popup />
          </div>
        </q-card-section>

        <q-tabs
          v-model="tabFormulario"
          dense
          class="text-primary bg-blue-1"
          active-color="primary"
          indicator-color="primary"
          align="justify"
        >
          <q-tab name="datos" icon="event" label="1. Cita" />
          <q-tab name="trabajo" icon="search" label="2. Diagnóstico" />
          <q-tab name="decision" icon="rule" label="3. Decisión" />
          <q-tab name="resumen" icon="engineering" label="4. Servicio" />
          <q-tab name="pago" icon="payments" label="5. Pago y garantía" />
        </q-tabs>

        <q-separator />

        <q-card-section>
          <q-tab-panels v-model="tabFormulario" animated keep-alive>
            <q-tab-panel name="datos" class="q-pa-none">
              <div class="row q-col-gutter-md">
                <div class="col-12 col-md-6">
                  <q-select
                    v-model="form.cliente_id"
                    :options="clientesOptions"
                    emit-value
                    map-options
                    use-input
                    input-debounce="0"
                    label="Cliente"
                    outlined
                    clearable
                    :readonly="modo === 'ver'"
                    @filter="filtrarClientes"
                    @update:model-value="seleccionarCliente"
                  >
                    <template #after>
                      <q-btn
                        v-if="modo !== 'ver'"
                        round
                        dense
                        color="primary"
                        icon="person_add"
                        @click="abrirClienteRapido"
                      >
                        <q-tooltip>Registrar cliente sin salir</q-tooltip>
                      </q-btn>
                    </template>
                    <template #option="scope">
                      <q-item v-bind="scope.itemProps">
                        <q-item-section avatar
                          ><q-icon name="person" color="primary"
                        /></q-item-section>
                        <q-item-section>
                          <q-item-label>{{ scope.opt.nombre }}</q-item-label>
                          <q-item-label caption
                            >{{ scope.opt.telefono || 'Sin teléfono' }} ·
                            {{
                              scope.opt.direccion || 'Sin dirección'
                            }}</q-item-label
                          >
                        </q-item-section>
                      </q-item>
                    </template>
                  </q-select>
                </div>
                <div class="col-12 col-md-6">
                  <q-select
                    v-model="form.equipo_id"
                    :options="equiposOptions"
                    emit-value
                    map-options
                    label="Equipo del cliente"
                    outlined
                    clearable
                    :readonly="modo === 'ver'"
                    :disable="!form.cliente_id"
                    hint="Se carga automáticamente si el cliente tiene un solo equipo"
                  >
                    <template #after>
                      <q-btn
                        v-if="modo !== 'ver' && form.cliente_id"
                        round
                        dense
                        color="primary"
                        icon="add"
                        @click="abrirEquipoRapido"
                      >
                        <q-tooltip>Agregar equipo a este cliente</q-tooltip>
                      </q-btn>
                    </template>
                    <template #option="scope">
                      <q-item v-bind="scope.itemProps">
                        <q-item-section avatar
                          ><q-icon name="devices_other" color="primary"
                        /></q-item-section>
                        <q-item-section>
                          <q-item-label>{{ scope.opt.label }}</q-item-label>
                          <q-item-label caption
                            >{{ scope.opt.ubicacion || 'Sin ubicación' }}
                            <span v-if="scope.opt.serie"
                              >· Serie: {{ scope.opt.serie }}</span
                            ></q-item-label
                          >
                        </q-item-section>
                      </q-item>
                    </template>
                  </q-select>
                </div>
                <div v-if="clienteSeleccionado" class="col-12">
                  <q-card flat bordered class="q-pa-sm selected-context-card">
                    <div class="row q-col-gutter-sm items-center">
                      <div class="col-12 col-md-4">
                        <div class="text-caption text-grey-7">Cliente</div>
                        <div class="text-weight-bold">{{
                          clienteSeleccionado.nombre
                        }}</div>
                        <div class="text-caption">{{
                          clienteSeleccionado.telefono || 'Sin teléfono'
                        }}</div>
                      </div>
                      <div class="col-12 col-md-4">
                        <div class="text-caption text-grey-7"
                          >Equipo elegido</div
                        >
                        <div class="text-weight-bold">{{
                          resumenEquipo(equipoSeleccionado)
                        }}</div>
                        <div class="text-caption">{{
                          equipoSeleccionado?.ubicacion ||
                          'Ubicación no registrada'
                        }}</div>
                      </div>
                      <div class="col-12 col-md-4 text-md-right">
                        <q-chip dense outline color="primary" icon="inventory_2"
                          >{{ equiposFiltradosPorCliente.length }} equipos del
                          cliente</q-chip
                        >
                      </div>
                    </div>
                  </q-card>
                </div>
                <div
                  v-if="
                    form.cliente_id && equiposFiltradosPorCliente.length === 0
                  "
                  class="col-12"
                >
                  <q-banner rounded class="empty-hint-card text-primary">
                    Este cliente todavía no tiene equipos registrados. Puedes
                    guardar la atención sin equipo o registrarlo ahora para
                    conservar su historial técnico.
                    <template #action>
                      <q-btn
                        flat
                        color="primary"
                        icon="add"
                        label="Agregar equipo"
                        @click="abrirEquipoRapido"
                      />
                    </template>
                  </q-banner>
                </div>
                <div class="col-12 col-md-3">
                  <q-select
                    v-model="form.canal_contacto"
                    :options="canalContactoOptions"
                    emit-value
                    map-options
                    label="Contacto recibido por"
                    outlined
                    :readonly="modo === 'ver'"
                  />
                </div>
                <div class="col-12 col-md-3">
                  <q-select
                    v-model="form.prioridad"
                    :options="prioridadOptions"
                    emit-value
                    map-options
                    label="Prioridad"
                    outlined
                    :readonly="modo === 'ver'"
                  />
                </div>
                <div class="col-12 col-md-4">
                  <q-select
                    v-model="form.tecnico_id"
                    :options="tecnicosOptions"
                    emit-value
                    map-options
                    label="Técnico"
                    outlined
                    clearable
                    :readonly="modo === 'ver'"
                  />
                </div>
                <div class="col-12 col-md-3">
                  <q-input
                    v-model="form.fecha"
                    type="date"
                    label="Fecha de la cita"
                    outlined
                    :readonly="modo === 'ver'"
                  />
                </div>
                <div class="col-12 col-md-3">
                  <q-input
                    v-model="form.hora"
                    type="time"
                    label="Hora de la cita"
                    outlined
                    :readonly="modo === 'ver'"
                  />
                </div>
                <div class="col-12">
                  <q-input
                    v-model="form.problema_reportado"
                    type="textarea"
                    rows="3"
                    label="Problema informado por el cliente"
                    outlined
                    :readonly="modo === 'ver'"
                    hint="Anota lo que el cliente explicó en la llamada o mensaje; todavía no es el diagnóstico."
                  />
                </div>
                <div class="col-12 col-md-7">
                  <q-input
                    v-model="form.direccion_servicio"
                    label="Dirección de la visita"
                    outlined
                    :readonly="modo === 'ver'"
                  >
                    <template #prepend><q-icon name="location_on" /></template>
                  </q-input>
                </div>
                <div class="col-12 col-md-5">
                  <q-input
                    v-model="form.referencia_ubicacion"
                    label="Referencia o enlace de Google Maps"
                    outlined
                    :readonly="modo === 'ver'"
                  >
                    <template #prepend><q-icon name="map" /></template>
                  </q-input>
                </div>
              </div>
            </q-tab-panel>

            <q-tab-panel name="trabajo" class="q-pa-none">
              <div class="row q-col-gutter-md">
                <div class="col-12">
                  <q-banner rounded class="bg-blue-1 text-primary">
                    <template #avatar><q-icon name="search" /></template>
                    Durante la visita registra el diagnóstico técnico. Después
                    prepara la solución y el precio que se ofrecerán al cliente.
                    <template #action>
                      <q-btn
                        v-if="citaId"
                        flat
                        color="primary"
                        icon="engineering"
                        label="Abrir diagnóstico técnico"
                        @click="abrirDetalleTecnico({ id: citaId })"
                      />
                    </template>
                  </q-banner>
                </div>
                <div class="col-12 col-md-6">
                  <q-select
                    v-model="form.servicio_id"
                    :options="serviciosOptions"
                    emit-value
                    map-options
                    use-input
                    input-debounce="0"
                    label="Servicio / catálogo de precios"
                    outlined
                    clearable
                    :readonly="modo === 'ver'"
                    @filter="filtrarServicios"
                    @update:model-value="seleccionarServicio"
                  >
                    <template #option="scope">
                      <q-item v-bind="scope.itemProps">
                        <q-item-section avatar
                          ><q-icon
                            :name="iconoCategoriaServicio(scope.opt.categoria)"
                            color="primary"
                        /></q-item-section>
                        <q-item-section>
                          <q-item-label>{{ scope.opt.nombre }}</q-item-label>
                          <q-item-label caption>{{
                            scope.opt.descripcion || 'Sin descripción'
                          }}</q-item-label>
                        </q-item-section>
                        <q-item-section side>
                          <q-chip dense color="primary" text-color="white"
                            >Bs {{ scope.opt.precio.toFixed(2) }}</q-chip
                          >
                        </q-item-section>
                      </q-item>
                    </template>
                  </q-select>
                </div>
                <div class="col-12 col-md-2">
                  <q-input
                    v-model.number="form.costo_mano_obra"
                    type="number"
                    label="Mano de obra"
                    prefix="Bs"
                    outlined
                    :readonly="modo === 'ver'"
                    min="0"
                    @update:model-value="recalcularTotalForm"
                  />
                </div>
                <div class="col-12 col-md-2">
                  <q-input
                    v-model.number="form.costo_materiales"
                    type="number"
                    label="Materiales"
                    prefix="Bs"
                    outlined
                    :readonly="modo === 'ver'"
                    min="0"
                    @update:model-value="recalcularTotalForm"
                  />
                </div>
                <div class="col-12 col-md-2">
                  <q-input
                    v-model.number="form.descuento"
                    type="number"
                    label="Descuento"
                    prefix="Bs"
                    outlined
                    :readonly="modo === 'ver'"
                    min="0"
                    @update:model-value="recalcularTotalForm"
                  />
                </div>
                <div v-if="servicioSeleccionado" class="col-12">
                  <q-card flat bordered class="q-pa-sm selected-context-card">
                    <div class="row items-center q-col-gutter-sm">
                      <div class="col-12 col-md-8">
                        <div class="text-caption text-grey-7"
                          >Servicio seleccionado</div
                        >
                        <div class="text-weight-bold">{{
                          servicioSeleccionado.nombre
                        }}</div>
                        <div class="text-caption">{{
                          servicioSeleccionado.descripcion ||
                          'Sin descripción base'
                        }}</div>
                      </div>
                      <div class="col-12 col-md-4 text-md-right q-gutter-xs">
                        <q-chip dense color="primary" text-color="white"
                          >Bs {{ Number(form.total || 0).toFixed(2) }}</q-chip
                        >
                        <q-btn
                          dense
                          outline
                          color="primary"
                          icon="auto_fix_high"
                          label="Usar descripción"
                          :disable="modo === 'ver'"
                          @click="usarDescripcionServicio"
                        />
                      </div>
                    </div>
                  </q-card>
                </div>
                <div class="col-12">
                  <q-input
                    v-model="form.descripcion"
                    label="Solución o servicio recomendado"
                    outlined
                    type="textarea"
                    rows="3"
                    :readonly="modo === 'ver'"
                    hint="Se sugiere automáticamente desde el catálogo; solo edita si hace falta"
                  />
                </div>
                <div class="col-12 col-md-8">
                  <q-input
                    v-model="form.propuesta"
                    label="Propuesta para el cliente"
                    outlined
                    type="textarea"
                    rows="3"
                    :readonly="modo === 'ver'"
                    hint="Resume qué se realizará, qué incluye y las condiciones ofrecidas."
                  />
                </div>
                <div class="col-12 col-md-4">
                  <q-card flat bordered class="q-pa-md total-proposal-card">
                    <div class="text-caption text-grey-7">Total propuesto</div>
                    <div class="text-h4 text-weight-bold text-primary">
                      Bs {{ Number(form.total || 0).toFixed(2) }}
                    </div>
                    <div class="text-caption text-grey-7">
                      Mano de obra + materiales − descuento
                    </div>
                  </q-card>
                </div>
                <div class="col-12">
                  <q-input
                    v-model="form.observacion"
                    label="Observación interna"
                    outlined
                    type="textarea"
                    rows="2"
                    :readonly="modo === 'ver'"
                  />
                </div>
              </div>
            </q-tab-panel>

            <q-tab-panel name="decision" class="q-pa-none">
              <q-banner
                v-if="!citaId"
                rounded
                class="bg-orange-1 text-orange-10 q-mb-md"
              >
                <template #avatar><q-icon name="save" /></template>
                Primero guarda la cita y la propuesta. Luego registra la
                respuesta del cliente sin salir de esta pantalla.
                <template #action>
                  <q-btn
                    color="primary"
                    icon="save"
                    label="Guardar y continuar"
                    :disable="!atencionListaParaGuardar"
                    @click="guardarBorradorAtencion"
                  />
                </template>
              </q-banner>

              <template v-else>
                <q-banner
                  v-if="!diagnosticoRegistrado"
                  rounded
                  class="bg-orange-1 text-orange-10 q-mb-md"
                >
                  <template #avatar><q-icon name="search" /></template>
                  Falta registrar el diagnóstico de la visita antes de guardar
                  la decisión del cliente.
                  <template #action>
                    <q-btn
                      flat
                      color="primary"
                      icon="engineering"
                      label="Registrar diagnóstico"
                      @click="abrirDetalleTecnico({ id: citaId })"
                    />
                  </template>
                </q-banner>
                <div class="row q-col-gutter-md">
                  <div class="col-12 col-md-7">
                    <q-card flat bordered class="q-pa-md decision-card">
                      <div class="text-subtitle1 text-weight-bold q-mb-xs">
                        ¿El cliente acepta la propuesta?
                      </div>
                      <div class="text-caption text-grey-7 q-mb-md">
                        Esta decisión controla automáticamente lo que se puede
                        hacer después.
                      </div>
                      <div class="row q-col-gutter-sm">
                        <div
                          v-for="opcion in decisionOptions"
                          :key="opcion.value"
                          class="col-12 col-sm-4"
                        >
                          <button
                            type="button"
                            class="decision-option"
                            :class="{
                              'decision-option--active':
                                form.decision_cliente === opcion.value
                            }"
                            :disabled="modo === 'ver'"
                            @click="form.decision_cliente = opcion.value"
                          >
                            <q-icon
                              :name="opcion.icon"
                              :color="opcion.color"
                              size="32px"
                            />
                            <strong>{{ opcion.label }}</strong>
                            <small>{{ opcion.caption }}</small>
                          </button>
                        </div>
                      </div>

                      <q-input
                        v-if="form.decision_cliente === 'rechazado'"
                        v-model="form.motivo_rechazo"
                        class="q-mt-md"
                        type="textarea"
                        rows="3"
                        outlined
                        label="Motivo del rechazo"
                        :readonly="modo === 'ver'"
                      />

                      <q-btn
                        v-if="modo !== 'ver'"
                        class="q-mt-md full-width"
                        color="primary"
                        icon="how_to_reg"
                        label="Guardar decisión del cliente"
                        @click="guardarDecision"
                      />
                    </q-card>
                  </div>
                  <div class="col-12 col-md-5">
                    <q-card flat bordered class="q-pa-md summary-box">
                      <div class="text-caption text-grey-7">Propuesta</div>
                      <div class="text-body1 q-mb-md">
                        {{
                          form.propuesta || 'Propuesta todavía no registrada'
                        }}
                      </div>
                      <q-separator class="q-my-sm" />
                      <div class="row items-end justify-between">
                        <span class="text-grey-7">Total ofrecido</span>
                        <strong class="text-h5 text-primary">
                          Bs {{ Number(form.total || 0).toFixed(2) }}
                        </strong>
                      </div>
                      <q-banner
                        rounded
                        class="q-mt-md"
                        :class="claseBannerDecision(form.decision_cliente)"
                      >
                        {{ mensajeDecision(form.decision_cliente) }}
                      </q-banner>
                    </q-card>
                  </div>
                </div>
              </template>
            </q-tab-panel>

            <q-tab-panel name="resumen" class="q-pa-none">
              <q-banner
                v-if="form.decision_cliente !== 'aceptado'"
                rounded
                class="bg-orange-1 text-orange-10 q-mb-md"
              >
                <template #avatar><q-icon name="lock" /></template>
                El servicio se habilita únicamente cuando la propuesta está
                marcada como <strong>aceptada</strong>.
                <template #action>
                  <q-btn
                    flat
                    color="primary"
                    label="Ir a la decisión"
                    @click="tabFormulario = 'decision'"
                  />
                </template>
              </q-banner>
              <div v-else class="row q-col-gutter-md">
                <div class="col-12 col-md-7">
                  <q-card flat bordered class="summary-box q-pa-md">
                    <div class="text-subtitle1 text-weight-bold q-mb-sm"
                      >Resumen de la atención</div
                    >
                    <q-list dense>
                      <q-item>
                        <q-item-section avatar
                          ><q-icon name="person" color="primary"
                        /></q-item-section>
                        <q-item-section>
                          <q-item-label>{{
                            nombreSeleccionado(clientes, form.cliente_id) ||
                            'Cliente no seleccionado'
                          }}</q-item-label>
                          <q-item-label caption>Cliente</q-item-label>
                        </q-item-section>
                      </q-item>
                      <q-item>
                        <q-item-section avatar
                          ><q-icon name="devices_other" color="primary"
                        /></q-item-section>
                        <q-item-section>
                          <q-item-label>{{
                            resumenEquipo(equipoSeleccionado)
                          }}</q-item-label>
                          <q-item-label caption>Equipo técnico</q-item-label>
                        </q-item-section>
                      </q-item>
                      <q-item>
                        <q-item-section avatar
                          ><q-icon name="build" color="primary"
                        /></q-item-section>
                        <q-item-section>
                          <q-item-label>{{
                            servicioSeleccionado?.nombre ||
                            'Servicio no seleccionado'
                          }}</q-item-label>
                          <q-item-label caption>Servicio</q-item-label>
                        </q-item-section>
                        <q-item-section side>
                          <strong
                            >Bs {{ Number(form.total || 0).toFixed(2) }}</strong
                          >
                        </q-item-section>
                      </q-item>
                    </q-list>
                  </q-card>
                </div>
                <div class="col-12 col-md-5">
                  <q-card flat bordered class="summary-box q-pa-md">
                    <div class="text-subtitle1 text-weight-bold q-mb-md"
                      >Siguiente paso recomendado</div
                    >
                    <div class="text-body2 text-grey-8">
                      La propuesta fue aceptada. Ahora registra el trabajo
                      realizado, los materiales utilizados, las fotos y las
                      recomendaciones para el cliente.
                    </div>
                    <q-btn
                      class="q-mt-md full-width"
                      color="positive"
                      outline
                      icon="engineering"
                      label="Abrir servicio técnico"
                      :disable="!citaId"
                      @click="guardarCitaYAbrirDetalle"
                    />
                    <q-btn
                      v-if="!['pago', 'garantia'].includes(form.etapa)"
                      class="q-mt-sm full-width"
                      color="primary"
                      icon="task_alt"
                      label="Finalizar servicio y pasar al pago"
                      :disable="!citaId"
                      @click="finalizarServicioActual"
                    />
                  </q-card>
                </div>
              </div>
            </q-tab-panel>

            <q-tab-panel name="pago" class="q-pa-none">
              <q-banner
                v-if="!citaId"
                rounded
                class="bg-orange-1 text-orange-10"
              >
                <template #avatar><q-icon name="info" /></template>
                Guarda primero la atención. Después podrás registrar aquí el
                pago y elegir efectivo, QR, transferencia o pago mixto.
                <template #action>
                  <q-btn
                    color="primary"
                    icon="save"
                    label="Guardar y continuar al pago"
                    :disable="!atencionListaParaGuardar"
                    @click="guardarCitaYAbrirPago"
                  />
                </template>
              </q-banner>

              <q-banner
                v-else-if="form.decision_cliente !== 'aceptado'"
                rounded
                class="bg-orange-1 text-orange-10"
              >
                <template #avatar><q-icon name="lock" /></template>
                El pago permanece bloqueado hasta que el cliente acepte la
                propuesta.
              </q-banner>

              <q-banner
                v-else-if="!['pago', 'garantia'].includes(form.etapa)"
                rounded
                class="bg-blue-1 text-primary"
              >
                <template #avatar><q-icon name="engineering" /></template>
                Termina y guarda el trabajo técnico antes de registrar el pago.
                <template #action>
                  <q-btn
                    flat
                    color="primary"
                    label="Ir al servicio"
                    @click="tabFormulario = 'resumen'"
                  />
                </template>
              </q-banner>

              <template v-else>
                <div class="row q-col-gutter-md q-mb-md">
                  <div class="col-12 col-md-4">
                    <q-card flat bordered class="payment-summary-card q-pa-md">
                      <div class="text-caption text-grey-7">Total</div>
                      <div class="text-h5 text-weight-bold text-primary">
                        Bs
                        {{
                          Number(
                            documentoResumen.total || form.total || 0
                          ).toFixed(2)
                        }}
                      </div>
                    </q-card>
                  </div>
                  <div class="col-12 col-md-4">
                    <q-card flat bordered class="payment-summary-card q-pa-md">
                      <div class="text-caption text-grey-7">Pagado</div>
                      <div class="text-h5 text-weight-bold text-positive">
                        Bs
                        {{
                          Number(documentoResumen.monto_pagado || 0).toFixed(2)
                        }}
                      </div>
                    </q-card>
                  </div>
                  <div class="col-12 col-md-4">
                    <q-card flat bordered class="payment-summary-card q-pa-md">
                      <div class="text-caption text-grey-7"
                        >Saldo pendiente</div
                      >
                      <div
                        class="text-h5 text-weight-bold"
                        :class="
                          Number(documentoResumen.saldo_pendiente || 0) > 0
                            ? 'text-warning'
                            : 'text-positive'
                        "
                      >
                        Bs
                        {{
                          Number(documentoResumen.saldo_pendiente || 0).toFixed(
                            2
                          )
                        }}
                      </div>
                    </q-card>
                  </div>
                </div>

                <q-banner
                  v-if="Number(documentoResumen.saldo_pendiente || 0) <= 0"
                  rounded
                  class="bg-green-1 text-positive q-mb-md"
                >
                  <template #avatar><q-icon name="verified" /></template>
                  Esta atención está completamente pagada.
                </q-banner>

                <q-banner
                  v-if="
                    Number(documentoResumen.saldo_pendiente || 0) <= 0 &&
                    garantiaDocumento.aplica
                  "
                  rounded
                  :class="`bg-${colorGarantia(garantiaDocumento.estado)}-1 text-${colorGarantia(garantiaDocumento.estado)} q-mb-md`"
                >
                  <template #avatar><q-icon name="verified" /></template>
                  {{ garantiaDocumento.label }}: inicia
                  {{ formatearFecha(detalleDocumento?.garantia_inicio) }} y
                  vence {{ formatearFecha(garantiaDocumento.vence) }}.
                </q-banner>

                <div class="row items-center justify-between q-mb-md">
                  <div>
                    <div class="text-h6 text-weight-bold">
                      Historial de pagos
                    </div>
                    <div class="text-caption text-grey-7">
                      Los pagos quedan asociados a esta atención y al cliente.
                    </div>
                  </div>
                  <q-btn
                    color="positive"
                    icon="add_card"
                    label="Registrar pago"
                    :disable="
                      Number(documentoResumen.saldo_pendiente || 0) <= 0
                    "
                    @click="abrirPagoRapido"
                  />
                </div>

                <q-list
                  v-if="documentoCita?.pagos?.length"
                  bordered
                  separator
                  class="rounded-borders"
                >
                  <q-item v-for="pago in documentoCita.pagos" :key="pago.id">
                    <q-item-section avatar>
                      <q-avatar color="green-1" text-color="positive">
                        <q-icon
                          :name="
                            pago.metodo_pago === 'qr' ? 'qr_code_2' : 'payments'
                          "
                        />
                      </q-avatar>
                    </q-item-section>
                    <q-item-section>
                      <q-item-label class="text-weight-bold">
                        {{ etiquetaMetodoPago(pago.metodo_pago) }}
                      </q-item-label>
                      <q-item-label caption>
                        {{ formatearFecha(pago.fecha_pago || pago.created_at) }}
                        <span v-if="pago.observacion">
                          · {{ pago.observacion }}
                        </span>
                      </q-item-label>
                    </q-item-section>
                    <q-item-section side>
                      <div
                        class="text-subtitle1 text-weight-bold text-positive"
                      >
                        Bs {{ Number(pago.monto || 0).toFixed(2) }}
                      </div>
                    </q-item-section>
                  </q-item>
                </q-list>
                <q-banner v-else rounded class="bg-blue-1 text-primary">
                  Todavía no se registraron pagos para esta atención.
                </q-banner>
              </template>
            </q-tab-panel>
          </q-tab-panels>
        </q-card-section>

        <q-card-actions align="between" class="q-pa-md">
          <q-btn flat label="Cerrar" color="grey-8" v-close-popup />
          <div class="q-gutter-sm">
            <q-btn
              v-if="tabFormulario !== 'datos'"
              flat
              color="primary"
              icon="arrow_back"
              label="Anterior"
              @click="irTabAnterior"
            />
            <q-btn
              v-if="tabFormulario !== 'pago'"
              color="primary"
              icon-right="arrow_forward"
              label="Siguiente"
              @click="irTabSiguiente"
            />
            <q-btn
              v-if="modo !== 'ver'"
              color="positive"
              outline
              icon="engineering"
              :label="
                form.decision_cliente === 'aceptado'
                  ? 'Guardar y servicio'
                  : 'Guardar y diagnóstico'
              "
              :disable="form.decision_cliente === 'rechazado'"
              @click="guardarCitaYAbrirDetalle"
            />
            <q-btn
              v-if="modo !== 'ver'"
              color="positive"
              icon="save"
              :label="
                modo === 'crear' ? 'Guardar atención' : 'Actualizar atención'
              "
              @click="guardarCita"
            />
          </div>
        </q-card-actions>
      </q-card>
    </q-dialog>

    <q-dialog v-model="dialogoDetalle" persistent>
      <q-card class="rounded-dialog detail-dialog">
        <q-card-section class="bg-info text-white">
          <div class="row items-center justify-between no-wrap">
            <div>
              <div class="text-h6">Detalle técnico de la atención</div>
              <div class="text-caption text-blue-1"
                >Este contenido alimenta el expediente y la nota de
                servicio</div
              >
            </div>
            <q-btn flat round dense icon="close" v-close-popup />
          </div>
        </q-card-section>

        <q-card-section v-if="citaDetalle" class="bg-blue-1">
          <div class="row q-col-gutter-md">
            <div class="col-12 col-md-4">
              <div class="text-caption text-grey-7">Cliente</div>
              <div class="text-weight-bold">{{
                citaDetalle.cliente?.nombre || 'Sin cliente'
              }}</div>
            </div>
            <div class="col-12 col-md-4">
              <div class="text-caption text-grey-7">Equipo</div>
              <div class="text-weight-bold">{{
                resumenEquipo(citaDetalle.equipo)
              }}</div>
            </div>
            <div class="col-12 col-md-4">
              <div class="text-caption text-grey-7">Servicio</div>
              <div class="text-weight-bold">{{
                citaDetalle.servicio?.nombre || 'Sin servicio'
              }}</div>
            </div>
          </div>
        </q-card-section>

        <q-card-section>
          <q-banner
            v-if="!servicioHabilitado"
            rounded
            class="bg-orange-1 text-orange-10 q-mb-md"
          >
            <template #avatar><q-icon name="lock" /></template>
            La propuesta aún no fue aceptada. Puedes guardar el diagnóstico,
            pero el trabajo, los materiales y la garantía permanecen bloqueados.
          </q-banner>
          <q-banner rounded class="bg-blue-1 text-primary q-mb-md">
            <template #avatar
              ><q-icon name="auto_awesome" color="primary"
            /></template>
            No repitas datos: cliente, equipo, servicio, precio y técnico vienen
            desde la atención. Aquí solo completa lo que pasó realmente en el
            trabajo.
          </q-banner>

          <div class="row q-col-gutter-sm q-mb-md">
            <div
              class="col-12 col-sm-6 col-md-3"
              v-for="preset in detalleRapidoOptions"
              :key="preset.value"
            >
              <q-btn
                class="full-width quick-preset-btn"
                outline
                color="primary"
                :icon="preset.icon"
                :label="preset.label"
                :disable="!servicioHabilitado && preset.value !== 'diagnostico'"
                @click="aplicarPlantillaDetalle(preset.value)"
              />
            </div>
          </div>

          <div class="row q-col-gutter-md">
            <div class="col-12 col-md-6">
              <q-select
                v-model="detalleForm.tecnico_id"
                :options="tecnicosOptions"
                emit-value
                map-options
                label="Técnico responsable"
                outlined
                clearable
              />
            </div>
            <div class="col-12 col-md-3">
              <q-select
                v-model="detalleForm.estado_equipo"
                :options="estadoEquipoOptions"
                emit-value
                map-options
                label="Estado del equipo"
                outlined
                clearable
              />
            </div>
            <div class="col-12 col-md-3">
              <q-input
                v-model="detalleForm.fecha_entrega"
                type="date"
                label="Fecha entrega"
                outlined
              />
            </div>
            <div class="col-12">
              <q-input
                v-model="detalleForm.diagnostico"
                type="textarea"
                rows="3"
                outlined
                label="Diagnóstico técnico"
              />
            </div>
            <div class="col-12">
              <q-input
                v-model="detalleForm.trabajo_realizado"
                type="textarea"
                rows="3"
                outlined
                label="Trabajo realizado"
                :disable="!servicioHabilitado"
              />
            </div>
            <div class="col-12 col-md-6">
              <q-input
                v-model="detalleForm.repuestos"
                type="textarea"
                rows="3"
                outlined
                label="Repuestos / materiales usados"
                :disable="!servicioHabilitado"
              />
            </div>
            <div class="col-12 col-md-6">
              <q-input
                v-model="detalleForm.recomendaciones"
                type="textarea"
                rows="3"
                outlined
                label="Recomendaciones para el cliente"
                :disable="!servicioHabilitado"
              />
            </div>

            <div class="col-12">
              <q-card flat bordered class="q-pa-md proforma-items-card">
                <div
                  class="row items-center justify-between q-mb-sm q-col-gutter-sm"
                >
                  <div>
                    <div class="text-subtitle2 text-weight-bold"
                      >Nota / proforma automática</div
                    >
                    <div class="text-caption text-grey-7"
                      >El ítem principal se arma desde la atención. Solo abre la
                      edición manual para agregar materiales o cambiar
                      precios.</div
                    >
                  </div>
                  <div class="q-gutter-xs">
                    <q-btn
                      color="primary"
                      outline
                      dense
                      icon="sync"
                      label="Usar servicio"
                      :disable="!servicioHabilitado"
                      @click="sincronizarItemPrincipalConCita"
                    />
                    <q-btn
                      color="primary"
                      dense
                      :outline="!edicionItemsManual"
                      icon="edit_note"
                      :disable="!servicioHabilitado"
                      :label="
                        edicionItemsManual ? 'Ocultar edición' : 'Editar ítems'
                      "
                      @click="edicionItemsManual = !edicionItemsManual"
                    />
                  </div>
                </div>

                <q-list dense bordered class="rounded-borders q-mb-sm">
                  <q-item
                    v-for="(item, index) in detalleForm.items"
                    :key="`item-preview-${index}`"
                  >
                    <q-item-section>
                      <q-item-label>{{
                        item.descripcion || 'Servicio técnico'
                      }}</q-item-label>
                      <q-item-label caption
                        >{{ Number(item.cantidad || 0) }}
                        {{ item.unidad || '' }} × Bs
                        {{
                          Number(item.precio_unitario || 0).toFixed(2)
                        }}</q-item-label
                      >
                    </q-item-section>
                    <q-item-section side
                      ><strong
                        >Bs {{ Number(item.subtotal || 0).toFixed(2) }}</strong
                      ></q-item-section
                    >
                  </q-item>
                </q-list>

                <q-slide-transition>
                  <div v-show="edicionItemsManual">
                    <div class="text-right q-mb-sm">
                      <q-btn
                        color="primary"
                        outline
                        dense
                        icon="add"
                        label="Agregar ítem"
                        :disable="!servicioHabilitado"
                        @click="agregarItemDetalle"
                      />
                    </div>
                    <q-markup-table
                      flat
                      bordered
                      dense
                      class="proforma-items-table"
                    >
                      <thead>
                        <tr>
                          <th class="text-left">Tipo</th>
                          <th class="text-left">Cant.</th>
                          <th class="text-left">Unidad</th>
                          <th class="text-left">Descripción</th>
                          <th class="text-right">P. Unit. (Bs)</th>
                          <th class="text-right">Subtotal (Bs)</th>
                          <th></th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr
                          v-for="(item, index) in detalleForm.items"
                          :key="index"
                        >
                          <td style="width: 140px">
                            <q-select
                              v-model="item.tipo"
                              :options="tipoItemOptions"
                              emit-value
                              map-options
                              dense
                              outlined
                            />
                          </td>
                          <td style="width: 90px">
                            <q-input
                              v-model.number="item.cantidad"
                              dense
                              outlined
                              type="number"
                              min="0"
                              @update:model-value="actualizarSubtotalItem(item)"
                            />
                          </td>
                          <td style="width: 110px">
                            <q-input
                              v-model="item.unidad"
                              dense
                              outlined
                              placeholder="un."
                            />
                          </td>
                          <td>
                            <q-input
                              v-model="item.descripcion"
                              dense
                              outlined
                              placeholder="Descripción del servicio/material"
                            />
                          </td>
                          <td style="width: 150px">
                            <q-input
                              v-model.number="item.precio_unitario"
                              dense
                              outlined
                              type="number"
                              min="0"
                              prefix="Bs"
                              @update:model-value="actualizarSubtotalItem(item)"
                            />
                          </td>
                          <td
                            class="text-right text-weight-bold"
                            style="width: 130px"
                          >
                            Bs {{ Number(item.subtotal || 0).toFixed(2) }}
                          </td>
                          <td style="width: 44px">
                            <q-btn
                              flat
                              round
                              dense
                              color="negative"
                              icon="delete"
                              @click="eliminarItemDetalle(index)"
                            />
                          </td>
                        </tr>
                      </tbody>
                    </q-markup-table>
                  </div>
                </q-slide-transition>

                <div class="text-right q-mt-sm">
                  <span class="money-pill"
                    >Total nota: Bs {{ totalItemsDetalle.toFixed(2) }}</span
                  >
                </div>
              </q-card>
            </div>
            <div class="col-12">
              <q-card flat bordered class="q-pa-md evidence-card">
                <div
                  class="row items-center justify-between q-mb-md q-col-gutter-sm"
                >
                  <div>
                    <div class="text-subtitle2 text-weight-bold"
                      >Evidencia fotográfica</div
                    >
                    <div class="text-caption text-grey-7"
                      >Carga fotos de antes, durante y después. Acepta JPG, PNG,
                      WEBP, GIF y BMP; se muestran automáticamente en el
                      expediente técnico.</div
                    >
                  </div>
                  <q-chip outline color="primary" icon="photo_library">
                    {{ (detalleForm.evidencias || []).length }} fotos
                  </q-chip>
                </div>

                <q-banner
                  v-if="!detalleForm.id"
                  rounded
                  class="bg-orange-1 text-orange-10 q-mb-md"
                >
                  Primero guarda el detalle técnico una vez. Luego podrás subir
                  fotos del trabajo realizado.
                </q-banner>

                <div class="row q-col-gutter-md q-mb-md">
                  <div class="col-12 col-md-3">
                    <q-select
                      v-model="evidenciaTipo"
                      :options="evidenciaTipoOptions"
                      emit-value
                      map-options
                      outlined
                      dense
                      label="Tipo de foto"
                      :disable="!detalleForm.id || evidenciaSubiendo"
                    />
                  </div>
                  <div class="col-12 col-md-4">
                    <q-input
                      v-model="evidenciaDescripcion"
                      outlined
                      dense
                      label="Descripción breve"
                      placeholder="Ej: filtro antes de limpiar"
                      :disable="!detalleForm.id || evidenciaSubiendo"
                    />
                  </div>
                  <div class="col-12 col-md-5">
                    <q-file
                      v-model="fotoEvidencia"
                      outlined
                      dense
                      clearable
                      accept="image/jpeg,image/jpg,image/png,image/webp,image/gif,image/bmp,.jpg,.jpeg,.png,.webp,.gif,.bmp"
                      label="Seleccionar foto JPG, PNG, WEBP, GIF o BMP"
                      :disable="!detalleForm.id || evidenciaSubiendo"
                    >
                      <template #prepend
                        ><q-icon name="attach_file"
                      /></template>
                      <template #append>
                        <q-btn
                          dense
                          round
                          flat
                          color="primary"
                          icon="cloud_upload"
                          :loading="evidenciaSubiendo"
                          :disable="!fotoEvidencia || !detalleForm.id"
                          @click.stop.prevent="subirFotoEvidencia"
                        />
                      </template>
                    </q-file>
                  </div>
                </div>

                <div
                  v-if="(detalleForm.evidencias || []).length"
                  class="row q-col-gutter-md"
                >
                  <div
                    v-for="(evidencia, index) in detalleForm.evidencias"
                    :key="evidencia.id || index"
                    class="col-12 col-sm-6 col-md-3"
                  >
                    <q-card flat bordered class="evidence-thumb-card">
                      <q-img
                        :src="urlEvidencia(evidencia, detalleForm, index)"
                        ratio="4/3"
                        class="evidence-img"
                      >
                        <div class="absolute-top-left q-pa-xs">
                          <q-chip
                            dense
                            :color="colorEvidencia(evidencia.tipo)"
                            text-color="white"
                            :icon="iconoEvidencia(evidencia.tipo)"
                          >
                            {{ etiquetaEvidencia(evidencia.tipo) }}
                          </q-chip>
                        </div>
                      </q-img>
                      <q-card-section class="q-pa-sm">
                        <div class="text-caption ellipsis">{{
                          evidencia.descripcion ||
                          evidencia.nombre_original ||
                          'Foto del trabajo'
                        }}</div>
                        <div class="text-right">
                          <q-btn
                            flat
                            dense
                            round
                            color="negative"
                            icon="delete"
                            @click="eliminarFotoEvidencia(evidencia, index)"
                          />
                        </div>
                      </q-card-section>
                    </q-card>
                  </div>
                </div>

                <q-banner v-else rounded class="bg-blue-1 text-primary">
                  Todavía no hay fotos. Recomendado: mínimo 1 foto de antes y 1
                  foto de después para que el expediente se vea profesional.
                </q-banner>
              </q-card>
            </div>

            <div class="col-12">
              <q-card flat bordered class="q-pa-md warranty-card">
                <div class="text-subtitle2 text-weight-bold q-mb-md">
                  Garantía del servicio
                </div>
                <div class="row q-col-gutter-md">
                  <div class="col-12 col-md-3">
                    <q-input
                      v-model.number="detalleForm.garantia_dias"
                      type="number"
                      min="0"
                      outlined
                      label="Duración en días"
                      @update:model-value="actualizarGarantiaDetalle"
                      :disable="!servicioHabilitado"
                    />
                  </div>
                  <div class="col-12 col-md-3">
                    <q-input
                      v-model="detalleForm.garantia_inicio"
                      type="date"
                      outlined
                      label="Inicio de garantía"
                      @update:model-value="actualizarGarantiaDetalle"
                      :disable="!servicioHabilitado"
                    />
                  </div>
                  <div class="col-12 col-md-3">
                    <q-input
                      :model-value="detalleForm.garantia_fin"
                      type="date"
                      outlined
                      readonly
                      label="Vencimiento"
                    />
                  </div>
                  <div class="col-12 col-md-3">
                    <q-input
                      v-model="detalleForm.garantia"
                      outlined
                      label="Resumen"
                      placeholder="Ej: 30 días sobre el trabajo"
                      :disable="!servicioHabilitado"
                    />
                  </div>
                  <div class="col-12">
                    <q-input
                      v-model="detalleForm.condiciones_garantia"
                      type="textarea"
                      rows="2"
                      outlined
                      label="Condiciones y exclusiones de la garantía"
                      :disable="!servicioHabilitado"
                    />
                  </div>
                </div>
              </q-card>
            </div>
            <div class="col-12">
              <q-input
                v-model="detalleForm.observacion"
                outlined
                label="Observación interna"
              />
            </div>
            <div class="col-12" v-if="garantiaDetalle.aplica">
              <q-banner
                rounded
                :class="`bg-${colorGarantia(garantiaDetalle.estado)}-1 text-${colorGarantia(garantiaDetalle.estado)}`"
              >
                <template #avatar
                  ><q-icon
                    name="verified"
                    :color="colorGarantia(garantiaDetalle.estado)"
                /></template>
                {{ garantiaDetalle.label }} · {{ garantiaDetalle.dias }} días ·
                Vence: {{ formatearFecha(garantiaDetalle.vence) }}
                <span v-if="garantiaDetalle.estado !== 'vencida'">
                  · {{ garantiaDetalle.restantes }} días restantes</span
                >
              </q-banner>
            </div>
          </div>
        </q-card-section>

        <q-card-actions align="between" class="q-pa-md">
          <q-btn flat label="Cerrar" color="grey-8" v-close-popup />
          <div class="q-gutter-sm">
            <q-btn
              color="primary"
              outline
              icon="picture_as_pdf"
              label="Ver documento"
              :disable="!detalleForm.cita_id"
              @click="abrirDocumentoDesdeDetalle"
            />
            <q-btn
              color="positive"
              icon="save"
              label="Guardar detalle técnico"
              :loading="guardandoDetalle"
              @click="guardarDetalleTecnico"
            />
            <q-btn
              v-if="servicioHabilitado"
              color="primary"
              icon="task_alt"
              label="Guardar y pasar al pago"
              :loading="guardandoDetalle"
              @click="guardarDetalleYFinalizar"
            />
          </div>
        </q-card-actions>
      </q-card>
    </q-dialog>

    <q-dialog v-model="dialogoDocumento" persistent maximized>
      <q-card class="document-dialog">
        <q-card-section class="bg-primary text-white">
          <div class="row items-center justify-between no-wrap">
            <div>
              <div class="text-h6">Documentos de atención</div>
              <div class="text-caption text-blue-1"
                >Proforma / nota de servicio y expediente técnico</div
              >
            </div>
            <q-btn flat round dense icon="close" v-close-popup />
          </div>
        </q-card-section>

        <q-card-section
          class="row q-col-gutter-md document-toolbar items-center"
        >
          <div class="col-12 col-md-4">
            <q-tabs
              v-model="tipoDocumento"
              dense
              active-color="primary"
              indicator-color="primary"
              align="justify"
              class="bg-blue-1 rounded-borders"
            >
              <q-tab name="nota" icon="receipt_long" label="Nota / Proforma" />
              <q-tab
                name="expediente"
                icon="folder_shared"
                label="Expediente"
              />
            </q-tabs>
          </div>
          <div class="col-12 col-md-8 text-md-right q-gutter-sm">
            <q-btn
              color="primary"
              outline
              icon="print"
              label="Imprimir / Guardar PDF"
              @click="imprimirDocumento"
            />
            <q-btn
              color="positive"
              icon="payments"
              label="Registrar pago"
              :disable="!documentoCita"
              @click="abrirPagoRapido"
            />
            <q-btn-dropdown color="positive" icon="chat" label="WhatsApp">
              <q-list dense style="min-width: 230px">
                <q-item
                  clickable
                  v-close-popup
                  @click="enviarWhatsappDocumento('resumen')"
                >
                  <q-item-section avatar
                    ><q-icon name="summarize" color="primary"
                  /></q-item-section>
                  <q-item-section>Resumen del servicio</q-item-section>
                </q-item>
                <q-item
                  clickable
                  v-close-popup
                  @click="enviarWhatsappDocumento('terminado')"
                >
                  <q-item-section avatar
                    ><q-icon name="task_alt" color="positive"
                  /></q-item-section>
                  <q-item-section>Avisar terminado</q-item-section>
                </q-item>
                <q-item
                  clickable
                  v-close-popup
                  @click="enviarWhatsappDocumento('cobro')"
                >
                  <q-item-section avatar
                    ><q-icon name="payments" color="negative"
                  /></q-item-section>
                  <q-item-section>Recordar pago</q-item-section>
                </q-item>
                <q-item
                  clickable
                  v-close-popup
                  @click="enviarWhatsappDocumento('garantia')"
                >
                  <q-item-section avatar
                    ><q-icon name="verified" color="info"
                  /></q-item-section>
                  <q-item-section>Datos de garantía</q-item-section>
                </q-item>
              </q-list>
            </q-btn-dropdown>
          </div>
        </q-card-section>

        <q-card-section v-if="documentoLoading" class="text-center q-pa-xl">
          <q-spinner color="primary" size="48px" />
          <div class="q-mt-md text-grey-7">Cargando documento...</div>
        </q-card-section>

        <q-card-section v-else-if="documentoCita" class="document-preview-wrap">
          <div class="document-preview nota-venta-preview">
            <div class="nota-header">
              <div class="nota-brand-row">
                <img
                  :src="logoElectroFrio"
                  alt="Electro Frío"
                  class="nota-logo"
                />
                <div>
                  <div class="doc-company">ELECTROFRÍO</div>
                  <div class="doc-subtitle">Tu técnico de confianza</div>
                  <div class="doc-subtitle">Tec. Enrique Guzmán · 73907925</div>
                </div>
              </div>
              <div class="doc-number">
                <div class="text-caption text-grey-7">Documento</div>
                <div class="text-weight-bold">N.º {{ documentoCita.id }}</div>
                <div class="text-caption text-grey-7">{{
                  formatearFecha(new Date())
                }}</div>
              </div>
            </div>

            <q-separator class="q-my-md" />

            <div class="doc-title">
              {{
                tipoDocumento === 'nota'
                  ? 'NOTA DE VENTA / PROFORMA'
                  : 'EXPEDIENTE TÉCNICO'
              }}
            </div>

            <div class="nota-meta-grid q-mt-md">
              <div><strong>Empresa:</strong> ELECTROFRÍO</div>
              <div
                ><strong>Fecha:</strong>
                {{
                  formatearFecha(documentoCita.fecha) ||
                  formatearFecha(new Date())
                }}</div
              >
              <div
                ><strong>Cliente:</strong>
                {{ documentoCita.cliente?.nombre || 'Sin cliente' }}</div
              >
              <div
                ><strong>Teléfono:</strong>
                {{ documentoCita.cliente?.telefono || 'No registrado' }}</div
              >
              <div class="nota-meta-wide"
                ><strong>Dirección de visita:</strong>
                {{
                  documentoCita.direccion_servicio ||
                  documentoCita.cliente?.direccion ||
                  'No registrada'
                }}</div
              >
              <div class="nota-meta-wide"
                ><strong>Equipo:</strong>
                {{ resumenEquipo(documentoCita.equipo) }}
                <span v-if="documentoCita.equipo?.serie"
                  >· Serie: {{ documentoCita.equipo.serie }}</span
                ></div
              >
            </div>

            <div class="nota-table-wrap q-mt-md">
              <q-markup-table flat bordered dense class="nota-table">
                <thead>
                  <tr>
                    <th class="text-left">Cantidad</th>
                    <th class="text-left">Descripción</th>
                    <th class="text-right">P. Unit. (Bs)</th>
                    <th class="text-right">Subtotal (Bs)</th>
                  </tr>
                </thead>
                <tbody>
                  <tr
                    v-for="(item, index) in itemsDocumento"
                    :key="`doc-item-${index}`"
                  >
                    <td
                      >{{ Number(item.cantidad || 0) }}
                      {{ item.unidad || '' }}</td
                    >
                    <td>{{ item.descripcion || 'Servicio técnico' }}</td>
                    <td class="text-right">{{
                      Number(item.precio_unitario || 0).toFixed(2)
                    }}</td>
                    <td class="text-right">{{
                      Number(item.subtotal || 0).toFixed(2)
                    }}</td>
                  </tr>
                </tbody>
              </q-markup-table>
            </div>

            <div class="nota-total-block q-mt-md">
              <div v-if="Number(documentoCita.descuento || 0) > 0">
                Descuento: Bs
                {{ Number(documentoCita.descuento || 0).toFixed(2) }}
              </div>
              <div class="nota-total"
                >TOTAL: Bs
                {{ Number(totalGeneralDocumento || 0).toFixed(2) }}</div
              >
              <div><strong>SON:</strong> {{ montoLiteralDocumento }}</div>
              <div class="q-mt-xs text-caption text-grey-7">
                Pagado: Bs
                {{ Number(documentoResumen.monto_pagado || 0).toFixed(2) }} ·
                Saldo: Bs
                {{ Number(documentoResumen.saldo_pendiente || 0).toFixed(2) }}
              </div>
            </div>

            <q-card
              v-if="tipoDocumento === 'expediente'"
              flat
              bordered
              class="q-pa-md q-mt-md doc-box expediente-box"
            >
              <div class="doc-section-title">Detalle técnico</div>
              <q-banner
                v-if="!detalleDocumento"
                rounded
                class="bg-orange-1 text-orange-10 q-mb-md"
              >
                Esta atención todavía no tiene detalle técnico completo. Puedes
                generarlo desde el menú de tres puntos → Detalle técnico.
              </q-banner>
              <div class="row q-col-gutter-md">
                <div class="col-12"
                  ><strong>Diagnóstico:</strong>
                  {{ detalleDocumento?.diagnostico || 'Sin registrar' }}</div
                >
                <div class="col-12"
                  ><strong>Trabajo realizado:</strong>
                  {{
                    detalleDocumento?.trabajo_realizado || 'Sin registrar'
                  }}</div
                >
                <div class="col-12 col-md-6"
                  ><strong>Repuestos:</strong>
                  {{ detalleDocumento?.repuestos || 'Sin registrar' }}</div
                >
                <div class="col-12 col-md-6"
                  ><strong>Estado del equipo:</strong>
                  {{ textoEstadoEquipo(detalleDocumento?.estado_equipo) }}</div
                >
                <div class="col-12 col-md-6"
                  ><strong>Garantía:</strong>
                  {{ detalleDocumento?.garantia || 'Sin registrar' }}</div
                >
                <div class="col-12"
                  ><strong>Condiciones de garantía:</strong>
                  {{
                    detalleDocumento?.condiciones_garantia || 'Sin registrar'
                  }}</div
                >
                <div class="col-12 col-md-6"
                  ><strong>Entrega:</strong>
                  {{
                    formatearFecha(detalleDocumento?.fecha_entrega) ||
                    'Sin fecha'
                  }}</div
                >
                <div v-if="garantiaDocumento.aplica" class="col-12">
                  <q-chip
                    dense
                    :color="colorGarantia(garantiaDocumento.estado)"
                    text-color="white"
                    icon="verified"
                  >
                    {{ garantiaDocumento.label }} · vence
                    {{ formatearFecha(garantiaDocumento.vence) }}
                  </q-chip>
                </div>
                <div class="col-12"
                  ><strong>Recomendaciones:</strong>
                  {{
                    detalleDocumento?.recomendaciones || 'Sin registrar'
                  }}</div
                >
              </div>
            </q-card>

            <q-card
              v-if="tipoDocumento === 'expediente'"
              flat
              bordered
              class="q-pa-md q-mt-md doc-box evidence-document-box"
            >
              <div class="doc-section-title">Evidencia fotográfica</div>
              <div
                v-if="evidenciasDocumento.length"
                class="row q-col-gutter-md"
              >
                <div
                  v-for="(evidencia, index) in evidenciasDocumento"
                  :key="evidencia.id || index"
                  class="col-12 col-sm-6"
                >
                  <q-card flat bordered class="doc-evidence-card">
                    <q-img
                      :src="urlEvidencia(evidencia, detalleDocumento, index)"
                      ratio="4/3"
                      class="doc-evidence-img"
                    />
                    <q-card-section class="q-pa-sm">
                      <q-chip
                        dense
                        :color="colorEvidencia(evidencia.tipo)"
                        text-color="white"
                        :icon="iconoEvidencia(evidencia.tipo)"
                      >
                        {{ etiquetaEvidencia(evidencia.tipo) }}
                      </q-chip>
                      <div class="text-caption q-mt-xs">{{
                        evidencia.descripcion ||
                        evidencia.nombre_original ||
                        'Evidencia del servicio'
                      }}</div>
                    </q-card-section>
                  </q-card>
                </div>
              </div>
              <q-banner v-else rounded class="bg-blue-1 text-primary">
                No hay fotos cargadas todavía. Agrégalas desde Detalle técnico →
                Evidencia fotográfica.
              </q-banner>
            </q-card>

            <div class="doc-footer q-mt-xl">
              <div>Firma del Cliente</div>
              <div>Firma técnico / sello</div>
            </div>
          </div>
        </q-card-section>
      </q-card>
    </q-dialog>

    <q-dialog v-model="dialogoClienteRapido" persistent>
      <q-card style="width: 620px; max-width: 94vw">
        <q-card-section class="bg-primary text-white">
          <div class="row items-center justify-between">
            <div>
              <div class="text-h6">Registrar cliente</div>
              <div class="text-caption text-blue-1">
                Se seleccionará automáticamente en la atención
              </div>
            </div>
            <q-btn flat round dense icon="close" v-close-popup />
          </div>
        </q-card-section>
        <q-card-section class="row q-col-gutter-md">
          <div class="col-12">
            <q-input
              v-model="clienteRapido.nombre"
              outlined
              autofocus
              label="Nombre completo"
            />
          </div>
          <div class="col-12 col-md-6">
            <q-input
              v-model="clienteRapido.telefono"
              outlined
              label="Teléfono / WhatsApp"
            />
          </div>
          <div class="col-12 col-md-6">
            <q-input
              v-model="clienteRapido.direccion"
              outlined
              label="Dirección"
            />
          </div>
        </q-card-section>
        <q-card-actions align="right" class="q-pa-md">
          <q-btn flat label="Cancelar" color="grey-8" v-close-popup />
          <q-btn
            color="primary"
            icon="save"
            label="Guardar cliente"
            :loading="guardandoClienteRapido"
            @click="guardarClienteRapido"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <q-dialog v-model="dialogoEquipoRapido" persistent>
      <q-card style="width: 720px; max-width: 94vw">
        <q-card-section class="bg-primary text-white">
          <div class="row items-center justify-between">
            <div>
              <div class="text-h6">Agregar equipo</div>
              <div class="text-caption text-blue-1">
                {{ clienteSeleccionado?.nombre || 'Cliente seleccionado' }}
              </div>
            </div>
            <q-btn flat round dense icon="close" v-close-popup />
          </div>
        </q-card-section>
        <q-card-section class="row q-col-gutter-md">
          <div class="col-12 col-md-6">
            <q-input
              v-model="equipoRapido.tipo"
              outlined
              autofocus
              label="Tipo de equipo"
              hint="Ej.: aire acondicionado, freezer o refrigerador"
            />
          </div>
          <div class="col-12 col-md-3">
            <q-input v-model="equipoRapido.marca" outlined label="Marca" />
          </div>
          <div class="col-12 col-md-3">
            <q-input v-model="equipoRapido.modelo" outlined label="Modelo" />
          </div>
          <div class="col-12 col-md-6">
            <q-input
              v-model="equipoRapido.serie"
              outlined
              label="Serie / código"
            />
          </div>
          <div class="col-12 col-md-6">
            <q-input
              v-model="equipoRapido.ubicacion"
              outlined
              label="Ubicación"
            />
          </div>
          <div class="col-12">
            <q-input
              v-model="equipoRapido.observacion"
              outlined
              type="textarea"
              rows="2"
              label="Observación"
            />
          </div>
        </q-card-section>
        <q-card-actions align="right" class="q-pa-md">
          <q-btn flat label="Cancelar" color="grey-8" v-close-popup />
          <q-btn
            color="primary"
            icon="save"
            label="Guardar equipo"
            :loading="guardandoEquipoRapido"
            @click="guardarEquipoRapido"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <q-dialog v-model="dialogoPagoRapido" persistent>
      <q-card style="width: 560px; max-width: 94vw">
        <q-card-section class="bg-positive text-white">
          <div class="row items-center justify-between">
            <div>
              <div class="text-h6">Registrar pago</div>
              <div class="text-caption">
                Atención #{{ documentoCita?.id }} ·
                {{ documentoCita?.cliente?.nombre || 'Cliente' }}
              </div>
            </div>
            <q-btn flat round dense icon="close" v-close-popup />
          </div>
        </q-card-section>
        <q-card-section class="row q-col-gutter-md">
          <div class="col-12 col-md-6">
            <q-input
              v-model.number="pagoRapido.monto"
              outlined
              type="number"
              min="0"
              prefix="Bs"
              label="Monto recibido"
            />
          </div>
          <div class="col-12 col-md-6">
            <q-select
              v-model="pagoRapido.metodo_pago"
              outlined
              emit-value
              map-options
              :options="metodosPagoOptions"
              label="Método de pago"
              @update:model-value="seleccionarMetodoPago"
            />
          </div>
          <div v-if="pagoRapido.metodo_pago === 'qr'" class="col-12">
            <q-btn
              outline
              color="primary"
              icon="qr_code_2"
              label="Mostrar QR para escanear"
              class="full-width"
              @click="abrirQrCobro"
            />
          </div>
          <div class="col-12">
            <q-input
              v-model="pagoRapido.observacion"
              outlined
              type="textarea"
              rows="2"
              label="Observación / referencia"
            />
          </div>
          <div class="col-12">
            <q-banner rounded class="bg-green-1 text-positive">
              Saldo actual: Bs
              {{ Number(documentoResumen.saldo_pendiente || 0).toFixed(2) }}
            </q-banner>
          </div>
        </q-card-section>
        <q-card-actions align="right" class="q-pa-md">
          <q-btn flat label="Cancelar" color="grey-8" v-close-popup />
          <q-btn
            color="positive"
            icon="save"
            label="Confirmar pago"
            :loading="guardandoPagoRapido"
            @click="guardarPagoRapido"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <q-dialog
      v-model="dialogoQr"
      maximized
      transition-show="fade"
      transition-hide="fade"
    >
      <q-card class="qr-payment-screen">
        <q-card-section class="qr-screen-header">
          <div class="row items-center justify-between no-wrap">
            <div class="row items-center no-wrap">
              <q-avatar size="46px" class="bg-white q-mr-sm">
                <img :src="logoElectroFrio" alt="Electro Frío" />
              </q-avatar>
              <div>
                <div class="text-h5 text-weight-bold">Electro Frío</div>
                <div class="text-caption text-cyan-1">
                  Pago seguro mediante QR
                </div>
              </div>
            </div>
            <q-btn flat round dense icon="close" @click="dialogoQr = false" />
          </div>
        </q-card-section>

        <q-card-section class="qr-screen-body flex flex-center">
          <div class="qr-brand-card">
            <div class="qr-brand-title">
              <q-icon name="ac_unit" size="24px" />
              <span>ELECTRO FRÍO</span>
            </div>
            <div class="qr-bank-crop" aria-label="Código QR Banco Ganadero">
              <div class="qr-bank-window">
                <img
                  :src="qrBancoGanadero"
                  alt="Código QR de pago de Electro Frío"
                  class="qr-bank-source"
                />
              </div>
            </div>
            <div class="qr-payment-copy">
              <div class="text-caption text-grey-7">Monto a cobrar</div>
              <div class="text-h4 text-weight-bold text-primary">
                Bs {{ Number(pagoRapido.monto || 0).toFixed(2) }}
              </div>
              <div class="text-body2 text-grey-7 q-mt-xs">
                Escanea el código desde la aplicación de tu banco.
              </div>
            </div>
          </div>
        </q-card-section>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { date, useQuasar } from 'quasar'
import { useRoute } from 'vue-router'
import ActionMenu from '../components/ActionMenu.vue'
import logoElectroFrio from '../assets/electrofrio-mark.png'
import qrBancoGanadero from '../assets/qr-banco-ganadero.png'
import api, { extraerMensajeError } from '../services/api.js'

const $q = useQuasar()
const route = useRoute()

const loading = ref(false)
const error = ref('')
const buscar = ref('')
const estadoFiltro = ref(null)
const vistaFiltro = ref(null)
const citas = ref([])
const clientes = ref([])
const clientesFiltrados = ref([])
const tecnicos = ref([])
const servicios = ref([])
const serviciosFiltrados = ref([])
const equipos = ref([])
const dialogo = ref(false)
const modo = ref('crear')
const citaId = ref(null)
const tabFormulario = ref('datos')
const dialogoClienteRapido = ref(false)
const guardandoClienteRapido = ref(false)
const dialogoEquipoRapido = ref(false)
const guardandoEquipoRapido = ref(false)
const dialogoPagoRapido = ref(false)
const guardandoPagoRapido = ref(false)
const dialogoQr = ref(false)
const clienteRapido = ref({ nombre: '', telefono: '', direccion: '' })
const equipoRapido = ref({
  tipo: '',
  marca: '',
  modelo: '',
  serie: '',
  ubicacion: '',
  observacion: ''
})
const pagoRapido = ref({
  monto: 0,
  metodo_pago: 'efectivo',
  observacion: ''
})

const dialogoDetalle = ref(false)
const guardandoDetalle = ref(false)
const citaDetalle = ref(null)
const guardarYAbrirDetalle = ref(false)
const guardarYAbrirPago = ref(false)
const edicionItemsManual = ref(false)
const fotoEvidencia = ref(null)
const evidenciaTipo = ref('antes')
const evidenciaDescripcion = ref('')
const evidenciaSubiendo = ref(false)

const dialogoDocumento = ref(false)
const documentoLoading = ref(false)
const documentoPayload = ref(null)
const tipoDocumento = ref('nota')

const estadoOptions = [
  {
    label: 'Pendiente',
    value: 'pendiente',
    color: 'warning',
    icon: 'schedule'
  },
  { label: 'En revisión', value: 'revision', color: 'orange', icon: 'search' },
  {
    label: 'En proceso',
    value: 'en_proceso',
    color: 'info',
    icon: 'construction'
  },
  {
    label: 'Esperando repuesto',
    value: 'esperando_repuesto',
    color: 'deep-orange',
    icon: 'inventory_2'
  },
  { label: 'Terminado', value: 'terminado', color: 'teal', icon: 'task_alt' },
  {
    label: 'Entregado',
    value: 'entregado',
    color: 'positive',
    icon: 'verified'
  },
  { label: 'Cancelado', value: 'cancelada', color: 'negative', icon: 'cancel' }
]

const flujoEtapas = [
  {
    label: 'Cita',
    value: 'cita',
    color: 'primary',
    icon: 'event',
    caption: 'Ubicación y hora'
  },
  {
    label: 'Diagnóstico',
    value: 'diagnostico',
    color: 'orange',
    icon: 'search',
    caption: 'Revisión técnica'
  },
  {
    label: 'Propuesta',
    value: 'propuesta',
    color: 'deep-orange',
    icon: 'request_quote',
    caption: 'Solución y precio'
  },
  {
    label: 'Servicio',
    value: 'servicio',
    color: 'info',
    icon: 'engineering',
    caption: 'Solo si acepta'
  },
  {
    label: 'Pago',
    value: 'pago',
    color: 'teal',
    icon: 'payments',
    caption: 'Cobro y saldo'
  },
  {
    label: 'Garantía',
    value: 'garantia',
    color: 'positive',
    icon: 'verified',
    caption: 'Vigencia y seguimiento'
  },
  {
    label: 'Cerrada',
    value: 'cerrada',
    color: 'negative',
    icon: 'block',
    caption: 'Rechazada o cancelada'
  }
]

const canalContactoOptions = [
  { label: 'Llamada', value: 'llamada' },
  { label: 'WhatsApp', value: 'whatsapp' },
  { label: 'Presencial', value: 'presencial' },
  { label: 'Otro', value: 'otro' }
]

const prioridadOptions = [
  { label: 'Baja', value: 'baja' },
  { label: 'Normal', value: 'normal' },
  { label: 'Alta', value: 'alta' },
  { label: 'Urgente', value: 'urgente' }
]

const decisionOptions = [
  {
    label: 'Pendiente',
    value: 'pendiente',
    color: 'warning',
    icon: 'hourglass_top',
    caption: 'El cliente lo está evaluando'
  },
  {
    label: 'Aceptada',
    value: 'aceptado',
    color: 'positive',
    icon: 'thumb_up',
    caption: 'Habilita el servicio'
  },
  {
    label: 'Rechazada',
    value: 'rechazado',
    color: 'negative',
    icon: 'thumb_down',
    caption: 'Cierra la atención'
  }
]

const tipoItemOptions = [
  { label: 'Mano de obra', value: 'mano_obra' },
  { label: 'Material', value: 'material' },
  { label: 'Otro', value: 'otro' }
]

const metodosPagoOptions = [
  { label: 'Efectivo', value: 'efectivo' },
  { label: 'QR', value: 'qr' },
  { label: 'Transferencia', value: 'transferencia' },
  { label: 'Mixto', value: 'mixto' }
]

const vistaOptions = [
  { label: 'Atenciones de hoy', value: 'hoy' },
  { label: 'Trabajos abiertos', value: 'abiertos' },
  { label: 'Cobros pendientes', value: 'cobros_pendientes' },
  { label: 'Pagos de hoy', value: 'pagos_hoy' },
  { label: 'Pagos del mes', value: 'pagos_mes' },
  { label: 'Garantías vigentes', value: 'garantias' }
]

const estadoLegacyOptions = [
  ...estadoOptions,
  { label: 'Concluida', value: 'concluida', color: 'teal', icon: 'task_alt' }
]

const estadosFinales = ['terminado', 'entregado', 'concluida', 'cancelada']

const estadoEquipoOptions = [
  { label: 'Pendiente de revisión', value: 'pendiente_revision' },
  { label: 'En reparación', value: 'en_reparacion' },
  { label: 'Reparado', value: 'reparado' },
  { label: 'Entregado', value: 'entregado' },
  { label: 'No reparado', value: 'no_reparado' }
]

const detalleRapidoOptions = [
  { label: 'Mantenimiento', value: 'preventivo', icon: 'cleaning_services' },
  { label: 'Reparación', value: 'correctivo', icon: 'construction' },
  { label: 'Instalación', value: 'instalacion', icon: 'ac_unit' },
  { label: 'Diagnóstico', value: 'diagnostico', icon: 'search' }
]

const evidenciaTipoOptions = [
  { label: 'Antes', value: 'antes', color: 'negative', icon: 'history' },
  {
    label: 'Durante',
    value: 'durante',
    color: 'warning',
    icon: 'construction'
  },
  { label: 'Después', value: 'despues', color: 'positive', icon: 'task_alt' },
  {
    label: 'Firma / comprobante',
    value: 'firma',
    color: 'primary',
    icon: 'draw'
  },
  { label: 'Otro', value: 'otro', color: 'grey-7', icon: 'photo' }
]

const formInicial = {
  cliente_id: null,
  equipo_id: null,
  tecnico_id: null,
  servicio_id: null,
  canal_contacto: 'llamada',
  prioridad: 'normal',
  direccion_servicio: '',
  referencia_ubicacion: '',
  problema_reportado: '',
  fecha: date.formatDate(new Date(), 'YYYY-MM-DD'),
  hora: '08:00',
  estado: 'pendiente',
  etapa: 'cita',
  descripcion: '',
  propuesta: '',
  costo_mano_obra: 0,
  costo_materiales: 0,
  descuento: 0,
  decision_cliente: 'pendiente',
  motivo_rechazo: '',
  total: 0,
  observacion: ''
}

const detalleInicial = {
  cita_id: null,
  tecnico_id: null,
  diagnostico: '',
  trabajo_realizado: '',
  estado_equipo: 'reparado',
  garantia: '',
  garantia_dias: 0,
  garantia_inicio: date.formatDate(new Date(), 'YYYY-MM-DD'),
  garantia_fin: '',
  condiciones_garantia: '',
  recomendaciones: '',
  fecha_entrega: date.formatDate(new Date(), 'YYYY-MM-DD'),
  repuestos: '',
  items: [],
  evidencias: [],
  observacion: ''
}

const form = ref({ ...formInicial })
const detalleForm = ref({ ...detalleInicial })

const clientesOptions = computed(() =>
  clientesFiltrados.value.map(cliente => ({
    label: cliente.nombre,
    value: cliente.id,
    nombre: cliente.nombre,
    telefono: cliente.telefono,
    direccion: cliente.direccion
  }))
)

const tecnicosOptions = computed(() =>
  tecnicos.value
    .filter(tecnico => tecnico.activo !== false)
    .map(tecnico => ({ label: tecnico.nombre, value: tecnico.id }))
)

const serviciosOptions = computed(() =>
  serviciosFiltrados.value
    .filter(servicio => servicio.activo !== false)
    .map(servicio => ({
      label: `${servicio.nombre} - Bs ${Number(servicio.precio || 0).toFixed(2)}`,
      value: servicio.id,
      nombre: servicio.nombre,
      descripcion: servicio.descripcion,
      categoria: servicio.categoria,
      precio: Number(servicio.precio || 0)
    }))
)

const equiposFiltradosPorCliente = computed(() =>
  equipos.value.filter(equipo => {
    if (!form.value.cliente_id) return false
    return (
      Number(equipo.cliente_id || equipo.cliente?.id) ===
      Number(form.value.cliente_id)
    )
  })
)

const equiposOptions = computed(() =>
  equiposFiltradosPorCliente.value.map(equipo => ({
    label: resumenEquipo(equipo),
    value: equipo.id,
    ubicacion: equipo.ubicacion,
    serie: equipo.serie
  }))
)

const clienteSeleccionado = computed(() =>
  clientes.value.find(
    cliente => Number(cliente.id) === Number(form.value.cliente_id)
  )
)
const equipoSeleccionado = computed(() =>
  equipos.value.find(
    equipo => Number(equipo.id) === Number(form.value.equipo_id)
  )
)
const servicioSeleccionado = computed(() =>
  servicios.value.find(
    servicio => Number(servicio.id) === Number(form.value.servicio_id)
  )
)
const atencionListaParaGuardar = computed(() =>
  Boolean(form.value.cliente_id && form.value.fecha)
)
const documentoCita = computed(() => documentoPayload.value?.cita || null)
const documentoResumen = computed(() => documentoPayload.value?.resumen || {})
const detalleDocumento = computed(
  () =>
    documentoCita.value?.detalle_tecnico ||
    documentoCita.value?.detalleTecnico ||
    null
)
const servicioHabilitado = computed(
  () => citaDetalle.value?.decision_cliente === 'aceptado'
)
const diagnosticoRegistrado = computed(() => {
  const detalle =
    form.value.detalle_tecnico ||
    form.value.detalleTecnico ||
    citaDetalle.value?.detalle_tecnico ||
    citaDetalle.value?.detalleTecnico
  return Boolean(String(detalle?.diagnostico || '').trim())
})
const evidenciasDocumento = computed(() =>
  Array.isArray(detalleDocumento.value?.evidencias)
    ? detalleDocumento.value.evidencias
    : []
)
const totalItemsDetalle = computed(() =>
  (detalleForm.value.items || []).reduce(
    (sum, item) => sum + Number(item.subtotal || 0),
    0
  )
)
const itemsDocumento = computed(() =>
  obtenerItemsDocumento(documentoCita.value)
)
const totalItemsDocumento = computed(() =>
  itemsDocumento.value.reduce(
    (sum, item) => sum + Number(item.subtotal || 0),
    0
  )
)
const totalGeneralDocumento = computed(() =>
  Number(
    documentoResumen.value.total ??
      documentoCita.value?.total ??
      totalItemsDocumento.value
  )
)
const montoLiteralDocumento = computed(() =>
  montoEnLiteral(totalGeneralDocumento.value)
)
const garantiaDetalle = computed(() => resumenGarantia(detalleForm.value))
const garantiaDocumento = computed(() =>
  resumenGarantia(detalleDocumento.value || {})
)
const resumenEstados = computed(() =>
  flujoEtapas.map(estado => ({
    ...estado,
    total: citas.value.filter(cita => etapaCita(cita) === estado.value).length
  }))
)

const columns = [
  { name: 'acciones', label: '', field: 'acciones', align: 'center' },
  {
    name: 'fecha',
    label: 'Fecha',
    field: row => formatearFecha(row.fecha),
    align: 'left',
    sortable: true
  },
  {
    name: 'hora',
    label: 'Hora',
    field: row => normalizarHora(row.hora),
    align: 'left'
  },
  {
    name: 'cliente',
    label: 'Cliente',
    field: row => row.cliente?.nombre || 'Sin cliente',
    align: 'left',
    sortable: true
  },
  {
    name: 'ubicacion',
    label: 'Dirección de visita',
    field: row =>
      row.direccion_servicio || row.cliente?.direccion || 'Sin dirección',
    align: 'left'
  },
  {
    name: 'equipo',
    label: 'Equipo',
    field: row => resumenEquipo(row.equipo),
    align: 'left'
  },
  {
    name: 'servicio',
    label: 'Servicio',
    field: row => row.servicio?.nombre || 'Sin servicio',
    align: 'left'
  },
  {
    name: 'decision',
    label: 'Decisión',
    field: 'decision_cliente',
    align: 'center'
  },
  {
    name: 'total',
    label: 'Total',
    field: 'total',
    align: 'right',
    sortable: true
  },
  {
    name: 'pago',
    label: 'Pago',
    field: row => saldoCita(row),
    align: 'center',
    sortable: true
  },
  { name: 'etapa', label: 'Etapa', field: 'etapa', align: 'center' }
]

const tituloDialogo = computed(() => {
  if (modo.value === 'crear') return 'Registrar nueva atención'
  if (modo.value === 'editar') return 'Editar atención técnica'
  return 'Detalle de la atención'
})

const etapaCita = cita => {
  if (cita?.etapa) return cita.etapa
  if (cita?.estado === 'cancelada') return 'cerrada'
  if (['terminado', 'entregado', 'concluida'].includes(cita?.estado))
    return 'pago'
  if (['en_proceso', 'esperando_repuesto'].includes(cita?.estado))
    return 'servicio'
  if (cita?.estado === 'revision') return 'diagnostico'
  return 'cita'
}
const textoEtapa = etapa =>
  flujoEtapas.find(item => item.value === etapa)?.label || 'Cita'
const colorEtapa = etapa =>
  flujoEtapas.find(item => item.value === etapa)?.color || 'primary'
const iconoEtapa = etapa =>
  flujoEtapas.find(item => item.value === etapa)?.icon || 'event'
const progresoEtapa = etapa => {
  const index = flujoEtapas.findIndex(item => item.value === etapa)
  if (index < 0) return 1 / flujoEtapas.length
  if (etapa === 'cerrada') return 1
  return (index + 1) / (flujoEtapas.length - 1)
}
const textoDecision = decision =>
  decisionOptions.find(item => item.value === decision)?.label || 'Pendiente'
const colorDecision = decision =>
  decisionOptions.find(item => item.value === decision)?.color || 'warning'
const iconoDecision = decision =>
  decisionOptions.find(item => item.value === decision)?.icon || 'hourglass_top'
const mensajeDecision = decision => {
  if (decision === 'aceptado')
    return 'Servicio habilitado: ya puedes registrar el trabajo y el cobro.'
  if (decision === 'rechazado')
    return 'Atención cerrada: no se habilitarán servicio ni pago.'
  return 'La propuesta sigue pendiente. Servicio y pago permanecen bloqueados.'
}
const claseBannerDecision = decision => {
  if (decision === 'aceptado') return 'bg-green-1 text-positive'
  if (decision === 'rechazado') return 'bg-red-1 text-negative'
  return 'bg-orange-1 text-orange-10'
}
const textoEstado = estado =>
  estadoLegacyOptions.find(item => item.value === estado)?.label ||
  estado ||
  'Sin estado'
const normalizarHora = hora => (hora ? String(hora).slice(0, 5) : '')
const nombreSeleccionado = (lista, id) =>
  lista.find(item => Number(item.id) === Number(id))?.nombre
const formatearFecha = value =>
  value ? date.formatDate(value, 'DD/MM/YYYY') : ''
const montoPagadoCita = cita =>
  (cita?.pagos || [])
    .filter(pago => pago.estado === 'pagado')
    .reduce((total, pago) => total + Number(pago.monto || 0), 0)
const saldoCita = cita =>
  Math.max(Number(cita?.total || 0) - montoPagadoCita(cita), 0)
const etiquetaMetodoPago = metodo =>
  ({
    efectivo: 'Efectivo',
    qr: 'QR',
    transferencia: 'Transferencia',
    mixto: 'Pago mixto'
  })[metodo] ||
  metodo ||
  'Método no indicado'

const extraerDiasGarantia = garantia => {
  const texto = String(garantia || '').toLowerCase()
  const dias = texto.match(/(\d+)\s*(d[ií]a|dias|días)/)
  if (dias) return Number(dias[1])
  const meses = texto.match(/(\d+)\s*(mes|meses)/)
  if (meses) return Number(meses[1]) * 30
  return 0
}

const sumarDiasFecha = (fechaBase, dias) => {
  if (!fechaBase || !dias) return null
  const base = new Date(`${fechaBase}T00:00:00`)
  if (Number.isNaN(base.getTime())) return null
  base.setDate(base.getDate() + Number(dias))
  return date.formatDate(base, 'YYYY-MM-DD')
}

const resumenGarantia = detalle => {
  const dias =
    Number(detalle?.garantia_dias || 0) ||
    extraerDiasGarantia(detalle?.garantia)
  const inicio = detalle?.garantia_inicio || detalle?.fecha_entrega
  const vence = detalle?.garantia_fin || sumarDiasFecha(inicio, dias)
  if (!dias || !vence)
    return {
      aplica: false,
      dias: 0,
      vence: '',
      estado: 'sin_datos',
      label: 'Sin garantía calculable'
    }
  const hoy = new Date(date.formatDate(new Date(), 'YYYY-MM-DD') + 'T00:00:00')
  const fin = new Date(`${vence}T23:59:59`)
  const restantes = Math.ceil((fin - hoy) / 86400000)
  const estado =
    restantes < 0 ? 'vencida' : restantes <= 7 ? 'por_vencer' : 'vigente'
  const label =
    estado === 'vencida'
      ? 'Garantía vencida'
      : estado === 'por_vencer'
        ? 'Garantía por vencer'
        : 'Garantía vigente'
  return { aplica: true, dias, vence, restantes, estado, label }
}

const citasVisibles = computed(() => {
  const vista = vistaFiltro.value
  const citasPorEtapa = estadoFiltro.value
    ? citas.value.filter(cita => etapaCita(cita) === estadoFiltro.value)
    : citas.value
  if (!vista) return citasPorEtapa

  const hoy = date.formatDate(new Date(), 'YYYY-MM-DD')
  const mes = hoy.slice(0, 7)
  const pagosPagados = cita =>
    (cita?.pagos || []).filter(pago => pago.estado === 'pagado')

  return citasPorEtapa.filter(cita => {
    if (vista === 'hoy') return String(cita.fecha || '').slice(0, 10) === hoy
    if (vista === 'abiertos') return !estadosFinales.includes(cita.estado || '')
    if (vista === 'cobros_pendientes') return saldoCita(cita) > 0
    if (vista === 'pagos_hoy')
      return pagosPagados(cita).some(
        pago => String(pago.fecha_pago || '').slice(0, 10) === hoy
      )
    if (vista === 'pagos_mes')
      return pagosPagados(cita).some(
        pago => String(pago.fecha_pago || '').slice(0, 7) === mes
      )
    if (vista === 'garantias') {
      const detalle = cita.detalle_tecnico || cita.detalleTecnico || {}
      const garantia = resumenGarantia(detalle)
      return garantia.aplica && garantia.estado !== 'vencida'
    }
    return true
  })
})

const colorGarantia = estado =>
  ({
    vigente: 'positive',
    por_vencer: 'warning',
    vencida: 'negative',
    sin_datos: 'grey'
  })[estado] || 'grey'
const textoEstadoEquipo = value =>
  estadoEquipoOptions.find(item => item.value === value)?.label ||
  value ||
  'Sin registrar'
const iconoCategoriaServicio = categoria =>
  ({
    diagnostico: 'search',
    preventivo: 'cleaning_services',
    correctivo: 'construction',
    instalacion: 'ac_unit'
  })[categoria] || 'build'

const etiquetaEvidencia = tipo =>
  evidenciaTipoOptions.find(item => item.value === tipo)?.label || 'Foto'
const colorEvidencia = tipo =>
  evidenciaTipoOptions.find(item => item.value === tipo)?.color || 'primary'
const iconoEvidencia = tipo =>
  evidenciaTipoOptions.find(item => item.value === tipo)?.icon || 'photo_camera'
const apiBaseSinApi = () =>
  String(api.defaults.baseURL || '')
    .replace(/\/api\/?$/, '')
    .replace(/\/$/, '')

const codificarPathArchivo = path =>
  String(path || '')
    .split('/')
    .map(segmento => encodeURIComponent(segmento))
    .join('/')

const evidenciaIdParaUrl = (evidencia, index = 0) =>
  encodeURIComponent(String(evidencia?.id ?? index ?? 0))

const urlEvidencia = (evidencia, detalle = null, index = 0) => {
  if (!evidencia) return ''

  // Fix V7.3: prioridad absoluta a data_url en base64.
  // Así el PDF y la vista previa no dependen de /storage, CORS ni rutas de Windows/Laragon.
  const dataUrl = String(evidencia.data_url || evidencia.base64 || '')
  if (dataUrl.startsWith('data:image/')) return dataUrl

  const detalleId =
    detalle?.id || detalleForm.value?.id || evidencia.detalle_tecnico_id

  if (detalleId) {
    return `${String(api.defaults.baseURL || '').replace(/\/$/, '')}/detalle-tecnicos/${detalleId}/evidencias/${evidenciaIdParaUrl(evidencia, index)}/archivo`
  }

  const url = String(evidencia.url || evidencia.archivo_url || '')
  if (!url) return ''

  if (url.includes('/storage/')) {
    const path = url.split('/storage/').pop()
    return `${apiBaseSinApi()}/storage/${codificarPathArchivo(path)}`
  }

  return url
}

const crearItemProforma = (overrides = {}) => ({
  tipo: overrides.tipo ?? 'mano_obra',
  cantidad: overrides.cantidad ?? 1,
  unidad: overrides.unidad ?? 'un.',
  descripcion: overrides.descripcion ?? '',
  precio_unitario: Number(overrides.precio_unitario ?? 0),
  subtotal: Number(
    overrides.subtotal ??
      (overrides.cantidad ?? 1) * Number(overrides.precio_unitario ?? 0)
  )
})

const sanitizarItems = items =>
  Array.isArray(items)
    ? items
        .filter(
          item =>
            item &&
            (item.descripcion ||
              Number(item.cantidad || 0) > 0 ||
              Number(item.precio_unitario || 0) > 0)
        )
        .map(item =>
          crearItemProforma({
            tipo: item.tipo || 'mano_obra',
            cantidad: Number(item.cantidad || 0),
            unidad: item.unidad || 'un.',
            descripcion: item.descripcion || '',
            precio_unitario: Number(item.precio_unitario || 0),
            subtotal: Number(
              item.subtotal ||
                Number(item.cantidad || 0) * Number(item.precio_unitario || 0)
            )
          })
        )
    : []

const crearItemDesdeCita = cita =>
  crearItemProforma({
    tipo: 'mano_obra',
    cantidad: 1,
    unidad: 'serv.',
    descripcion:
      cita?.servicio?.nombre || cita?.descripcion || 'Servicio técnico',
    precio_unitario: Number(
      cita?.costo_mano_obra || cita?.servicio?.precio || cita?.total || 0
    )
  })

const crearItemsDesdeCita = cita => {
  const items = [crearItemDesdeCita(cita)]
  const materiales = Number(cita?.costo_materiales || 0)
  if (materiales > 0) {
    items.push(
      crearItemProforma({
        tipo: 'material',
        cantidad: 1,
        unidad: 'lote',
        descripcion: 'Materiales y repuestos estimados',
        precio_unitario: materiales
      })
    )
  }
  return items
}

const obtenerItemsDocumento = cita => {
  if (!cita) return []
  const detalle = cita.detalle_tecnico || cita.detalleTecnico || {}
  const items = sanitizarItems(detalle.items)
  return items.length ? items : crearItemsDesdeCita(cita)
}

const actualizarSubtotalItem = item => {
  item.subtotal = Number(item.cantidad || 0) * Number(item.precio_unitario || 0)
}

const agregarItemDetalle = () => {
  if (!Array.isArray(detalleForm.value.items)) detalleForm.value.items = []
  detalleForm.value.items.push(crearItemProforma())
}

const eliminarItemDetalle = index => {
  detalleForm.value.items.splice(index, 1)
}

const prepararItemsParaGuardar = () => sanitizarItems(detalleForm.value.items)

const actualizarGarantiaDetalle = () => {
  const dias = Math.max(Number(detalleForm.value.garantia_dias || 0), 0)
  const inicio = detalleForm.value.garantia_inicio
  detalleForm.value.garantia_fin = sumarDiasFecha(inicio, dias) || ''
  if (dias > 0 && !detalleForm.value.garantia) {
    detalleForm.value.garantia = `${dias} días sobre el trabajo realizado`
  }
}

const unidades = [
  '',
  'UNO',
  'DOS',
  'TRES',
  'CUATRO',
  'CINCO',
  'SEIS',
  'SIETE',
  'OCHO',
  'NUEVE'
]
const especiales = {
  10: 'DIEZ',
  11: 'ONCE',
  12: 'DOCE',
  13: 'TRECE',
  14: 'CATORCE',
  15: 'QUINCE',
  16: 'DIECISÉIS',
  17: 'DIECISIETE',
  18: 'DIECIOCHO',
  19: 'DIECINUEVE',
  20: 'VEINTE',
  21: 'VEINTIUNO',
  22: 'VEINTIDÓS',
  23: 'VEINTITRÉS',
  24: 'VEINTICUATRO',
  25: 'VEINTICINCO',
  26: 'VEINTISÉIS',
  27: 'VEINTISIETE',
  28: 'VEINTIOCHO',
  29: 'VEINTINUEVE'
}
const decenas = [
  '',
  '',
  'VEINTE',
  'TREINTA',
  'CUARENTA',
  'CINCUENTA',
  'SESENTA',
  'SETENTA',
  'OCHENTA',
  'NOVENTA'
]
const centenas = [
  '',
  'CIENTO',
  'DOSCIENTOS',
  'TRESCIENTOS',
  'CUATROCIENTOS',
  'QUINIENTOS',
  'SEISCIENTOS',
  'SETECIENTOS',
  'OCHOCIENTOS',
  'NOVECIENTOS'
]

const numeroEnTexto = numero => {
  const n = Math.floor(Number(numero || 0))
  if (n === 0) return 'CERO'
  if (n === 100) return 'CIEN'
  if (n < 10) return unidades[n]
  if (n < 30) return especiales[n]
  if (n < 100) {
    const d = Math.floor(n / 10)
    const u = n % 10
    return u ? `${decenas[d]} Y ${unidades[u]}` : decenas[d]
  }
  if (n < 1000) {
    const c = Math.floor(n / 100)
    const resto = n % 100
    return resto ? `${centenas[c]} ${numeroEnTexto(resto)}` : centenas[c]
  }
  if (n < 1000000) {
    const miles = Math.floor(n / 1000)
    const resto = n % 1000
    const textoMiles = miles === 1 ? 'MIL' : `${numeroEnTexto(miles)} MIL`
    return resto ? `${textoMiles} ${numeroEnTexto(resto)}` : textoMiles
  }
  const millones = Math.floor(n / 1000000)
  const resto = n % 1000000
  const textoMillones =
    millones === 1 ? 'UN MILLÓN' : `${numeroEnTexto(millones)} MILLONES`
  return resto ? `${textoMillones} ${numeroEnTexto(resto)}` : textoMillones
}

const montoEnLiteral = monto => {
  const total = Number(monto || 0)
  const enteros = Math.floor(total)
  const centavos = Math.round((total - enteros) * 100)
  return `${numeroEnTexto(enteros)} ${String(centavos).padStart(2, '0')}/100 BOLIVIANOS.`
}

const resumenEquipo = equipo => {
  if (!equipo) return 'Sin equipo seleccionado'
  return (
    [equipo.tipo, equipo.marca, equipo.modelo].filter(Boolean).join(' · ') ||
    'Equipo sin referencia'
  )
}

const limpiarFormulario = () => {
  form.value = { ...formInicial }
  citaId.value = null
  documentoPayload.value = null
  tabFormulario.value = 'datos'
}

const prepararFormulario = item => ({
  ...item,
  hora: normalizarHora(item.hora),
  cliente_id: item.cliente_id || item.cliente?.id || null,
  equipo_id: item.equipo_id || item.equipo?.id || null,
  tecnico_id: item.tecnico_id || item.tecnico?.id || null,
  servicio_id: item.servicio_id || item.servicio?.id || null,
  canal_contacto: item.canal_contacto || 'llamada',
  prioridad: item.prioridad || 'normal',
  direccion_servicio: item.direccion_servicio || item.cliente?.direccion || '',
  etapa: etapaCita(item),
  decision_cliente: item.decision_cliente || 'pendiente',
  costo_mano_obra: Number(item.costo_mano_obra || item.total || 0),
  costo_materiales: Number(item.costo_materiales || 0),
  descuento: Number(item.descuento || 0),
  total: Number(item.total || 0)
})

const cargarCombos = async () => {
  const [
    clientesResponse,
    tecnicosResponse,
    serviciosResponse,
    equiposResponse
  ] = await Promise.all([
    api.get('/clientes'),
    api.get('/tecnicos'),
    api.get('/servicios'),
    api.get('/equipos')
  ])

  clientes.value = clientesResponse.data.data || []
  clientesFiltrados.value = clientes.value
  tecnicos.value = tecnicosResponse.data.data || []
  servicios.value = serviciosResponse.data.data || []
  serviciosFiltrados.value = servicios.value
  equipos.value = equiposResponse.data.data || []
}

const cargarCitas = async () => {
  loading.value = true
  error.value = ''
  try {
    const response = await api.get('/citas', {
      params: {
        buscar: buscar.value || undefined
      }
    })
    citas.value = response.data.data || []
  } catch (err) {
    error.value = extraerMensajeError(
      err,
      'No se pudo cargar la lista de citas.'
    )
  } finally {
    loading.value = false
  }
}

const filtrarPorEstado = estado => {
  estadoFiltro.value = estado
  cargarCitas()
}

const cargarCitaCompleta = async id => {
  const response = await api.get(`/citas/${id}`)
  return response.data.data
}

const cargarDocumento = async id => {
  const response = await api.get(`/citas/${id}/documento`)
  return response.data.data
}

const filtrarClientes = (val, update) => {
  update(() => {
    const texto = String(val || '').toLowerCase()
    clientesFiltrados.value = clientes.value.filter(cliente =>
      cliente.nombre?.toLowerCase().includes(texto)
    )
  })
}

const filtrarServicios = (val, update) => {
  update(() => {
    const texto = String(val || '').toLowerCase()
    serviciosFiltrados.value = servicios.value.filter(
      servicio =>
        servicio.nombre?.toLowerCase().includes(texto) ||
        servicio.descripcion?.toLowerCase().includes(texto)
    )
  })
}

const seleccionarCliente = () => {
  const equiposCliente = equiposFiltradosPorCliente.value
  const equipoActualPerteneceAlCliente = equiposCliente.some(
    equipo => Number(equipo.id) === Number(form.value.equipo_id)
  )

  if (!equipoActualPerteneceAlCliente) {
    form.value.equipo_id =
      equiposCliente.length === 1 ? equiposCliente[0].id : null
  }

  if (!form.value.direccion_servicio && clienteSeleccionado.value?.direccion) {
    form.value.direccion_servicio = clienteSeleccionado.value.direccion
  }
}

const abrirClienteRapido = () => {
  clienteRapido.value = { nombre: '', telefono: '', direccion: '' }
  dialogoClienteRapido.value = true
}

const guardarClienteRapido = async () => {
  if (!clienteRapido.value.nombre.trim()) {
    $q.notify({ type: 'warning', message: 'Escribe el nombre del cliente' })
    return
  }

  guardandoClienteRapido.value = true
  try {
    const { data } = await api.post('/clientes', {
      ...clienteRapido.value,
      activo: true
    })
    const cliente = data.data
    clientes.value.unshift(cliente)
    clientesFiltrados.value = [...clientes.value]
    form.value.cliente_id = cliente.id
    form.value.equipo_id = null
    dialogoClienteRapido.value = false
    $q.notify({
      type: 'positive',
      message: 'Cliente registrado y seleccionado'
    })
  } catch (err) {
    $q.notify({
      type: 'negative',
      message: extraerMensajeError(err, 'No se pudo registrar el cliente')
    })
  } finally {
    guardandoClienteRapido.value = false
  }
}

const abrirEquipoRapido = () => {
  if (!form.value.cliente_id) {
    $q.notify({ type: 'warning', message: 'Selecciona primero un cliente' })
    return
  }
  equipoRapido.value = {
    tipo: '',
    marca: '',
    modelo: '',
    serie: '',
    ubicacion: '',
    observacion: ''
  }
  dialogoEquipoRapido.value = true
}

const guardarEquipoRapido = async () => {
  if (!equipoRapido.value.tipo.trim()) {
    $q.notify({ type: 'warning', message: 'Escribe el tipo de equipo' })
    return
  }

  guardandoEquipoRapido.value = true
  try {
    const { data } = await api.post('/equipos', {
      ...equipoRapido.value,
      cliente_id: form.value.cliente_id,
      activo: true
    })
    const equipo = data.data
    equipos.value.unshift(equipo)
    form.value.equipo_id = equipo.id
    dialogoEquipoRapido.value = false
    $q.notify({
      type: 'positive',
      message: 'Equipo registrado y seleccionado'
    })
  } catch (err) {
    $q.notify({
      type: 'negative',
      message: extraerMensajeError(err, 'No se pudo registrar el equipo')
    })
  } finally {
    guardandoEquipoRapido.value = false
  }
}

const abrirPagoRapido = () => {
  pagoRapido.value = {
    monto: Number(documentoResumen.value.saldo_pendiente || 0),
    metodo_pago: 'efectivo',
    observacion: ''
  }
  dialogoPagoRapido.value = true
}

const abrirQrCobro = () => {
  dialogoQr.value = true
}

const seleccionarMetodoPago = metodo => {
  if (metodo === 'qr') abrirQrCobro()
}

const guardarPagoRapido = async () => {
  if (!documentoCita.value?.id || Number(pagoRapido.value.monto) <= 0) {
    $q.notify({ type: 'warning', message: 'Ingresa un monto mayor a cero' })
    return
  }

  guardandoPagoRapido.value = true
  try {
    await api.post('/pagos', {
      cita_id: documentoCita.value.id,
      cliente_id: documentoCita.value.cliente?.id || null,
      monto: Number(pagoRapido.value.monto),
      metodo_pago: pagoRapido.value.metodo_pago,
      estado: 'pagado',
      observacion: pagoRapido.value.observacion
    })
    documentoPayload.value = await cargarDocumento(documentoCita.value.id)
    dialogoPagoRapido.value = false
    await cargarCitas()
    $q.notify({ type: 'positive', message: 'Pago registrado correctamente' })
  } catch (err) {
    $q.notify({
      type: 'negative',
      message: extraerMensajeError(err, 'No se pudo registrar el pago')
    })
  } finally {
    guardandoPagoRapido.value = false
  }
}

const usarDescripcionServicio = servicioManual => {
  const servicio = servicioManual?.nombre
    ? servicioManual
    : servicioSeleccionado.value
  if (!servicio) return
  form.value.descripcion =
    servicio.descripcion || servicio.nombre || form.value.descripcion
}

const seleccionarServicio = value => {
  const servicio = servicios.value.find(
    item => Number(item.id) === Number(value)
  )
  if (!servicio) return
  form.value.costo_mano_obra = Number(servicio.precio || 0)
  recalcularTotalForm()
  if (!form.value.descripcion) usarDescripcionServicio(servicio)
}

const recalcularTotalForm = () => {
  form.value.total = Math.max(
    Number(form.value.costo_mano_obra || 0) +
      Number(form.value.costo_materiales || 0) -
      Number(form.value.descuento || 0),
    0
  )
}

const sincronizarItemPrincipalConCita = () => {
  if (!citaDetalle.value) return
  detalleForm.value.items = crearItemsDesdeCita({
    ...citaDetalle.value,
    total: Number(citaDetalle.value.total || 0)
  })
}

const aplicarPlantillaDetalle = tipo => {
  const servicio = citaDetalle.value?.servicio?.nombre || 'servicio técnico'
  const equipo = resumenEquipo(citaDetalle.value?.equipo)
  const plantillas = {
    preventivo: {
      diagnostico: `Equipo ${equipo} requiere mantenimiento preventivo y limpieza general.`,
      trabajo_realizado:
        'Se realizó limpieza de filtros, revisión general, verificación de funcionamiento y limpieza de áreas accesibles del equipo.',
      recomendaciones:
        'Realizar mantenimiento preventivo cada 3 a 6 meses, según uso del equipo.',
      garantia: '30 días sobre el trabajo realizado',
      garantia_dias: 30,
      estado_equipo: 'reparado'
    },
    correctivo: {
      diagnostico: `Equipo ${equipo} presenta falla relacionada con ${servicio}.`,
      trabajo_realizado: `Se realizó ${servicio.toLowerCase()}, pruebas de funcionamiento y verificación posterior del equipo.`,
      recomendaciones:
        'Mantener seguimiento del funcionamiento del equipo y reportar cualquier anomalía.',
      garantia: '30 días sobre el trabajo realizado',
      garantia_dias: 30,
      estado_equipo: 'reparado'
    },
    instalacion: {
      diagnostico: `Se solicitó instalación o reubicación de ${equipo}.`,
      trabajo_realizado:
        'Se realizó instalación, revisión de conexiones, prueba de encendido y verificación de funcionamiento.',
      recomendaciones:
        'Evitar manipular conexiones y realizar mantenimiento preventivo según uso.',
      garantia: '30 días sobre instalación',
      garantia_dias: 30,
      estado_equipo: 'entregado'
    },
    diagnostico: {
      diagnostico: `Se revisó el equipo ${equipo} para identificar el problema reportado.`,
      trabajo_realizado:
        'Se realizó revisión técnica, pruebas básicas de funcionamiento y evaluación del estado del equipo.',
      recomendaciones:
        'Proceder según diagnóstico técnico y presupuesto aprobado por el cliente.',
      garantia: '',
      garantia_dias: 0,
      estado_equipo: 'pendiente_revision'
    }
  }

  const plantilla = plantillas[tipo]
  if (!plantilla) return
  detalleForm.value = { ...detalleForm.value, ...plantilla }
  detalleForm.value.garantia_inicio =
    detalleForm.value.garantia_inicio ||
    detalleForm.value.fecha_entrega ||
    date.formatDate(new Date(), 'YYYY-MM-DD')
  actualizarGarantiaDetalle()
  sincronizarItemPrincipalConCita()
}

const irTabSiguiente = () => {
  const tabs = ['datos', 'trabajo', 'decision', 'resumen', 'pago']
  const actual = tabs.indexOf(tabFormulario.value)
  if (actual >= 0 && actual < tabs.length - 1) {
    tabFormulario.value = tabs[actual + 1]
  }
}

const irTabAnterior = () => {
  const tabs = ['datos', 'trabajo', 'decision', 'resumen', 'pago']
  const actual = tabs.indexOf(tabFormulario.value)
  if (actual > 0) tabFormulario.value = tabs[actual - 1]
}

const abrirCrear = async () => {
  modo.value = 'crear'
  limpiarFormulario()
  await cargarCombos()
  dialogo.value = true
}

const abrirVer = async item => {
  modo.value = 'ver'
  citaId.value = item.id
  await cargarCombos()
  const [cita, documento] = await Promise.all([
    cargarCitaCompleta(item.id),
    cargarDocumento(item.id)
  ])
  form.value = prepararFormulario(cita)
  documentoPayload.value = documento
  tabFormulario.value = 'resumen'
  dialogo.value = true
}

const abrirEditar = async item => {
  modo.value = 'editar'
  citaId.value = item.id
  await cargarCombos()
  const [cita, documento] = await Promise.all([
    cargarCitaCompleta(item.id),
    cargarDocumento(item.id)
  ])
  form.value = prepararFormulario(cita)
  documentoPayload.value = documento
  tabFormulario.value = 'datos'
  dialogo.value = true
}

const abrirPagoAtencion = async item => {
  modo.value = 'ver'
  citaId.value = item.id
  await cargarCombos()
  const [cita, documento] = await Promise.all([
    cargarCitaCompleta(item.id),
    cargarDocumento(item.id)
  ])
  form.value = prepararFormulario(cita)
  documentoPayload.value = documento
  tabFormulario.value = 'pago'
  dialogo.value = true
}

const guardarCitaYAbrirDetalle = () => {
  guardarYAbrirDetalle.value = true
  guardarCita()
}

const guardarCitaYAbrirPago = () => {
  guardarYAbrirPago.value = true
  guardarCita()
}

const guardarBorradorAtencion = async () => {
  if (!form.value.cliente_id || !form.value.fecha) {
    $q.notify({ type: 'warning', message: 'Cliente y fecha son obligatorios' })
    tabFormulario.value = 'datos'
    return
  }

  recalcularTotalForm()
  try {
    const response = citaId.value
      ? await api.put(`/citas/${citaId.value}`, form.value)
      : await api.post('/citas', form.value)
    const citaGuardada = response.data.data
    citaId.value = citaGuardada.id
    modo.value = 'editar'
    form.value = prepararFormulario(citaGuardada)
    tabFormulario.value = 'decision'
    await cargarCitas()
    $q.notify({
      type: 'positive',
      message: 'Cita y propuesta guardadas. Registra ahora la decisión.'
    })
  } catch (err) {
    $q.notify({
      type: 'negative',
      message: extraerMensajeError(err, 'No se pudo guardar la atención')
    })
  }
}

const guardarDecision = async () => {
  if (!citaId.value) return
  if (
    form.value.decision_cliente === 'rechazado' &&
    !String(form.value.motivo_rechazo || '').trim()
  ) {
    $q.notify({
      type: 'warning',
      message: 'Escribe el motivo del rechazo para cerrar la atención.'
    })
    return
  }

  recalcularTotalForm()
  try {
    await api.put(`/citas/${citaId.value}`, form.value)
    const response = await api.put(`/citas/${citaId.value}/decision`, {
      decision_cliente: form.value.decision_cliente,
      motivo_rechazo: form.value.motivo_rechazo || null
    })
    form.value = prepararFormulario(response.data.data)
    await cargarCitas()
    $q.notify({ type: 'positive', message: response.data.mensaje })
    if (form.value.decision_cliente === 'aceptado') {
      tabFormulario.value = 'resumen'
    }
  } catch (err) {
    $q.notify({
      type: 'negative',
      message: extraerMensajeError(err, 'No se pudo guardar la decisión')
    })
  }
}

const guardarCita = async () => {
  if (!form.value.cliente_id || !form.value.fecha) {
    $q.notify({ type: 'warning', message: 'Cliente y fecha son obligatorios' })
    tabFormulario.value = 'datos'
    guardarYAbrirDetalle.value = false
    guardarYAbrirPago.value = false
    return
  }

  recalcularTotalForm()
  try {
    const response =
      modo.value === 'crear'
        ? await api.post('/citas', form.value)
        : await api.put(`/citas/${citaId.value}`, form.value)

    const citaGuardada = response.data.data
    $q.notify({ type: 'positive', message: 'Atención guardada correctamente' })
    dialogo.value = false
    limpiarFormulario()
    await cargarCitas()

    if (guardarYAbrirDetalle.value && citaGuardada?.id) {
      await abrirDetalleTecnico(citaGuardada)
    } else if (guardarYAbrirPago.value && citaGuardada?.id) {
      await abrirPagoAtencion(citaGuardada)
    }
  } catch (err) {
    $q.notify({
      type: 'negative',
      message: extraerMensajeError(err, 'No se pudo guardar la atención')
    })
  } finally {
    guardarYAbrirDetalle.value = false
    guardarYAbrirPago.value = false
  }
}

const abrirDetalleTecnico = async item => {
  try {
    await cargarCombos()
    const cita = await cargarCitaCompleta(item.id)
    const detalle = cita.detalle_tecnico || cita.detalleTecnico || {}
    citaDetalle.value = cita
    const itemsDetalle = sanitizarItems(detalle.items)
    edicionItemsManual.value = false
    detalleForm.value = {
      ...detalleInicial,
      ...detalle,
      cita_id: cita.id,
      tecnico_id:
        detalle.tecnico_id || cita.tecnico_id || cita.tecnico?.id || null,
      fecha_entrega:
        detalle.fecha_entrega || date.formatDate(new Date(), 'YYYY-MM-DD'),
      garantia_inicio:
        detalle.garantia_inicio ||
        detalle.fecha_entrega ||
        date.formatDate(new Date(), 'YYYY-MM-DD'),
      items: itemsDetalle.length ? itemsDetalle : crearItemsDesdeCita(cita),
      evidencias: Array.isArray(detalle.evidencias) ? detalle.evidencias : []
    }
    actualizarGarantiaDetalle()
    dialogoDetalle.value = true
  } catch (err) {
    $q.notify({
      type: 'negative',
      message: extraerMensajeError(err, 'No se pudo abrir el detalle técnico')
    })
  }
}

const guardarDetalleTecnico = async ({
  cerrar = false,
  mostrarMensaje = true
} = {}) => {
  if (!detalleForm.value.cita_id) return false
  guardandoDetalle.value = true
  try {
    actualizarGarantiaDetalle()
    detalleForm.value.items = prepararItemsParaGuardar()
    const response = await api.post('/detalle-tecnicos', detalleForm.value)
    const detalleGuardado = response.data.data
    detalleForm.value = {
      ...detalleForm.value,
      ...detalleGuardado,
      evidencias: Array.isArray(detalleGuardado.evidencias)
        ? detalleGuardado.evidencias
        : [],
      items: sanitizarItems(detalleGuardado.items).length
        ? sanitizarItems(detalleGuardado.items)
        : detalleForm.value.items
    }
    if (citaDetalle.value) {
      citaDetalle.value.detalle_tecnico = detalleForm.value
      citaDetalle.value.detalleTecnico = detalleForm.value
    }
    if (Number(citaId.value) === Number(detalleForm.value.cita_id)) {
      form.value.detalle_tecnico = detalleForm.value
      form.value.detalleTecnico = detalleForm.value
    }
    if (mostrarMensaje)
      $q.notify({
        type: 'positive',
        message: 'Detalle técnico guardado correctamente'
      })
    await cargarCitas()
    if (cerrar) dialogoDetalle.value = false
    return true
  } catch (err) {
    $q.notify({
      type: 'negative',
      message: extraerMensajeError(err, 'No se pudo guardar el detalle técnico')
    })
    return false
  } finally {
    guardandoDetalle.value = false
  }
}

const guardarDetalleYFinalizar = async () => {
  const guardado = await guardarDetalleTecnico({ mostrarMensaje: false })
  if (!guardado || !detalleForm.value.cita_id) return

  try {
    await api.put(`/citas/${detalleForm.value.cita_id}/finalizar`)
    dialogoDetalle.value = false
    await cargarCitas()
    $q.notify({
      type: 'positive',
      message: 'Servicio guardado y finalizado. Ya puedes registrar el pago.'
    })
  } catch (err) {
    $q.notify({
      type: 'negative',
      message: extraerMensajeError(
        err,
        'El detalle se guardó, pero no se pudo finalizar el servicio.'
      )
    })
  }
}

const subirFotoEvidencia = async () => {
  if (!fotoEvidencia.value) {
    $q.notify({ type: 'warning', message: 'Selecciona una foto primero' })
    return
  }

  if (!detalleForm.value.id) {
    const guardado = await guardarDetalleTecnico({ mostrarMensaje: false })
    if (!guardado || !detalleForm.value.id) return
  }

  const formData = new FormData()
  formData.append('foto', fotoEvidencia.value)
  formData.append('tipo', evidenciaTipo.value || 'antes')
  if (evidenciaDescripcion.value)
    formData.append('descripcion', evidenciaDescripcion.value)

  evidenciaSubiendo.value = true
  try {
    const response = await api.post(
      `/detalle-tecnicos/${detalleForm.value.id}/evidencias`,
      formData,
      {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 60000
      }
    )
    const detalleActualizado = response.data.data
    detalleForm.value = {
      ...detalleForm.value,
      ...detalleActualizado,
      evidencias: Array.isArray(detalleActualizado.evidencias)
        ? detalleActualizado.evidencias
        : []
    }
    if (citaDetalle.value) {
      citaDetalle.value.detalle_tecnico = detalleForm.value
      citaDetalle.value.detalleTecnico = detalleForm.value
    }
    fotoEvidencia.value = null
    evidenciaDescripcion.value = ''
    $q.notify({ type: 'positive', message: 'Foto agregada al expediente' })
    await cargarCitas()
  } catch (err) {
    $q.notify({
      type: 'negative',
      message: extraerMensajeError(
        err,
        'No se pudo subir la foto. Verifica que sea JPG, PNG, WEBP, GIF o BMP y menor a 8 MB.'
      )
    })
  } finally {
    evidenciaSubiendo.value = false
  }
}

const eliminarFotoEvidencia = (evidencia, index) => {
  if (!detalleForm.value.id) return
  $q.dialog({
    title: 'Eliminar foto',
    message: `¿Eliminar esta foto ${etiquetaEvidencia(evidencia.tipo).toLowerCase()} del expediente?`,
    cancel: true,
    persistent: true
  }).onOk(async () => {
    try {
      const evidenciaId = evidencia.id || index
      const response = await api.delete(
        `/detalle-tecnicos/${detalleForm.value.id}/evidencias/${evidenciaId}`
      )
      const detalleActualizado = response.data.data
      detalleForm.value = {
        ...detalleForm.value,
        ...detalleActualizado,
        evidencias: Array.isArray(detalleActualizado.evidencias)
          ? detalleActualizado.evidencias
          : []
      }
      $q.notify({ type: 'positive', message: 'Foto eliminada correctamente' })
      await cargarCitas()
    } catch (err) {
      $q.notify({
        type: 'negative',
        message: extraerMensajeError(err, 'No se pudo eliminar la foto')
      })
    }
  })
}

const abrirDocumento = async item => {
  documentoLoading.value = true
  documentoPayload.value = null
  tipoDocumento.value = 'nota'
  dialogoDocumento.value = true
  try {
    documentoPayload.value = await cargarDocumento(item.id)
  } catch (err) {
    $q.notify({
      type: 'negative',
      message: extraerMensajeError(err, 'No se pudo cargar el documento')
    })
    dialogoDocumento.value = false
  } finally {
    documentoLoading.value = false
  }
}

const abrirDocumentoDesdeDetalle = async () => {
  if (!detalleForm.value.cita_id) return
  dialogoDetalle.value = false
  await abrirDocumento({ id: detalleForm.value.cita_id })
  tipoDocumento.value = 'expediente'
}

const finalizarServicioActual = async () => {
  if (!citaId.value) return
  try {
    const response = await api.put(`/citas/${citaId.value}/finalizar`)
    form.value = prepararFormulario(response.data.data)
    documentoPayload.value = await cargarDocumento(citaId.value)
    await cargarCitas()
    tabFormulario.value = 'pago'
    $q.notify({
      type: 'positive',
      message: 'Servicio finalizado. El pago quedó habilitado.'
    })
  } catch (err) {
    $q.notify({
      type: 'negative',
      message: extraerMensajeError(
        err,
        'No se pudo finalizar el servicio. Verifica el trabajo realizado.'
      )
    })
  }
}

const finalizarCita = item => {
  $q.dialog({
    title: 'Marcar como terminado',
    message: `¿Marcar como terminado el trabajo de ${item.cliente?.nombre || 'este cliente'}?`,
    cancel: true,
    persistent: true
  }).onOk(async () => {
    try {
      await api.put(`/citas/${item.id}/finalizar`)
      $q.notify({
        type: 'positive',
        message: 'Atención marcada como terminada'
      })
      cargarCitas()
    } catch (err) {
      $q.notify({
        type: 'negative',
        message: extraerMensajeError(err, 'No se pudo finalizar la atención')
      })
    }
  })
}

const eliminarCita = item => {
  $q.dialog({
    title: 'Confirmar eliminación',
    message: `¿Eliminar la atención de ${item.cliente?.nombre || 'este cliente'}?`,
    cancel: true,
    persistent: true
  }).onOk(async () => {
    try {
      await api.delete(`/citas/${item.id}`)
      $q.notify({
        type: 'positive',
        message: 'Atención eliminada correctamente'
      })
      cargarCitas()
    } catch (err) {
      $q.notify({
        type: 'negative',
        message: extraerMensajeError(err, 'No se pudo eliminar la atención')
      })
    }
  })
}

const normalizarTelefono = telefono => {
  const digitos = String(telefono || '').replace(/\D/g, '')
  if (!digitos) return ''
  if (digitos.startsWith('591')) return digitos
  if (digitos.length <= 8) return `591${digitos}`
  return digitos
}

const mensajeWhatsapp = (cita, tipo = 'resumen') => {
  const detalle = cita.detalle_tecnico || cita.detalleTecnico || {}
  const items = obtenerItemsDocumento(cita)
  const totalItems = items.reduce(
    (sum, item) => sum + Number(item.subtotal || 0),
    0
  )
  const total = Number(cita.total ?? totalItems ?? 0).toFixed(2)
  const pagado = Number(
    (cita.pagos || [])
      .filter(pago => pago.estado === 'pagado')
      .reduce((sum, pago) => sum + Number(pago.monto || 0), 0)
  ).toFixed(2)
  const saldo = Math.max(Number(total) - Number(pagado), 0).toFixed(2)
  const estado = textoEstado(cita.estado)
  const garantia = resumenGarantia(detalle)
  const garantiaTexto = detalle.garantia
    ? `
Garantía: ${detalle.garantia}${garantia.aplica ? ` (vence ${formatearFecha(garantia.vence)})` : ''}`
    : ''
  const recomendaciones = detalle.recomendaciones
    ? `
Recomendaciones: ${detalle.recomendaciones}`
    : ''
  const nombre = cita.cliente?.nombre || ''
  const equipo = resumenEquipo(cita.equipo)
  const servicio = cita.servicio?.nombre || 'Servicio técnico'

  const mensajes = {
    resumen: `Hola ${nombre}, Electro Frío le envía el resumen del servicio realizado.

Equipo: ${equipo}
Servicio: ${servicio}
Estado: ${estado}
Total: Bs ${total}${garantiaTexto}${recomendaciones}

Gracias por confiar en Electro Frío.`,
    terminado: `Hola ${nombre}, le informamos que el trabajo de su equipo ya está marcado como ${estado}.

Equipo: ${equipo}
Servicio: ${servicio}
Total: Bs ${total}
Saldo pendiente: Bs ${saldo}

Puede pasar a recoger/coordinar entrega cuando guste. Electro Frío, tu técnico de confianza.`,
    cobro: `Hola ${nombre}, Electro Frío le recuerda el saldo de su servicio técnico.

Equipo: ${equipo}
Servicio: ${servicio}
Total: Bs ${total}
Pagado: Bs ${pagado}
Saldo pendiente: Bs ${saldo}

Gracias.`,
    garantia: `Hola ${nombre}, le compartimos la información de garantía de su servicio.

Equipo: ${equipo}
Servicio: ${servicio}
${detalle.garantia ? `Garantía: ${detalle.garantia}` : 'Garantía: no registrada'}${
      garantia.aplica
        ? `
Vence: ${formatearFecha(garantia.vence)}
Estado: ${garantia.label}`
        : ''
    }

Conserve su nota/proforma o expediente técnico. Electro Frío, tu técnico de confianza.`
  }

  return mensajes[tipo] || mensajes.resumen
}

const abrirWhatsapp = (cita, tipo = 'resumen') => {
  const telefono = normalizarTelefono(cita.cliente?.telefono)
  const texto = encodeURIComponent(mensajeWhatsapp(cita, tipo))
  const url = telefono
    ? `https://wa.me/${telefono}?text=${texto}`
    : `https://wa.me/?text=${texto}`
  window.open(url, '_blank')
}

const enviarWhatsappDesdeFila = async (item, tipo = 'resumen') => {
  try {
    const data = await cargarDocumento(item.id)
    abrirWhatsapp(data.cita, tipo)
  } catch (err) {
    $q.notify({
      type: 'negative',
      message: extraerMensajeError(err, 'No se pudo preparar WhatsApp')
    })
  }
}

const enviarWhatsappDocumento = (tipo = 'resumen') => {
  if (!documentoCita.value) return
  abrirWhatsapp(documentoCita.value, tipo)
}

const escapeHtml = value =>
  String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')

const generarHtmlDocumento = () => {
  const cita = documentoCita.value
  if (!cita) return ''

  const detalle = cita.detalle_tecnico || cita.detalleTecnico || {}
  const resumen = documentoResumen.value
  const garantiaInfo = resumenGarantia(detalle)
  const titulo =
    tipoDocumento.value === 'nota'
      ? 'NOTA DE VENTA / PROFORMA'
      : 'EXPEDIENTE TÉCNICO'
  const items = obtenerItemsDocumento(cita)
  const totalItems = items.reduce(
    (sum, item) => sum + Number(item.subtotal || 0),
    0
  )
  const totalCalculado = Number(resumen.total ?? cita.total ?? totalItems ?? 0)
  const descuento = Number(cita.descuento || 0)
  const total = Number(totalCalculado || 0).toFixed(2)
  const pagado = Number(resumen.monto_pagado || 0).toFixed(2)
  const saldo = Math.max(
    Number(totalCalculado || 0) - Number(resumen.monto_pagado || 0),
    0
  ).toFixed(2)
  const mostrarExpediente = tipoDocumento.value === 'expediente'
  const evidencias = Array.isArray(detalle.evidencias) ? detalle.evidencias : []
  const evidenciasHtml = evidencias
    .map(
      (evidencia, index) => `
    <div class="evidence-item">
      <div class="evidence-label">${escapeHtml(etiquetaEvidencia(evidencia.tipo))}</div>
      <img src="${escapeHtml(urlEvidencia(evidencia, detalle, index))}" alt="${escapeHtml(etiquetaEvidencia(evidencia.tipo))}">
      <div class="evidence-caption">${escapeHtml(evidencia.descripcion || evidencia.nombre_original || 'Evidencia del servicio')}</div>
    </div>`
    )
    .join('')

  const filasItems = items
    .map(
      item => `
    <tr>
      <td>${escapeHtml(`${Number(item.cantidad || 0)} ${item.unidad || ''}`)}</td>
      <td>${escapeHtml(item.descripcion || 'Servicio técnico')}</td>
      <td class="right">${Number(item.precio_unitario || 0).toFixed(2)}</td>
      <td class="right">${Number(item.subtotal || 0).toFixed(2)}</td>
    </tr>`
    )
    .join('')

  const fila = (label, value) =>
    `<div class="row"><span>${escapeHtml(label)}</span><strong>${escapeHtml(value || 'Sin registrar')}</strong></div>`

  return `<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <title>${escapeHtml(titulo)} - Electro Frío</title>
  <style>
    * { box-sizing: border-box; }
    body { margin: 0; padding: 28px; font-family: Arial, sans-serif; color: #111; background: #fff; }
    .paper { max-width: 820px; min-height: 1050px; margin: 0 auto; padding: 28px 34px; background: #fff; }
    .top { display: flex; align-items: center; justify-content: space-between; gap: 18px; margin-bottom: 18px; }
    .brand { display: flex; align-items: center; gap: 14px; }
    .logo { width: 72px; height: 72px; border-radius: 14px; object-fit: cover; border: 1px solid #ddd; }
    .company { font-size: 30px; font-weight: 900; letter-spacing: .04em; color: #0a6b67; line-height: 1; }
    .slogan { margin-top: 4px; font-size: 13px; letter-spacing: .12em; color: #333; text-transform: uppercase; }
    .contact { margin-top: 4px; font-size: 12px; color: #555; }
    h1 { margin: 16px 0 22px; text-align: center; font-size: 24px; letter-spacing: .03em; }
    .meta { margin: 0 0 16px; font-size: 13px; line-height: 1.4; }
    .meta strong { font-weight: 800; }
    table { width: 100%; border-collapse: collapse; margin-top: 8px; font-size: 13px; }
    th, td { border: 1px solid #333; padding: 7px 8px; vertical-align: top; }
    th { background: #d9d9d9; text-align: left; font-weight: 800; }
    .right { text-align: right; }
    .total { margin-top: 22px; font-size: 18px; font-weight: 900; font-style: italic; }
    .literal { margin-top: 10px; font-size: 13px; }
    .payment { margin-top: 6px; color: #555; font-size: 12px; }
    .section { margin-top: 18px; border: 1px solid #cfcfcf; padding: 12px; border-radius: 8px; font-size: 13px; }
    .section-title { font-weight: 900; color: #0a6b67; text-transform: uppercase; margin-bottom: 8px; }
    .row { display: flex; justify-content: space-between; gap: 18px; border-bottom: 1px dashed #ddd; padding: 5px 0; }
    .row span { color: #555; }
    .row strong { text-align: right; max-width: 68%; }
    .text { white-space: pre-line; line-height: 1.45; }
    .evidence-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; margin-top: 10px; }
    .evidence-item { border: 1px solid #ddd; border-radius: 8px; overflow: hidden; page-break-inside: avoid; }
    .evidence-label { background: #0a6b67; color: white; font-weight: 800; padding: 6px 8px; font-size: 12px; text-transform: uppercase; }
    .evidence-item img { width: 100%; height: 210px; object-fit: cover; display: block; }
    .evidence-caption { padding: 7px 8px; font-size: 12px; color: #333; }
    .empty-evidence { margin-top: 10px; padding: 10px; border: 1px dashed #84bff5; border-radius: 8px; color: #0b5794; font-size: 13px; }
    .signatures { display: grid; grid-template-columns: 1fr 1fr; gap: 80px; margin-top: 84px; font-size: 13px; }
    .signature { border-top: 1px solid #333; padding-top: 8px; text-align: left; }
    @media print { body { padding: 0; } .paper { max-width: none; min-height: auto; padding: 22px 32px; } }
  
.fast-flow-banner { border: 1px solid rgba(25, 118, 210, .16); }
.selected-context-card { background: linear-gradient(135deg, #ffffff 0%, #eef8ff 100%); border-color: rgba(25, 118, 210, .18); }
.quick-preset-btn { min-height: 44px; border-radius: 12px; }
.proforma-items-card { background: #fbfdff; }
.evidence-card { background: #fbfdff; border-color: rgba(25, 118, 210, .16); }
.evidence-thumb-card, .doc-evidence-card { border-radius: 12px; overflow: hidden; }
.evidence-img, .doc-evidence-img { background: #eef5fb; }
.evidence-document-box { background: #fff; }
.workflow-mini-card { cursor: pointer; border-radius: 16px; transition: transform .15s ease, box-shadow .15s ease; }
.workflow-mini-card:hover { transform: translateY(-2px); box-shadow: 0 8px 22px rgba(15, 76, 129, .12); }
.workflow-mini-card--active { outline: 2px solid var(--q-primary); background: #eef8ff; }
</style>
</head>
<body>
  <div class="paper">
    <div class="top">
      <div class="brand">
        <img src="${escapeHtml(logoElectroFrio)}" class="logo" alt="Electro Frío">
        <div>
          <div class="company">ELECTROFRÍO</div>
          <div class="slogan">Tu técnico de confianza</div>
          <div class="contact">Tec. Enrique Guzmán · 73907925</div>
        </div>
      </div>
      <div class="meta" style="text-align:right">
        <div><strong>N.º:</strong> ${escapeHtml(cita.id)}</div>
        <div><strong>Fecha:</strong> ${escapeHtml(formatearFecha(cita.fecha) || formatearFecha(new Date()))}</div>
      </div>
    </div>

    <h1>${escapeHtml(titulo)} N.º ${escapeHtml(cita.id)}</h1>

    <div class="meta">
      <div><strong>Empresa:</strong> ELECTROFRÍO</div>
      <div><strong>Fecha:</strong> ${escapeHtml(formatearFecha(cita.fecha) || formatearFecha(new Date()))}</div>
      <div><strong>Cliente:</strong> ${escapeHtml(cita.cliente?.nombre || 'Sin cliente')}</div>
      <div><strong>Teléfono:</strong> ${escapeHtml(cita.cliente?.telefono || 'No registrado')}</div>
      <div><strong>Dirección de visita:</strong> ${escapeHtml(cita.direccion_servicio || cita.cliente?.direccion || 'No registrada')}</div>
      <div><strong>Equipo:</strong> ${escapeHtml(resumenEquipo(cita.equipo))}${cita.equipo?.serie ? ` · Serie: ${escapeHtml(cita.equipo.serie)}` : ''}</div>
    </div>

    <table>
      <thead>
        <tr>
          <th style="width: 90px">Cantidad</th>
          <th>Descripción</th>
          <th style="width: 120px" class="right">P. Unit. (Bs)</th>
          <th style="width: 120px" class="right">Subtotal (Bs)</th>
        </tr>
      </thead>
      <tbody>${filasItems}</tbody>
    </table>

    ${descuento > 0 ? `<div class="payment">Descuento aplicado: Bs ${descuento.toFixed(2)}</div>` : ''}
    <div class="total">TOTAL: Bs ${total}</div>
    <div class="literal"><strong>SON:</strong> ${escapeHtml(montoEnLiteral(Number(total)))}</div>
    <div class="payment">Pagado: Bs ${pagado} · Saldo pendiente: Bs ${saldo}</div>

    ${
        mostrarExpediente
          ? `
    <div class="section">
      <div class="section-title">Detalle técnico</div>
      <div class="text"><strong>Diagnóstico:</strong> ${escapeHtml(detalle.diagnostico || 'Sin registrar')}</div><br>
      <div class="text"><strong>Trabajo realizado:</strong> ${escapeHtml(detalle.trabajo_realizado || 'Sin registrar')}</div><br>
      ${fila('Estado del equipo', textoEstadoEquipo(detalle.estado_equipo))}
      ${fila('Repuestos', detalle.repuestos)}
      ${fila('Garantía', detalle.garantia)}
      ${fila('Condiciones de garantía', detalle.condiciones_garantia)}
      ${fila('Fecha entrega', formatearFecha(detalle.fecha_entrega))}
      ${garantiaInfo.aplica ? fila('Vence garantía', `${formatearFecha(garantiaInfo.vence)} · ${garantiaInfo.label}`) : ''}
      <div class="text"><strong>Recomendaciones:</strong> ${escapeHtml(detalle.recomendaciones || 'Sin registrar')}</div>
    </div>

    <div class="section">
      <div class="section-title">Evidencia fotográfica</div>
      ${evidencias.length ? `<div class="evidence-grid">${evidenciasHtml}</div>` : '<div class="empty-evidence">Sin fotos cargadas en este expediente.</div>'}
    </div>`
          : ''
      }

    <div class="signatures">
      <div class="signature">Firma del Cliente</div>
      <div class="signature">Firma técnico / sello</div>
    </div>
  </div>
</body>
</html>`
}

const imprimirDocumento = () => {
  const html = generarHtmlDocumento()
  if (!html) return
  const ventana = window.open('', '_blank')
  if (!ventana) {
    $q.notify({
      type: 'warning',
      message: 'El navegador bloqueó la ventana de impresión.'
    })
    return
  }
  ventana.document.open()
  ventana.document.write(html)
  ventana.document.close()
  ventana.focus()

  const imagenes = Array.from(ventana.document.images || [])
  const esperarImagenes = imagenes.map(img => {
    if (img.complete) return Promise.resolve()
    return new Promise(resolve => {
      img.onload = resolve
      img.onerror = resolve
    })
  })

  Promise.all(esperarImagenes).finally(() => {
    setTimeout(() => ventana.print(), 450)
  })
}

onMounted(async () => {
  const etapaDesdePanel = String(route.query.etapa || '')
  const estadoDesdePanel = String(route.query.estado || '')
  const etapaLegacy = {
    pendiente: 'cita',
    revision: 'diagnostico',
    en_proceso: 'servicio',
    esperando_repuesto: 'servicio',
    terminado: 'pago',
    concluida: 'pago',
    entregado: 'garantia',
    cancelada: 'cerrada'
  }[estadoDesdePanel]
  const etapaInicial = etapaDesdePanel || etapaLegacy
  if (flujoEtapas.some(opcion => opcion.value === etapaInicial)) {
    estadoFiltro.value = etapaInicial
  }

  const vistaDesdePanel = String(route.query.vista || '')
  if (vistaOptions.some(opcion => opcion.value === vistaDesdePanel)) {
    vistaFiltro.value = vistaDesdePanel
  }

  await Promise.all([cargarCitas(), cargarCombos()])

  const citaParaAbrir = Number(route.query.abrir || 0)
  if (citaParaAbrir) {
    await abrirVer({ id: citaParaAbrir })
    return
  }

  if (route.query.nueva === '1') {
    modo.value = 'crear'
    limpiarFormulario()
    const clienteDesdeRuta = Number(route.query.cliente_id || 0)
    if (
      clienteDesdeRuta &&
      clientes.value.some(cliente => Number(cliente.id) === clienteDesdeRuta)
    ) {
      form.value.cliente_id = clienteDesdeRuta
      seleccionarCliente()
    }
    dialogo.value = true
  }
})
</script>

<style scoped>
.workflow-map {
  overflow: hidden;
  border: 1px solid rgba(25, 118, 210, 0.14);
  background: linear-gradient(135deg, #ffffff 0%, #f3faff 100%);
}
.workflow-map__grid {
  display: grid;
  grid-template-columns: repeat(7, minmax(145px, 1fr));
  gap: 10px;
  overflow-x: auto;
  padding: 2px 2px 8px;
}
.workflow-step {
  position: relative;
  display: flex;
  min-width: 145px;
  min-height: 76px;
  align-items: center;
  gap: 9px;
  padding: 12px 10px;
  border: 1px solid rgba(15, 76, 129, 0.14);
  border-radius: 14px;
  color: #163447;
  text-align: left;
  background: #ffffff;
  cursor: pointer;
  transition:
    transform 0.15s ease,
    border-color 0.15s ease,
    box-shadow 0.15s ease;
}
.workflow-step:hover,
.workflow-step--active {
  transform: translateY(-2px);
  border-color: var(--q-primary);
  box-shadow: 0 8px 20px rgba(15, 76, 129, 0.12);
}
.workflow-step__number {
  position: absolute;
  top: 6px;
  right: 8px;
  color: rgba(15, 76, 129, 0.34);
  font-size: 12px;
  font-weight: 800;
}
.workflow-step__copy {
  display: flex;
  min-width: 0;
  flex-direction: column;
}
.workflow-step__copy small {
  color: #667b8a;
  line-height: 1.2;
}
.decision-option {
  display: flex;
  width: 100%;
  min-height: 132px;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  gap: 6px;
  padding: 14px;
  border: 1px solid #d6e2ea;
  border-radius: 14px;
  color: #244052;
  text-align: center;
  background: #ffffff;
  cursor: pointer;
}
.decision-option small {
  color: #6b7f8d;
}
.decision-option:hover,
.decision-option--active {
  border-color: var(--q-primary);
  background: #eef8ff;
  box-shadow: 0 8px 18px rgba(15, 76, 129, 0.1);
}
.decision-option:disabled {
  cursor: default;
}
.total-proposal-card,
.warranty-card {
  height: 100%;
  background: linear-gradient(145deg, #ffffff 0%, #f4fbfd 100%);
}
.fast-flow-banner {
  border: 1px solid rgba(25, 118, 210, 0.16);
}
.selected-context-card {
  background: linear-gradient(135deg, #ffffff 0%, #eef8ff 100%);
  border-color: rgba(25, 118, 210, 0.18);
}
.quick-preset-btn {
  min-height: 44px;
  border-radius: 12px;
}
.proforma-items-card {
  background: #fbfdff;
}
.evidence-card {
  background: #fbfdff;
  border-color: rgba(25, 118, 210, 0.16);
}
.evidence-thumb-card,
.doc-evidence-card {
  border-radius: 12px;
  overflow: hidden;
}
.evidence-img,
.doc-evidence-img {
  background: #eef5fb;
}
.evidence-document-box {
  background: #fff;
}
.workflow-mini-card {
  cursor: pointer;
  border-radius: 16px;
  transition:
    transform 0.15s ease,
    box-shadow 0.15s ease;
}
.workflow-mini-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 22px rgba(15, 76, 129, 0.12);
}
.workflow-mini-card--active {
  outline: 2px solid var(--q-primary);
  background: #eef8ff;
}
.payment-summary-card {
  min-height: 102px;
  background: linear-gradient(145deg, #ffffff 0%, #f4fbfd 100%);
  border-color: rgba(9, 113, 134, 0.18);
}
.qr-payment-screen {
  min-height: 100vh;
  color: white;
  background:
    radial-gradient(
      circle at 50% 30%,
      rgba(86, 218, 236, 0.2),
      transparent 36%
    ),
    linear-gradient(145deg, #082d40 0%, #07566b 55%, #08778a 100%);
}
.qr-screen-header {
  background: rgba(4, 38, 54, 0.74);
  border-bottom: 1px solid rgba(145, 235, 246, 0.24);
}
.qr-screen-body {
  min-height: calc(100vh - 79px);
  padding: 28px 18px;
}
.qr-brand-card {
  width: min(620px, 96vw);
  padding: 18px;
  border: 4px solid #62d9ee;
  border-radius: 28px;
  color: #163447;
  background: white;
  box-shadow:
    0 0 0 8px rgba(98, 217, 238, 0.14),
    0 28px 70px rgba(0, 13, 24, 0.42);
}
.qr-brand-title {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 2px 0 14px;
  color: #075f76;
  font-size: 22px;
  font-weight: 900;
  letter-spacing: 0.08em;
}
.qr-bank-crop {
  width: 100%;
  box-sizing: border-box;
  padding: 24px;
  aspect-ratio: 1;
  border: 2px solid #d6eef3;
  border-radius: 18px;
  background: white;
}
.qr-bank-window {
  position: relative;
  width: 100%;
  overflow: hidden;
  aspect-ratio: 1;
}
.qr-bank-source {
  position: absolute;
  top: -41.37%;
  left: -20.59%;
  width: 141.18%;
  max-width: none;
}
.qr-payment-copy {
  padding: 16px 8px 4px;
  text-align: center;
}
@media (max-width: 600px) {
  .qr-screen-body {
    padding: 14px 10px;
  }
  .qr-brand-card {
    padding: 12px;
    border-width: 3px;
    border-radius: 22px;
  }
  .qr-bank-crop {
    padding: 16px;
  }
  .qr-brand-title {
    padding-bottom: 10px;
    font-size: 18px;
  }
}
</style>
