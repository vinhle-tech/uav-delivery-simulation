// Stage 1 document / repository audit. Node.js >= 18. No external dependencies.
// Default: read only. Optional --write-report writes docs/07-testing/phase1-audit-report.md.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
  "..",
);
const checks = [
  ["SRS", "docs/01-requirements/SRS.md"],
  ["Business Rules", "docs/01-requirements/business-rules.md"],
  ["Use Cases", "docs/01-requirements/use-cases.md"],
  ["Architecture", "docs/02-architecture/architecture.md"],
  ["Simulation Spec", "docs/03-simulation/simulation-spec.md"],
  ["Simulation Parameters", "docs/03-simulation/simulation-parameters.md"],
  ["ERD/Database Design", "docs/04-database-api/database-design.md"],
  ["Database Schema SQL", "docs/04-database-api/schema.sql"],
  ["Seed SQL", "docs/04-database-api/seed.sql"],
  ["REST API Contract", "docs/04-database-api/api-contract.md"],
  ["Socket Events", "docs/04-database-api/socket-events.md"],
  ["Screen List", "docs/05-ui-ux/screens.md"],
  ["Test Plan", "docs/07-testing/test-plan.md"],
  ["Test Cases", "docs/07-testing/test-cases.md"],
  ["Test Results", "docs/07-testing/test-results.md"],
  ["Flight Controller Tests", "experiments/flight-controller/test.js"],
  ["Backend Server", "experiments/database-api/src/server.js"],
  ["Cesium JavaScript", "experiments/cesium-sandcastle/main.js"],
  ["Cesium HTML/CSS", "experiments/cesium-sandcastle/sandcastle.html"],
];
function exists(rel) {
  return fs.existsSync(path.join(root, rel));
}
const lines = [
  "# PHASE 1 — AUTOMATED FILE AUDIT",
  "",
  `Generated at: ${new Date().toISOString()}`,
  "",
  "> PRESENT = file exists only. This tool does NOT validate correctness or mark test cases PASS.",
  "",
  "| Item | Path | File status |",
  "|---|---|---|",
];
for (const [label, rel] of checks)
  lines.push(
    `| ${label} | \`${rel}\` | ${exists(rel) ? "PRESENT" : "MISSING / CHECK PATH"} |`,
  );
const diagramDir = path.join(root, "docs/06-diagrams");
const diagramFiles = fs.existsSync(diagramDir)
  ? fs.readdirSync(diagramDir).filter((n) => /^\d{2}-.+\.mmd$/i.test(n))
  : [];
const diagramIds = new Set(diagramFiles.map((n) => n.slice(0, 2)));
const expected = Array.from({ length: 10 }, (_, i) =>
  String(i + 1).padStart(2, "0"),
);
lines.push(
  "",
  "## 10 Editable Diagrams",
  `Found filenames: ${diagramFiles.length}; covered IDs: ${expected.filter((x) => diagramIds.has(x)).join(", ") || "(none)"}`,
);
for (const id of expected)
  if (!diagramIds.has(id)) lines.push(`- MISSING: ${id}-*.mmd`);
const casesFile = path.join(root, "docs/07-testing/test-cases.md");
let tcCount = 0;
if (fs.existsSync(casesFile)) {
  const content = fs.readFileSync(casesFile, "utf8");
  const m = content.match(/\bTC-(?:DB|API|RT|FC|3D|UI)-\d{2}\b/g) || [];
  tcCount = new Set(m).size;
}
lines.push(
  "",
  "## Test Cases",
  `Unique TC IDs in test-cases.md: **${tcCount}** (stage 1 minimum: 15).`,
);
const docsRoot = path.join(root, "docs");
const todoList = [];
function walk(dir) {
  if (!fs.existsSync(dir)) return;
  for (const f of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, f.name);
    if (f.isDirectory()) {
      if (!["node_modules", "evidence"].includes(f.name)) walk(full);
    } else if (/\.(md|mmd)$/i.test(f.name)) {
      const rel = path.relative(root, full).replace(/\\/g, "/");
      // Generated acceptance forms include [ĐIỀN] intentionally; search only [TODO].
      const text = fs.readFileSync(full, "utf8");
      if (text.includes("[TODO]")) todoList.push(rel);
    }
  }
}
walk(docsRoot);
lines.push(
  "",
  "## Outstanding [TODO] markers",
  ...(todoList.length
    ? todoList.map((p) => "- " + p)
    : ["None found. This does not establish document quality."]),
);
lines.push(
  "",
  "## Human review required",
  "- Verify SRS, Business Rules and State Machine content and numbering.",
  "- Open all Mermaid diagrams to validate their content, not just filenames.",
  "- Validate test execution in test-results.md and screenshots.",
  "- Check Figma Desktop/Mobile prototype and Cesium Sandcastle manually.",
  "- Cross-review and sign phase1-acceptance.md.",
);
const report = lines.join("\n") + "\n";
process.stdout.write(report);
if (process.argv.includes("--write-report")) {
  const output = path.join(root, "docs/07-testing/phase1-audit-report.md");
  fs.mkdirSync(path.dirname(output), { recursive: true });
  fs.writeFileSync(output, report, "utf8");
  console.log("\nSaved:", output);
}
