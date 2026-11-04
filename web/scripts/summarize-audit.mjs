import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const root = path.resolve(import.meta.dirname, '..');
const summarize = (phase) => {
  const folder = path.join(root, '.test-artifacts', phase);
  const scans = fs.readdirSync(folder).filter((name) => /-\d+\.json$/.test(name)).map((name) => JSON.parse(fs.readFileSync(path.join(folder, name), 'utf8')));
  if (scans.length !== 32) throw new Error(`Expected 32 ${phase} scans, got ${scans.length}`);
  return {
    scans: scans.length,
    ruleViewportViolations: scans.reduce((n, s) => n + s.violations.length, 0),
    affectedElementViewportInstances: scans.reduce((n, s) => n + s.violations.reduce((m, v) => m + v.nodes.length, 0), 0),
    incompleteRuleViewportInstances: scans.reduce((n, s) => n + s.incomplete.length, 0),
    pagesWithOverflow: scans.filter((s) => s.overflow.content > s.overflow.viewport + 1).map((s) => ({ route: s.route, width: s.width })),
    browser: scans[0].browser,
    checks: scans.map((s) => ({ route: s.route, width: s.width, testedAt: s.testedAt, overflow: s.overflow,
      violations: s.violations.map((v) => ({ rule: v.id, impact: v.impact, targets: v.nodes.map((n) => n.target) })),
      manualReview: s.incomplete.map((v) => ({ rule: v.id, targets: v.nodes.map((n) => n.target) })),
    })).sort((a, b) => a.route.localeCompare(b.route) || a.width - b.width),
    longContent: JSON.parse(fs.readFileSync(path.join(folder, 'long-content.json'), 'utf8')).map(({ viewport, content }) => ({ viewport, content })),
  };
};
const result = JSON.parse(fs.readFileSync(path.join(root, '.test-artifacts/results.json'), 'utf8'));
if (result.stats.unexpected || result.stats.skipped || result.stats.expected !== 38) throw new Error('Expected 38 passing tests with no skips.');
const lock = JSON.parse(fs.readFileSync(path.join(root, 'package-lock.json'), 'utf8'));
const report = {
  generatedAt: new Date().toISOString(),
  baselineCommit: execFileSync('git', ['rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8' }).trim(),
  implementationWasUncommittedDuringRun: true,
  platform: process.platform,
  versions: Object.fromEntries(['next', '@playwright/test', '@axe-core/playwright', 'axe-core'].map((n) => [n, lock.packages[`node_modules/${n}`]?.version])),
  wcagTags: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'],
  before: summarize('before'), after: summarize('after'), tests: result.stats,
  limits: 'Chromium on Windows; local Go API and SQLite. Repeated viewport instances are not unique defects. Incomplete axe rules need manual review. No real participant study, screen-reader test, native mobile-device test, or complete WCAG conformance is claimed.',
};
fs.writeFileSync(path.join(root, '../docs/ui-quality-results.json'), JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify({ before: report.before.ruleViewportViolations, after: report.after.ruleViewportViolations, tests: report.tests.expected }));
