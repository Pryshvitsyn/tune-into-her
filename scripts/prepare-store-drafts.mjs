import { Buffer } from 'node:buffer';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const readJSON = async file => JSON.parse(await readFile(file, 'utf8'));
export function storeDrafts(listings, config, brand, billing) {
  const result = { status: config.status, apple: {}, google: {}, excluded: [], issues: [] };
  const fits = (value, limit, field, bytes = false) => {
    const length = bytes ? Buffer.byteLength(value, 'utf8') : [...value].length;
    if (!value.trim() || length > limit) result.issues.push(`${field}: ${length}/${limit}${bytes ? ' bytes' : ' characters'}`);
  };
  for (const [language, listing] of Object.entries(listings)) {
    const mapping = config.locales[language];
    if (!mapping) { result.issues.push(`Missing storefront decision: ${language}`); continue; }
    if (!mapping.apple && !mapping.google) { result.excluded.push({ language, reason: mapping.reason }); continue; }
    if (!/review required/.test(listing.status)) result.issues.push(`Listing approval boundary missing: ${language}`);
    fits(listing.name, 30, `${language}.name`);
    fits(listing.description, 4000, `${language}.description`);
    const common = { name: listing.name, description: listing.description, approval: listing.status };
    const disclosure = source => {
      const strings = billing?.[language];
      if (!strings || ['trialPolicy', 'chargeNow', 'renewal'].some(key => !strings[key]?.trim())) {
        result.issues.push(`Missing existing billing disclosure: ${language}`); return '';
      }
      return [strings.trialPolicy, strings.chargeNow, strings.renewal.replaceAll('{{source}}', source)].join('\n\n');
    };
    if (mapping.apple) {
      const subtitle = mapping.appleSubtitle ?? listing.shortDescription;
      const subscriptionDisclosure = disclosure('App Store');
      const description = listing.description + '\n\n' + subscriptionDisclosure;
      fits(subtitle, 30, `${language}.apple.subtitle`);
      fits(mapping.keywords, 100, `${language}.apple.keywords`, true);
      fits(description, 4000, `${language}.apple.description`);
      result.apple[mapping.apple] = { ...common, description, subscriptionDisclosure, subtitle, keywords: mapping.keywords, privacyUrl: brand.privacyUrl || null, supportUrl: null, termsUrl: brand.termsUrl || null };
    }
    if (mapping.google) {
      const subscriptionDisclosure = disclosure('Google Play');
      const description = listing.description + '\n\n' + subscriptionDisclosure;
      fits(listing.shortDescription, 80, `${language}.google.shortDescription`);
      fits(description, 4000, `${language}.google.description`);
      result.google[mapping.google] = { ...common, description, subscriptionDisclosure, shortDescription: listing.shortDescription, privacyUrl: brand.privacyUrl || null, supportEmail: brand.supportEmail || null };
    }
  }
  return result;
}

async function main() {
  const [listings, config, brand, billing] = await Promise.all(['release/store-listings.json', 'release/store-config.json', 'src/config/brand.json', 'src/i18n/billing.json'].map(readJSON));
  const drafts = storeDrafts(listings, config, brand, billing);
  if (drafts.issues.length) throw new Error(drafts.issues.join('\n'));
  const out = path.resolve(process.argv[2] ?? 'build/store-drafts');
  await mkdir(out, { recursive: true });
  await writeFile(path.join(out, 'metadata.json'), JSON.stringify(drafts, null, 2) + '\n');
  for (const platform of ['apple', 'google']) {
    for (const [locale, fields] of Object.entries(drafts[platform])) {
      const dir = path.join(out, platform, locale); await mkdir(dir, { recursive: true });
      for (const [field, value] of Object.entries(fields)) if (typeof value === 'string') await writeFile(path.join(dir, field + '.txt'), value + '\n');
    }
  }
  console.log(`Draft only: ${Object.keys(drafts.apple).length} Apple / ${Object.keys(drafts.google).length} Play locales; ${drafts.excluded.length} unsupported mapping withheld. No upload or approval.`);
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main().catch(error => { console.error(error.message); process.exitCode = 1; });
