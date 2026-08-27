import assert from 'node:assert/strict';
import test from 'node:test';
import { createUrlContext } from '../scripts/lib/url.ts';

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

test('URL context keeps shared assets at the root and localizes content routes', () => {
  const urls = createUrlContext({
    siteUrl: 'https://engineer.example',
    basePath: '/career-ledger',
    locale: 'pt-BR'
  });

  assert.equal(urls.locale, 'pt-BR');
  assert.equal(urls.href(''), '/career-ledger/pt-br/');
  assert.equal(urls.href('projects/example/'), '/career-ledger/pt-br/projects/example/');
  assert.equal(urls.rootHref('assets/app.js'), '/career-ledger/assets/app.js');
  assert.equal(urls.alternateHref('en', 'projects/example/'), '/career-ledger/projects/example/');
  assert.equal(urls.alternateAbsolute('pt-BR', 'about/'), 'https://engineer.example/career-ledger/pt-br/about/');
});
