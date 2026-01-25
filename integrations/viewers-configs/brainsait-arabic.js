/** @type {AppTypes.Config} */
/**
 * BrainSAIT - Arabic Medical Imaging Platform
 * Custom OHIF Configuration with AI-Powered Features
 * 
 * Features:
 * - Arabic language by default
 * - RTL (Right-to-Left) support
 * - Custom BrainSAIT branding
 * - GCP Healthcare API integration
 * - AI-powered analysis ready
 */

window.config = {
  name: 'BrainSAIT DICOM Viewer',
  routerBasename: null,
  
  // Custom branding
  whiteLabeling: {
    createLogoComponentFn: function(React) {
      return React.createElement(
        'div',
        { 
          style: { 
            display: 'flex', 
            alignItems: 'center',
            gap: '10px',
            color: '#00d4ff',
            fontSize: '24px',
            fontWeight: 'bold',
            fontFamily: 'Arial, sans-serif',
            direction: 'rtl'
          } 
        },
        React.createElement('span', null, '🧠'),
        React.createElement('span', null, 'BrainSAIT')
      );
    },
  },
  
  extensions: [],
  modes: [],
  customizationService: {
    // Arabic-first customization
    cornerstoneOverlayTopRight: {
      id: 'cornerstoneOverlayTopRight',
      items: [
        {
          id: 'PatientNameOverlay',
          customizationType: 'ohif.cornerstoneOverlay',
          attribute: 'patientName',
          title: 'اسم المريض',
          contentF: ({ instance, formatters: { formatPN } }) => {
            return formatPN(instance.PatientName) || 'غير متوفر';
          },
        },
        {
          id: 'PatientSex',
          customizationType: 'ohif.cornerstoneOverlay',
          attribute: 'patientSex',
          title: 'الجنس',
          contentF: ({ instance }) => {
            const sex = instance.PatientSex;
            const arabicSex = sex === 'M' ? 'ذكر' : sex === 'F' ? 'أنثى' : 'غير محدد';
            return arabicSex;
          },
        },
        {
          id: 'StudyDate',
          customizationType: 'ohif.cornerstoneOverlay',
          attribute: 'studyDate',
          title: 'تاريخ الدراسة',
          contentF: ({ instance, formatters: { formatDate } }) => {
            return formatDate(instance.StudyDate) || 'غير متوفر';
          },
        },
      ],
    },
  },
  
  showStudyList: true,
  maxNumberOfWebWorkers: 4, // Increased for better performance
  showWarningMessageForCrossOrigin: true,
  showCPUFallbackMessage: true,
  showLoadingIndicator: true,
  experimentalStudyBrowserSort: true,
  strictZSpacingForVolumeViewport: true,
  groupEnabledModesFirst: true,
  allowMultiSelectExport: true,
  
  maxNumRequests: {
    interaction: 100,
    thumbnail: 100,
    prefetch: 50,
  },
  
  showErrorDetails: 'always',
  
  // Default to Arabic language
  language: 'ar',
  
  defaultDataSourceName: 'brainsait-gcp',
  
  dataSources: [
    // BrainSAIT GCP Healthcare API
    {
      namespace: '@ohif/extension-default.dataSourcesModule.dicomweb',
      sourceName: 'brainsait-gcp',
      configuration: {
        friendlyName: 'BrainSAIT - مخزن الصور الطبية',
        name: 'gcp-healthcare',
        
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
        
        requestOptions: {
          headers: {
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
    
    // Local Orthanc for testing
    {
      namespace: '@ohif/extension-default.dataSourcesModule.dicomweb',
      sourceName: 'brainsait-local',
      configuration: {
        friendlyName: 'BrainSAIT محلي - خادم الاختبار',
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

    // Demo data for testing
    {
      namespace: '@ohif/extension-default.dataSourcesModule.dicomweb',
      sourceName: 'brainsait-demo',
      configuration: {
        friendlyName: 'BrainSAIT تجريبي - بيانات اختبار',
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
  
  // AI-Ready configuration (placeholder for future AI features)
  aiServices: {
    enabled: true,
    autoAnalysis: false,
    features: {
      autoMeasurements: false,
      abnormalityDetection: false,
      reportGeneration: false,
    },
  },
};
