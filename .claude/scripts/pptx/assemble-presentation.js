#!/usr/bin/env node
/**
 * Assembles individual slide HTML files into final PowerPoint presentation
 *
 * Usage: node assemble-presentation.js <slides-dir> <output-path> <slide-count>
 *
 * Expects:
 * - slides-dir: Directory containing slide_001.html, slide_002.html, etc.
 * - output-path: Where to save final .pptx file
 * - slide-count: Number of slides to assemble
 */

const pptxgen = require('pptxgenjs');
const html2pptx = require('./html2pptx.js');
const fs = require('fs');
const path = require('path');

async function assemblePresentation(slidesDir, outputPath, slideCount) {
  console.log(`Assembling ${slideCount} slides from ${slidesDir}...`);

  const pptx = new pptxgen();
  pptx.layout = 'LAYOUT_16x9';
  pptx.author = 'Claude Code';
  pptx.title = path.basename(outputPath, '.pptx');

  let assembled = 0;

  // Process all slides in order
  for (let i = 1; i <= slideCount; i++) {
    const slideNum = String(i).padStart(3, '0');
    const htmlPath = path.join(slidesDir, `slide_${slideNum}.html`);
    const specPath = path.join(slidesDir, `spec_${slideNum}.json`);

    if (!fs.existsSync(htmlPath)) {
      console.error(`WARNING: Missing slide ${i} at ${htmlPath}`);
      continue;
    }

    // Convert HTML and get placeholders
    const { slide, placeholders } =
      await html2pptx(htmlPath, pptx);

    // Add charts if spec exists and has chart data
    if (fs.existsSync(specPath)) {
      const spec = JSON.parse(fs.readFileSync(specPath, 'utf8'));

      if (spec.content.chart_data && placeholders.length > 0) {
        const chartArea = placeholders[0];
        const chartData = spec.content.chart_data;
        const colors = chartData.colors ||
          ["4472C4", "ED7D31", "A5A5A5", "FFC000", "5B9BD5"];

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
    }

    assembled++;

    if (assembled % 5 === 0) {
      console.log(`  Assembled ${assembled}/${slideCount} slides...`);
    }
  }

  await pptx.writeFile({ fileName: outputPath });

  console.log(`\nFinal presentation assembled successfully!`);
  console.log(`  Slides: ${assembled}/${slideCount}`);
  console.log(`  Output: ${outputPath}`);

  return { assembled, total: slideCount, outputPath };
}

// CLI usage
if (require.main === module) {
  const slidesDir = process.argv[2];
  const outputPath = process.argv[3];
  const slideCount = parseInt(process.argv[4], 10);

  if (!slidesDir || !outputPath || !slideCount) {
    console.error('Usage: node assemble-presentation.js <slides-dir> <output-path> <slide-count>');
    process.exit(1);
  }

  assemblePresentation(slidesDir, outputPath, slideCount).catch(error => {
    console.error('Error:', error.message);
    process.exit(1);
  });
}

module.exports = { assemblePresentation };
