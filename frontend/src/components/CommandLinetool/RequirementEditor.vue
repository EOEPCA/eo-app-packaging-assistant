<template>
  <div>
    <b-modal
      @hide="closeModalForm"
      ref="modal-form"
      id="requirement-modal"
      :title="modalTitleProp"
      align-h="end"
      hide-footer
      size="lg"
    >
      <requirement-form
        :allow-workflow-req="allowWorkflowReq"
        :requirement-prop="selectedElement"
        @onEdit="onEditRequirement"
        @onAdd="onAddRequirement"
        @onClose="closeModalForm"
      />
    </b-modal>
    <div class="card-section" id="clt-requirements">
      <div
        class="title" v-b-toggle="`collapse-requirements-${pos}`"
        v-b-tooltip.hover.window.html="getHelper('requirements')"
      >
        Requirements
      </div>
      <b-collapse :id="`collapse-requirements-${pos}`" :visible="collapsedProp">
        <b-table
          :fields="requirementsTableFields"
          :items="Object.entries(requirementsProp).sort((a, b) => a[0].localeCompare(b[0]))"
          small show-empty
        >
          <template #cell(type)="data">
            {{ data.item[0] }}
          </template>
          <template #cell(options)="data">
            <ul>
              <li v-for="input in Object.entries(data.item[1].envDef || data.item[1])" :key="input._key">
                {{`${input[0]}: ${input[1]}`}}
              </li>
            </ul>
          </template>
          <template #cell(action)="data">
            <b-btn
              variant="primary" @click="edit(data.item, data.item[0])"
              class="mr-2" size="sm"
            >
              <fa-icon icon="edit"></fa-icon>
            </b-btn>
            <b-btn variant="danger" @click="removeElement(data.item[0])" size="sm">
              <fa-icon icon="times"></fa-icon>
            </b-btn>
          </template>
          <template #empty>
            <div class="text-center mt-2"><i>There are no requirements to show.</i></div>
          </template>
        </b-table>
        <div class="col" align="right">
          <b-btn
            class="add-btn"
            variant="outline-success"
            @click="showModalForm"
            size="sm"
          >
            <fa-icon icon="plus"/>
            <span class="ml-2">Add requirement</span>
          </b-btn>
        </div>
      </b-collapse>
    </div>
  </div>
</template>

<script>

import RequirementForm from "./RequirementForm";

export default {
  name: "RequirementEditor",
  components: {RequirementForm},
  props: {
    allowWorkflowReq: {
      type: Boolean,
      default: false,
    },
    requirementsProp: Object,
    modalTitleProp: {
      type: String,
      default: 'Requirements',
    },
    collapsedProp: {
      type: Boolean,
      default: true,
    },
    pos: Number
  },
  data() {
    return {
      requirementsTableFields: [
        {key: 'type', label: 'Type', thStyle: {width: "30%"}},
        {key: 'options', label: 'Options', thStyle: {width: "55%"}},
        {key: 'action', label: '', thStyle: {width: "15%"}},
      ],
      selectedElement: undefined,
      selectedElementIndex: undefined,
    };
  },
  methods: {
    onEditRequirement(data) {
      this.$delete(this.requirementsProp, this.selectedElementIndex);
      Object.assign(this.requirementsProp, data);
      this.closeModalForm();
    },
    onAddRequirement(type, data) {
      this.$set(this.requirementsProp, type, data);
      this.closeModalForm();
    },
    showModalForm() {
      this.$refs['modal-form'].show();
    },
    closeModalForm() {
      this.$refs['modal-form'].hide();
      this.selectedElement = undefined;
      this.selectedElementIndex = undefined;
    },
    edit(element, index) {
      this.selectedElement = element;
      this.selectedElementIndex = index;
      this.showModalForm();
    },
    removeElement(index) {
      this.$delete(this.requirementsProp, index);
    },
  },
};

</script>

<style scoped>

</style>
