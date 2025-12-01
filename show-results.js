#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Terminal-Bench 2.0 Leaderboard data (as of Dec 1, 2025)
const leaderboard = [
  { rank: 1, agent: "Codex CLI", model: "GPT-5.1-Codex-Max", org: "OpenAI", accuracy: 60.4, stderr: 2.7 },
  { rank: 2, agent: "Warp", model: "Multiple", org: "Warp", accuracy: 59.1, stderr: 2.8 },
  { rank: 3, agent: "II-Agent", model: "Gemini 3 Pro", org: "Intelligent Internet", accuracy: 58.9, stderr: 2.9 },
  { rank: 4, agent: "Codex CLI", model: "GPT-5.1-Codex", org: "OpenAI", accuracy: 57.8, stderr: 2.9 },
  { rank: 5, agent: "Terminus 2", model: "Gemini 3 Pro", org: "Stanford", accuracy: 54.2, stderr: 2.4 },
  { rank: 6, agent: "Warp", model: "Multiple", org: "Warp", accuracy: 50.1, stderr: 2.7 },
  { rank: 7, agent: "Codex CLI", model: "GPT-5", org: "OpenAI", accuracy: 49.6, stderr: 2.9 },
  { rank: 8, agent: "Terminus 2", model: "GPT-5.1", org: "Stanford", accuracy: 47.6, stderr: 2.8 },
  { rank: 9, agent: "Codex CLI", model: "GPT-5-Codex", org: "OpenAI", accuracy: 44.3, stderr: 2.7 },
  { rank: 10, agent: "OpenHands", model: "GPT-5", org: "OpenHands", accuracy: 43.8, stderr: 3.0 },
  { rank: 11, agent: "Terminus 2", model: "GPT-5-Codex", org: "Stanford", accuracy: 43.4, stderr: 2.9 },
  { rank: 12, agent: "Codex CLI", model: "GPT-5.1-Codex-Mini", org: "OpenAI", accuracy: 43.1, stderr: 3.0 },
  { rank: 13, agent: "Terminus 2", model: "Claude Sonnet 4.5", org: "Stanford", accuracy: 42.8, stderr: 2.8 },
  { rank: 14, agent: "OpenHands", model: "Claude Sonnet 4.5", org: "OpenHands", accuracy: 42.6, stderr: 2.8 },
  { rank: 15, agent: "Mini-SWE-Agent", model: "Claude Sonnet 4.5", org: "Princeton", accuracy: 42.5, stderr: 2.8 },
  { rank: 16, agent: "Mini-SWE-Agent", model: "GPT-5-Codex", org: "Princeton", accuracy: 41.3, stderr: 2.8 },
  { rank: 17, agent: "Claude Code", model: "Claude Sonnet 4.5", org: "Anthropic", accuracy: 40.1, stderr: 2.9 },
  { rank: 18, agent: "Terminus 2", model: "Claude Opus 4.1", org: "Stanford", accuracy: 38.0, stderr: 2.6 },
  { rank: 19, agent: "OpenHands", model: "Claude Opus 4.1", org: "OpenHands", accuracy: 36.9, stderr: 2.7 },
  { rank: 20, agent: "Terminus 2", model: "GPT-5.1-Codex", org: "Stanford", accuracy: 36.9, stderr: 3.2 },
  { rank: 21, agent: "Terminus 2", model: "Kimi K2 Thinking", org: "Stanford", accuracy: 35.7, stderr: 2.8 },
  { rank: 22, agent: "Terminus 2", model: "GPT-5", org: "Stanford", accuracy: 35.2, stderr: 3.1 },
  { rank: 23, agent: "Mini-SWE-Agent", model: "Claude Opus 4.1", org: "Princeton", accuracy: 35.1, stderr: 2.5 },
  { rank: 24, agent: "Claude Code", model: "Claude Opus 4.1", org: "Anthropic", accuracy: 34.8, stderr: 2.9 },
  { rank: 25, agent: "Mini-SWE-Agent", model: "GPT-5", org: "Princeton", accuracy: 33.9, stderr: 2.9 },
  { rank: 26, agent: "Terminus 2", model: "Gemini 2.5 Pro", org: "Stanford", accuracy: 32.6, stderr: 3.0 },
  { rank: 27, agent: "Codex CLI", model: "GPT-5-Mini", org: "OpenAI", accuracy: 31.9, stderr: 3.0 },
  { rank: 28, agent: "Terminus 2", model: "MiniMax M2", org: "Stanford", accuracy: 30.0, stderr: 2.7 },
  { rank: 29, agent: "Mini-SWE-Agent", model: "Claude Haiku 4.5", org: "Princeton", accuracy: 29.8, stderr: 2.5 },
  { rank: 30, agent: "OpenHands", model: "GPT-5-Mini", org: "OpenHands", accuracy: 29.2, stderr: 2.8 },
  { rank: 31, agent: "Terminus 2", model: "Claude Haiku 4.5", org: "Stanford", accuracy: 28.3, stderr: 2.9 },
  { rank: 32, agent: "Terminus 2", model: "Kimi K2 Instruct", org: "Stanford", accuracy: 27.8, stderr: 2.5 },
  { rank: 33, agent: "Claude Code", model: "Claude Haiku 4.5", org: "Anthropic", accuracy: 27.5, stderr: 2.8 },
  { rank: 34, agent: "OpenHands", model: "Grok 4", org: "OpenHands", accuracy: 27.2, stderr: 3.1 },
  { rank: 35, agent: "OpenHands", model: "Kimi K2 Instruct", org: "OpenHands", accuracy: 26.7, stderr: 2.7 },
  { rank: 36, agent: "Mini-SWE-Agent", model: "Gemini 2.5 Pro", org: "Princeton", accuracy: 26.1, stderr: 2.5 },
  { rank: 37, agent: "Mini-SWE-Agent", model: "Grok Code Fast 1", org: "Princeton", accuracy: 25.8, stderr: 2.6 },
  { rank: 38, agent: "OpenHands", model: "Qwen 3 Coder 480B", org: "OpenHands", accuracy: 25.4, stderr: 2.6 },
  { rank: 39, agent: "Mini-SWE-Agent", model: "Grok 4", org: "Princeton", accuracy: 25.4, stderr: 2.9 },
  { rank: 40, agent: "Terminus 2", model: "GLM 4.6", org: "Stanford", accuracy: 24.5, stderr: 2.4 },
  { rank: 41, agent: "Terminus 2", model: "GPT-5-Mini", org: "Stanford", accuracy: 24.0, stderr: 2.5 },
  { rank: 42, agent: "Terminus 2", model: "Qwen 3 Coder 480B", org: "Stanford", accuracy: 23.9, stderr: 2.8 },
  { rank: 43, agent: "Terminus 2", model: "Grok 4", org: "Stanford", accuracy: 23.1, stderr: 2.9 },
  { rank: 44, agent: "Mini-SWE-Agent", model: "GPT-5-Mini", org: "Princeton", accuracy: 22.2, stderr: 2.6 },
  { rank: 45, agent: "Gemini CLI", model: "Gemini 2.5 Pro", org: "Google", accuracy: 19.6, stderr: 2.9 },
  { rank: 46, agent: "Terminus 2", model: "GPT-OSS-120B", org: "Stanford", accuracy: 18.7, stderr: 2.7 },
  { rank: 47, agent: "Mini-SWE-Agent", model: "Gemini 2.5 Flash", org: "Princeton", accuracy: 17.1, stderr: 2.5 },
  { rank: 48, agent: "Terminus 2", model: "Gemini 2.5 Flash", org: "Stanford", accuracy: 16.9, stderr: 2.4 },
  { rank: 49, agent: "OpenHands", model: "Gemini 2.5 Flash", org: "OpenHands", accuracy: 16.4, stderr: 2.4 },
  { rank: 50, agent: "OpenHands", model: "Gemini 2.5 Pro", org: "OpenHands", accuracy: 16.4, stderr: 2.8 },
  { rank: 51, agent: "Gemini CLI", model: "Gemini 2.5 Flash", org: "Google", accuracy: 15.4, stderr: 2.3 },
  { rank: 52, agent: "Mini-SWE-Agent", model: "GPT-OSS-120B", org: "Princeton", accuracy: 14.2, stderr: 2.3 },
  { rank: 53, agent: "Terminus 2", model: "Grok Code Fast 1", org: "Stanford", accuracy: 14.2, stderr: 2.5 },
  { rank: 54, agent: "OpenHands", model: "Claude Haiku 4.5", org: "OpenHands", accuracy: 13.9, stderr: 2.7 },
  { rank: 55, agent: "Codex CLI", model: "GPT-5-Nano", org: "OpenAI", accuracy: 11.5, stderr: 2.3 },
  { rank: 56, agent: "OpenHands", model: "GPT-5-Nano", org: "OpenHands", accuracy: 9.9, stderr: 2.1 },
  { rank: 57, agent: "Terminus 2", model: "GPT-5-Nano", org: "Stanford", accuracy: 7.9, stderr: 1.9 },
  { rank: 58, agent: "Mini-SWE-Agent", model: "GPT-5-Nano", org: "Princeton", accuracy: 7.0, stderr: 1.9 },
  { rank: 59, agent: "Mini-SWE-Agent", model: "GPT-OSS-20B", org: "Princeton", accuracy: 3.4, stderr: 1.4 },
  { rank: 60, agent: "Terminus 2", model: "GPT-OSS-20B", org: "Stanford", accuracy: 3.1, stderr: 1.5 },
];

