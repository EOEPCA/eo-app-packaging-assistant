<template>
  <div id="app">
    <notifications
      class="notification-global mb-1"
      classes="notifications"
      group="global"
      :max="5"
      width="500px"
      position="top right"
      v-if="!guidedTourRunning"
    >
      <template slot="body" slot-scope="props">
        <div :class="`vue-notification-template notifications ${props.item.type}`" style="word-break: break-word">
          <div class="notification-title">
            <span class="title">{{ props.item.title }}</span>
            <a class="close" @click="props.close">
              <fa-icon icon="times"/>
            </a>
          </div>
          <div v-if="props.item.text" class="notification-content mt-1">
            <ul v-if="Array.isArray(props.item.text)" class="m-0 pl-4">
              <li v-for="text in props.item.text" :key="text._key"> {{ text }}</li>
            </ul>
            <span v-if="!Array.isArray(props.item.text)"> {{ props.item.text }} </span>
          </div>
        </div>
      </template>
    </notifications>
    <notifications
      class="notification-info mb-1"
      classes="notifications"
      group="info"
      :max="2"
      width="500px"
      position="top center"
      v-if="!guidedTourRunning"
    >
      <template slot="body" slot-scope="props">
        <div :class="`vue-notification-template notifications ${props.item.type}`" style="word-break: break-word">
          <div class="notification-title">
            <span class="title">{{ props.item.title }}</span>
            <a class="close" @click="props.close">
              <fa-icon icon="times"/>
            </a>
          </div>
          <div v-if="props.item.text" class="notification-content mt-1">
            <ul v-if="Array.isArray(props.item.text)" class="m-0 pl-4">
              <li v-for="text in props.item.text" :key="text._key"> {{ text }}</li>
            </ul>
            <span v-if="!Array.isArray(props.item.text)"> {{ props.item.text }} </span>
          </div>
        </div>
      </template>
    </notifications>
    <ApplicationImportTool ref="appImportTool"/>
  </div>
</template>

<script>
import ApplicationImportTool from "@/views/ApplicationImportTool";

export default {
  name: "App",
  components: {
    ApplicationImportTool
  },
  mounted() {
    this.$watch(
      () => this.$refs.appImportTool?.guidedTourRunning, (n, o) => {
        this.guidedTourRunning = n;
        if (n !== o) this.guidedTourRunning ?
          document.body.classList.add('read-only') : document.body.classList.remove('read-only') ;
      }
    );
  },
  data() {
    return {
      guidedTourRunning: false
    };
  }
};
</script>

<style lang="scss">
@import "/assets/scss/default/application-package-editor.scss";

body {
  word-break: break-all;
}

.message {
  border-radius: 0;
  font-size: $font-size-base * 1.2;
}

.tab-pane {
  outline: none;
}

.notification-global {
  margin-top: $navbar-height * 1.8;
}

.notification-info {
  margin-top: $navbar-height * 0.1;
}

.notifications {
  padding: 15px 20px 15px 20px;
  margin: 5px 20px 5px 20px;
  font-size: $font-size-base * 1.05;
  color: black;
  border: 1px solid black;
  border-radius: 5px;
  -webkit-box-shadow: 0px 0px 15px 5px rgba(0, 0, 0, 0.1);
  -moz-box-shadow: 0px 0px 15px 5px rgba(0, 0, 0, 0.1);
  box-shadow: 0px 0px 15px 5px rgba(0, 0, 0, 0.1);

  &.success {
    border-color: theme-color("success");
    background: lighten(theme-color("success"), 47%);
  }

  &.warn {
    border-color: theme-color("warning");
    background: lighten(theme-color("warning"), 47%);
  }

  &.error {
    border-color: theme-color("danger");
    background: lighten(theme-color("danger"), 47%);
  }
}

*::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

*::-webkit-scrollbar-track {
  background: #eeeeee;
  border-radius: 10px;
}

*::-webkit-scrollbar-thumb {
  background-color: #c2c2c2;
  border-radius: 10px;
}

.multiselect__tag {
  font-size: 100%;
  padding: 0.1rem 1.7rem 0.1rem 0.25rem;
}

.read-only {
  pointer-events: none !important;
}

.read-only .modal-content {
  pointer-events: none !important;
}
</style>
