import Vue from "vue";
import App from "./App.vue";
import {BootstrapVue, BootstrapVueIcons, BIconThreeDots, BIcon} from "bootstrap-vue";
import {library} from "@fortawesome/fontawesome-svg-core";
import {FontAwesomeIcon} from "@fortawesome/vue-fontawesome";
import Notifications from "vue-notification";
import {store} from "./store/store";
import VueTour from 'vue-tour';

import yaml from "highlight.js/lib/languages/yaml";

import VueHighlightJS from "vue-highlight.js";
import "highlight.js/styles/atom-one-light.css";
import "vue-tour/dist/vue-tour.css";
import tooltips from './data/tooltips.json';

Vue.use(VueHighlightJS, {
  languages: {yaml}
});

Vue.use(VueTour);

import {
  faAngleDoubleLeft,
  faAngleDoubleRight,
  faArchive,
  faArrowDown,
  faArrowLeft,
  faArrowRight,
  faArrowsAlt,
  faArrowUp,
  faBars,
  faBolt,
  faCaretSquareDown,
  faCheck,
  faCheckCircle,
  faChevronDown,
  faChevronLeft,
  faChevronRight,
  faChevronUp,
  faClock,
  faCloud,
  faCloudUploadAlt,
  faCog,
  faColumns,
  faDatabase,
  faDownload,
  faEdit,
  faEllipsisH,
  faEnvelope,
  faExclamation,
  faExclamationCircle,
  faExclamationTriangle,
  faExternalLinkAlt,
  faEye,
  faEyeSlash,
  faFileAlt,
  faFileImport,
  faFolderOpen,
  faGlobe,
  faHdd,
  faInfoCircle,
  faKey,
  faLock,
  faLockOpen,
  faMemory,
  faMicrochip,
  faNetworkWired,
  faPaperPlane,
  faPause,
  faPauseCircle,
  faPen,
  faPlay,
  faPlayCircle,
  faPlus,
  faPlusCircle,
  faPlusSquare,
  faQuestionCircle,
  faRedo,
  faSearch,
  faShare,
  faShieldAlt,
  faSpinner,
  faSyncAlt,
  faTimes,
  faTimesCircle,
  faTrash,
  faUnlink,
  faUpload,
  faUser,
  faUserCheck,
  faUserCog,
  faUserPlus,
  faUserShield,
  faUserSlash,
  faSave,
} from "@fortawesome/free-solid-svg-icons";

library.add(
  faAngleDoubleLeft,
  faAngleDoubleRight,
  faArchive,
  faArrowDown,
  faArrowLeft,
  faArrowRight,
  faArrowsAlt,
  faArrowUp,
  faBars,
  faBolt,
  faCaretSquareDown,
  faCheck,
  faCheckCircle,
  faChevronDown,
  faChevronLeft,
  faChevronRight,
  faChevronUp,
  faClock,
  faCloud,
  faCloudUploadAlt,
  faCog,
  faColumns,
  faDatabase,
  faDownload,
  faEdit,
  faEllipsisH,
  faEnvelope,
  faExclamation,
  faExclamationCircle,
  faExclamationTriangle,
  faExternalLinkAlt,
  faEye,
  faEyeSlash,
  faFileAlt,
  faFileImport,
  faFolderOpen,
  faGlobe,
  faHdd,
  faInfoCircle,
  faKey,
  faLock,
  faLockOpen,
  faMemory,
  faMicrochip,
  faNetworkWired,
  faPaperPlane,
  faPause,
  faPauseCircle,
  faPen,
  faPlay,
  faPlayCircle,
  faPlus,
  faPlusCircle,
  faPlusSquare,
  faQuestionCircle,
  faRedo,
  faSearch,
  faShare,
  faShieldAlt,
  faSpinner,
  faSyncAlt,
  faTimes,
  faTimesCircle,
  faTrash,
  faUnlink,
  faUpload,
  faUser,
  faUserCheck,
  faUserCog,
  faUserPlus,
  faUserShield,
  faUserSlash,
  faSave
);

Vue.config.productionTip = false;
Vue.config.devtools = true;

Vue.use(BootstrapVue);
Vue.use(Notifications);
Vue.use(BootstrapVueIcons);


Vue.component("fa-icon", FontAwesomeIcon);
Vue.component("BIcon", BIcon);
Vue.component("BIconThreeDots", BIconThreeDots);

Vue.mixin({
  methods: {
    getHelper: function (id) {
      return tooltips[id];
    }
  },
});

new Vue({
  store: store,
  render: (h) => h(App),
}).$mount("#app");
