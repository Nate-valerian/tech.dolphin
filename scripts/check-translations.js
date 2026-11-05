const fs=require('fs');
const path=require('path');
const {dictionary,SITES,PAGES}=require('./render-content');
const ROOT=path.resolve(__dirname,'..');
function check(){
 const errors=[];
 for(const site of SITES){
  const t=dictionary(site.directory);
  const used=new Set(PAGES.flatMap(name=>[...fs.readFileSync(path.join(ROOT,site.directory,name),'utf8').matchAll(/data-i18n="([^"]+)"/g)].map(match=>match[1])));
  const all=new Set([...used,...Object.keys(t.ru),...Object.keys(t.en)]);
  for(const key of all)for(const language of ['ru','en']){
   if(t[language][key]===undefined||t[language][key]==='')errors.push(site.directory+': '+language+' missing '+key);
  }
 }
 if(errors.length)throw new Error(errors.join('\n'));
 console.log('All used translation keys and language dictionaries are complete.');
}
if(require.main===module)check();
module.exports={check};
