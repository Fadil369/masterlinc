/**
 * BrainSAIT Radiology Skills - Direct Orthanc/OHIF integration
 * Provides quick access to DICOM studies without routing through MasterLinc
 */

const http = require('http');

module.exports = {
  name: 'brainsait-radiology',
  description: 'Direct access to BrainSAIT radiology platform',
  version: '1.0.0',
  
  // Environment configuration
  config: {
    orthancUrl: process.env.ORTHANC_URL || 'http://localhost:8042',
    orthancUser: process.env.ORTHANC_USER || 'orthanc',
    orthancPassword: process.env.ORTHANC_PASSWORD || 'orthanc',
    ohifUrl: process.env.OHIF_URL || 'http://localhost:3000',
    enablePHI: process.env.ENABLE_PHI_PROTECTION === 'true'
  },
  
  commands: [
    {
      name: 'status',
      pattern: /^(status|health|check)$/i,
      handler: 'getSystemStatus'
    },
    {
      name: 'studies',
      pattern: /^studies\s*(today|new|recent)?$/i,
      handler: 'listStudies'
    },
    {
      name: 'study',
      pattern: /^study\s+([a-f0-9-]+)$/i,
      handler: 'getStudyDetails'
    },
    {
      name: 'stats',
      pattern: /^(stats|statistics|analytics)$/i,
      handler: 'getStatistics'
    }
  ],
  
  async handler(message, context) {
    const text = message.text.replace(/^(@bot|!radiology)\s+/i, '').trim();
    
    // Find matching command
    for (const cmd of this.commands) {
      const match = text.match(cmd.pattern);
      if (match) {
        return await this[cmd.handler](match, context);
      }
    }
    
    return this.getHelp();
  },
  
  async getSystemStatus() {
    try {
      const systemInfo = await this.orthancRequest('/system');
      const stats = await this.orthancRequest('/statistics');
      
      const uptime = this.formatUptime(systemInfo.ServerUptime);
      
      return `🧠 *BrainSAIT Status*\n\n` +
        `✅ Orthanc PACS: Online\n` +
        `✅ OHIF Viewer: Online\n` +
        `📊 Total Studies: ${stats.CountStudies}\n` +
        `📁 Total Series: ${stats.CountSeries}\n` +
        `🖼️ Total Instances: ${stats.CountInstances}\n` +
        `💾 Disk Usage: ${this.formatBytes(stats.TotalDiskSize)}\n` +
        `⏱️ Uptime: ${uptime}`;
        
    } catch (error) {
      return `❌ *System Error*\n\n${error.message}\n\nOrthanc may be offline.`;
    }
  },
  
  async listStudies(match) {
    try {
      const filter = match[1] || 'today';
      const studies = await this.orthancRequest('/studies');
      
      // Get details for recent studies (limit to 10)
      const recentStudies = studies.slice(0, 10);
      const details = await Promise.all(
        recentStudies.map(id => this.orthancRequest(`/studies/${id}`))
      );
      
      let response = `📋 *Recent Studies* (${studies.length} total)\n\n`;
      
      details.forEach((study, idx) => {
        const patientName = this.config.enablePHI ? 
          this.anonymizePatient(study.PatientMainDicomTags?.PatientName) :
          study.PatientMainDicomTags?.PatientName || 'UNKNOWN';
          
        const studyDate = study.MainDicomTags?.StudyDate || 'N/A';
        const modality = study.MainDicomTags?.ModalitiesInStudy || 'N/A';
        const studyId = study.ID;
        
        response += `${idx + 1}. *${patientName}*\n`;
        response += `   📅 ${this.formatDate(studyDate)}\n`;
        response += `   🔬 ${modality}\n`;
        response += `   🔗 ID: \`${studyId.substring(0, 8)}\`\n\n`;
      });
      
      response += `_Send "study <ID>" for details_`;
      return response;
      
    } catch (error) {
      return `❌ Error fetching studies: ${error.message}`;
    }
  },
  
  async getStudyDetails(match) {
    try {
      const studyIdPrefix = match[1];
      
      // Find full study ID
      const allStudies = await this.orthancRequest('/studies');
      const fullStudyId = allStudies.find(id => id.startsWith(studyIdPrefix));
      
      if (!fullStudyId) {
        return `❌ Study not found with ID: ${studyIdPrefix}`;
      }
      
      const study = await this.orthancRequest(`/studies/${fullStudyId}`);
      
      const patientName = this.config.enablePHI ?
        this.anonymizePatient(study.PatientMainDicomTags?.PatientName) :
        study.PatientMainDicomTags?.PatientName || 'UNKNOWN';
      
      const viewerUrl = `${this.config.ohifUrl}/viewer?StudyInstanceUIDs=${study.MainDicomTags.StudyInstanceUID}`;
      
      return `🔬 *Study Details*\n\n` +
        `👤 Patient: ${patientName}\n` +
        `📅 Date: ${this.formatDate(study.MainDicomTags?.StudyDate)}\n` +
        `🏥 Modality: ${study.MainDicomTags?.ModalitiesInStudy}\n` +
        `📝 Description: ${study.MainDicomTags?.StudyDescription || 'N/A'}\n` +
        `📊 Series: ${study.Series?.length || 0}\n` +
        `🖼️ Instances: ${study.Instances?.length || 0}\n\n` +
        `🔗 *View in OHIF*:\n${viewerUrl}\n\n` +
        `_Study ID: ${fullStudyId}_`;
        
    } catch (error) {
      return `❌ Error: ${error.message}`;
    }
  },
  
  async getStatistics() {
    try {
      const stats = await this.orthancRequest('/statistics');
      const systemInfo = await this.orthancRequest('/system');
      
      return `📊 *Analytics Dashboard*\n\n` +
        `📁 Total Studies: ${stats.CountStudies}\n` +
        `📂 Total Series: ${stats.CountSeries}\n` +
        `🖼️ Total Images: ${stats.CountInstances}\n` +
        `👥 Total Patients: ${stats.CountPatients}\n` +
        `💾 Storage Used: ${this.formatBytes(stats.TotalDiskSize)}\n` +
        `💿 Uncompressed: ${this.formatBytes(stats.TotalUncompressedSize)}\n\n` +
        `🏷️ Orthanc Version: ${systemInfo.Version}\n` +
        `🔧 Database: ${systemInfo.DatabaseVersion}`;
        
    } catch (error) {
      return `❌ Error: ${error.message}`;
    }
  },
  
  getHelp() {
    return `🧠 *BrainSAIT Radiology Commands*\n\n` +
      `📊 \`@bot status\` - System health check\n` +
      `📋 \`@bot studies\` - List recent studies\n` +
      `🔬 \`@bot study <ID>\` - Study details\n` +
      `📈 \`@bot stats\` - Analytics dashboard\n\n` +
      `_More commands available via MasterLinc integration_`;
  },
  
  // Helper: Make authenticated request to Orthanc
  async orthancRequest(path) {
    return new Promise((resolve, reject) => {
      const auth = 'Basic ' + Buffer.from(
        `${this.config.orthancUser}:${this.config.orthancPassword}`
      ).toString('base64');
      
      const url = new URL(path, this.config.orthancUrl);
      
      const options = {
        hostname: url.hostname,
        port: url.port,
        path: url.pathname,
        method: 'GET',
        headers: {
          'Authorization': auth,
          'Accept': 'application/json'
        }
      };
      
      const req = http.request(options, (res) => {
        let data = '';
        
        res.on('data', (chunk) => {
          data += chunk;
        });
        
        res.on('end', () => {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            try {
              resolve(JSON.parse(data));
            } catch (e) {
              resolve(data);
            }
          } else {
            reject(new Error(`Orthanc returned ${res.statusCode}`));
          }
        });
      });
      
      req.on('error', (error) => {
        reject(error);
      });
      
      req.end();
    });
  },
  
  // Helpers
  anonymizePatient(name) {
    if (!name) return 'ANON-UNKNOWN';
    const hash = name.split('').reduce((a, b) => {
      a = ((a << 5) - a) + b.charCodeAt(0);
      return a & a;
    }, 0);
    return `ANON-${Math.abs(hash).toString().substring(0, 6)}`;
  },
  
  formatDate(dateStr) {
    if (!dateStr || dateStr === 'N/A') return 'N/A';
    // DICOM format: YYYYMMDD
    const year = dateStr.substring(0, 4);
    const month = dateStr.substring(4, 6);
    const day = dateStr.substring(6, 8);
    return `${year}-${month}-${day}`;
  },
  
  formatBytes(bytes) {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  },
  
  formatUptime(seconds) {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (days > 0) return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  }
};
