import { radiologyAnalyzer } from '@masterlinc/deepseek-radiology';
import axios from 'axios';

export class RadioLincAgent {
  private orthancUrl: string;
  private orthancAuth: string;

  constructor() {
    this.orthancUrl = process.env.ORTHANC_URL || 'http://localhost:8042';
    const user = process.env.ORTHANC_USER || 'orthanc';
    const pass = process.env.ORTHANC_PASSWORD || 'orthanc';
    this.orthancAuth = 'Basic ' + Buffer.from(`${user}:${pass}`).toString('base64');
  }

  async triageNewStudy(studyId: string): Promise<any> {
    console.log('[RadioLinc] Triaging study:', studyId);
    const analysis = await radiologyAnalyzer.analyzeStudy(studyId);
    
    if (analysis.classification === 'emergent') {
      console.log('[RadioLinc] EMERGENT study - alerting on-call doctor');
    }
    
    return analysis;
  }
}

export const radioLincAgent = new RadioLincAgent();
