<template>
  <div>
    <b-breadcrumb>
      <b-breadcrumb-item @click="showAllAppPackages">
        <b-icon icon="list-stars" shift-v="-1.25"/>
        All
      </b-breadcrumb-item>
      <b-breadcrumb-item v-if="selectedAp" @click="showAppPackageVersions">
        <b-icon icon="archive" shift-v="-1.1"/>
        {{ selectedAp }}
      </b-breadcrumb-item>
      <div style="position: absolute; right: 2rem;">
        <b-icon
          @click="sort('asc', 'version')"
          class="ml-1 sorter" icon="sort-alpha-down" shift-v="-1.1"
          v-b-tooltip.hover.window.html="'Alphabetical order'" font-scale="1.4"
        />
        <b-icon
          @click="sort('desc', 'version')"
          class="ml-1 sorter mr-3" icon="sort-alpha-down-alt" shift-v="-1.1"
          v-b-tooltip.hover.window.html="'Reverse alphabetical order'" font-scale="1.4"
        />
        <b-iconstack
          v-if="viewMode === 'appPackageVersions'"
          font-scale="1.2" class="ml-2 sorter" v-b-tooltip.hover.window.html="'Date order'"
          @click="sort('asc', 'lastModified')"
        >
          <b-icon stacked icon="arrow-down" shift-h="-8"/>
          <b-icon stacked icon="clock" shift-v="4" shift-h="-1" scale="0.5"/>
        </b-iconstack>
        <b-iconstack
          v-if="viewMode === 'appPackageVersions'"
          font-scale="1.2" class="ml-1 sorter" v-b-tooltip.hover.window.html="'Reverse date order'"
          @click="sort('desc', 'lastModified')"
        >
          <b-icon stacked icon="arrow-up" shift-h="-8"/>
          <b-icon stacked icon="clock" shift-v="-4" shift-h="-1" scale="0.5"/>
        </b-iconstack>
      </div>
    </b-breadcrumb>
    <b-list-group>
      <div class='list-group' v-if="viewMode==='appPackages'">
        <empty class="m-0 p-0" v-if="applicationPackages?.length === 0" text="No Applications" no-icon/>
        <b-list-group-item
          class="app-package-items"
          v-for="appPackage in applicationPackages" :key="appPackage._key"
          @click="onApSelect(appPackage)" style="cursor: pointer"
        >
          <b-row class="item">
            <b-col sm="11">
              <b-icon icon="archive" shift-v="-1.1"/> &nbsp;{{ appPackage }}
            </b-col>
            <b-col sm="1">
              <b-btn
                size="sm" variant="danger" v-b-tooltip.hover.window.html="'Delete this application.'"
                @click="deleteAppPackage($event, appPackage)"
              >
                <b-icon icon="trash-fill" shift-v="-1.2"/>
              </b-btn>
            </b-col>
          </b-row>
        </b-list-group-item>
      </div>
      <div class='list-group' v-if="viewMode==='appPackageVersions'">
        <b-list-group-item
          class="app-package-items" v-for="appPackageVersion in selectedApVersions" :key="appPackageVersion._key"
        >
          <b-row class="item">
            <b-col sm="1">
              <b-icon
                class="ml-1"
                v-if="appPackageVersion.locked" icon="lock-fill" shift-v="-1.1"
                v-b-tooltip.hover.window.html="'This version is locked'"
              />
            </b-col>
            <b-col sm="5">
              <span v-b-tooltip.hover.window.html="'Version name'">{{ appPackageVersion.version }}</span>
            </b-col>
            <b-col sm="3">
              <span v-b-tooltip.hover.window.html="'Last modification date'">
                {{ toHumanReadableDate(appPackageVersion.lastModified) }}
              </span>
            </b-col>
            <b-col sm="3  ">
              <b-button-toolbar>
                <b-button-group class="mr-1">
                  <b-btn
                    size="sm" variant="success" v-b-tooltip.hover.window.html="'Download from Workspace'"
                    @click="$emit('download', selectedAp, appPackageVersion.version)"
                  >
                    <fa-icon icon="download"/>
                  </b-btn>
                  <b-btn
                    size="sm" variant="primary" v-b-tooltip.hover.window.html="'Open Application definition'"
                    @click="open(selectedAp, appPackageVersion.version)"
                  >
                    <b-icon icon="box-arrow-in-up-right" shift-v="-1.2"/>
                  </b-btn>
                  <b-btn
                    size="sm" variant="primary" 
                    v-b-tooltip.hover.window.html="'Open Application definition in new Window'"
                    @click="openNewWindow(selectedAp, appPackageVersion.version)"
                  >
                    <b-icon icon="box-arrow-up-right" shift-v="-1.2"/>
                  </b-btn>
                  <b-btn
                    size="sm" variant="primary"
                    v-b-tooltip.hover.window.html="appPackageVersion.locked ? 'Unlock version' : 'Lock version'"
                    @click="lockUnlock(appPackageVersion.version, appPackageVersion.locked)"
                  >
                    <b-icon :icon="appPackageVersion.locked ? 'unlock-fill' : 'lock-fill'" shift-v="-1.2"/>
                  </b-btn>
                  <b-btn
                    size="sm" variant="danger" v-b-tooltip.hover.window.html="'Delete this version'"
                    @click="deleteVersion(appPackageVersion.version)"
                  >
                    <b-icon icon="trash-fill" shift-v="-1.2"/>
                  </b-btn>
                </b-button-group>
              </b-button-toolbar>
            </b-col>
          </b-row>
        </b-list-group-item>
      </div>
    </b-list-group>
    <div class="form-control-btn">
      <b-btn size="sm" id="clt-input-modal-cancel-btn" @click="handleClose">
        <span>Close</span>
      </b-btn>
    </div>
  </div>
