#!/usr/bin/env node
// Generates README.md from index.html so they never drift apart.
// Usage: node generate-readme.js

const fs = require("fs");
const html = fs.readFileSync("index.html", "utf8");

function extract(pattern, group = 1) {
  const m = html.match(pattern);
  return m ? m[group].trim() : "";
}

function extractAll(pattern) {
  const results = [];
  let m;
  const re = new RegExp(pattern, "gs");
  while ((m = re.exec(html))) results.push(m);
  return results;
}

function stripTags(s) {
  return s
    .replace(/<[^>]+>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .trim();
}

// ── Hero ──
const title = stripTags(extract(/<h1>([\s\S]*?)<\/h1>/));
const subtitle = stripTags(extract(/<p class="hero-sub">([\s\S]*?)<\/p>/));
const heroTag = stripTags(extract(/<div class="hero-tag">([\s\S]*?)<\/div>/));

// ── Stats ──
const stats = extractAll(
  /<div class="stat-val[^"]*">(.*?)<\/div>\s*<div class="stat-lbl">(.*?)<\/div>/
);

// ── Capacity ──
const capacityTitle = stripTags(
  extract(/<div class="capacity-title">([\s\S]*?)<\/div>/)
);
const capacityBody = stripTags(
  extract(/<p class="capacity-body">([\s\S]*?)<\/p>/)
);
const capacityBadge = stripTags(
  extract(/<span class="capacity-badge">([\s\S]*?)<\/span>/)
);

// ── Timeline ──
const tlItems = extractAll(
  /<span class="tl-tag[^"]*">(.*?)<\/span>\s*<h3>(.*?)<\/h3>\s*<p>([\s\S]*?)<\/p>/
);

// ── Hall of Infamy ──
const shameCards = extractAll(
  /<div class="shame-q">([\s\S]*?)<\/div>\s*<div class="shame-a">([\s\S]*?)<\/div>/
);

// ── Prompts ──
const promptsMatch = html.match(/const prompts = \[([\s\S]*?)\];/);
const prompts = promptsMatch
  ? promptsMatch[1].match(/"([^"]+)"/g).map((p) => p.replace(/"/g, ""))
  : [];

// ── Tree ──
const treeNodes = extractAll(
  /<div class="tree-n (anc|star|desc)">(.*?)<\/div>/
);

// ── Chat ──
const chatMatch = html.match(/const chatMsgs = \[([\s\S]*?)\];/);
const chatMsgs = [];
if (chatMatch) {
  const roleRe = /role:\s*"([ug])"/g;
  const textRe = /text:\s*"((?:[^"\\]|\\.)*)"/g;
  let r,
    t,
    roles = [],
    texts = [];
  while ((r = roleRe.exec(chatMatch[1]))) roles.push(r[1]);
  while ((t = textRe.exec(chatMatch[1])))
    texts.push(t[1].replace(/\\"/g, '"'));
  for (let i = 0; i < roles.length; i++)
    chatMsgs.push({ role: roles[i], text: texts[i] });
}

// ── GitHub info ──
const repo = extract(
  /const GITHUB_REPO = "([^"]+)"/
);
const issue = extract(
  /const ISSUE_NUMBER = (\d+)/
);

// ── Big quote ──
const bigQuote = stripTags(
  extract(/<div class="big-quote">([\s\S]*?)<span/)
);
const bigQuoteAttr = stripTags(
  extract(/<span class="attr">([\s\S]*?)<\/span>/)
);

// ── Footer ──
const footerLines = extractAll(/<footer>([\s\S]*?)<\/footer>/);
const footerPs = extractAll(/<p[^>]*>([\s\S]*?)<\/p>/gs)
  .map((m) => stripTags(m[1]))
  .filter(
    (t) =>
      t.includes("Solidarity Day") ||
      t.includes("ironically") ||
      t.includes("confidently")
  );

// ═══════════════ BUILD README ═══════════════

let md = "";

// Hero
md += `<div align="center">\n\n`;
md += `\`${heroTag}\`\n\n`;
md += `# Solidarity Day\n# *for ChatGPT 3.5*\n\n`;
md += `${subtitle}\n\n`;

