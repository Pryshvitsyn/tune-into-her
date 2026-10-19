import { readFile, writeFile, mkdir } from 'node:fs/promises';

const keys=JSON.parse(await readFile('localization/ui-keys.json','utf8'));
await mkdir('src/i18n/locales',{recursive:true});
for(const code of ['fr','de','hi','zh-Hans','ms','mbf']){
 const lines=(await readFile(`localization/${code}.txt`,'utf8')).trim().split('\n');
 if(lines.length!==keys.length)throw Error(`${code}: ${lines.length} != ${keys.length}`);
 const out={};keys.forEach((key,i)=>{const parts=key.split('.');let at=out;for(const p of parts.slice(0,-1))at=at[p]??={};at[parts.at(-1)]=lines[i];});
 await writeFile(`src/i18n/locales/${code}.json`,JSON.stringify(out,null,2)+'\n');
}
console.log(`Built six UI locales, ${keys.length} keys each. Baba Malay is an unreviewed editorial draft.`);
