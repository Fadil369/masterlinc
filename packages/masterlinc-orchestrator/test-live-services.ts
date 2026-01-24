import { LiveServiceConnector } from './src/connectors/live-service-connector.js';

async function testServices() {
  console.log('🧪 Testing Live Service Connections\n');
  
  const results = await LiveServiceConnector.testAllServices();
  
  console.log('\n📊 Results:');
  console.log('═══════════════════════════════════════\n');
  
  results.forEach((result) => {
    const status = result.status === 'connected' ? '✅' : '❌';
    console.log(`${status} ${result.serviceId}`);
    console.log(`   URL: ${result.url}`);
    if (result.responseTime) {
      console.log(`   Response Time: ${result.responseTime}ms`);
    }
    if (result.version) {
      console.log(`   Version: ${result.version}`);
    }
    if (result.error) {
      console.log(`   Error: ${result.error}`);
    }
    console.log('');
  });
  
  const connected = results.filter(r => r.status === 'connected').length;
  console.log(`\n📈 Summary: ${connected}/${results.length} services connected`);
}

testServices().catch(console.error);
