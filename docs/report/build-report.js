// Builds report.pdf from report.html: inlines the stage diagrams and run outputs, then prints with Chrome/Edge.
// Usage (from the repository root): node docs/report/build-report.js
'use strict';
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const root = path.resolve(__dirname, '..', '..');
const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
let html = fs.readFileSync(path.join(__dirname, 'report.html'), 'utf8');
html = html.replace(/<!--SVG:(stage\d)-->/g, (m, s) =>
  fs.readFileSync(path.join(root, 'docs', 'uml', s + '-class-diagram.svg'), 'utf8')
    .replace(/<svg ([^>]*?)width="\d+" height="\d+"/, '<svg $1'));
html = html.replace(/<!--FILE:([^>]+)-->/g, (m, f) => esc(fs.readFileSync(path.join(root, f), 'utf8').trim()));
const built = path.join(__dirname, 'report.built.html');
fs.writeFileSync(built, html);

const browsers = ['C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', '/usr/bin/google-chrome', '/usr/bin/chromium'];
const browser = browsers.find((b) => fs.existsSync(b));
const out = path.join(__dirname, 'RestaurantRush_Report.pdf');
execFileSync(browser, ['--headless=new', '--disable-gpu', '--no-pdf-header-footer',
  '--print-to-pdf=' + out, 'file:///' + built.split(path.sep).join('/')], { stdio: 'ignore' });
fs.unlinkSync(built);
console.log('Wrote ' + out);
