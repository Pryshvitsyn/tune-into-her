import { readFile } from 'node:fs/promises';

import { billingConfigIssues, nativeRedemptionIssues } from './billing-config.mjs';
const json=async p=>JSON.parse(await readFile(p,'utf8'));
const brand=await json('src/config/brand.json');
const readiness=await json('release/readiness.json');
const issues=[];
if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(brand.supportEmail))issues.push('Set a monitored supportEmail in src/config/brand.json.');
for(const key of ['privacyUrl','termsUrl'])if(!/^https:\/\//.test(brand[key]))issues.push(`Set a live HTTPS ${key} in src/config/brand.json.`);
if(!brand.publisherName?.trim())issues.push('Set the actual publisherName.');
for(const [k,v] of Object.entries(readiness))if(v!==true)issues.push(`Evidence required: ${k}.`);
issues.push(...billingConfigIssues(process.env, { production: true, platform: process.env.EAS_BUILD_PLATFORM }));
issues.push(...await nativeRedemptionIssues(process.env, { platform: process.env.EAS_BUILD_PLATFORM }));
if(issues.length){console.error('NOT READY FOR STORE SUBMISSION\n'+issues.map(x=>'• '+x).join('\n'));process.exitCode=1;}else console.log('Release checklist passed. Verify live URLs and store settings before submission.');
