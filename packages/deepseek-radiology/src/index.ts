import axios from 'axios';

interface DicomMetadata {
  StudyInstanceUID: string;
  Modality: string;
  BodyPartExamined?: string;
  SeriesDescription?: string;
  StudyDescription?: string;
  NumberOfFrames?: number;
  StudyDate?: string;
  PatientAge?: string;
  PatientSex?: string;
  [key: string]: any;
}

interface AnalysisResult {
  classification: 'routine' | 'urgent' | 'emergent';
  priority: number; // 1-10
  findings: string[];
  reportTemplate: string;
  qualityChecks: string[];
  recommendations: string[];
  reasoning: string;
}

export class DeepSeekRadiologyAnalyzer {
  private orthancUrl: string;
  private orthancAuth: string;

  constructor() {

    this.orthancUrl = process.env.ORTHANC_URL || 'http://localhost:8042';
    const user = process.env.ORTHANC_USER || 'orthanc';
    const pass = process.env.ORTHANC_PASSWORD || 'orthanc';
    this.orthancAuth = 'Basic ' + Buffer.from(`${user}:${pass}`).toString('base64');
  }

  /**
   * Analyze a DICOM study using DeepSeek AI
   */
  async analyzeStudy(studyId: string): Promise<AnalysisResult> {
    try {
      // Fetch study metadata from Orthanc
      const metadata = await this.fetchStudyMetadata(studyId);

      // Build AI prompt
      const prompt = this.buildAnalysisPrompt(metadata);

      // Call DeepSeek via Synthetic API - using simple axios call
      const response = await axios.post(
        'https://api.synthetic.new/anthropic/v1/messages',
        {
          model: 'hf:deepseek-ai/DeepSeek-V3.2',
          max_tokens: 3000,
          temperature: 0.7,
          messages: [
            {
              role: 'user',
              content: prompt
            }
          ]
        },
        {
          headers: {
            'Authorization': `Bearer ${process.env.SYNTHETIC_API_KEY || process.env.DEEPSEEK_API_KEY}`,
            'Content-Type': 'application/json',
            'anthropic-version': '2023-06-01'
          }
        }
      );

      // Parse AI response
      const aiResponse = response.data.content[0].text;
      return this.parseAnalysisResponse(aiResponse, metadata);

    } catch (error: any) {
      console.error('[DeepSeek Analyzer] Error:', error);
      throw new Error(`Analysis failed: ${error?.message || error}`);
    }
  }

  /**
   * Generate a radiology report template
   */
  async generateReport(studyId: string, findings?: string): Promise<string> {
    const metadata = await this.fetchStudyMetadata(studyId);

    const prompt = `You are a radiology report assistant. Generate a professional radiology report template.

STUDY INFORMATION:
- Modality: ${metadata.Modality}
- Body Part: ${metadata.BodyPartExamined || 'Not specified'}
- Study Description: ${metadata.StudyDescription || 'Not specified'}
- Study Date: ${metadata.StudyDate || 'Not specified'}
- Number of Series: ${metadata.Series?.length || 0}

${findings ? `PRELIMINARY FINDINGS:\n${findings}\n` : ''}

Generate a complete radiology report with the following sections:
1. CLINICAL HISTORY: [Template]
2. TECHNIQUE: ${metadata.Modality} examination of ${metadata.BodyPartExamined || 'the specified region'}
3. FINDINGS: [Detailed template with anatomical structures to evaluate]
4. IMPRESSION: [Template for summary and recommendations]

Format the report professionally and include placeholders for radiologist input.`;

    const response = await axios.post(
      'https://api.synthetic.new/anthropic/v1/messages',
      {
        model: 'hf:deepseek-ai/DeepSeek-V3.2',
        max_tokens: 2000,
        temperature: 0.8,
        messages: [{ role: 'user', content: prompt }]
      },
      {
        headers: {
          'Authorization': `Bearer ${process.env.SYNTHETIC_API_KEY || process.env.DEEPSEEK_API_KEY}`,
          'Content-Type': 'application/json',
          'anthropic-version': '2023-06-01'
        }
      }
    );

    return response.data.content[0].text;
  }

