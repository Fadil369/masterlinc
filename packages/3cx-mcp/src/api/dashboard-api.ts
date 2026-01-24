/**
 * Dashboard API for Web Interface
 * Provides REST endpoints for the web dashboard
 */

import type { CallControlClient } from '../clients/call-control.js';
import type { XApiClient } from '../clients/xapi.js';
import type { MasterLincCoordinator } from '../orchestration/masterlinc-coordinator.js';

export class DashboardAPI {
  constructor(
    private callControl: CallControlClient,
    private xapi: XApiClient,
    private coordinator: MasterLincCoordinator,
  ) {}

  /**
   * Get dashboard data
   */
  async getDashboardData(): Promise<any> {
    const [activeCalls, agents, analytics] = await Promise.all([
      this.getActiveCalls(),
      this.getAgents(),
      this.coordinator.getAnalytics(),
    ]);

    return {
      stats: {
        activeCalls: activeCalls.length,
        availableAgents: agents.filter((a) => a.status === 'idle').length,
        totalCalls: analytics.totalCalls,
        avgDuration: analytics.avgDuration,
      },
      activeCalls: activeCalls.map((call) => ({
        id: call.Id,
        caller: call.Caller,
        callee: call.Callee,
        duration: call.Duration,
        status: call.Status,
      })),
      recentActivity: await this.getRecentActivity(),
    };
  }

  /**
   * Get active calls
   */
  private async getActiveCalls(): Promise<any[]> {
    try {
      return await this.callControl.getActiveCalls('12310');
    } catch (error) {
      console.error('Failed to get active calls:', error);
      return [];
    }
  }

  /**
   * Get agents status
   */
  private getAgents(): any[] {
    return this.coordinator.getAllAgents();
  }

  /**
   * Get recent activity
   */
  private async getRecentActivity(): Promise<any[]> {
    try {
      const logs = await this.xapi.getCallLogs({ limit: 10 });
      return logs.map((log) => ({
        id: log.Id,
        type: 'call',
        message: `Call from ${log.Caller} to ${log.Callee}`,
        time: new Date(log.StartTime).toLocaleTimeString(),
      }));
    } catch (error) {
      console.error('Failed to get recent activity:', error);
      return [];
    }
  }
}
