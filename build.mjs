import fs from 'node:fs';
const raw=fs.readFileSync('reference/questions.md','utf8');
const traits=[...raw.matchAll(/^## \d+\. (.+)\r?\n([\s\S]*?)(?=^## |$(?![\s\S]))/gm)].map(m=>({name:m[1].trim(),questions:[...m[2].matchAll(/^(\d+)\. (.+)$/gm)].map((q,i)=>{if(+q[1]!==i+1)throw Error('numbering');return q[2].trim()})}));
if(traits.length!==30||traits.some(t=>t.questions.length!==30)||new Set(traits.flatMap(t=>t.questions)).size!==900)throw Error('Question data mismatch');
fs.writeFileSync('worker/data.js','export const TRAITS='+JSON.stringify(traits)+';\n');
let html=fs.readFileSync('worker/page.html','utf8').replace('/*DATA*/','const TRAITS='+JSON.stringify(traits)+';').replace('/*SHARED*/',fs.readFileSync('worker/shared.js','utf8').replace(/^import .*;\r?\n/gm,'').replaceAll('export ',''));
fs.mkdirSync('lib',{recursive:true});fs.writeFileSync('lib/page.js','export const PAGE='+JSON.stringify(html)+';\n');fs.mkdirSync('public',{recursive:true});fs.writeFileSync('public/robots.txt','User-agent: *\nDisallow: /admin\nDisallow: /api/\n');console.log('Build complete: 900 questions');
