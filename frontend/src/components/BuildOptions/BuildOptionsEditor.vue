<template>
  <div style="padding: 6px">
    <div class="card-section">
      <b-row class="mt-2 mb-5">
        <b-col sm="6">
          <div>
            <h6>Software Dependencies</h6>
            <b-form-row id="software-dependencies">
              <b-col align="center">
                <empty
                  v-if="fetching"
                  class="m-0 p-0"
                  text="Fetching dependencies..."
                  no-icon
                ></empty>
                <empty
                  class="m-0 p-0"
                  v-else-if="availableSoftwareDependencies.length === 0"
                  text="No software dependencies"
                  no-icon
                ></empty>
                <multiselect
                  v-else
                  v-model="buildOptionsSelection.softwareDeps"
                  :options="availableSoftwareDependencies"
                  track-by="identifier"
                  label="detailedLabel"
                  placeholder="Select software dependencies"
                  :multiple="true"
                ></multiselect>
              </b-col>
            </b-form-row>
          </div>
        </b-col>
      </b-row>
    </div>
    <div class="card-section">
      <div class="title">Registry</div>
      <b-row class="mt-3 mb-1">
        <b-col sm="6">
          <h6>Registry Type</h6>
          <b-form-row id="registry-type">
            <b-col align="center">
              <empty
                class="m-0 p-0"
                v-if="buildOptions.repositoryTypes.length === 0"
                text="No registry types"
                no-icon
              ></empty>
              <multiselect
                v-else
                v-model="buildOptionsSelection.repositoryType"
                :options="buildOptions.repositoryTypes"
                track-by="identifier"
                label="label"
                placeholder="Select registry type"
              ></multiselect>
            </b-col>
          </b-form-row>
          <b-form-invalid-feedback :state="shareRepoValidator">
            {{ "This field is required." }}
          </b-form-invalid-feedback>
        </b-col>
        <b-col sm="6">
          <div v-if="repoAddressVisible">
            <h6>Registry Address (+ optional path)</h6>
            <b-form-input
              type="text"
              v-model="buildOptionsSelection.repositoryAddress"
              @keydown.space.prevent
            />
            <b-form-invalid-feedback :state="repoAddressValidator">
              {{ "This field is required." }}
            </b-form-invalid-feedback>
          </div>
        </b-col>
      </b-row>
      <b-row class="mt-3 mb-1">
        <b-col sm="6">
          <h6>Image Tag</h6>
          <b-form-input
          id="docker-image-tag"
            type="text"
            v-model="buildOptionsSelection.imageTag"
            @keydown.space.prevent
          />
          <b-form-invalid-feedback :state="imgTagValidator">
            {{ "This field is required." }}
          </b-form-invalid-feedback>
        </b-col>
      </b-row>
    </div>
  </div>
</template>

<script>
import Multiselect from "vue-multiselect";
import Empty from "../Shared/Empty";

export default {
  name: "BuildOptionsEditor",
  components: {
    Multiselect,
    Empty,
  },
  props: {
    buildOptionsSelectionProp: Object,
    buildOptionsProp: Object,
    fetching: String,
  },
  watch: {
    buildOptionsSelectionProp(newValue, oldValue) {
      this.buildOptionsSelection = newValue;
    },
    buildOptionsProp(newValue, oldValue) {
      this.buildOptions = newValue;
    },
  },
  data() {
    return {
      buildOptionsSelection: this.buildOptionsSelectionProp || {
        softwareDeps: [],
        repositoryType: undefined,
        repositoryAddress: "",
        imageTag: "latest",
      },
      buildOptions: this.buildOptionsProp || {
        mainDependencies: [],
        softwareDependencies: [],
        repositoryTypes: [],
      },
    };
  },
  computed: {
    incompatibleDependencies() {
      let incompatibleDeps = {};
            for (let dep of this.buildOptionsSelection.softwareDeps) {
        // Check if there are incompatibilities listed
        if (dep["incompatible_with"].length != 0) {
          for (let incompDep of dep["incompatible_with"]) {
            incompatibleDeps[incompDep] = incompatibleDeps[incompDep] ?
            incompatibleDeps[incompDep].add(dep.label) :
            new Set([dep.label]);
          }
        }
      }
      return incompatibleDeps;
    },
    availableSoftwareDependencies() {
      let dependencies = [];

      for (let dep of this.buildOptions.softwareDependencies) {
        // Check if the dependency is already in the list of incompatible dependencies
        if (this.incompatibleDependencies[dep.identifier]) {
          dep["$isDisabled"] = true;
          dep["detailedLabel"] = `${dep.label} (incompatible with ${
            [...this.incompatibleDependencies[dep.identifier]].join(", ")
            })`;
          dependencies.push(dep);
          continue;
        }

        let conflictDeps = this.buildOptionsSelection.softwareDeps.filter(
          selectedDep => dep["incompatible_with"].includes(selectedDep.identifier));
        // Check if the dependency would conflict with previously selected dependencies
        if (conflictDeps.length != 0) {
            dep["$isDisabled"] = true;
            dependencies.push(dep);
            dep["detailedLabel"] = `${dep.label} (incompatible with ${
            [...conflictDeps.map(conflictDep => conflictDep.label)].join(", ")
            })`;
            continue;
          }
        dep["$isDisabled"] = false;
        dep["detailedLabel"] = dep.label;
        dependencies.push(dep);
      }

      return dependencies;
    },
    shareRepoValidator() {
      if (this.buildOptionsSelection.repositoryType) {
        return true;
      } else {
        return false;
      }
    },
    repoAddressValidator() {
      if (this.buildOptionsSelection.repositoryAddress) {
        return true;
      } else {
        return false;
      }
    },
    imgTagValidator() {
      if (this.buildOptionsSelection.imageTag) {
        return true;
      } else {
        return false;
      }
    },
    repoAddressVisible() {
      if (this.buildOptionsSelection.repositoryType?.identifier === "custom") {
        return true;
      } else {
        return false;
      }
    },
  },
};
</script>

<style scoped>
</style>