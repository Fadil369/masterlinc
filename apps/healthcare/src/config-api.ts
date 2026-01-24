export interface ApiConfig {
    orchestratorUrl: string;
    basmaUrl: string;
    healthcareUrl: string;
    oidUrl: string;
    sbsUrl: string;
}

export const API_CONFIG: ApiConfig = {
    // Dynamic services
    orchestratorUrl: import.meta.env.VITE_ORCHESTRATOR_URL || 'http://localhost:4000',
    sbsUrl: import.meta.env.VITE_SBS_URL || 'https://brainsait-sbs-dynamic.brainsait-fadil.workers.dev',
    // Static / Spark services
    basmaUrl: import.meta.env.VITE_BASMA_URL || 'https://basma-voice-chat-app--fadil369.github.app',
    healthcareUrl: import.meta.env.VITE_HEALTHCARE_URL || 'https://brainsait-healthcare--fadil369.github.app',
    oidUrl: import.meta.env.VITE_OID_URL || 'https://brainsait-oid-integr--fadil369.github.app',
};
