<template>
  <b-row :class="{ divider: !noDivider }" class="page-title" align-v="end" no-gutters>
    <b-col cols="12" lg="6" style="display: flex; align-items: center">
      <slot name="help"/>
      <div>
        <slot name="title">
          <div>
            <span class="title">{{ title }}</span>
          </div>
        </slot>
        <slot name="subtitle">
          <h5 class="subtitle">{{ subtitle }}</h5>
        </slot>
      </div>
    </b-col>
    <b-col cols="12" lg="6" align="right">
      <slot name="toolbar"></slot>
    </b-col>
  </b-row>
</template>

<script>

export default {
  name: "PageTitle",
  components: {},
  props: {
    title: String,
    subtitle: String,
    noDivider: {
      type: Boolean,
      default: false
    },
    loading: {
      type: Boolean,
      default: false
    },
    fetching: {
      type: Boolean,
      default: undefined
    },
    noFetching: {
      type: Boolean,
      default: true
    }
  }
};
</script>

<style scoped lang="scss">
@import "../../assets/scss/default/application-package-editor.scss";

.page-title {
  padding-bottom: 0.7rem;
}

.title {
  font-weight: bold;
  font-size: $font-size-base * 2;
}

.align-offset {
  // offset to better align the loading spinner with the title
  position: absolute;
  top: 0.6rem;
  margin-left: 0.5rem;
}
</style>
