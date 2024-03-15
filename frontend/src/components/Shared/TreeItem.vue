<template>
  <li v-if="item !== undefined">
    <div :class="{ bold: isFolder }" @click="toggle">
      {{ item.name }}
      <span class="expand" v-if="isFolder">[{{ isOpen ? "-" : "+" }}]</span>
    </div>
    <ul v-show="isOpen" v-if="isFolder">
      <tree-item v-for="(child, index) in item.children" :key="index" :item="child"></tree-item>
    </ul>
  </li>
</template>

<script>
export default {
  name: "TreeItem",
  props: {
    item: Object,
    open: {
      type: Boolean,
      default: false
    }
  },
  data: function() {
    return {
      isOpen: this.open
    };
  },
  computed: {
    isFolder: function() {
      return this.item["children"] && this.item.children.length;
    }
  },
  methods: {
    toggle: function() {
      if (this.isFolder) {
        this.isOpen = !this.isOpen;
      }
    }
  }
};
</script>

<style scoped>
.item {
  cursor: pointer;
}
.bold {
  font-weight: bold;
}
.expand {
  cursor: pointer;
}

ul {
  padding-left: 1em;
  line-height: 1.5em;
  list-style-type: dot;
}
</style>
