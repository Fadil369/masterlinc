import type { AggregatedSnapshot, MetricsExporter } from './types'

/**
 * Simple exporter for development.
 */
export class ConsoleMetricsExporter implements MetricsExporter {
  export(snapshot: AggregatedSnapshot): void {
    // Intentionally concise
    // eslint-disable-next-line no-console
    console.log('[MASTERLINC metrics]', snapshot)
  }
}

/**
 * Prometheus text format exporter (returns a string).
 * Use with an HTTP endpoint or write to file in a backend.
 */
export class PrometheusTextFormatter {
  format(snapshot: AggregatedSnapshot): string {
    const lines: string[] = []

    lines.push(`# HELP masterlinc_active_workflows Number of active workflows`)
    lines.push(`# TYPE masterlinc_active_workflows gauge`)
    lines.push(`masterlinc_active_workflows ${snapshot.workflows.activeCount}`)

    lines.push(`# HELP masterlinc_agent_latency_ms Agent latency summary over window`)
    lines.push(`# TYPE masterlinc_agent_latency_ms gauge`)
    for (const a of snapshot.agents.latency) {
      const labels = `{agent_id="${escapeLabel(a.agent_id)}",window_ms="${a.window_ms}"}`
      lines.push(`masterlinc_agent_latency_ms_min${labels} ${a.min_ms}`)
      lines.push(`masterlinc_agent_latency_ms_max${labels} ${a.max_ms}`)
      lines.push(`masterlinc_agent_latency_ms_avg${labels} ${a.avg_ms}`)
      lines.push(`masterlinc_agent_latency_ms_samples${labels} ${a.samples}`)
    }

    lines.push(`# HELP masterlinc_system_status_samples Count of system status samples over window`)
    lines.push(`# TYPE masterlinc_system_status_samples gauge`)
    for (const [status, count] of Object.entries(snapshot.system.statusCounts)) {
      lines.push(`masterlinc_system_status_samples{status="${escapeLabel(status)}",window_ms="${snapshot.window_ms}"} ${count}`)
    }

    lines.push('')
    return lines.join('\n')
  }
}

function escapeLabel(s: string): string {
  return s.replace(/\\/g, '\\\\').replace(/\n/g, '\\n').replace(/"/g, '\\"')
}

/**
 * Browser-friendly exporter: POSTs Prometheus text to a remote collector.
 * (In production you'd likely do this server-side.)
 */
export class HttpTextPostExporter implements MetricsExporter {
  constructor(private readonly url: string, private readonly formatter = new PrometheusTextFormatter()) {}

  async export(snapshot: AggregatedSnapshot): Promise<void> {
    const body = this.formatter.format(snapshot)
    await fetch(this.url, {
      method: 'POST',
      headers: {
        'content-type': 'text/plain'
      },
      body
    })
  }
}
