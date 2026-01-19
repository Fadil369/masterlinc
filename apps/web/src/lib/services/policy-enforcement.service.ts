import type { PermissionAction, PermissionResource, User, Permission } from '@/lib/types'
import { ROLE_PERMISSIONS } from '@/lib/types'
import { ServiceError } from './errors'
import type { PolicyEnforcementService } from './contracts'

/**
 * PolicyEnforcementService (RBAC)
 *
 * Implements the 4-tier healthcare RBAC model using ROLE_PERMISSIONS.
 *
 * This is intentionally deterministic and side-effect free.
 * In production, replace/extend it with policy configs and audit logging.
 */
export class RbacPolicyEnforcementService implements PolicyEnforcementService {
  can(actor: User, resource: PermissionResource, action: PermissionAction, context?: Record<string, unknown>): boolean {
    if (!actor?.role) throw new ServiceError('Missing actor role', 'VALIDATION_ERROR')

    const perms = actor.permissions?.length ? actor.permissions : ROLE_PERMISSIONS[actor.role]
    return this.match(perms, resource, action, context)
  }

  require(actor: User, resource: PermissionResource, action: PermissionAction, context?: Record<string, unknown>): void {
    if (!this.can(actor, resource, action, context)) {
      throw new ServiceError('Forbidden', 'FORBIDDEN', { resource, action, role: actor.role })
    }
  }

  private match(perms: Permission[], resource: PermissionResource, action: PermissionAction, context?: Record<string, unknown>): boolean {
    for (const p of perms) {
      if (p.resource !== resource) continue
      if (p.action !== action) continue

      // scope enforcement hook: validate that context matches scope
      // NOTE: this is a placeholder; production logic should validate patient/team membership.
      if (!p.scope) return true

      if (p.scope === 'system') return true
      if (p.scope === 'self') {
        return context?.actor_user_id !== undefined ? context.actor_user_id === (context.target_user_id ?? context.actor_user_id) : true
      }

      // For 'patient'/'team', allow when context declares matching flag.
      if (p.scope === 'patient') return Boolean(context?.patient_allowed ?? true)
      if (p.scope === 'team') return Boolean(context?.team_allowed ?? true)
    }

    return false
  }
}
