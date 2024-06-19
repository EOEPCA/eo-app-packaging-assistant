<template>
  <b-container fluid class="my-2 px-4">
    <b-modal id="buildlog" title="Build log" size="xl" ok-only>
      <highlight-code>
        <pre>
                   {{ formattedBuildLog }}
                  </pre
        >
      </highlight-code>
    </b-modal>
    <v-tour
      name="clt-tour"
      :steps="steps"
      :callbacks="guidedTourCallbacks"
      ref="cltTour"
    />
    <b-modal
      ref="download-modal"
      id="download-modal"
      title="Download CWL"
      align-h="end"
      hide-footer
      size="md"
    >
      <b-form-group label="CWL file name">
        <b-form-input v-model="cwlFilename"> </b-form-input>
      </b-form-group>
      <b-btn variant="success" @click="createDownloadCwl(cwlFilename)">
        <fa-icon class="mr-2" icon="download"></fa-icon>
        <span>Download</span>
      </b-btn>
    </b-modal>
    <b-modal
      @hide="closeApExplorer"
      ref="ws-manager-modal"
      title="Applications manager"
      align-h="end"
      hide-footer
      size="lg"
    >
      <ap-workspace-manager
        @onClose="closeApExplorer"
        @download="downloadFromWs"
        @openAppPackage="loadWsAppPackage"
        @openAppPackageNewTab="openWsAppPackageNewWindow"
      />
    </b-modal>
    <b-modal
      @hide="closeWorkspaceSaver"
      ref="ws-save-modal"
      title="Save in Workspace"
      align-h="end"
      hide-footer
      size="lg"
    >
      <ap-workspace-saver
        :appNameProp="appPackageName"
        :appVersionProp="appPackageVersion"
        @onClose="closeWorkspaceSaver"
        @onSave="workspaceSave"
      />
    </b-modal>
    <page-title
      title="EO Application Packaging Assistant"
      subtitle="Interactive Earth Observation Application Packaging Assistant"
    >
      <template v-slot:help>
        <div>
          <b-dropdown
            no-caret
            class="mr-3"
            menu-class="help-menu-dropdown"
            id="help-menu"
          >
            <template v-slot:button-content>
              <b-icon
                icon="three-dots-vertical"
                v-b-tooltip.hover.window="'Help Menu'"
                style="height: 1.8rem; width: 1.8rem; color: white"
              />
            </template>
            <b-dropdown-item @click="showConfirmReset">
              <b-icon icon="arrow-counterclockwise" />
              Reset
            </b-dropdown-item>
            <div class="p-2">
              <span style="font-weight: bold; font-size: 14px"
                >Editing Mode</span
              >
              <b-dropdown-item @click="setMode('simple')">
                <b-icon
                  icon="check-circle"
                  variant="success"
                  v-if="mode === 'simple'"
                />
                Simple
              </b-dropdown-item>
              <b-dropdown-item @click="setMode('advanced')">
                <b-icon
                  icon="check-circle"
                  variant="success"
                  v-if="mode === 'advanced'"
                />
                Advanced
              </b-dropdown-item>
            </div>
            <div class="p-2">
              <span style="font-weight: bold; font-size: 14px"
                >Manuals & References</span
              >
              <b-dropdown-item                
              @click="
                  openNewTab(
                    'https://eoepca.github.io/eo-app-packaging-assistant/current/user-manual/',
                    $event
                  )
                "> User Manual </b-dropdown-item>
              <b-dropdown-item
                @click="
                  openNewTab('https://docs.ogc.org/bp/20-089r1.html', $event)
                "
              >
                OGC BP Earth Observation Application Package
              </b-dropdown-item>
            </div>
            <div class="p-2">
              <span style="font-weight: bold; font-size: 14px"
                >Guided Tour</span
              >
              <b-dropdown-item
                @click="startGuidedTour('applicationImportToolTour')"
              >
                A tour of the EO Application Packaging Assistant features
              </b-dropdown-item>
            </div>
          </b-dropdown>
        </div>
      </template>
    </page-title>
    <b-row>
      <b-col lg="12" xl="7">
        <b-tabs content-class="mt-2" fill v-model="currentTab">
          <b-tab :active="currentTab === 0">
            <template v-slot:title>
              <span id="clt-tab-title"> Command Line Tool </span>&nbsp;
            </template>
            <b-card class="mt-2">
              <template v-slot:header>
                <span>Command Line Tool</span>
                <input
                  ref="file"
                  type="file"
                  accept=".cwl"
                  @change="onFileUpload"
                  hidden
                />
                <b-btn
                  variant="primary"
                  @click="uploadFile()"
                  class="float-right mr-2"
                  size="sm"
                   v-b-tooltip.hover.window.html="'Upload Application from your computer'"
                >
                  <fa-icon class="mr-2" icon="upload"></fa-icon>
                  <span>Upload</span>
                </b-btn>
                <b-btn
                  variant="success"
                  @click="showDownloadModal()"
                  class="float-right mr-2"
                  size="sm"
                   v-b-tooltip.hover.window.html="'Save Application to your computer'"
                >
                  <fa-icon class="mr-2" icon="download"></fa-icon>
                  <span>Download</span>
                </b-btn>
                <b-btn
                  variant="primary"
                  @click="showApExplorer"
                  class="mr-2 float-right"
                  size="sm"
                   v-b-tooltip.hover.window.html="'View Applications stored in your workspace'"
                >
                  <fa-icon class="mr-2" icon="folder-open" />
                  <span id="clt-file-storage">Manage</span>
                </b-btn>
                <b-btn
                  variant="success"
                  @click="showWorkspaceSaver"
                  class="float-right mr-2"
                  size="sm"
                  v-b-tooltip.hover.window.html="'Save Application in your workspace'"
                >
                  <fa-icon class="mr-2" icon="save" />
                  <span>Save</span>
                </b-btn>
              </template>
              <command-line-tool-editor
                :command-line-tool-prop="cwlObject"
                :pos="0"
              />
            </b-card>
          </b-tab>
          <b-tab :active="currentTab === 1">
            <template v-slot:title>
              <span id="af-tab-title">Application Files</span>&nbsp;
            </template>
            <b-card header="Application Files" class="mt-3">
              <process-bucket
              
                v-if="version && version.bucketId"
                :bucket-id="version.bucketId"
                v-on:build-passed="buildPassed"
                v-on:release-passed="releasePassed"
              ></process-bucket>
            </b-card>
          </b-tab>
          <b-tab :active="currentTab === 2" >
            <template v-slot:title>
              <span id="build-options-tab-title">Build Options</span>&nbsp;
            </template>
            <b-card header="Build Options" class="mt-3">
              <build-options-editor
                :build-options-prop="buildOptions"
                :build-options-selection-prop="buildOptionsSelection"
                :fetching-prop="fetching"
              />
            </b-card>
          </b-tab>
        </b-tabs>
      </b-col>
      <b-col lg="12" xl="5">
        <b-card header="Build" class="mt-3">
          <b-row>
            <b-col cols="6">
              <b-button
              id="dry-run"
                class="text-center"
                block
                variant="success"
                @click="build"
                :disabled="building"
                >Build (Dry Run)</b-button
              >
              <b-form-invalid-feedback :state="buildValidator">
                {{ this.buildValidatorMsg }}
              </b-form-invalid-feedback>
            </b-col>
            <b-col cols="6">
              <b-button
              id="build-and-push"
                class="text-center"
                block
                variant="success"
                @click="buildAndPush"
                :disabled="building"
                >Build and Push to Repository
              </b-button>
              <b-form-invalid-feedback :state="buildAndPushValidator">
                {{ this.buildAndPushValidatorMsg }}
              </b-form-invalid-feedback>
            </b-col>
          </b-row>
          <b-row class="my-2">
            <b-col>
              <b-checkbox 
              id="perform-dry-run"
              v-model="executionDryRun"
              :disabled="!checkDryRunAvailable || building"
              >Perform a test run with default values                
              <b-icon
                  icon="info-circle"
                  variant="info"
                  v-b-tooltip.hover.window="
                    'Every mandatory input needs to have a default value.'
                  "
                /></b-checkbox>
            </b-col>
          </b-row>
          <b-row class="mt-3">
            <b-col cols="12">
              <b-progress
                height="20px"
                :value="progress"
                :max="maxSteps"
                show-progress
                class="mb-4"
                :variant=progressColor
                :animated="building"
              ></b-progress>
              <span class="text-center">
                <b-alert :show="buildStatus == 'disconnected'" variant="warning">
                  Your browser seems to have disconnected from the server.<br>
                  <b-btn variant="warning" class="mt-2" @click="connectToSSE()">Reconnect</b-btn>
                </b-alert>
              </span>
              <b-btn
                v-b-toggle.collapse-docker-output
                variant="primary"
                size="sm"
                class="mr-2"
                id="live-output"
                ><span class="when-open">Hide live output</span
                ><span class="when-closed">Show live output</span></b-btn
              >
              <b-button
                id="buildlog"
                @click="showLogs()"
                variant="primary"
                size="sm"
                :disabled="!buildFinished"
                >Show detailed logs</b-button
              >
              <b-collapse id="collapse-docker-output" class="mt-2">
                <highlight-code>
                  <pre>
                   {{ buildOutput }}
                  </pre>
                </highlight-code>
              </b-collapse>
            </b-col>
          </b-row>
        </b-card>
        <b-card header="CWL snippet" class="mt-3">
          <ApplicationPackageCwlTemplate
            :cwlObject="cleanedCwl"
            ref="processWrapper"
          />
        </b-card>
      </b-col>
    </b-row>
  </b-container>
