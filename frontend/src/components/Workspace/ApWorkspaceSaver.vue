<template>
  <b-form @submit.stop.prevent>
    <div class="form-content">
      <b-form-group label="Application Name:">
        <b-form-input v-model="appName" type="text" @keydown.space.prevent/>
        <b-form-invalid-feedback :state="appNameValidator"> {{appNameValidatorFeedback}} </b-form-invalid-feedback>
      </b-form-group>
      <b-form-group label="Application Version:">
        <b-form-input v-model="appVersion" type="text" @keydown.space.prevent/>
        <b-form-invalid-feedback :state="appVersionValidator">
          {{appVersionValidatorFeedback}}
        </b-form-invalid-feedback>
      </b-form-group>
    </div>
    <div class="form-control-btn">
      <b-btn variant="primary" :disabled="!appNameValidator || !appVersionValidator" @click="handleSubmit" size="sm">
        <fa-icon class="mr-2" icon="save"/>
        <span>Save</span>
      </b-btn>
      <b-btn @click="handleCancel" size="sm">
        <fa-icon class="mr-2" icon="times"/>
        <span>Cancel</span>
      </b-btn>
    </div>
  </b-form>
</template>

<script>
const SpecialCharacters = new RegExp('[\\/<>=+*!@#$%^&}{()\\[\\]\'";:,?~`]+');

export default {
  name: "ApWorkspaceSaver",
  props: {
    appNameProp: String,
    appVersionProp: String,
  },
  data() {
    return {
      appName: this.appNameProp,
      appVersion: this.appVersionProp,
    };
  },
  methods: {
    handleSubmit() {
      this.$emit('onSave', this.appName, this.appVersion);
    },
    handleCancel() {
      this.$emit('onClose');
    }
  },
  computed: {
    appNameValidator() {
      return this.appName !== undefined && this.appName?.length > 0
        && !SpecialCharacters.test(this.appName);
    },
    appVersionValidator() {
      return this.appVersion !== undefined && this.appVersion?.length > 0
        && !SpecialCharacters.test(this.appVersion)
        && !this.appVersion?.endsWith('__locked');
    },
    appNameValidatorFeedback() {
      if (this.appVersion === undefined || this.appVersion?.length === 0) {
        return 'This field is required.';
      }
      return 'Special Characters are not allowed.';
    },
    appVersionValidatorFeedback() {
      if (this.appVersion === undefined || this.appVersion?.length === 0) {
        return 'This field is required.';
      }
      return 'Special Characters are not allowed and version name cannot end with "__locked".';
    }
  }
};
</script>

<style scoped>
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
