export interface ApiConfig {
    orchestratorUrl: string;
    basmaUrl: string;
    healthcareUrl: string;
    oidUrl: string;
    sbsUrl: string;
}

export const API_CONFIG: ApiConfig = {
    // Dynamic services
    orchestratorUrl: process.env.NEXT_PUBLIC_ORCHESTRATOR_URL || 'http://localhost:4000',
    sbsUrl: process.env.NEXT_PUBLIC_SBS_URL || 'https://brainsait-sbs-dynamic.brainsait-fadil.workers.dev',
    // Static / Spark services
    basmaUrl: process.env.NEXT_PUBLIC_BASMA_URL || 'https://basma-voice-chat-app--fadil369.github.app',
    healthcareUrl: process.env.NEXT_PUBLIC_HEALTHCARE_URL || 'https://brainsait-healthcare--fadil369.github.app',
    oidUrl: process.env.NEXT_PUBLIC_OID_URL || 'https://brainsait-oid-integr--fadil369.github.app',
};
