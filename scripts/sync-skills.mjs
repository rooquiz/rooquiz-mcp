#!/usr/bin/env node
/**
 * Regenerates bin/skills.json — the three RooQuiz preview skills the bridge serves as
 * working tools when it has no usable token. See the long comment in bin/rooquiz-mcp.mjs
 * for why that path exists.
 *
 * The skills themselves live in the rooquiz-skills repo, which is their only source of
 * truth; this script vendors them so the bridge stays a single COPY with no runtime
 * fetch. Re-run it whenever a SKILL.md changes:
 *
 *   node scripts/sync-skills.mjs
 *   ROOQUIZ_SKILLS_DIR=/path/to/rooquiz-skills node scripts/sync-skills.mjs
 *
 * Env:
 *   ROOQUIZ_SKILLS_DIR   checkout of rooquiz-skills (default: ../rooquiz-skills)
 */

import { execFileSync } from 'node:child_process'
import { readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const SKILLS_DIR = resolve(
  process.env.ROOQUIZ_SKILLS_DIR || fileURLToPath(new URL('../../rooquiz-skills/', import.meta.url))
)
const OUTPUT = new URL('../bin/skills.json', import.meta.url)
const SNAPSHOT = new URL('../bin/introspection.json', import.meta.url)

/**
 * The bridge needs a few things the SKILL.md frontmatter does not carry: the MCP tool name
 * and title, the `preview_guide` enum value, and the `scene` the skill is fixed to. They live
 * here rather than being scraped out of the prose, and `scene` is cross-checked against
 * the body below so a change upstream fails the sync instead of shipping silently.
 */
const SKILLS = [
  {
    name: 'preview-quiz',
    tool: 'preview_quiz',
    title: 'Create preview quiz',
    guideType: 'quiz',
    scene: 'knowledge_quiz',
  },
  {
    name: 'preview-scorecard',
    tool: 'preview_scorecard',
    title: 'Create preview scorecard',
    guideType: 'scorecard',
    scene: 'scored_quiz',
  },
  {
    name: 'preview-outcome',
    tool: 'preview_outcome',
    title: 'Create preview personality test',
    guideType: 'outcome',
    scene: 'outcome_quiz',
  },
]

// Kept in step with GUIDE_TOOL in bin/rooquiz-mcp.mjs; only used for the collision check.
const GUIDE_TOOL = 'preview_guide'

const FRONTMATTER = /^---\r?\n([\s\S]*?)\r?\n---\r?\n/

function fail(message) {
  console.error(message)
  process.exit(1)
}

/** Splits a SKILL.md into its frontmatter fields and the markdown body. */
function splitSkill(source, path) {
  const match = source.match(FRONTMATTER)
  if (!match) {
    fail(`${path}: no YAML frontmatter`)
  }
  const fields = {}
  for (const line of match[1].split(/\r?\n/)) {
    // The two fields we need are single-line scalars, so a real YAML parser (and the
    // dependency it would drag in) buys nothing here.
    const pair = line.match(/^([A-Za-z_][\w-]*):\s*(.*)$/)
    if (pair) {
      fields[pair[1]] = pair[2].trim().replace(/^(['"])([\s\S]*)\1$/, '$2')
    }
  }
  return { fields, body: source.slice(match[0].length).trim() }
}

/** Short revision of the skills checkout, so a stale bin/skills.json is traceable. */
function revision(dir) {
  try {
    const sha = execFileSync('git', ['-C', dir, 'rev-parse', '--short', 'HEAD'], {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim()
    const dirty = execFileSync('git', ['-C', dir, 'status', '--porcelain'], {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim()
    return dirty ? `${sha}-dirty` : sha
  } catch {
    return null
  }
}

const skills = SKILLS.map(meta => {
  // Both layouts in rooquiz-skills are byte-identical; the plain one is the generic copy.
  const path = resolve(SKILLS_DIR, 'skills', meta.name, 'SKILL.md')
  let source
  try {
    source = readFileSync(path, 'utf8')
  } catch (error) {
    fail(`Cannot read ${path}: ${error.message}\nSet ROOQUIZ_SKILLS_DIR to a rooquiz-skills checkout.`)
  }

  const { fields, body } = splitSkill(source, path)
  if (fields.name !== meta.name) {
    fail(`${path}: frontmatter name is ${JSON.stringify(fields.name)}, expected ${JSON.stringify(meta.name)}`)
  }
  if (!fields.description) {
    fail(`${path}: frontmatter has no description — it is what the MCP client shows for the tool`)
  }
  if (!body.includes(`"scene": "${meta.scene}"`)) {
    fail(`${path}: does not mention scene ${JSON.stringify(meta.scene)} — update SKILLS in this script`)
  }

  return { ...meta, description: fields.description, body }
})

// The preview tools are merged into the snapshot's tool list on the tokenless path, so a
// name shared with a hosted tool would leave the client with two entries under one name.
const hosted = new Set(JSON.parse(readFileSync(SNAPSHOT, 'utf8')).tools.map(tool => tool.name))
for (const name of [...skills.map(skill => skill.tool), GUIDE_TOOL]) {
  if (hosted.has(name)) {
    fail(`Tool name ${name} collides with a hosted tool in bin/introspection.json`)
  }
}

const output = {
  source: `rooquiz-skills@${revision(SKILLS_DIR) || 'unknown'}`,
  generatedAt: new Date().toISOString(),
  skills,
}

writeFileSync(OUTPUT, JSON.stringify(output, null, 2) + '\n')
const bytes = skills.reduce((total, skill) => total + skill.body.length, 0)
console.log(`Wrote ${skills.length} skills (${bytes} bytes of instructions) to bin/skills.json`)
console.log(`Source: ${output.source} at ${SKILLS_DIR}`)
