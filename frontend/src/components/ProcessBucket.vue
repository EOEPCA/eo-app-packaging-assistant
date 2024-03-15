<template>
  <b-row>
    <b-col cols="12">
      <empty
        class="mt-2"
        v-show="loading || importerError"
        :loading="loading"
        :text="
          importerError
            ? 'Something went wrong while fetching files'
            : 'Fetching files...'
        "
        show-loading-content
        icon="exclamation"
      />
    </b-col>
    <b-col cols="12" v-if="bucketId === undefined">
      <empty text="No files found"></empty>
    </b-col>
    <b-col v-else cols="12">
      <b-row v-if="process" class="mt-4">
        <b-col>
          <h5 class="text-generated">
            <div>
              <fa-icon class="mr-2" icon="check-circle"></fa-icon>
              <span>Wrapper detected</span>
            </div>
          </h5>
        </b-col>
      </b-row>
      <b-row class="mt-3">
        <b-col cols="12">
          <vue-dropzone
            v-show="!readOnly"
            ref="dropzone"
            id="dropzone"
            v-on:vdropzone-mounted="dropzoneMounted"
            v-on:vdropzone-removed-file="removedFile"
            v-on:vdropzone-file-added="addedFile"
            v-on:vdropzone-success="uploadSuccess"
            v-on:vdropzone-error="uploadError"
            :options="dropzoneOptions"
            useCustomSlot
          >
          </vue-dropzone>
          <p class="text-center my-3">
            Tar archives are extracted automatically. Please provide
            requirements.txt files as a separate file.
          </p>

          <b-row>
            <b-col></b-col>
            <b-col cols="6">
              <b-button
                class="text-center"
                block
                variant="success"
                @click="removeAllFiles"
                >Remove All Files</b-button
              >
            </b-col>
            <b-col></b-col>
          </b-row>
        </b-col>
      </b-row>
    </b-col>
  </b-row>
</template>

<script>
import vue2Dropzone from "vue2-dropzone";
import "vue2-dropzone/dist/vue2Dropzone.min.css";
import Empty from "../components/Shared/Empty";
import { clearApplicationFiles } from "../api";
import { showApiErrorAsNotification } from "../utils";

export default {
  name: "ProcessBucket",
  components: {
    vueDropzone: vue2Dropzone,
    Empty,
  },
  props: {
    bucketId: {
      type: String,
      required: true,
    },
    readOnly: {
      type: Boolean,
      default: false,
    },
  },
  watch: {
    bucketId: function () {
      this.loadBucket();
    },
  },
  data: function () {
    return {
      loading: false,
      importerError: false,
      dropzoneOptions: {
        url: `${process.env.VUE_APP_API_ROOT_URL}/upload`,
        thumbnailWidth: 100,
        maxFilesize: 20,
        // addRemoveLinks: true
      },
      process: undefined,
      dockerfile: undefined,
      properties: undefined,
      // Tree view files data
      files: undefined,
    };
  },
  methods: {
    // Dropzone events
    dropzoneMounted() {
      console.log("Dropzone mounted");
    },
    loadBucket() {
      console.debug("Loading bucket");
    },
    removedFile(file) {
      console.log("Removing file", file);
    },
    addedFile(file) {
      console.log("Adding file", file);
    },
    uploadSuccess(file, response) {
      console.debug("Upload Success: ", file, response);
    },
    uploadError(file, response) {
      console.error("Upload Error: ", file, response);
    },
    removeAllFiles() {
      this.$refs.dropzone.removeAllFiles();
      clearApplicationFiles().catch(showApiErrorAsNotification);
    },
  },
  computed: {
    bucket() {
      return "1";
    },
  },
};
</script>

<style scoped>
.logs {
  font-family: "Courier New", serif;
  color: black;
}
</style>
