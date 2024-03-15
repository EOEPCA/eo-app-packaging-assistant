<template>
  <b-form>
    <div class="form-content" id="clt-output-form">
      <b-form-group label="Identifier:" v-b-tooltip.hover.window.html="getHelper('paramIdentifier')">
        <b-form-input v-model="output.id" type="text"/>
        <b-form-invalid-feedback :state="idValidator">{{ this.idValidatorFeedback }}</b-form-invalid-feedback>
      </b-form-group>
      <b-form-group label="Type:" v-b-tooltip.hover.window.html="getHelper('paramType')">
        <b-row align-v="center">
          <b-col sm="9">
            <multiselect v-model="output.type" :options="dataTypes"/>
          </b-col>
          <b-col sm="2">
            <b-form-checkbox v-model="optionalType">Optional</b-form-checkbox>
          </b-col>
        </b-row>
      </b-form-group>
      <b-form-group
        label="Format:"
        description="Note: you can add a list of format using ',' as a separator."
        v-if="output.type?.includes('File')"
        v-b-tooltip.hover.window.html="getHelper('paramFormat')"
      >
        <b-form-input :value="formatValue" @input="handleFormatChange" type="text"/>
      </b-form-group>
      <b-form-checkbox
        v-model="output.streamable" class="m-2" v-if="output.type?.includes('File')"
        v-b-tooltip.hover.window.html="getHelper('paramStreamable')"
      >
        Streamable
      </b-form-checkbox>
      <div v-if="mode==='advanced'">
        <b-form-group label="Output Binding:" v-b-tooltip.hover.window.html="getHelper('paramOutputBinding')">
          <div class="composite-output">
            <b-form-group
              label-cols-sm="2.5"
              label="Glob:"
            >
              <b-form-input v-model="output.outputBinding.glob" type="text"/>
            </b-form-group>
            <b-form-group
              label-cols-sm="2.5"
              label="Output Eval:"
            >
              <b-form-input v-model="output.outputBinding.outputEval" type="text"/>
            </b-form-group>
            <b-form-checkbox v-model="output.outputBinding.loadContents">Load Contents</b-form-checkbox>
          </div>
        </b-form-group>
        <b-form-group label="Label:" v-b-tooltip.hover.window.html="getHelper('label')">
          <b-form-input v-model="output.label" type="text"/>
        </b-form-group>
        <b-form-group label="Description:" v-b-tooltip.hover.window.html="getHelper('description')">
          <b-form-textarea v-model="output.doc" rows="3" max-rows="6"/>
        </b-form-group>
      </div>
    </div>
    <div class="form-control-btn">
      <b-btn variant="primary" :disabled="!idValidator" @click="handleSubmit">
        <fa-icon class="mr-2" :icon="this.outputProp ? 'save' : 'plus'"/>
        <span>{{ this.outputProp ? 'Save' : 'Add' }}</span>
      </b-btn>
      <b-btn @click="handleCancel" id="clt-output-modal-cancel-btn">
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
  name: "CommandLineToolOutputForm",
  components: {Multiselect},
  props: {
    inOutIds: Array,
    outputProp: Object,
  },
  data() {
    return {
      output: {
        id: undefined,
        label: undefined,
        doc: undefined,
        streamable: undefined,
        format: undefined,
        ...this.outputProp,
        type: this.outputProp?.type?.replace('?', ''),
        outputBinding: {
          glob: undefined,
          loadContents: undefined,
          outputEval: undefined,
          ...this.outputProp?.outputBinding
        }
      },
      optionalType: this.outputProp?.type?.endsWith('?') || false,
    };
  },
  methods: {
    handleSubmit() {
      const outputData = {
        ...this.output,
        type: this.output.type ? `${this.output.type}${this.optionalType ? '?' : ''}` : undefined,
      };
      if (this.outputProp) {
        this.$emit('onEdit', outputData);
      } else {
        this.$emit('onAdd', outputData);
      }
    },
    handleCancel() {
      this.$emit('onClose');
    },
    handleFormatChange(newValue) {
      const trimmedValue = newValue.replace(/\s/g, '');
      if (trimmedValue.split(',').filter(e => e).length > 1) {
        this.$set(this.output, 'format', trimmedValue.split(','));
      } else {
        this.$set(this.output, 'format', trimmedValue);
      }
    }
  },
  computed: {
    dataTypes() {
      return cwlTypes;
    },
    idValidator() {
      return this.output?.id !== undefined && this.output?.id.length > 0
        && this.inOutIds.filter(id => id === this.output?.id && id !== this.outputProp?.id).length === 0;
    },
    idValidatorFeedback() {
      if (this.output?.id === undefined || this.output?.id.length === 0)
        return 'This field is required.';
      return 'This field must be unique.';
    },
    formatValue() {
      if (Array.isArray(this.output.format)) return this.output.format.join(', ');
      return this.output.format;
    },
    ...mapGetters({
      mode: 'mode'
    }),
  }
};
</script>

<style scoped>
.composite-output {
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