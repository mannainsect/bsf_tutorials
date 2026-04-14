#!/usr/bin/env node
/**
 * Creates a master PowerPoint template with specified theme
 *
 * Usage: node create-template.js <output-path> [color-scheme]
 *
 * Color schemes: professional_blue (default), corporate_gray, modern_teal
 */

const pptxgen = require('pptxgenjs');
const html2pptx = require('/home/yka/.claude/plugins/marketplaces/anthropic-agent-skills/document-skills/pptx/scripts/html2pptx.js');
const fs = require('fs');
const path = require('path');

const COLOR_SCHEMES = {
  professional_blue: {
    primary: '#1F3864',
    secondary: '#4472C4',
    text: '#333333',
    background: '#ffffff'
  },
  corporate_gray: {
    primary: '#404040',
    secondary: '#808080',
    text: '#333333',
    background: '#ffffff'
  },
  modern_teal: {
    primary: '#00796B',
    secondary: '#00BCD4',
    text: '#333333',
    background: '#ffffff'
  }
};

async function createTemplate(outputPath, colorScheme = 'professional_blue') {
  const colors = COLOR_SCHEMES[colorScheme] || COLOR_SCHEMES.professional_blue;
  const tmpHtml = path.join(path.dirname(outputPath), '.template-tmp.html');

  // Create template HTML
  const html = `<!DOCTYPE html>
<html>
<head>
<style>
html { background: #ffffff; }
body {
  width: 720pt; height: 405pt; margin: 0; padding: 0;
  background: ${colors.background}; font-family: Arial, sans-serif;
  display: flex; flex-direction: column;
}
.header {
  background: ${colors.primary}; height: 60pt; padding: 20pt 40pt;
  display: flex; align-items: center;
}
.content {
  flex: 1; padding: 30pt 40pt; background: ${colors.background};
}
h1 { color: #ffffff; font-size: 32pt; margin: 0; }
h2 { color: ${colors.primary}; font-size: 28pt; margin: 0 0 20pt 0; }
p { color: ${colors.text}; font-size: 18pt; line-height: 1.4; margin: 10pt 0; }
</style>
</head>
<body>
<div class="header">
  <h1>Template Slide</h1>
</div>
<div class="content">
  <h2>Master Template</h2>
  <p>Professional ${colorScheme.replace(/_/g, ' ')} color scheme.</p>
</div>
</body>
</html>`;

  fs.writeFileSync(tmpHtml, html);

  const pptx = new pptxgen();
  pptx.layout = 'LAYOUT_16x9';
  pptx.author = 'Claude Code';

  await html2pptx(tmpHtml, pptx);
  await pptx.writeFile({ fileName: outputPath });

  // Cleanup
  fs.unlinkSync(tmpHtml);

  console.log(`Template created: ${outputPath}`);
  return outputPath;
}

// CLI usage
if (require.main === module) {
  const outputPath = process.argv[2];
  const colorScheme = process.argv[3] || 'professional_blue';

  if (!outputPath) {
    console.error('Usage: node create-template.js <output-path> [color-scheme]');
    process.exit(1);
  }

  createTemplate(outputPath, colorScheme).catch(error => {
    console.error('Error:', error.message);
    process.exit(1);
  });
}

module.exports = { createTemplate, COLOR_SCHEMES };