  /**
   * Natural language query to Orthanc
   */
  async naturalLanguageQuery(query: string): Promise<string> {
    const prompt = `You are a DICOM/Orthanc API expert. Convert this natural language query into actionable information:

QUERY: "${query}"

Available Orthanc API endpoints:
- /studies - List all studies
- /patients - List all patients
- /statistics - Get statistics
- /modalities - List modalities

Provide:
1. What the user is asking for
2. Which Orthanc API endpoint(s) to call
3. Any filters or parameters needed
4. How to format the response

Respond in JSON format.`;

    const response = await axios.post(
      'https://api.synthetic.new/anthropic/v1/messages',
      {
        model: 'hf:deepseek-ai/DeepSeek-V3.2',
        max_tokens: 1000,
        temperature: 0.5,
        messages: [{ role: 'user', content: prompt }]
      },
      {
        headers: {
          'Authorization': `Bearer ${process.env.SYNTHETIC_API_KEY || process.env.DEEPSEEK_API_KEY}`,
          'Content-Type': 'application/json',
          'anthropic-version': '2023-06-01'
        }
      }
    );

    return response.data.content[0].text;
  }

  /**
   * Build analysis prompt for DeepSeek
   */
  private buildAnalysisPrompt(metadata: DicomMetadata): string {
    return `You are an expert radiology AI assistant analyzing DICOM study metadata. Provide a comprehensive analysis.

STUDY METADATA:
- Study ID: ${metadata.StudyInstanceUID}
- Modality: ${metadata.Modality}
- Body Part: ${metadata.BodyPartExamined || 'Not specified'}
- Series Description: ${metadata.SeriesDescription || 'Not specified'}
- Study Description: ${metadata.StudyDescription || 'Not specified'}
- Study Date: ${metadata.StudyDate || 'Not specified'}
- Patient Age: ${metadata.PatientAge || 'Not specified'}
- Patient Sex: ${metadata.PatientSex || 'Not specified'}
- Number of Series: ${metadata.Series?.length || 0}

ANALYSIS REQUIRED:
1. **Classification**: Determine urgency level (routine/urgent/emergent)
   - Consider modality, body part, time of acquisition
   - Brain/chest/trauma studies may be higher priority
   - After-hours studies often more urgent

2. **Priority Score**: Rate 1-10 (10 = most urgent)

3. **Key Findings to Look For**: List anatomical structures and pathologies the radiologist should evaluate

4. **Quality Checks**: 
   - Is this a complete study?
   - Adequate number of series?
   - Common imaging artifacts to watch for?

5. **Report Template Suggestions**: What sections should the report include?

6. **Recommendations**: Any follow-up imaging or clinical correlation needed?

7. **Reasoning**: Explain your classification and priority score

Respond in JSON format:
{
  "classification": "routine|urgent|emergent",
  "priority": 1-10,
  "findings": ["finding1", "finding2"],
  "reportTemplate": "template text",
  "qualityChecks": ["check1", "check2"],
  "recommendations": ["rec1", "rec2"],
  "reasoning": "explanation"
}`;
  }

  /**
   * Parse AI response into structured result
   */
  private parseAnalysisResponse(aiResponse: string, metadata: DicomMetadata): AnalysisResult {
    try {
      // Try to extract JSON from response
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          classification: parsed.classification || 'routine',
          priority: parsed.priority || 5,
          findings: parsed.findings || [],
          reportTemplate: parsed.reportTemplate || '',
          qualityChecks: parsed.qualityChecks || [],
          recommendations: parsed.recommendations || [],
          reasoning: parsed.reasoning || aiResponse
        };
      }
    } catch (e) {
      console.warn('[DeepSeek] Failed to parse JSON, using text response');
    }

    // Fallback: return text response
    return {
      classification: 'routine',
      priority: 5,
      findings: [],
      reportTemplate: '',
      qualityChecks: [],
      recommendations: [],
      reasoning: aiResponse
    };
  }

  /**
   * Fetch study metadata from Orthanc
   */
  private async fetchStudyMetadata(studyId: string): Promise<DicomMetadata> {
    try {
      const response = await axios.get(
        `${this.orthancUrl}/studies/${studyId}`,
        {
          headers: {
            'Authorization': this.orthancAuth,
            'Accept': 'application/json'
          }
        }
      );

      return response.data;
    } catch (error: any) {
      throw new Error(`Failed to fetch study ${studyId} from Orthanc: ${error?.message || error}`);
    }
  }
}

// Export singleton instance
export const radiologyAnalyzer = new DeepSeekRadiologyAnalyzer();
