import api from './shared/apiUtils';

const API_ROOT = process.env.VUE_APP_API_ROOT_URL;

export const urls = {
  applicationPackages: {
    list: () => `${API_ROOT}/clt/`,
    detail: apSlug => `${API_ROOT}/clt/${apSlug}/`,
  },
  applicationPackageVersions: {
    list: apSlug => `${API_ROOT}/clt/${apSlug}/versions/`,
    detail: {
      base: (apSlug, versionSlug) => `${API_ROOT}/clt/${apSlug}/versions/${versionSlug}/`,
      lock: (apSlug, versionSlug) => `${API_ROOT}/clt/${apSlug}/versions/${versionSlug}/lock/`,
      unlock: (apSlug, versionSlug) => `${API_ROOT}/clt/${apSlug}/versions/${versionSlug}/unlock/`,
    },
  },
  // buildApplication: `${API_ROOT}/build/`,
  buildApplication: `${API_ROOT}/build/`, //development for new endpoint
  buildAndPushApplication: `${API_ROOT}/buildAndPush/`,
  buildOptions: `${API_ROOT}/options/`,
  clearApplicationFiles: `${API_ROOT}/clearApplicationFiles/`,
  buildLog: `${API_ROOT}/buildLog/`
};

export const listApplicationPackages = () => api.get(urls.applicationPackages.list());
export const listApplicationPackageVersions = apSlug => api.get(urls.applicationPackageVersions.list(apSlug));

export const getApplicationPackageVersion =
  (apSlug, versionSlug) => api.get(urls.applicationPackageVersions.detail.base(apSlug, versionSlug));

export const createUpdateApplicationPackageVersion = (apSlug, versionSlug, payload) =>
  api.put(urls.applicationPackageVersions.detail.base(apSlug, versionSlug), payload);

export const lockApplicationPackageVersion = (apSlug, versionSlug) =>
  api.patch(urls.applicationPackageVersions.detail.lock(apSlug, versionSlug));
export const unlockApplicationPackageVersion = (apSlug, versionSlug) =>
  api.patch(urls.applicationPackageVersions.detail.unlock(apSlug, versionSlug));

export const deleteApplicationPackage = apSlug =>
  api.delete(urls.applicationPackages.detail(apSlug));
export const deleteApplicationPackageVersion = (apSlug, versionSlug) =>
  api.delete(urls.applicationPackageVersions.detail.base(apSlug, versionSlug));

export const buildApplication = (payload) =>
  api.post(urls.buildApplication, payload);
  
export const buildAndPushApplication = (payload) =>
  api.post(urls.buildAndPushApplication, payload);

export const getOptions = () => api.get(urls.buildOptions);

export const getBuildLog = () => api.get(urls.buildLog);

export const clearApplicationFiles = (payload) =>
  api.post(urls.clearApplicationFiles, payload);