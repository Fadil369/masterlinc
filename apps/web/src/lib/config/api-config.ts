/**
 * API Configuration
 * Centralized configuration for all API endpoints and services
 */

interface APIConfig {
  backend: {
    baseUrl: string;
    apiUrl: string;
  };
  sbs: {
    normalizer: string;
    signer: string;
    financialRules: string;
    nphiesBridge: string;
    n8n: string;
  };
  agents: {
    authlinc: string;
    claimlinc: string;
    doctorlinc: string;
    policylinc: string;
    masterlinc: string;
  };
  mcp: {
    enabled: boolean;
    gitkraken: boolean;
    docker: boolean;
    pylance: boolean;
  };
  features: {
    sbsIntegration: boolean;
    agentWorkflows: boolean;
    githubPages: boolean;
  };
}

/**
 * Get environment variable with fallback
 */
function env(key: string, fallback: string = ""): string {
  return import.meta.env[key] || fallback;
}

/**
 * Get boolean environment variable
 */
function envBool(key: string, fallback: boolean = false): boolean {
  const value = import.meta.env[key];
  if (value === undefined) return fallback;
  return value === "true" || value === "1";
}

/**
 * API Configuration based on environment
 */
export const apiConfig: APIConfig = {
  backend: {
    baseUrl: env("VITE_API_BASE_URL", "http://localhost:3000"),
    apiUrl: env("VITE_BACKEND_URL", "http://localhost:3000/api/v1"),
  },
  sbs: {
    normalizer: env("VITE_SBS_NORMALIZER_URL", "http://localhost:8000"),
    signer: env("VITE_SBS_SIGNER_URL", "http://localhost:8001"),
    financialRules: env(
      "VITE_SBS_FINANCIAL_RULES_URL",
      "http://localhost:8002",
    ),
    nphiesBridge: env("VITE_SBS_NPHIES_BRIDGE_URL", "http://localhost:8003"),
    n8n: env("VITE_SBS_N8N_URL", "http://localhost:5678"),
  },
  agents: {
    authlinc: env("VITE_AUTHLINC_URL", "http://localhost:8001"),
    claimlinc: env("VITE_CLAIMLINC_URL", "http://localhost:8002"),
    doctorlinc: env("VITE_DOCTORLINC_URL", "http://localhost:8010"),
    policylinc: env("VITE_POLICYLINC_URL", "http://localhost:8003"),
    masterlinc: env("VITE_MASTERLINC_URL", "http://localhost:8000"),
  },
  mcp: {
    enabled: envBool("VITE_MCP_ENABLED", true),
    gitkraken: envBool("VITE_MCP_GITKRAKEN_ENABLED", true),
    docker: envBool("VITE_MCP_DOCKER_ENABLED", true),
    pylance: envBool("VITE_MCP_PYLANCE_ENABLED", true),
  },
  features: {
    sbsIntegration: envBool("VITE_ENABLE_SBS_INTEGRATION", true),
    agentWorkflows: envBool("VITE_ENABLE_AGENT_WORKFLOWS", true),
    githubPages: envBool("VITE_ENABLE_GITHUB_PAGES", false),
  },
};

/**
 * Health check endpoints for all services
 */
export const healthEndpoints = {
  backend: `${apiConfig.backend.baseUrl}/health`,
  sbsNormalizer: `${apiConfig.sbs.normalizer}/health`,
  sbsSigner: `${apiConfig.sbs.signer}/health`,
  sbsFinancialRules: `${apiConfig.sbs.financialRules}/health`,
  sbsNphiesBridge: `${apiConfig.sbs.nphiesBridge}/health`,
};

/**
 * API endpoints for agents
 */
export const agentEndpoints = {
  // ClaimLinc Agent
  claimlinc: {
    submit: `${apiConfig.agents.claimlinc}/api/v1/claims/submit`,
    status: `${apiConfig.agents.claimlinc}/api/v1/claims/status`,
    list: `${apiConfig.agents.claimlinc}/api/v1/claims`,
  },
  // DoctorLinc Agent
  doctorlinc: {
    patients: `${apiConfig.agents.doctorlinc}/api/v1/patients`,
    appointments: `${apiConfig.agents.doctorlinc}/api/v1/appointments`,
    diagnoses: `${apiConfig.agents.doctorlinc}/api/v1/diagnoses`,
  },
  // PolicyLinc Agent
  policylinc: {
    policies: `${apiConfig.agents.policylinc}/api/v1/policies`,
    validate: `${apiConfig.agents.policylinc}/api/v1/policies/validate`,
    coverage: `${apiConfig.agents.policylinc}/api/v1/coverage`,
  },
  // AuthLinc Agent
  authlinc: {
    login: `${apiConfig.agents.authlinc}/api/v1/auth/login`,
    verify: `${apiConfig.agents.authlinc}/api/v1/auth/verify`,
    refresh: `${apiConfig.agents.authlinc}/api/v1/auth/refresh`,
  },
  // MasterLinc Orchestrator
  masterlinc: {
    agents: `${apiConfig.agents.masterlinc}/api/v1/agents`,
    workflows: `${apiConfig.agents.masterlinc}/api/v1/workflows`,
    messages: `${apiConfig.agents.masterlinc}/api/v1/messages`,
  },
};

/**
 * SBS Integration endpoints
 */
export const sbsEndpoints = {
  normalizer: {
    normalize: `${apiConfig.sbs.normalizer}/api/v1/claims/normalize`,
    codes: `${apiConfig.sbs.normalizer}/api/v1/codes/translate`,
  },
  signer: {
    sign: `${apiConfig.sbs.signer}/api/v1/documents/sign`,
    verify: `${apiConfig.sbs.signer}/api/v1/documents/verify`,
  },
  financialRules: {
    apply: `${apiConfig.sbs.financialRules}/api/v1/rules/apply`,
    validate: `${apiConfig.sbs.financialRules}/api/v1/rules/validate`,
  },
  nphiesBridge: {
    submit: `${apiConfig.sbs.nphiesBridge}/api/v1/claims/submit`,
    status: `${apiConfig.sbs.nphiesBridge}/api/v1/claims/status`,
  },
  n8n: {
    webhooks: `${apiConfig.sbs.n8n}/webhook`,
    workflows: `${apiConfig.sbs.n8n}/api/v1/workflows`,
  },
};

export default apiConfig;
