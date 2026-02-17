#!/usr/bin/env node
/**
 * Health Check System for BrainSAIT MasterLinc
 * Comprehensive health monitoring for all Phase 1 services
 */

import axios from 'axios';

interface ServiceEndpoint {
  name: string;
  url: string;
  type: 'core' | 'registry' | 'app' | 'external';
  critical: boolean;
}

interface HealthCheckResult {
  name: string;
  status: 'healthy' | 'unhealthy' | 'unknown';
  responseTime?: number;
  details?: any;
  error?: string;
}

const SERVICES: ServiceEndpoint[] = [
  // Core Infrastructure
  {
    name: 'MasterLinc Orchestrator',
    url: 'http://localhost:4000/health',
    type: 'core',
    critical: true,
  },
  {
    name: 'MasterLinc Orchestrator (alt)',
    url: 'http://localhost:3001/health',
    type: 'core',
    critical: false,
  },
  
  // Registry Services
  {
    name: 'OID Registry',
    url: 'http://localhost:3001/health',
    type: 'registry',
    critical: true,
  },
  {
    name: 'DID Registry',
    url: 'http://localhost:3002/health',
    type: 'registry',
    critical: true,
  },
  
  // Database
  {
    name: 'PostgreSQL Health',
    url: 'http://localhost:5432',
    type: 'core',
    critical: true,
  },
  
  // External Services
  {
    name: 'Basma Voice',
    url: 'https://basma-voice-chat-app--fadil369.github.app/health',
    type: 'external',
    critical: false,
  },
  {
    name: 'Healthcare Platform',
    url: 'https://brainsait-healthcare--fadil369.github.app/health',
    type: 'external',
    critical: false,
  },
  {
    name: 'OID Service (Cloud)',
    url: 'https://brainsait-oid-integr--fadil369.github.app/health',
    type: 'external',
    critical: false,
  },
];

async function checkHealth(service: ServiceEndpoint): Promise<HealthCheckResult> {
  const startTime = Date.now();
  
  try {
    const response = await axios.get(service.url, {
      timeout: 5000,
      validateStatus: () => true, // Accept any status code
    });
    
    const responseTime = Date.now() - startTime;
    
    if (response.status >= 200 && response.status < 300) {
      return {
        name: service.name,
        status: 'healthy',
        responseTime,
        details: response.data,
      };
    } else {
      return {
        name: service.name,
        status: 'unhealthy',
        responseTime,
        error: `HTTP ${response.status}`,
      };
    }
  } catch (error: any) {
    const responseTime = Date.now() - startTime;
    
    // For local services that may not be running, this is expected
    if (error.code === 'ECONNREFUSED' && !service.critical) {
      return {
        name: service.name,
        status: 'unknown',
        error: 'Service not running (expected if not started)',
        responseTime,
      };
    }
    
    return {
      name: service.name,
      status: 'unhealthy',
      error: error.message,
      responseTime,
    };
  }
}

async function runHealthChecks(): Promise<void> {
  console.log('🏥 BrainSAIT MasterLinc - Health Check System');
  console.log('='.repeat(60));
  console.log('');
  
  const results: HealthCheckResult[] = [];
  
  // Run all checks in parallel
  const checks = SERVICES.map(service => checkHealth(service));
  const allResults = await Promise.all(checks);
  results.push(...allResults);
  
  // Group by type
  const groupedResults = results.reduce((acc, result) => {
    const service = SERVICES.find(s => s.name === result.name);
    const type = service?.type || 'unknown';
    if (!acc[type]) acc[type] = [];
    acc[type].push(result);
    return acc;
  }, {} as Record<string, HealthCheckResult[]>);
  
  // Display results by type
  const typeLabels = {
    core: '🔧 Core Infrastructure',
    registry: '📋 Registry Services',
    app: '💻 Applications',
    external: '🌐 External Services',
  };
  
  for (const [type, label] of Object.entries(typeLabels)) {
    const typeResults = groupedResults[type] || [];
    if (typeResults.length === 0) continue;
    
    console.log(`\n${label}`);
    console.log('-'.repeat(60));
    
    for (const result of typeResults) {
      const statusIcon = result.status === 'healthy' ? '✅' : 
                        result.status === 'unhealthy' ? '❌' : '⚠️';
      const responseTime = result.responseTime ? ` (${result.responseTime}ms)` : '';
      
      console.log(`${statusIcon} ${result.name}${responseTime}`);
      
      if (result.details) {
        console.log(`   ${JSON.stringify(result.details)}`);
      }
      
      if (result.error) {
        console.log(`   Error: ${result.error}`);
      }
    }
  }
  
  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 Summary');
  console.log('='.repeat(60));
  
  const healthy = results.filter(r => r.status === 'healthy').length;
  const unhealthy = results.filter(r => r.status === 'unhealthy').length;
  const unknown = results.filter(r => r.status === 'unknown').length;
  const critical = results.filter(r => {
    const service = SERVICES.find(s => s.name === r.name);
    return service?.critical && r.status === 'unhealthy';
  }).length;
  
  console.log(`Total Services: ${results.length}`);
  console.log(`✅ Healthy: ${healthy}`);
  console.log(`❌ Unhealthy: ${unhealthy}`);
  console.log(`⚠️  Unknown: ${unknown}`);
  console.log(`🚨 Critical Issues: ${critical}`);
  
  if (critical > 0) {
    console.log('\n⚠️  WARNING: Critical services are not healthy!');
    console.log('Please check the failed services above and ensure they are running.');
    process.exit(1);
  } else if (unhealthy > 0) {
    console.log('\n⚠️  Some services are not healthy, but no critical services are affected.');
    process.exit(0);
  } else {
    console.log('\n✅ All critical services are healthy!');
    process.exit(0);
  }
}

// Run if called directly
if (require.main === module) {
  runHealthChecks().catch(error => {
    console.error('Error running health checks:', error);
    process.exit(1);
  });
}

export { runHealthChecks, checkHealth };
