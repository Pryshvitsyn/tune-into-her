

import { describe, it, expect } from 'vitest';

import { SUPPORTED_LANGUAGES } from '../src/config/constants';
import { resources } from '../src/i18n/resources';

const flat = (o: object, prefix=''): Record<string,string> => Object.fromEntries(Object.entries(o).flatMap(([k,v]) => typeof v === 'object' && v !== null ? Object.entries(flat(v,`${prefix}${k}.`)) : [[`${prefix}${k}`,String(v)]]));
const placeholders = (s: string) => [...s.matchAll(/{{(\w+)}}/g)].map(m=>m[1]).sort();
describe('release localization integrity',()=>{
 it('has eleven distinct locales including Malay and Baba Malay',()=>{
  expect(SUPPORTED_LANGUAGES).toHaveLength(11);
  expect(SUPPORTED_LANGUAGES).toContain('ms');expect(SUPPORTED_LANGUAGES).toContain('mbf');
  expect(resources.ms.translation.onboarding.welcomeTitle).not.toBe(resources.mbf.translation.onboarding.welcomeTitle);
 });
 it('preserves every interpolation variable in all UI translations',()=>{
  const english=flat(resources.en.translation);
  for(const code of SUPPORTED_LANGUAGES){const translated=flat(resources[code].translation);for(const [k,v] of Object.entries(english)){expect(translated[k],`${code}:${k}`).toBeTruthy();expect(placeholders(translated[k]!),`${code}:${k}`).toEqual(placeholders(v));}}
 });
});