</template>


<script>
import ApplicationPackageCwlTemplate from "../components/Shared/ApplicationPackageCwlTemplate";
import PageTitle from "../components/Shared/PageTitle";
import ApWorkspaceManager from "../components/Workspace/ApWorkspaceManager";
import ApWorkspaceSaver from "../components/Workspace/ApWorkspaceSaver.vue";
import "vue-slider-component/theme/antd.css";
import { saveAs } from "file-saver";
import yaml from "js-yaml";
import { cwlValidator } from "../cwlObjectValidator";
import CommandLineToolEditor from "../components/CommandLinetool/CommandLineToolEditor";
import BuildOptionsEditor from "../components/BuildOptions/BuildOptionsEditor";
import {
  showApiErrorAsNotification,
  parseCwlObject,
  parseCommandLineTool,
  showNotification,
  removeEmpty,
  arrayUnique,
    getURLParam,
  validateCwlConsistency,
} from "../utils";
import { mapGetters } from "vuex";
import {
  CHANGE_APP_PACKAGE_NAME,
  CHANGE_APP_PACKAGE_VERSION,
  RESET_EDITOR,
  SET_MODE,
  EDIT_COMMAND_LINE_TOOL,
  SET_CWL_OBJECT,
} from "../store/action-types";
import { BIcon } from "bootstrap-vue";
import { guidedTours, guidedToursCallbacks } from "../guidedTour";
import examples from "../data/examples.json";
import ProcessBucket from "../components/ProcessBucket";
import {
  
  buildApplication,
  buildAndPushApplication,
  createUpdateApplicationPackageVersion,
  getApplicationPackageVersion,
  getBuildLog,
  getOptions,
  clearApplicationFiles,
} from "../api";
// import SSEClient from "@/sse.js";

