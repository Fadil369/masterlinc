/** @type {AppTypes.Config} */
window.config = {
  routerBasename: '/',
  enableGoogleCloudAdapter: true,
  showWarningMessageForCrossOrigin: true,
  showCPUFallbackMessage: true,
  showLoadingIndicator: true,
  strictZSpacingForVolumeViewport: true,
  // OIDC configuration for Google Authentication
  oidc: [
    {
      authority: 'https://accounts.google.com',
      client_id: '761079524667-xxxxxxxxxx.apps.googleusercontent.com', // Replace with your OAuth client ID
      redirect_uri: '/callback',
      response_type: 'id_token token',
      scope: 'email profile openid https://www.googleapis.com/auth/cloudplatformprojects.readonly https://www.googleapis.com/auth/cloud-healthcare',
      post_logout_redirect_uri: '/logout-redirect.html',
      revoke_uri: 'https://accounts.google.com/o/oauth2/revoke?token=',
      automaticSilentRenew: true,
      revokeAccessTokenOnSignout: true,
    },
  ],
  extensions: [],
  modes: [],
  showStudyList: true,
  defaultDataSourceName: 'dicomweb',
  dataSources: [
    {
      namespace: '@ohif/extension-default.dataSourcesModule.dicomweb',
      sourceName: 'dicomweb',
      configuration: {
        friendlyName: 'Healix DICOM Server',
        name: 'GCP',
        wadoUriRoot: 'https://healthcare.googleapis.com/v1/projects/healix369/locations/us-central1/datasets/dicom-viewer-dataset/dicomStores/ohif-dicom-store/dicomWeb',
        qidoRoot: 'https://healthcare.googleapis.com/v1/projects/healix369/locations/us-central1/datasets/dicom-viewer-dataset/dicomStores/ohif-dicom-store/dicomWeb',
        wadoRoot: 'https://healthcare.googleapis.com/v1/projects/healix369/locations/us-central1/datasets/dicom-viewer-dataset/dicomStores/ohif-dicom-store/dicomWeb',
        qidoSupportsIncludeField: true,
        imageRendering: 'wadors',
        thumbnailRendering: 'wadors',
        enableStudyLazyLoad: true,
        supportsFuzzyMatching: true,
        supportsWildcard: false,
        dicomUploadEnabled: true,
        omitQuotationForMultipartRequest: true,
        configurationAPI: 'ohif.dataSourceConfigurationAPI.google',
      },
    },
    {
      namespace: '@ohif/extension-default.dataSourcesModule.dicomjson',
      sourceName: 'dicomjson',
      configuration: {
        friendlyName: 'dicom json',
        name: 'json',
      },
    },
    {
      namespace: '@ohif/extension-default.dataSourcesModule.dicomlocal',
      sourceName: 'dicomlocal',
      configuration: {
        friendlyName: 'dicom local',
      },
    },
  ],
};
