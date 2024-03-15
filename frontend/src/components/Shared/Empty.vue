<template>
  <b-row>
    <b-col>
      <b-row>
        <b-col cols="12" align="center">
          <fa-icon v-show="!noIcon && !loading" class="empty-icon" :icon="iconContent"></fa-icon>
        </b-col>
        <b-col class="empty-text" cols="12" align="center">
          <slot v-if="!loading" name="content">
            <b-alert :variant="variant" show>{{ textContent }}</b-alert>
          </slot>
          <slot v-if="loading && showLoadingContent" name="loadingContent">
            <b-alert :variant="variant" show>{{ textContent }}</b-alert>
          </slot>
        </b-col>
        <b-col cols="12" align="center">
          <slot name="button-group"></slot>
        </b-col>
      </b-row>
    </b-col>
  </b-row>
</template>

<script>

export default {
  name: "Empty",
  components: {},
  props: {
    text: String,
    icon: {
      type: String,
      default: "folder-open"
    },
    noIcon: {
      type: Boolean,
      default: false
    },
    loading: {
      type: Boolean,
      default: false
    },
    showLoadingContent: {
      type: Boolean,
      default: false
    },
    variant: {
      type: String,
      required: false,
      default: "transparent"
    }
  },
  computed: {
    textContent() {
      return this.loading && !this.text ? "Loading..." : this.text;
    },
    iconContent() {
      return this.icon;
    }
  }
};
</script>

<style scoped lang="scss">
@import "../../assets/scss/default/application-package-editor.scss";

.empty-icon {
  color: gray("300");
  font-size: 10rem;
}

.empty-text {
  color: gray("600");
  font-size: 1rem;
}
</style>