export default {
  name: "ApplicationPackageEditor",
  components: {
    BIcon,
    CommandLineToolEditor,
    BuildOptionsEditor,
    PageTitle,
    ApplicationPackageCwlTemplate,
    ProcessBucket,
    ApWorkspaceManager,
    ApWorkspaceSaver,
  },
  data() {
    return {
      cwlFilename: undefined,
      currentTab: 0,
      guidedTourRunning: false,
      selectedGuidedTour: "applicationImportToolTour",
      selectedInput: undefined,
      idx: undefined,
      fetching: false,
      mainDep: undefined,
      softwareDeps: [],
      missingRequirements: [],
      buildValidationResult: "",
      buildAndPushValidationResult: "",
      pressedLast: "None",
      buildProgress: ["Build not started yet"],
      shareRepo: undefined,
      buildOptions: {
        mainDependencies: [],
        softwareDependencies: [],
        repositoryTypes: [],
      },
      buildResponse: {},
      version: {
        bucketId: "1",
      },
      building: false,
      progress: 0,
      maxSteps: 0,
      buildFinished: false,
      buildLog: [],
      buildStatus: "",
      push: false,
      executionDryRun: false,
    };
  },
  mounted() {
    this.$nextTick(() => {
      getOptions()
        .then((res) => {
          this.buildOptions = res;
          console.log(this.buildOptions);
        })
        .catch(showApiErrorAsNotification);

      clearApplicationFiles().catch(showApiErrorAsNotification);

      const apName = getURLParam("apName", undefined);
      const apVersion = getURLParam("apVersion", undefined);
      if (apName && apVersion) {
        this.loadWsAppPackage(apName, apVersion);
      }
    });
  },
  methods: {
    build() {
      console.log("Building");

      this.pressedLast = "Build";
      let multiselectData = this.assambleMultiSelectData();
      let cwlData = this.assambleCwlData();
      let buildData = { ...cwlData, ...multiselectData };
      console.log(buildData);
      // send post request to backend
      this.buildAndPushDataValidation(buildData);
      if (this.buildValidationResult == "Valid") {
        this.building = true;
        this.buildProgress = [];
        this.buildFinished = false;
        this.progress = 0;
        this.buildStatus = "building";
        this.push = false;
        if (this.executionDryRun) {
          buildData["cwl"] = yaml.dump(this.cwlObject, {lineWidth: -1});
        }
        buildApplication(buildData)
          .then((res) => {
            this.buildResponse = res;
            console.log(this.buildResponse);
            let dockerReqData = {};
            let dockerPullData = {};
            dockerPullData["dockerPull"] = this.buildResponse.imageReference;
            if (this.cwlObject.requirements.DockerRequirement) {
              dockerReqData = {
                ...this.cwlObject.requirements.DockerRequirement,
                ...dockerPullData,
              };
            } else {
              dockerReqData = dockerPullData;
            }
            this.$store.dispatch(EDIT_COMMAND_LINE_TOOL, {
              instance: this.cwlObject,
              property: "requirements",
              index: "DockerRequirement",
              updatedData: dockerReqData,
            });
          });
        // .catch(showApiErrorAsNotification);
        this.connectToSSE();
      } else {
        console.log(this.buildValidationResult);
      }
    },
    buildAndPush() {
      console.log("BuildingAndPushing");
      this.pressedLast = "BuildAndPush";
      let multiselectData = this.assambleMultiSelectData();
      let cwlData = this.assambleCwlData();
      let buildData = { ...cwlData, ...multiselectData };
      console.log(buildData);
      // send post request to backend
      this.buildAndPushDataValidation(buildData);
      if (this.buildAndPushValidationResult == "Valid") {
        this.building = true;
        this.buildProgress = [];
        this.buildFinished = false;
        this.progress = 0;
        this.buildStatus = "building";
        this.push = true;
        if (this.executionDryRun) {
          buildData["cwl"] = yaml.dump(this.cwlObject, {lineWidth: -1});
        }
        buildAndPushApplication(buildData)
          .then((res) => {
            this.buildResponse = res;
            console.log(this.buildResponse);
            let dockerReqData = {};
            let dockerPullData = {};
            dockerPullData["dockerPull"] = this.buildResponse.imageReference;
            if (this.cwlObject.requirements.DockerRequirement) {
              dockerReqData = {
                ...this.cwlObject.requirements.DockerRequirement,
                ...dockerPullData,
              };
            } else {
              dockerReqData = dockerPullData;
            }
            this.$store.dispatch(EDIT_COMMAND_LINE_TOOL, {
              instance: this.cwlObject,
              property: "requirements",
              index: "DockerRequirement",
              updatedData: dockerReqData,
            });
          })
          .catch(showApiErrorAsNotification);
        this.connectToSSE();
      } else {
        console.log(this.buildValidationResult);
      }
    },
    assambleMultiSelectData() {
      let multiselectData = {};
      if (this.buildOptionsSelection.mainDep) {
        multiselectData.mainDependency =
          this.buildOptionsSelection.mainDep.identifier;
      } else {
        multiselectData.mainDependency = "";
      }
      if (this.buildOptionsSelection.softwareDeps) {
        multiselectData.softwareDependency = [];
        Object.values(this.buildOptionsSelection.softwareDeps).forEach(
          (dep) => {
            multiselectData.softwareDependency.push(dep.identifier);
          }
        );
      } else {
        multiselectData.softwareDependency = [];
      }
      if (this.buildOptionsSelection.repositoryType) {
        multiselectData.repositoryType =
          this.buildOptionsSelection.repositoryType.identifier;
      } else {
        multiselectData.repositoryType = "";
      }
      multiselectData.repositoryAddress =
        this.buildOptionsSelection.repositoryAddress;
      multiselectData.imageTag = this.buildOptionsSelection.imageTag;
      return multiselectData;
    },
    assambleCwlData() {
      let cwlData = {};
      cwlData.identifier = this.cwlObject.id;
      return cwlData;
    },
    buildAndPushDataValidation(buildData) {
      this.buildValidationResult = "";
      this.buildAndPushValidationResult = "";

      let result = "";
      if (buildData.identifier == "") {
        result = "Please enter Identifier in Command Line Tool";
      } else if (this.cwlObject.baseCommand.length == 0) {
        result = "Please enter a Base Command in Command Line Tool";
      } else if (buildData.repositoryType == "") {
        result = "Please select Repository Type in Build Options";
      } else if (
        buildData.repositoryType == "custom" &&
        buildData.repositoryAddress == ""
      ) {
        result = "Please enter Repository Address in Build Options";
      } else if (buildData.imageTag == "") {
        result = "Please enter Image Tag in Build Options";
      } else {
        result = "Valid";
      }

      if (this.pressedLast == "Build") {
        this.buildValidationResult = result;
      } else if (this.pressedLast == "BuildAndPush") {
        this.buildAndPushValidationResult = result;
      }
    },
    buildPassed() {
      console.debug("Processing BUILD PASSED");
    },
    releasePassed() {
      console.debug("Processing RELEASE PASSED");
    },
    yamlToObject(yamlContent) {
      console.warn(yamlContent);
      let yamlObj = undefined;
      try {
        yamlObj = yaml.load(yamlContent);
      } catch (error) {
        showNotification("YAML Validator", {
          type: "error",
          text: error.message,
          duration: 5000,
          group: "global",
        });
        return undefined;
      }
      return yamlObj;
    },
    startGuidedTour(tourName) {
      this.guidedTourRunning = true;
      this.selectedGuidedTour = tourName;
      this.$tours["clt-tour"].start();
    },
    openNewTab(href, event = undefined) {
      if (event) event.stopPropagation();
      window.open(href, "_blank");
    },
    setMode(mode) {
      this.$store.dispatch(SET_MODE, mode);
    },
    resetEditor() {
      this.$store.dispatch(RESET_EDITOR);
      this.building = false;
      this.progress = 0;
      this.maxSteps = 0;
      this.buildFinished = false;
      this.buildLog = [];
      this.buildStatus = "notStarted";
      this.push = false;
      this.executionDryRun = false;
      this.buildProgress = ["Build not started yet"];
    },
    showConfirmReset() {
      this.$bvModal
        .msgBoxConfirm("All entered values will be lost, are you sure?")
        .then((value) => {
          if (value) this.resetEditor();
        });
    },
    connectToSSE() {
      this.ESClient = new EventSource(
        `${process.env.VUE_APP_API_ROOT_URL}/status/`,
        { withCredentials: true }
      );

      this.buildStatus = "building";
      this.ESClient.onmessage = this.handleSSEMessage;
      this.ESClient.onerror = () => {
        console.warn("Disconnected");
        // Do not try to automatically reconnect
        // This ends up creating many connections
        this.ESClient.close();
        this.buildStatus = "disconnected";
      };
    },
    handleSSEMessage(message) {
      message = JSON.parse(message.data);
      let prepMessage = "Preparing to push layers..";
      let waitingMessage = "Waiting for layers..";
      switch (message.status) {
        case "building":
          this.progress = Number(message.step) - 1;
          this.maxSteps = Number(message.max_steps);
          this.buildProgress.push(message.message);
          break;
        case "success":
          this.buildProgress.push(message.message);
          if (!this.push && !this.executionDryRun) { 
            this.buildStats = "success";
            this.finishBuilding();}
          break;
        case "failed":
          this.buildProgress.push(message.message);
          this.buildStatus = "failed";
          this.finishBuilding();
          break;
        case "Preparing":
          if (this.buildProgress.slice(-1) != prepMessage) {
            this.buildProgress.push(prepMessage);
            this.progress = 0;
            this.maxSteps = 3;
          }
          break;
        case "Waiting":
          if (this.buildProgress.slice(-1) != waitingMessage) {
            this.buildProgress.push(waitingMessage);
            this.progress = 1;
            this.maxSteps = 3;
          }
          break;
        case "Layer already exists":
          if (this.buildProgress.slice(-1) != message.status) {
            this.buildProgress.push(message.status);
            this.progress = 2;
            this.maxSteps = 3;
          }
          break;
        case "dry-run-running":
          this.buildProgress.push(message.message);
          break;
        case "dry-run-success":
          this.buildProgress.push(message.message);
          if (!this.push) {
           this.buildStatus = "success"; 
            this.finishBuilding();}
          break;
        case "end":
          this.buildProgress.push(message.message);
          this.buildStatus = "unknown";
          this.finishBuilding();
          break;
        default:
          if (message.status.includes("digest")) {
            this.buildProgress.push("Finished pushing image to registry");
            this.finishBuilding();
          }
          break;
      }
    },
    finishBuilding() {
      this.building = false;
      this.progress = 1;
      this.maxSteps = 1;
      this.buildFinished = true;
      this.ESClient.close();
    },
    showLogs() {
      this.$bvModal.show("buildlog");
      getBuildLog().then((log) => {
        this.buildLog = log;
      });
    },
    uploadFile() {
      this.$refs.file.click();
    },
    onFileUpload(event) {
      if (event.target.files.length) {
        const file = event.target.files[0];
        const reader = new FileReader();
        const appName = file.name.replace(".cwl", "").replace(".CWL", "");
        reader.onload = () => this.loadCwlFile(reader.result, appName);
        reader.onerror = () =>
          showNotification("File Error", {
            type: "error",
            text: reader.error,
            duration: 5000,
            group: "global",
          });
        reader.readAsText(file);
      }
      this.$refs.file.value = ""; // Clear the file to allow change detection when same file is re-uploaded
    },
    loadCwlFile(fileContent, appName, appVersion = "version_1") {
      const yamlObject = this.yamlToObject(fileContent);
      console.warn(yamlObject);
      cwlValidator
        .validate(yamlObject, { strict: true })
        .then((validatedCwlObject) => {
          //console.log("Validation OK");
          console.log(validatedCwlObject);

          this.$store
            .dispatch(SET_CWL_OBJECT, parseCommandLineTool(validatedCwlObject))
            .then(() => {
              this.validateCwl("Errors");
            });
          this.$store.dispatch(CHANGE_APP_PACKAGE_NAME, appName);
          this.$store.dispatch(CHANGE_APP_PACKAGE_VERSION, appVersion);
        })
        .catch((error) => {
          showNotification("CWL Validator", {
            type: "error",
            text: error.message,
            duration: 5000,
            group: "global",
          });
          this.$store
            .dispatch(SET_CWL_OBJECT, parseCommandLineTool(yamlObject))
            .then(() => {
              this.validateCwl("Errors");
            });
          this.$store.dispatch(CHANGE_APP_PACKAGE_NAME, appName);
          this.$store.dispatch(CHANGE_APP_PACKAGE_VERSION, appVersion);
        });
    },
    validateCwl(validationType) {
      const issues = validateCwlConsistency(this.cwlObject);
      if (issues.length) {
        showNotification("CWL Validation issues", {
          group: "info",
          type: "error",
          text: issues,
          duration: -1,
        });
      } else {
        let payload = { cwl: this.$refs.processWrapper.$el.innerText };
        switch (validationType) {
          case "Errors":
            payload = {
              cwl: this.$refs.processWrapper.$el.innerText,
              level: "error",
            };
            break;
          case "ErrorsAndHints":
            payload = {
              cwl: this.$refs.processWrapper.$el.innerText,
              level: "hint",
            };
            break;
          case "ErrorsHintsAndNotes":
            payload = {
              cwl: this.$refs.processWrapper.$el.innerText,
              level: "note",
            };
            break;
        }
        // add code here to performm back-end validation if desired
      }
    },

    showDownloadModal() {
      this.cwlFilename = this.cwlObject.label
        ? `${this.cwlObject.label.replaceAll(" ", "_")}.cwl`
        : `file.cwl`;
      this.$refs["download-modal"].show();
    },
    createDownloadCwl(filename, data=this.cwlObject) {
      let mimetype = "text/yaml";
      let cleanedCwlData = yaml.dump(data, {
        lineWidth: -1,
      });
      console.log("cleaning cwl");
      console.log(cleanedCwlData);
      let blob = new Blob([cleanedCwlData], {
        type: mimetype + ";charset=utf-8",
      });
      saveAs(blob, filename);
    },
    closeApExplorer() {
      this.$refs["ws-manager-modal"].hide();
    },
    closeWorkspaceSaver() {
      this.$refs["ws-save-modal"].hide();
    },
    showApExplorer() {
      this.$refs["ws-manager-modal"].show();
    },
    showWorkspaceSaver() {
      this.$refs["ws-save-modal"].show();
    },
    workspaceSave(appName, appVersion) {
      const payload = { cwl: yaml.dump(this.cwlObject, {lineWidth: -1})};
      createUpdateApplicationPackageVersion(appName, appVersion, payload)
        .then(() => {
          this.$store.dispatch(CHANGE_APP_PACKAGE_NAME, appName);
          this.$store.dispatch(CHANGE_APP_PACKAGE_VERSION, appVersion);
          this.closeWorkspaceSaver();
          showNotification("Saved in Workspace successfully.", {
            group: "info",
            type: "success",
          });
        })
        .catch(showApiErrorAsNotification);
    },
    loadWsAppPackage(apName, apVersion) {
      getApplicationPackageVersion(apName, apVersion)
        .then((res) => this.loadCwlFile(res.cwl, apName, apVersion))
        .catch(showApiErrorAsNotification);
    },
    downloadFromWs(appName, appVersion) {
      getApplicationPackageVersion(appName, appVersion)
        .then((res) => this.createDownloadCwl(`${appName}_${appVersion}.cwl`, res.cwl))
        .catch(showApiErrorAsNotification);
    },
    openWsAppPackageNewWindow(apName, apVersion) {
      this.openNewTab(
        `${process.env.BASE_URL}/?apName=${apName}&apVersion=${apVersion}`
      );
    },
  },
  computed: {
    ...mapGetters({
      cwlObject: "cwlObject",
      buildOptionsSelection: "buildOptionsSelection",
      mode: "mode",
      appPackageName: "appPackageName",
      appPackageVersion: "appPackageVersion",
    }),
    steps() {
      return guidedTours[this.selectedGuidedTour](this);
    },
    cleanedCwl() {
      console.log("Cleaning CWL");
      console.warn(this.cwlObject);
      return removeEmpty(this.cwlObject);
    },
    guidedTourCallbacks() {
      return guidedToursCallbacks[this.selectedGuidedTour](this);
    },
    examplesList() {
      return examples;
    },
    buildValidator() {
      if (this.buildValidationResult == "Valid") {
        return true;
      } else {
        return false;
      }
    },
    buildAndPushValidator() {
      if (this.buildAndPushValidationResult == "Valid") {
        return true;
      } else {
        return false;
      }
    },
    buildValidatorMsg() {
      return this.buildValidationResult;
    },
    buildAndPushValidatorMsg() {
      return this.buildAndPushValidationResult;
    },
    buildOutput() {
      // Flatten the list and add newlines
      return this.buildProgress.reduce((acc, val) => acc + val + "\n", "");
    },
    formattedBuildLog() {
      return this.buildLog.reduce((acc, val) => acc + val, "");
    },
    checkDryRunAvailable() {
      // Check if all mandatory inputs have a default value
      const inputs = this.cwlObject.inputs;
      for (let input of inputs) {
        if (!input["type"]) {
          return false;
        }
        if (!input.type.endsWith('?')) {
          if (input.default == undefined) { return false; }
        }
      }
      return true;
    },
    progressColor() {
      switch(this.buildStatus) {
        case "failed":
          return "danger";
        case "disconnected":
          return "warning";
        case "building":
          return "primary";
        case "success":
          return "success";
        case "unknown":
          return "secondary";
        default:
          return "primary";
      }
    }
  },
  watch: {
    // If inputs change and are no longer valid, uncheck the dry run checkbox
    checkDryRunAvailable(value) {
      if (!value) {this.executionDryRun = false;}
    }
  }
};
</script>