function parseResults(resultsPath) {
  const data = JSON.parse(fs.readFileSync(resultsPath, 'utf8'));
  const evalKey = Object.keys(data.stats.evals)[0];
  const stats = data.stats.evals[evalKey];
  const rewards = stats.reward_stats.reward;

  const passed = (rewards["1.0"] || []).length;
  const failed = (rewards["0.0"] || []).length;
  const total = passed + failed;
  const errors = stats.n_errors;

  const accuracy = (passed / total) * 100;
  const stderr = Math.sqrt((accuracy / 100) * (1 - accuracy / 100) / total) * 100;

  // Extract agent and model from eval key (e.g., "pi__claude-opus-4-5__terminal-bench")
  const parts = evalKey.split('__');
  const agent = parts[0];
  const model = parts[1].replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

  return { agent, model, accuracy, stderr, passed, failed, total, errors };
}

function findRank(accuracy, leaderboard) {
  for (let i = 0; i < leaderboard.length; i++) {
    if (accuracy > leaderboard[i].accuracy) {
      return i + 1;
    }
  }
  return leaderboard.length + 1;
}

function formatTable(piResult) {
  const piRank = findRank(piResult.accuracy, leaderboard);
  
  // ANSI colors
  const RESET = '\x1b[0m';
  const BOLD = '\x1b[1m';
  const GREEN = '\x1b[32m';
  const YELLOW = '\x1b[33m';
  const CYAN = '\x1b[36m';
  const DIM = '\x1b[2m';

  console.log();
  console.log(`${BOLD}Terminal-Bench 2.0 Leaderboard${RESET}`);
  console.log(`${'═'.repeat(75)}`);
  console.log();

  // Header
  console.log(`${BOLD}Rank  Agent               Model                    Accuracy${RESET}`);
  console.log(`${DIM}${'─'.repeat(75)}${RESET}`);

  // Show all entries with pi inserted at the right position
  let piInserted = false;
  
  for (let i = 0; i < leaderboard.length; i++) {
    const entry = leaderboard[i];
    
    // Insert pi before this entry if pi's accuracy is higher
    if (!piInserted && piResult.accuracy > entry.accuracy) {
      console.log(`${GREEN}${BOLD}${String(piRank).padStart(4)}  ${piResult.agent.padEnd(18)} ${piResult.model.padEnd(24)} ${piResult.accuracy.toFixed(1)}% ± ${piResult.stderr.toFixed(1)}  ★${RESET}`);
      piInserted = true;
    }
    
    // Adjust displayed rank for entries after pi
    const displayRank = piInserted ? entry.rank + 1 : entry.rank;
    const rankStr = String(displayRank).padStart(4);
    console.log(`${rankStr}  ${entry.agent.padEnd(18)} ${entry.model.padEnd(24)} ${entry.accuracy.toFixed(1)}% ± ${entry.stderr.toFixed(1)}`);
  }
  
  // If pi wasn't inserted (it's last), add it at the end
  if (!piInserted) {
    console.log(`${GREEN}${BOLD}${String(piRank).padStart(4)}  ${piResult.agent.padEnd(18)} ${piResult.model.padEnd(24)} ${piResult.accuracy.toFixed(1)}% ± ${piResult.stderr.toFixed(1)}  ★${RESET}`);
  }

  console.log();
  console.log(`${'═'.repeat(75)}`);
  console.log();
  console.log(`${BOLD}Results Summary:${RESET}`);
  console.log(`  Agent:    ${CYAN}${piResult.agent}${RESET}`);
  console.log(`  Model:    ${CYAN}${piResult.model}${RESET}`);
  console.log(`  Accuracy: ${GREEN}${piResult.accuracy.toFixed(1)}% ± ${piResult.stderr.toFixed(1)}%${RESET}`);
  console.log(`  Passed:   ${piResult.passed}/${piResult.total} tasks`);
  console.log(`  Errors:   ${piResult.errors}`);
  console.log(`  Rank:     ${YELLOW}#${piRank}${RESET} out of ${leaderboard.length + 1} entries`);
  console.log();
}

// Main
const resultsDir = path.join(__dirname, 'pi-tbench-results');

// Find the latest results directory
let latestDir = null;
if (fs.existsSync(resultsDir)) {
  const dirs = fs.readdirSync(resultsDir)
    .filter(d => fs.statSync(path.join(resultsDir, d)).isDirectory())
    .sort()
    .reverse();
  
  if (dirs.length > 0) {
    latestDir = path.join(resultsDir, dirs[0]);
  }
}

// Allow override via command line argument
const targetDir = process.argv[2] || latestDir;

if (!targetDir) {
  console.error('Usage: ./show-results.js [results-dir]');
  console.error('No results directory found in pi-tbench-results/');
  process.exit(1);
}

const resultsFile = path.join(targetDir, 'result.json');

if (!fs.existsSync(resultsFile)) {
  console.error(`Results file not found: ${resultsFile}`);
  process.exit(1);
}

const piResult = parseResults(resultsFile);
formatTable(piResult);
