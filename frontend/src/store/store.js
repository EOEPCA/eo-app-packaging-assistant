import Vuex from 'vuex';
import Vue from "vue";
import * as actionTypes from "./action-types";
import * as mutationTypes from "./mutation-types";
import _ from "lodash";

export const DEFAULT_NAMESPACE = 'https://schema.org/';
export const DEFAULT_NS_PREFIX = 's';

Vue.use(Vuex);

const initialEditorState = () => ({
  nsPrefix: DEFAULT_NS_PREFIX,
  appPackageName: 'application_package_name',
  appPackageVersion: 'version_1',
  cwlObject: {
    cwlVersion: 'v1.0',
    id: '',
    class: 'CommandLineTool',
    baseCommand: [],
    arguments: [],
    label: "",
    doc: "",
    inputs: [],
    outputs: [],
    requirements: {}
  },
  buildOptionsSelection: {
    mainDep: undefined,
    softwareDeps: [],
    repositoryType: undefined,
    repositoryAddress: '',
    imageTag: 'latest'
  }
});

export const store = new Vuex.Store({
  state: {
    mode: 'simple',
    ...initialEditorState()
  },
  getters: {
    cwlObject(state) {
      return state.cwlObject;
    },
    buildOptionsSelection(state) {
      return state.buildOptionsSelection;
    },
    mode(state) {
      return state.mode;
    },
    appPackageName(state) {
      return state.appPackageName;
    },
    appPackageVersion(state) {
      return state.appPackageVersion;
    },
  },
  mutations: {
    [mutationTypes.SET_MODE](state, mode) {
      Vue.set(state, 'mode', mode);
    },
    [mutationTypes.RESET_EDITOR](state) {
      store.replaceState({mode: state.mode, ...initialEditorState()});
      document.title = 'EO Application Packaging Assistant';
    },
    [mutationTypes.SET_CWL_OBJECT](state, cwlObject) {
      console.log("setting CWL object");
      console.warn(cwlObject);
      Vue.set(state, 'cwlObject', cwlObject);
    },
    [mutationTypes.CHANGE_APP_PACKAGE_NAME](state, filename) {
      state.appPackageName = filename;
    },
    [mutationTypes.CHANGE_APP_PACKAGE_VERSION](state, fileVersion) {
      state.appPackageVersion = fileVersion;
      document.title = `${state.appPackageName} - ${state.appPackageVersion}`;
    },
    [mutationTypes.EDIT_COMMAND_LINE_TOOL](state, {instance, property, index, updatedData}) {
      Vue.set(state.cwlObject[property], index, updatedData);
    },
    [mutationTypes.REMOVE_COMMAND_LINE_TOOL_ELEMENT](state, {instance, property, index}) {
      Vue.delete(state.cwlObject[property], index);
    },
    [mutationTypes.ADD_COMMAND_LINE_TOOL_ELEMENT](state, {instance, property, data}) {
      state.cwlObject[property].push(data);
    },
    [mutationTypes.EDIT_BUILD_OPTIONS_SELECTION](state, {instance, property, updatedData}) {
      Vue.set(state.buildOptionsSelection[property], updatedData);
    },
  },
  actions: {
    [actionTypes.SET_MODE]({commit}, mode) {
      commit(mutationTypes.SET_MODE, mode);
    },
    [actionTypes.RESET_EDITOR]({commit}) {
      commit(mutationTypes.RESET_EDITOR);
    },
    [actionTypes.SET_CWL_OBJECT]({commit}, cwlObject) {
      commit(mutationTypes.SET_CWL_OBJECT, cwlObject);
    },
    [actionTypes.CHANGE_APP_PACKAGE_NAME]({commit}, filename) {
      commit(mutationTypes.CHANGE_APP_PACKAGE_NAME, filename);
    },
    [actionTypes.CHANGE_APP_PACKAGE_VERSION]({commit}, fileVersion) {
      commit(mutationTypes.CHANGE_APP_PACKAGE_VERSION, fileVersion);
    },
    [actionTypes.EDIT_COMMAND_LINE_TOOL]({commit}, payload) {
      commit(mutationTypes.EDIT_COMMAND_LINE_TOOL, payload);
    },
    [actionTypes.REMOVE_COMMAND_LINE_TOOL_ELEMENT]({commit}, payload) {
      commit(mutationTypes.REMOVE_COMMAND_LINE_TOOL_ELEMENT, payload);
    },
    [actionTypes.ADD_COMMAND_LINE_TOOL_ELEMENT]({commit}, payload) {
      commit(mutationTypes.ADD_COMMAND_LINE_TOOL_ELEMENT, payload);
    },
    [actionTypes.EDIT_BUILD_OPTIONS_SELECTION]({commit}, payload) {
      commit(mutationTypes.EDIT_BUILD_OPTIONS_SELECTION, payload);
    },
  }
});