<style>
.add-btn {
  text-transform: uppercase;
  font-size: 0.8rem;
  width: fit-content;
}

.editor-card .card-body {
  max-height: 79vh;
  overflow-y: auto;
}

.card-section .title {
  display: flex;
  justify-content: center;
  padding: 4px;
  margin: 20px 0px 0px 0px;
  background-color: #f7f7f7;
  border-bottom: 1px solid rgba(0, 0, 0, 0.125);
}

.center-text {
  display: flex;
  align-items: center;
}

.nav-tabs .nav-link {
  padding: 12px !important;
}

.clt-list {
  height: 80vh;
  overflow-y: auto;
}

.clt-list .card-body {
  padding: 0px;
}

.clt-list .card-header {
  padding: 0px;
}

.card-header {
  background-color: #ebebeb !important;
}

.cwl-template .card-body {
  max-height: 85vh;
  overflow-y: auto;
  padding: 12px 12px 0px 12px;
}

.empty-text .alert {
  padding: 0.7rem 0.25rem 0rem 0.25rem;
  margin: 0rem;
}

.v-step__content {
  word-break: break-word;
}

.help-menu-dropdown {
  border-radius: 6px !important;
  box-shadow: 2px 7px 17px 1px rgba(0, 0, 0, 0.6) !important;
}

#help-menu .btn {
  background-color: #333333;
  padding: 0.3rem;
  border-radius: 0.2rem !important;
}

.read-only {
  pointer-events: none;
}

.collapsed > .when-open,
.not-collapsed > .when-closed {
  display: none;
}
</style>