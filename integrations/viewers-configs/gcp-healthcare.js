/** @type {AppTypes.Config} */
/**
 * Google Cloud Healthcare API DICOM Configuration
 * This config connects OHIF Viewer to Google Cloud Healthcare DICOM store
 */

window.config = {
  name: 'config/gcp-healthcare.js',
  routerBasename: null,
  extensions: [],
  modes: [],
  customizationService: {},
  showStudyList: true,
  maxNumberOfWebWorkers: 3,
  showWarningMessageForCrossOrigin: true,
  showCPUFallbackMessage: true,
  showLoadingIndicator: true,
  experimentalStudyBrowserSort: false,
  strictZSpacingForVolumeViewport: true,
  groupEnabledModesFirst: true,
  allowMultiSelectExport: false,
  maxNumRequests: {
    interaction: 100,
    thumbnail: 75,
    prefetch: 25,
  },
  showErrorDetails: 'always',
  
  defaultDataSourceName: 'gcp-healthcare',
  
  dataSources: [
    {
      namespace: '@ohif/extension-default.dataSourcesModule.dicomweb',
      sourceName: 'gcp-healthcare',
      configuration: {
        friendlyName: 'Google Cloud Healthcare DICOM Store',
        name: 'gcp-healthcare',
        
        // Google Cloud Healthcare API DICOMweb endpoints
        // Format: https://healthcare.googleapis.com/v1/projects/{PROJECT}/locations/{LOCATION}/datasets/{DATASET}/dicomStores/{DICOM_STORE}/dicomWeb
        qidoRoot: 'https://healthcare.googleapis.com/v1/projects/healix369/locations/us-central1/datasets/dicom-viewer-dataset/dicomStores/ohif-dicom-store/dicomWeb',
        wadoRoot: 'https://healthcare.googleapis.com/v1/projects/healix369/locations/us-central1/datasets/dicom-viewer-dataset/dicomStores/ohif-dicom-store/dicomWeb',
        wadoUriRoot: 'https://healthcare.googleapis.com/v1/projects/healix369/locations/us-central1/datasets/dicom-viewer-dataset/dicomStores/ohif-dicom-store/dicomWeb',
        
        qidoSupportsIncludeField: true,
        supportsReject: false,
        imageRendering: 'wadors',
        thumbnailRendering: 'wadors',
        enableStudyLazyLoad: true,
        supportsFuzzyMatching: true,
        supportsWildcard: true,
        
        // Authentication headers for GCP
        // Note: In production, you'll need to implement OAuth2 authentication
        // For now, we'll use a proxy or service account credentials
        requestOptions: {
          headers: {
            // Add authorization header here when authenticated
            'Authorization': 'Bearer YOUR_GOOGLE_OAUTH_TOKEN_HERE',
          },
        },
        
        bulkDataURI: {
          enabled: true,
          relativeResolution: 'studies',
        },
        omitQuotationForMultipartRequest: true,
      },
    },
    
    // Local fallback for testing with sample files
    {
      namespace: '@ohif/extension-default.dataSourcesModule.dicomweb',
      sourceName: 'local-orthanc',
      configuration: {
        friendlyName: 'Local Orthanc DICOM Server',
        name: 'orthanc',
        wadoUriRoot: 'http://localhost:8042/dicom-web',
        qidoRoot: 'http://localhost:8042/dicom-web',
        wadoRoot: 'http://localhost:8042/dicom-web',
        qidoSupportsIncludeField: true,
        supportsReject: true,
        dicomUploadEnabled: true,
        imageRendering: 'wadors',
        thumbnailRendering: 'wadors',
        enableStudyLazyLoad: true,
        supportsFuzzyMatching: true,
        supportsWildcard: true,
        bulkDataURI: {
          enabled: true,
        },
      },
    },

    // Keep the default AWS S3 demo data source
    {
      namespace: '@ohif/extension-default.dataSourcesModule.dicomweb',
      sourceName: 'ohif-demo',
      configuration: {
        friendlyName: 'AWS S3 Demo Data',
        name: 'aws',
        wadoUriRoot: 'https://d14fa38qiwhyfd.cloudfront.net/dicomweb',
        qidoRoot: 'https://d14fa38qiwhyfd.cloudfront.net/dicomweb',
        wadoRoot: 'https://d14fa38qiwhyfd.cloudfront.net/dicomweb',
        qidoSupportsIncludeField: false,
        imageRendering: 'wadors',
        thumbnailRendering: 'wadors',
        enableStudyLazyLoad: true,
        supportsFuzzyMatching: true,
        supportsWildcard: false,
        staticWado: true,
        singlepart: 'bulkdata,video',
        bulkDataURI: {
          enabled: true,
          relativeResolution: 'studies',
        },
      },
    },
  ],
};
