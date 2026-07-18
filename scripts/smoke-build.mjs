import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';

const distDirectory = path.resolve(process.cwd(), 'dist');
const outputName = 'drop-play.html';
const outputPath = path.join(distDirectory, outputName);
const entries = await fs.readdir(distDirectory, { withFileTypes: true });
const output = entries.find((entry) => entry.name === outputName);

assert(output?.isFile(), `Expected ${outputPath} to be a file`);
assert.deepEqual(
    entries.map((entry) => entry.name).sort(),
    [outputName],
    'The production bundle must contain only drop-play.html',
);

const html = await fs.readFile(outputPath, 'utf8');
const stats = await fs.stat(outputPath);

assert.match(html, /^<!doctype html>/i, 'The production artifact must be HTML');
assert.match(html, /<div id="app">/, 'The production artifact must contain the app mount point');
assert(stats.size > 1000, 'The production artifact is unexpectedly small');

const assetReferences = [...html.matchAll(/\b(?:href|src)=(?:"([^"]*)"|'([^']*)')/g)].map(
    (match) => match[1] ?? match[2] ?? '',
);
const externalAssets = assetReferences.filter(
    (reference) => reference !== '' && !reference.startsWith('data:') && !reference.startsWith('#'),
);

assert.deepEqual(externalAssets, [], `Found non-inlined assets: ${externalAssets.join(', ')}`);

console.log(`Verified ${outputName}: ${stats.size} bytes, all assets inlined.`);
