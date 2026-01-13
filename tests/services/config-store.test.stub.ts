/**
 * Unit test stub (framework-agnostic).
 */
import { InMemoryConfigStore } from '@/lib/config'
import { devConfig } from '@/lib/config'

export function test_config_store_stub() {
  const store = new InMemoryConfigStore(devConfig)

  // TODO: commit new versions, rollback, assert audit trail ordering
  void store
}
