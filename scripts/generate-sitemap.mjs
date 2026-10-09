import { existsSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const envFilePath = resolve('.env');
const fileSiteUrl = existsSync(envFilePath)
  ? readFileSync(envFilePath, 'utf8')
      .split(/\r?\n/)
      .find((line) => line.trim().startsWith('VITE_SITE_URL='))
      ?.split('=').slice(1).join('=').trim().replace(/^["']|["']$/g, '')
  : undefined;
const configuredSiteUrl = process.env.VITE_SITE_URL ?? fileSiteUrl;
if (!configuredSiteUrl) {
  const outputDirectory = resolve('dist');
  rmSync(resolve(outputDirectory, 'sitemap.xml'), { force: true });
  const robotsPath = resolve(outputDirectory, 'robots.txt');
  if (existsSync(robotsPath)) {
    const robots = readFileSync(robotsPath, 'utf8')
      .split(/\r?\n/)
      .filter((line) => !line.startsWith('Sitemap:'))
      .join('\n');
    writeFileSync(robotsPath, robots);
  }
  console.warn('Skipping sitemap generation: set VITE_SITE_URL to the production website origin.');
  process.exit(0);
}

let siteUrl;
try {
  const parsedUrl = new URL(configuredSiteUrl);
  if (!['http:', 'https:'].includes(parsedUrl.protocol) || parsedUrl.pathname !== '/' || parsedUrl.search || parsedUrl.hash) {
    throw new Error('VITE_SITE_URL must be a site origin without a path, query, or hash.');
  }
  siteUrl = parsedUrl.origin;
} catch (error) {
  throw new Error(`Invalid VITE_SITE_URL: ${error instanceof Error ? error.message : String(error)}`);
}

const routes = ['/', '/catalog', '/services', '/portfolio', '/about', '/contact', '/privacy', '/terms', '/refund'];
const entries = routes.map((route) => `  <url><loc>${siteUrl}${route}</loc></url>`).join('\n');
const sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${entries}\n</urlset>\n`;
const outputDirectory = resolve('dist');
writeFileSync(resolve(outputDirectory, 'sitemap.xml'), sitemap);

const robotsPath = resolve(outputDirectory, 'robots.txt');
const robots = readFileSync(robotsPath, 'utf8').trimEnd();
writeFileSync(robotsPath, `${robots}\nSitemap: ${siteUrl}/sitemap.xml\n`);