</template>

<script>
import {
  listApplicationPackages,
  listApplicationPackageVersions,
  deleteApplicationPackage,
  deleteApplicationPackageVersion,
  lockApplicationPackageVersion,
  unlockApplicationPackageVersion
} from "../../api";
import _ from 'lodash';
import {showApiErrorAsNotification} from "../../utils";
import Empty from "../Shared/Empty";

export default {
  name: "ApWorkspaceManager",
  components: {Empty},
  mounted() {
    listApplicationPackages().then(
      wsApplicationPackages => this.applicationPackages = _.orderBy(wsApplicationPackages)
    ).catch(showApiErrorAsNotification);
  },
  data() {
    return {
      applicationPackages: [],
      selectedAp: undefined,
      selectedApVersions: [],
      viewMode: 'appPackages'
    };
  },
  methods: {
    onApSelect(selectedAp) {
      if (this.selectedAp !== selectedAp) {
        this.selectedAp = selectedAp;
        listApplicationPackageVersions(selectedAp).then(apVersions => {
            this.selectedApVersions = _.orderBy(apVersions, 'version');
            this.viewMode = 'appPackageVersions';
          }
        ).catch(showApiErrorAsNotification);
      }
    },
    showAllAppPackages() {
      this.viewMode = 'appPackages';
      this.selectedAp = undefined;
    },
    showAppPackageVersions() {
      this.viewMode = 'appPackageVersions';
    },
    toHumanReadableDate(timestamp) {
      const tzoffset = (new Date()).getTimezoneOffset() * 60000;
      const isoString = new Date((timestamp * 1000) - tzoffset).toISOString();
      return `${isoString.split('T')[0]} ${isoString.split('T')[1].slice(0,5)}`;
    },
    sort(order, sortKey = undefined) {
      if (this.viewMode === 'appPackageVersions') {
        this.selectedApVersions = _.orderBy(this.selectedApVersions, sortKey, order);
      } else {
        this.applicationPackages = _.orderBy(this.applicationPackages, undefined, order);
      }
    },
    handleClose() {
      this.$emit('onClose');
    },
    open(apName, apVersion) {
      this.$emit('openAppPackage', apName, apVersion);
      this.handleClose();
    },
    openNewWindow(apName, apVersion) {
      this.$emit('openAppPackageNewTab', apName, apVersion);
    },
    lockUnlock(apVersion, locked) {
      const lockChangeHandler = res => {
        const idx = this.selectedApVersions.findIndex(apVersionObj => apVersionObj.version === apVersion);
        this.$set(this.selectedApVersions, idx, {...this.selectedApVersions[idx], locked: !locked});
      };
      if (!locked) {
        lockApplicationPackageVersion(this.selectedAp, apVersion).then(lockChangeHandler).catch(
          showApiErrorAsNotification
        );
      } else {
        unlockApplicationPackageVersion(this.selectedAp, apVersion).then(lockChangeHandler)
          .catch(showApiErrorAsNotification);
      }
    },
    deleteVersion(apVersion) {
      this.$bvModal.msgBoxConfirm(
        'You are about to delete this application version, please confirm this action?'
      ).then(value => {
        if (value) {
          deleteApplicationPackageVersion(this.selectedAp, apVersion).then(res => {
            this.selectedApVersions = this.selectedApVersions.filter(e => e.version !== apVersion);
          }).catch(showApiErrorAsNotification);
        }
      });
    },
    deleteAppPackage(event, apName) {
      event.stopPropagation();
      this.$bvModal.msgBoxConfirm(
        'You are about to delete this whole application, please confirm this action?'
      ).then(value => {
        if (value) {
          deleteApplicationPackage(apName).then(res => {
            this.applicationPackages = this.applicationPackages.filter(name => name !== apName);
          }).catch(showApiErrorAsNotification);
        }
      });
    }
  },
};
</script>

<style scoped>
.form-control-btn {
  display: flex;
  justify-content: center;
  margin-top: 20px;
}

.form-control-btn .btn {
  margin-left: 6px;
  margin-right: 6px;
}

.list-group {
  overflow-y: auto;
  max-height: 600px;
}

.list-group-item {
  padding-top: 0.3rem;
  padding-bottom: 0.3rem;
}

.app-package-items:hover {
  background-color: #ececec;
}

.app-package-items .item {
  display: flex;
  align-items: center;
}

.sorter:hover {
  cursor: pointer;
}
</style>
