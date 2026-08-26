import assert from 'node:assert/strict';
import test from 'node:test';
import { createUrlContext } from '../scripts/lib/url.mjs';

test('URL context supports GitHub project pages', () => {
  const urls = createUrlContext({
    siteUrl: 'https://engineer.example',
    basePath: '/career-ledger/'
  });

  assert.equal(urls.basePath, '/career-ledger');
  assert.equal(urls.href(''), '/career-ledger/');
  assert.equal(urls.href('/timeline/'), '/career-ledger/timeline/');
  assert.equal(urls.absolute('entries/example/'), 'https://engineer.example/career-ledger/entries/example/');
});

test('URL context supports root Pages repositories', () => {
  const urls = createUrlContext({ siteUrl: 'https://engineer.example/', basePath: '/' });
  assert.equal(urls.href(''), '/');
  assert.equal(urls.href('assets/app.js'), '/assets/app.js');
  assert.equal(urls.absolute('about/'), 'https://engineer.example/about/');
});
