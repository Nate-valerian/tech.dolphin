const fs=require('fs'),path=require('path');
const {SITES,PAGES,dictionary}=require('./render-content');
const ROOT=path.resolve(__dirname,'..');
function check(){
 require('./check-translations').check();
 const problems=[];
 const must=(condition,message)=>{if(!condition)problems.push(message);};
 for(const site of SITES){
  const t=dictionary(site.directory),currency=site.currency==='USD'?'$':'₽';
  const contactUrls=new Set(site.contacts.map(contact=>contact.href));
  for(const lang of ['ru','en']){
   must(t[lang].privacy_p1.includes(site.operatorTokens[lang]),site.id+' '+lang+' operator mismatch');
   for(let n=1;n<=4;n++)must(t[lang]['chat_budget_'+n].includes(currency),site.id+' '+lang+' budget currency mismatch');
   for(const match of t[lang].privacy_p6.matchAll(/href="([^"]+)"/g))must(contactUrls.has(match[1]),site.id+' '+lang+' privacy contact mismatch: '+match[1]);
  }
  for(const name of PAGES){
   const relative=path.posix.join(site.directory,name),full=path.join(ROOT,relative),html=fs.readFileSync(full,'utf8');
   must((html.match(/<h1\b/g)||[]).length===1,relative+' must have one h1');
   must((html.match(/<main\b/g)||[]).length===1,relative+' must have one main');
   must(html.includes('class="skip-link"'),relative+' missing skip link');
   const ids=[...html.matchAll(/\bid="([^"]+)"/g)].map(match=>match[1]);must(ids.length===new Set(ids).size,relative+' duplicate IDs');
   must(html.includes('<html lang="'+site.language+'"'),relative+' wrong initial language');
   must(!html.includes('nate-web3.netlify.app'),relative+' obsolete domain');
   const url=site.domain+(name==='index.html'?'/':'/'+name);must(html.includes('rel="canonical" href="'+url+'"'),relative+' canonical mismatch');
   for(const match of html.matchAll(/(?:src|href|poster)="([^"]+)"/g)){
    const value=match[1];
    if(/^[a-z]+:|^\/\//i.test(value))continue;
    if(value.startsWith('#')){must(ids.includes(value.slice(1)),relative+' broken fragment '+value);continue;}
    const [file,fragment]=value.split('#'),target=path.resolve(path.dirname(full),file.split('?')[0]);
    must(fs.existsSync(target),relative+' missing local reference '+value);
    if(fragment&&fs.existsSync(target))must(fs.readFileSync(target,'utf8').includes('id="'+fragment+'"'),relative+' broken target fragment '+value);
   }
   for(const match of html.matchAll(/<(input|textarea)\b[^>]*>/g)){
    if(match[0].includes('hp-field'))continue;
    const id=match[0].match(/id="([^"]+)"/)?.[1];
    must(id&&html.includes('for="'+id+'"'),relative+' unlabelled field '+(id||match[0]));
   }
   for(const match of html.matchAll(/href="((?:tel:|sms:|mailto:|https:\/\/(?:wa\.me|max\.ru|t\.me)\/)[^"]+)"/g))must(contactUrls.has(match[1]),relative+' regional contact mismatch '+match[1]);
  }
 }
 for(const file of ['js/main.js','js/analytics.js','js/storage.js','css/style.css'])must(fs.readFileSync(path.join(ROOT,file)).equals(fs.readFileSync(path.join(ROOT,'netlify-abroad',file))),file+' shared outputs differ');
 if(problems.length)throw Error(problems.join('\n'));
 console.log('Both regions pass identity, currency, contact, asset, structure, and shared-source checks.');
}
if(require.main===module)check();module.exports={check};