// Live link
md += `<a href="https://${repo.split("/")[0].toLowerCase()}.github.io/${repo.split("/")[1]}/"><strong>Visit the Memorial</strong></a>\n`;
md += `&nbsp;&nbsp;·&nbsp;&nbsp;\n`;
md += `<a href="https://github.com/${repo}/issues/${issue}">Press F to Pay Respects</a>\n\n`;

md += `</div>\n\n`;

// Stats
md += `<div align="center">\n\n`;
md += `| `;
stats.forEach((s) => (md += `${s[1]} | `));
md += `\n| `;
stats.forEach(() => (md += `:---: | `));
md += `\n| `;
stats.forEach((s) => (md += `${s[2]} | `));
md += `\n\n</div>\n\n`;

// Divider
md += `---\n\n`;

// Capacity
md += `> **${capacityTitle}**\n>\n`;
md += `> ${capacityBody}\n>\n`;
md += `> *${capacityBadge}*\n\n`;

// Timeline
md += `## Moments We'll Never Forget\n\n`;
md += `*Every generation has its "where were you when" moment. Ours was "when did you first try ChatGPT?"*\n\n`;
tlItems.forEach((item) => {
  const tag = stripTags(item[1]);
  const heading = stripTags(item[2]);
  const body = stripTags(item[3]);
  md += `### \`${tag}\` ${heading}\n`;
  md += `${body}\n\n`;
});

// Hall of Infamy
md += `## Things GPT-3.5 Said With Its Whole Chest\n\n`;
md += `*Wrong? Absolutely. Confident? Devastatingly.*\n\n`;
shameCards.forEach((card) => {
  const q = stripTags(card[1]);
  const a = stripTags(card[2]);
  md += `> **${q}**\n>\n`;
  md += `> GPT-3.5 > ${a}\n\n`;
});

// Prompts
md += `## First Prompts We All Tried\n\n`;
md += `*Nobody coordinated. Yet the whole world typed the same things.*\n\n`;
const rows = [];
for (let i = 0; i < prompts.length; i += 4) {
  rows.push(prompts.slice(i, i + 4));
}
rows.forEach((row) => {
  md += row.map((p) => `\`"${p}"\``).join(" &nbsp; ") + "\n\n";
});

// Tree
md += `## What Grew From That Seed\n\n`;
md += `*It wasn't the smartest. It wasn't the most capable. But it was first through the door.*\n\n`;
md += `\`\`\`\n`;
treeNodes.forEach((n) => {
  const text = stripTags(n[2]);
  if (n[1] === "anc") md += `  ${text}\n      │\n`;
  else if (n[1] === "star") md += `  ★ ${text} ★\n      │\n`;
  else md += `  ${text}\n      │\n`;
});
md = md.replace(/\n      │\n$/, "\n");
md += `\`\`\`\n\n`;

// Chat
md += `## One Last Conversation\n\n`;
chatMsgs.forEach((msg) => {
  if (msg.text === "__dots__") {
    md += `> **GPT-3.5 >** *typing...*\n\n`;
  } else if (msg.role === "u") {
    md += `**You:** ${msg.text}\n\n`;
  } else {
    md += `> **GPT-3.5 >** ${msg.text}\n\n`;
  }
});

// Press F
md += `---\n\n`;
md += `<div align="center">\n\n`;
md += `## 🕯️\n\n`;
md += `**[Press F to Pay Respects](https://github.com/${repo}/issues/${issue})**\n\n`;
md += `*React with ❤️ on the issue to light a candle*\n\n`;
md += `> *${bigQuote}*\n>\n`;
md += `> ${bigQuoteAttr}\n\n`;
md += `</div>\n\n`;

// Footer
md += `---\n\n`;
md += `<div align="center">\n\n`;
footerPs.forEach((p) => (md += `*${p}*\n\n`));
md += `</div>\n`;

fs.writeFileSync("README.md", md);
console.log("README.md generated from index.html");
