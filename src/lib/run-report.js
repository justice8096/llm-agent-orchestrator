/**
 * run-report.js — Generate execution reports.
 *
 * Summarizes agent results, timing, success/failure, and validation warnings.
 */

/**
 * Create a run report from collected agent results.
 *
 * @param {object[]} results - Array of agent result objects
 * @param {number} startTime - Start timestamp (Date.now())
 * @returns {{ json: object, markdown: string }}
 */
export function createReport(results, startTime) {
  const endTime = Date.now();
  const totalDuration = ((endTime - startTime) / 1000).toFixed(1);
  const now = new Date();
  const timestamp = now.toISOString();

  const report = {
    timestamp,
    totalDurationSec: parseFloat(totalDuration),
    agentCount: results.length,
    summary: {
      succeeded: results.filter(r => r.status === 'success').length,
      failed: results.filter(r => r.status === 'error').length,
      skipped: results.filter(r => r.status === 'skipped').length
    },
    agents: results.map(r => ({
      agentId: r.agentId,
      status: r.status,
      durationSec: r.duration ? parseFloat((r.duration / 1000).toFixed(1)) : null,
      errors: r.errors || [],
      warnings: r.warnings || [],
      locationsUpdated: r.locationsUpdated || []
    }))
  };

  // Generate markdown
  const lines = [
    `# Run Report — ${timestamp}`,
    '',
    `**Total Duration:** ${totalDuration}s`,
    `**Agents:** ${results.length} (${report.summary.succeeded} succeeded, ${report.summary.failed} failed)`,
    ''
  ];

  for (const agent of report.agents) {
    const icon = agent.status === 'success' ? '✓' : agent.status === 'error' ? '✗' : '−';
    lines.push(`## ${icon} ${agent.agentId}`);
    lines.push(`Status: ${agent.status}`);
    if (agent.durationSec) lines.push(`Duration: ${agent.durationSec}s`);
    if (agent.locationsUpdated?.length) {
      lines.push(`Updated: ${agent.locationsUpdated.length} file(s)`);
    }
    if (agent.errors?.length) {
      lines.push('Errors:');
      agent.errors.forEach(e => lines.push(`  - ${e}`));
    }
    if (agent.warnings?.length) {
      lines.push('Warnings:');
      agent.warnings.forEach(w => lines.push(`  - ${w}`));
    }
    lines.push('');
  }

  const markdown = lines.join('\n');

  return { json: report, markdown };
}
