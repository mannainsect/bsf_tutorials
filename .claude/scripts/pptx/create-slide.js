#!/usr/bin/env node
/**
 * Creates a single PowerPoint slide from JSON specification
 *
 * Usage: node create-slide.js <spec-json-file> <output-path>
 *
 * Spec format:
 * {
 *   "slide_number": 1,
 *   "title": "Slide Title",
 *   "subtitle": "Optional subtitle",
 *   "content": {
 *     "type": "bullets|title_only|two_column",
 *     "items": [...] or { "left": {...}, "right": {...} }
 *   },
 *   "visual_specs": {
 *     "title_font_size": 32,
 *     "body_font_size": 18,
 *     "max_bullets": 6,
 *     "color_scheme": "professional_blue"
 *   }
 * }
 */

const pptxgen = require('pptxgenjs');
const html2pptx = require('./html2pptx.js');
const fs = require('fs');
const path = require('path');

const COLOR_SCHEMES = {
  professional_blue: { primary: '#1F3864', secondary: '#4472C4', text: '#333333' },
  corporate_gray: { primary: '#404040', secondary: '#808080', text: '#333333' },
  modern_teal: { primary: '#00796B', secondary: '#00BCD4', text: '#333333' }
};

function generateHTML(spec) {
  const colors = COLOR_SCHEMES[spec.visual_specs.color_scheme] ||
    COLOR_SCHEMES.professional_blue;
  const { title_font_size = 32, body_font_size = 18 } =
    spec.visual_specs;

  if (spec.content.type === 'title_only') {
    return `<!DOCTYPE html>
<html>
<head>
<style>
html { background: #ffffff; }
body {
  width: 720pt; height: 405pt; margin: 0; padding: 0;
  background: ${colors.primary}; font-family: Arial, sans-serif;
  display: flex; flex-direction: column;
  justify-content: center; align-items: center;
}
h1 { color: #ffffff; font-size: ${spec.visual_specs.title_font_size || 44}pt; margin: 0 40pt 20pt 40pt; text-align: center; }
h2 { color: #ffffff; font-size: ${spec.visual_specs.subtitle_font_size || 24}pt; margin: 0 40pt; text-align: center; font-weight: normal; }
</style>
</head>
<body>
  <h1>${spec.title}</h1>
  ${spec.subtitle ? `<h2>${spec.subtitle}</h2>` : ''}
</body>
</html>`;
  }

  if (spec.content.type === 'bullets') {
    const bullets = spec.content.items.map(item =>
      `    <li>${item}</li>`).join('\n');
    return `<!DOCTYPE html>
<html>
<head>
<style>
html { background: #ffffff; }
body {
  width: 720pt; height: 405pt; margin: 0; padding: 0;
  background: #ffffff; font-family: Arial, sans-serif;
  display: flex; flex-direction: column;
}
.header {
  background: ${colors.primary}; padding: 20pt 40pt; min-height: 60pt;
  display: flex; align-items: center;
}
.content { flex: 1; padding: 30pt 40pt; }
h1 { color: #ffffff; font-size: ${title_font_size}pt; margin: 0; }
ul { color: ${colors.text}; font-size: ${body_font_size}pt; line-height: 1.5; margin: 0; padding-left: 30pt; }
li { margin: 12pt 0; }
</style>
</head>
<body>
<div class="header">
  <h1>${spec.title}</h1>
</div>
<div class="content">
  <ul>
${bullets}
  </ul>
</div>
</body>
</html>`;
  }

  if (spec.content.type === 'two_column') {
    const leftBullets = spec.content.left.items.map(item =>
      `      <li>${item}</li>`).join('\n');
    const rightBullets = spec.content.right.items.map(item =>
      `      <li>${item}</li>`).join('\n');
    return `<!DOCTYPE html>
<html>
<head>
<style>
html { background: #ffffff; }
body {
  width: 720pt; height: 405pt; margin: 0; padding: 0;
  background: #ffffff; font-family: Arial, sans-serif;
  display: flex; flex-direction: column;
}
.header {
  background: ${colors.primary}; padding: 20pt 40pt; min-height: 60pt;
  display: flex; align-items: center;
}
.content { flex: 1; padding: 30pt 40pt; display: flex; gap: 30pt; }
.column { flex: 1; }
h1 { color: #ffffff; font-size: ${title_font_size}pt; margin: 0; }
h3 { color: ${colors.primary}; font-size: 20pt; margin: 0 0 15pt 0; }
ul { color: ${colors.text}; font-size: ${body_font_size}pt; line-height: 1.4; margin: 0; padding-left: 25pt; }
li { margin: 8pt 0; }
</style>
</head>
<body>
<div class="header">
  <h1>${spec.title}</h1>
</div>
<div class="content">
  <div class="column">
    <h3>${spec.content.left.header}</h3>
    <ul>
${leftBullets}
    </ul>
  </div>
  <div class="column">
    <h3>${spec.content.right.header}</h3>
    <ul>
${rightBullets}
    </ul>
  </div>
</div>
</body>
</html>`;
  }

  if (spec.content.type === 'emphasis') {
    const attribution = spec.content.attribution
      ? `<p class="attribution">${spec.content.attribution}</p>`
      : '';
    return `<!DOCTYPE html>
<html>
<head>
<style>
html { background: #ffffff; }
body {
  width: 720pt; height: 405pt; margin: 0; padding: 0;
  background: ${colors.primary}; font-family: Arial, sans-serif;
  display: flex; flex-direction: column;
  justify-content: center; align-items: center;
  padding: 60pt;
}
.quote-text {
  color: #ffffff; font-size: 36pt; font-weight: bold;
  line-height: 1.4; text-align: center; margin: 0 0 20pt 0;
}
.attribution {
  color: #ffffff; font-size: 20pt; font-style: italic;
  text-align: center; margin: 0;
}
</style>
</head>
<body>
  <p class="quote-text">${spec.content.text}</p>
  ${attribution}
</body>
</html>`;
  }

  if (spec.content.type === 'pie_chart') {
    return `<!DOCTYPE html>
<html>
<head>
<style>
html { background: #ffffff; }
body {
  width: 720pt; height: 405pt; margin: 0; padding: 0;
  background: #ffffff; font-family: Arial, sans-serif;
  display: flex; flex-direction: column;
}
.header {
  background: ${colors.primary}; padding: 15pt 40pt;
  display: flex; align-items: center;
}
.content {
  flex: 1; padding: 15pt 40pt 40pt 40pt; display: flex;
  justify-content: center; align-items: center;
}
h1 { color: #ffffff; font-size: ${title_font_size}pt; margin: 0; }
.placeholder { background: #e0e0e0; border-radius: 8pt; }
</style>
</head>
<body>
<div class="header">
  <h1>${spec.title}</h1>
</div>
<div class="content">
  <div id="chart" class="placeholder"
       style="width: 480pt; height: 250pt;"></div>
</div>
</body>
</html>`;
  }

  if (spec.content.type === 'bar_chart') {
    return `<!DOCTYPE html>
<html>
<head>
<style>
html { background: #ffffff; }
body {
  width: 720pt; height: 405pt; margin: 0; padding: 0;
  background: #ffffff; font-family: Arial, sans-serif;
  display: flex; flex-direction: column;
}
.header {
  background: ${colors.primary}; padding: 15pt 40pt;
  display: flex; align-items: center;
}
.content {
  flex: 1; padding: 15pt 40pt 40pt 40pt; display: flex;
  justify-content: center; align-items: center;
}
h1 { color: #ffffff; font-size: ${title_font_size}pt; margin: 0; }
.placeholder { background: #e0e0e0; border-radius: 8pt; }
</style>
</head>
<body>
<div class="header">
  <h1>${spec.title}</h1>
</div>
<div class="content">
  <div id="chart" class="placeholder"
       style="width: 580pt; height: 250pt;"></div>
</div>
</body>
</html>`;
  }

  if (spec.content.type === 'bullet_with_chart') {
    const bullets = spec.content.bullets.map(item =>
      `      <li>${item}</li>`).join('\n');
    return `<!DOCTYPE html>
<html>
<head>
<style>
html { background: #ffffff; }
body {
  width: 720pt; height: 405pt; margin: 0; padding: 0;
  background: #ffffff; font-family: Arial, sans-serif;
  display: flex; flex-direction: column;
}
.header {
  background: ${colors.primary}; padding: 15pt 40pt;
  display: flex; align-items: center;
}
.content { flex: 1; padding: 15pt 40pt 40pt 40pt;
  display: flex; gap: 30pt; }
.text-column { flex: 0 0 40%; }
.chart-column { flex: 1; display: flex; align-items: center; }
h1 { color: #ffffff; font-size: ${title_font_size}pt; margin: 0; }
ul { color: ${colors.text}; font-size: ${body_font_size}pt;
  line-height: 1.5; margin: 0; padding-left: 30pt; }
li { margin: 12pt 0; }
.placeholder { background: #e0e0e0; border-radius: 8pt; }
</style>
</head>
<body>
<div class="header">
  <h1>${spec.title}</h1>
</div>
<div class="content">
  <div class="text-column">
    <ul>
${bullets}
    </ul>
  </div>
  <div class="chart-column">
    <div id="chart" class="placeholder"
         style="width: 100%; height: 240pt;"></div>
  </div>
</div>
</body>
</html>`;
  }

  throw new Error(`Unsupported content type: ${spec.content.type}`);
}

