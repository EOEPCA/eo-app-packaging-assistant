module.exports = {
  /* ... */
  publicPath: process.env.VUE_APP_ENV === 'application_hub'
    ? ''
    : process.env.NODE_ENV === 'production' ? '/app-pkg-assistant/' : '/'
};
