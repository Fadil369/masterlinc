# Deprecation Notice

The file `apps/web/src/services/api.ts` has been deprecated and renamed to `api.deprecated.ts`.

## Replacement
Please use `apps/web/src/services/masterlinc-client.ts` for all API interactions.

### Why?
The new `MasterLincClient` provides:
1. **Dynamic Service Integration**: Connects to the live SBS Worker and Orchestrator.
2. **Centralized Config**: Uses `src/config/api-config.ts` for environment management.
3. **Type Safety**: Improved matching with backend DTOs.

### Migration Guide
Replace:
```typescript
import { api } from '../services/api';
await api.createAppointment(...)
```

With:
```typescript
import { MasterLincClient } from '../services/masterlinc-client';
await MasterLincClient.appointment.create(...)
```
