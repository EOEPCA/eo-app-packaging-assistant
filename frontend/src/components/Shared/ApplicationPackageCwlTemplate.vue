<template>
  <highlight-code v-if="cwlObject" lang="yaml">
    <pre>
      {{ cwlContent }}
    </pre>
  </highlight-code>
</template>

<script>
import yaml from "js-yaml";

export default {
  name: "ApplicationPackageCwlTemplate",
  props: {
    cwlObject: {
      type: Object
    }
  },
  computed: {
    cwlContent() {
      return yaml.dump(this.cwlObject, {lineWidth: -1});
    }
  }
};
</script>

<style scoped/>
