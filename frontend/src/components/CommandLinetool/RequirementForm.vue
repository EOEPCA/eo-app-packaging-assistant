<template>
  <b-form @submit.stop.prevent>
    <div class="form-content">
      <b-form-group label="Type:">
        <multiselect v-model="type" :options="dataTypes"/>
      </b-form-group>
      <div v-if="type==='DockerRequirement'" class="p-3" style="background-color: rgba(231,231,231,0.56)">
        <b-form-group label="Docker Pull:">
          <b-form-input v-model="requirement.dockerPull" type="text"/>
        </b-form-group>
        <div v-if="mode==='advanced'">
          <b-form-group label="Docker Load:">
            <b-form-input v-model="requirement.dockerLoad" type="text"/>
          </b-form-group>
          <b-form-group label="Docker File:">
            <b-form-input v-model="requirement.dockerFile" type="text"/>
          </b-form-group>
          <b-form-group label="Docker Import:">
            <b-form-input v-model="requirement.dockerImport" type="text"/>
          </b-form-group>
          <b-form-group label="Docker Image ID:">
            <b-form-input v-model="requirement.dockerImageId" type="text"/>
          </b-form-group>
          <b-form-group label="Docker Output Directory:">
            <b-form-input v-model="requirement.dockerOutputDirectory" type="text"/>
          </b-form-group>
        </div>
      </div>
      <div v-if="type==='ResourceRequirement'" class="p-3" style="background-color: rgba(231,231,231,0.56)">
        <b-form-group label="Cores Min:">
          <b-form-input v-model.number="requirement.coresMin" type="number"/>
        </b-form-group>
        <b-form-group label="Cores Max:">
          <b-form-input v-model.number="requirement.coresMax" type="number"/>
        </b-form-group>
        <b-form-group label="Ram Min:">
          <b-form-input v-model.number="requirement.ramMin" type="number"/>
        </b-form-group>
        <b-form-group label="Ram Max:">
          <b-form-input v-model.number="requirement.ramMax" type="number"/>
        </b-form-group>
      </div>
      <div v-if="type==='EnvVarRequirement'" class="p-3" style="background-color: rgba(231,231,231,0.56)">
        <empty
          class="m-0 p-0" v-if="Object.entries(requirement?.envDef || {}).length === 0" text="No Environment Definition"
          no-icon
        />
        <b-row class="mt-2" v-for="nsPair in Object.entries(requirement?.envDef || {})" :key="nsPair._key">
          <b-col sm="3">
            <b-form-input
              placeholder="EnvName..."
              type="text"
              @blur="handleLabelChange($event, nsPair)"
              :value="nsPair[0]"
              @keydown.space.prevent
            />
          </b-col>
          <b-col sm="8">
            <b-form-input
              placeholder="EnvValue..."
              type="text"
              :value="nsPair[1]"
              @input="handleValueChange($event, nsPair)"
              @keydown.space.prevent
            />
          </b-col>
          <b-col align="right">
            <b-btn
              class="float-right" variant="danger" @click="removeEnvDef(nsPair[0])"
              :disabled="nsPair[0] === 's'" size="sm "
            >
              <fa-icon icon="times"/>
            </b-btn>
          </b-col>
        </b-row>
        <b-row class="mt-4">
          <b-col align="right">
            <b-btn
              class="add-btn"
              variant="outline-success"
              @click="addEnvDef()"
              size="sm"
            >
              <fa-icon icon="plus"></fa-icon>
              <span class="ml-2">Add Environment Definition</span>
            </b-btn>
          </b-col>
        </b-row>
      </div>
    </div>
    <div class="form-control-btn">
      <b-btn variant="primary" @click="handleSubmit" size="sm">
        <fa-icon class="mr-2" :icon="this.requirementProp ? 'save' : 'plus'"/>
        <span>{{ this.requirementProp ? 'Save' : 'Add' }}</span>
      </b-btn>
      <b-btn @click="handleCancel" size="sm">
        <fa-icon class="mr-2" icon="times"/>
        <span>Cancel</span>
      </b-btn>
    </div>
  </b-form>
</template>

<script>
import Multiselect from "vue-multiselect";
import Empty from "../Shared/Empty";
import {removeEmpty, showNotification} from "../../utils";
import _ from 'lodash';
import {mapGetters} from "vuex";

export default {
  name: "RequirementForm",
  components: {Empty, Multiselect},
  props: {
    allowWorkflowReq: Boolean,
    requirementProp: Array,
  },
  watch: {
    type(newValue, oldValue) {
      this.requirement = {};
    }
  },
  data() {
    return {
      type: this.requirementProp ? _.cloneDeep(this.requirementProp[0]) : 'DockerRequirement',
      requirement: this.requirementProp ? _.cloneDeep(this.requirementProp[1]) : {},
    };
  },
  methods: {
    handleSubmit() {
      if (this.requirementProp) {
        this.$emit('onEdit', {[this.type]: removeEmpty(this.requirement)});
      } else {
        this.$emit('onAdd', this.type, removeEmpty(this.requirement));
      }
    },
    handleCancel() {
      this.$emit('onClose');
    },
    handleValueChange(nsValue, nsPairDef) {
      this.$set(this.requirement.envDef, nsPairDef[0], nsValue);
    },
    handleLabelChange(event, nsPairDef) {
      const keys = Object.keys(this.requirement.envDef);
      if (event.target.value !== nsPairDef[0] && keys.includes(event.target.value)) {
        showNotification('Environment name already exist.');
        return;
      }
      this.$set(this.requirement.envDef, event.target.value, nsPairDef[1]);
      this.$delete(this.requirement.envDef, nsPairDef[0]);
    },
    removeEnvDef(nsPrefix) {
      this.$delete(this.requirement.envDef, nsPrefix);
    },
    addEnvDef() {
      if (!this.requirement.envDef) this.$set(this.requirement, 'envDef', {});
      this.$set(this.requirement.envDef, '', '');
    },
  },
  computed: {
    dataTypes() {
      const reqOptions = [
        'DockerRequirement', 'ResourceRequirement', 'InlineJavascriptRequirement', 'EnvVarRequirement'
      ];
      if (!this.allowWorkflowReq) return reqOptions;
      return [
        ...reqOptions, 'ScatterFeatureRequirement', 'MultipleInputFeatureRequirement', 'SubworkflowFeatureRequirement'
      ];
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
  height: 56vh;
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