async function createSlide(specFile, outputPath) {
  const spec = JSON.parse(fs.readFileSync(specFile, 'utf8'));
  const slideNum = String(spec.slide_number).padStart(3, '0');
  const htmlPath = path.join(
    path.dirname(outputPath),
    `slide_${slideNum}.html`
  );

  // Generate and save HTML (kept for assembly)
  const html = generateHTML(spec);
  fs.writeFileSync(htmlPath, html);

  // Create individual PPTX for verification
  const pptx = new pptxgen();
  pptx.layout = 'LAYOUT_16x9';

  // Convert HTML and get placeholders
  const { slide, placeholders } = await html2pptx(htmlPath, pptx);

  // Add charts if specified
  if (spec.content.chart_data && placeholders.length > 0) {
    const chartArea = placeholders[0];
    const chartData = spec.content.chart_data;
    const colors = chartData.colors || ["4472C4", "ED7D31", "A5A5A5",
      "FFC000", "5B9BD5"];

    if (spec.content.type === 'pie_chart') {
      slide.addChart(pptx.charts.PIE, [{
        name: chartData.name || "Data",
        labels: chartData.labels,
        values: chartData.values
      }], {
        ...chartArea,
        showPercent: true,
        showLegend: true,
        legendPos: 'r',
        chartColors: colors
      });
    }

    if (spec.content.type === 'bar_chart') {
      slide.addChart(pptx.charts.BAR, [{
        name: chartData.name || "Data",
        labels: chartData.labels,
        values: chartData.values
      }], {
        ...chartArea,
        barDir: 'col',
        showCatAxisTitle: chartData.x_label ? true : false,
        catAxisTitle: chartData.x_label || '',
        showValAxisTitle: chartData.y_label ? true : false,
        valAxisTitle: chartData.y_label || '',
        showLegend: false,
        chartColors: [colors[0]]
      });
    }

    if (spec.content.type === 'bullet_with_chart') {
      slide.addChart(pptx.charts.LINE, [{
        name: chartData.name || "Data",
        labels: chartData.labels,
        values: chartData.values
      }], {
        ...chartArea,
        lineSize: 4,
        lineSmooth: true,
        showCatAxisTitle: chartData.x_label ? true : false,
        catAxisTitle: chartData.x_label || '',
        showValAxisTitle: chartData.y_label ? true : false,
        valAxisTitle: chartData.y_label || '',
        showLegend: false,
        chartColors: [colors[0]]
      });
    }
  }

  await pptx.writeFile({ fileName: outputPath });

  console.log(`COMPLETE: ${path.basename(outputPath)}`);
  return outputPath;
}

// CLI usage
if (require.main === module) {
  const specFile = process.argv[2];
  const outputPath = process.argv[3];

  if (!specFile || !outputPath) {
    console.error('Usage: node create-slide.js <spec-json-file> <output-path>');
    process.exit(1);
  }

  createSlide(specFile, outputPath).catch(error => {
    console.error('ERROR:', error.message);
    process.exit(1);
  });
}

module.exports = { createSlide, generateHTML };
