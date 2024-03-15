<template>
  <b-form @submit.stop.prevent>
    <div class="form-content" id="clt-input-form">
      <b-form-group label="Identifier:" v-b-tooltip.hover.window.html="getHelper('paramIdentifier')">
        <b-form-input v-model="input.id" type="text"/>
        <b-form-invalid-feedback :state="idValidator">{{ this.idValidatorFeedback }}</b-form-invalid-feedback>
      </b-form-group>
      <b-form-group label="Type:" v-b-tooltip.hover.window.html="getHelper('paramType')">
        <b-row align-v="center">
          <b-col sm="9">
            <multiselect
              v-model="input.type"
              :options="dataTypes"
            />
          </b-col>
          <b-col sm="2">
            <b-form-checkbox v-model="optionalType">Optional</b-form-checkbox>
          </b-col>
        </b-row>
      </b-form-group>
      <b-form-group label="Default:" v-b-tooltip.hover.window.html="getHelper('paramDefault')">
        <b-form-input v-model="input.default" type="text"/>
      </b-form-group>
      <div v-if="mode==='advanced'">
        <b-form-checkbox
          v-model="input.streamable" class="m-2" v-if="input.type?.includes('File')"
          v-b-tooltip.hover.window.html="getHelper('paramStreamable')"
        >
          Streamable
        </b-form-checkbox>
      </div>
      <b-form-group label="Input Binding:" v-b-tooltip.hover.window.html="getHelper('paramInputBinding')">
        <div class="composite-input">
          <b-form-group
            label-cols-sm="2.5"
            label="Position:"
          >
            <b-form-input v-model="input.inputBinding.position" type="number" min="1" :number="true"/>
          </b-form-group>
          <div v-if="mode==='advanced'">
            <b-form-group
              label-cols-sm="2.5"
              label="Prefix:"
            >
              <b-form-input v-model="input.inputBinding.prefix" type="text"/>
            </b-form-group>
            <b-form-group
              label-cols-sm="2.5"
              label="Item Separator:"
            >
              <b-form-input v-model="input.inputBinding.itemSeparator" type="text"/>
            </b-form-group>
            <b-form-group
              label-cols-sm="2.5"
              label="Value From:"
            >
              <b-form-input v-model="input.inputBinding.valueFrom" type="text"/>
            </b-form-group>
            <b-row class="mt-2">
              <b-col sm="4">
                <b-form-checkbox v-model="input.inputBinding.loadContents">Load Contents</b-form-checkbox>
              </b-col>
              <b-col sm="4">
                <b-form-checkbox v-model="input.inputBinding.separate">Separate</b-form-checkbox>
              </b-col>
              <b-col sm="4">
                <b-form-checkbox v-model="input.inputBinding.shellQuote">Shell Quote</b-form-checkbox>
              </b-col>
            </b-row>
          </div>
        </div>
      </b-form-group>
      <div v-if="mode==='advanced'">
        <b-form-group label="Label:" v-b-tooltip.hover.window.html="getHelper('label')">
          <b-form-input v-model="input.label" type="text"/>
        </b-form-group>
        <b-form-group label="Description:" v-b-tooltip.hover.window.html="getHelper('description')">
          <b-form-textarea v-model="input.doc" rows="3" max-rows="6"/>
        </b-form-group>
      </div>
    </div>
    <div class="form-control-btn">
      <b-btn variant="primary" :disabled="!idValidator || !typeValidator" @click="handleSubmit" size="sm">
        <fa-icon class="mr-2" :icon="this.inputProp ? 'save' : 'plus'"/>
        <span>{{ this.inputProp ? 'Save' : 'Add' }}</span>
      </b-btn>
      <b-btn @click="handleCancel" size="sm" id="clt-input-modal-cancel-btn">
        <fa-icon class="mr-2" icon="times"/>
        <span>Cancel</span>
      </b-btn>
    </div>
  </b-form>
</template>

<script>
import Multiselect from "vue-multiselect";
import {cwlTypes} from "../../cwlObjectValidator";
import {mapGetters} from "vuex";

export default {
  name: "CommandLineToolInputForm",
  components: {Multiselect},
  props: {
    inOutIds: Array,
    inputProp: Object,
  },
  data() {
    return {
      input: {
        id: undefined,
        label: undefined,
        doc: undefined,
        default: undefined,
        streamable: undefined,
        ...this.inputProp,
        type: this.inputProp?.type?.replace('?', ''),
        inputBinding: {
          loadContents: undefined,
          position: undefined,
          prefix: undefined,
          separate: undefined,
          itemSeparator: undefined,
          valueFrom: undefined,
          shellQuote: undefined,
          ...this.inputProp?.inputBinding
        }
      },
      optionalType: this.inputProp?.type?.endsWith('?') || false,
    };
  },
  methods: {
    handleSubmit() {
      const inputData = {
        ...this.input,
        type: this.input.type ? `${this.input.type}${this.optionalType ? '?' : ''}` : undefined,
      };
      if (inputData.type == "int" || inputData.type == "float") {
        inputData.default = inputData.default ? Number(inputData.default) : undefined; 
      }
      if (this.inputProp) {
        console.warn(inputData);
        this.$emit('onEdit', inputData);
      } else {
        console.warn(inputData);
        this.$emit('onAdd', inputData);
      }
    },
    handleCancel() {
      this.$emit('onClose');
    }
  },
  computed: {
    dataTypes() {
      // Do not allow "null" to be selected as the value here.
      return cwlTypes.filter(type => type != "null");
    },
    idValidator() {
      return this.input?.id !== undefined && this.input?.id.length > 0
        && this.inOutIds.filter(id => id === this.input?.id && id !== this.inputProp?.id).length === 0;
    },
    typeValidator() {
      return this.input?.type != null;
    },
    idValidatorFeedback() {
      if (this.input?.id === undefined || this.input?.id.length === 0)
        return 'This field is required.';
      return 'This field must be unique.';
    },
    ...mapGetters({
      mode: 'mode'
    }),
  }
};
</script>

<style scoped>
.composite-input {
  margin-left: 20px;
}

.form-content {
  padding-left: 16px;
  padding-right: 16px;
  max-height: 75vh;
  overflow: auto;
}

.form-control-btn {
  display: flex;
  justify-content: center;
  margin-top: 20px;
}

.form-control-btn .btn {
  margin-left: 6px;
  margin-right: 6px;
}
</style>