/**
 * Unit test stub (framework-agnostic).
 */
import { DefaultMessageRoutingService, InMemoryAgentRegistryService, RbacPolicyEnforcementService } from '@/lib/services'

export async function test_message_routing_stub() {
  const registry = new InMemoryAgentRegistryService([])
  const policy = new RbacPolicyEnforcementService()
  const svc = new DefaultMessageRoutingService(registry, policy)

  // TODO: add cases
  void svc
}
