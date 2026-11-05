const fs=require('fs'),path=require('path'),crypto=require('crypto');
const {SITES,PAGES}=require('./render-content');
const ROOT=path.resolve(__dirname,'..');
function today(){const values=Object.fromEntries(new Intl.DateTimeFormat('en',{timeZone:'Europe/Moscow',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(new Date()).map(part=>[part.type,part.value]));return values.year+'-'+values.month+'-'+values.day;}
function update(){
 const file=path.join(ROOT,'config/content-dates.json');let records={};try{records=JSON.parse(fs.readFileSync(file,'utf8'));}catch(_){}
 for(const site of SITES){
  const urls=[];
  for(const name of PAGES){
   const relative=path.posix.join(site.directory,name);
   const hash=crypto.createHash('sha256').update(fs.readFileSync(path.join(ROOT,relative))).digest('hex');
   const previous=records[relative];records[relative]={hash,date:previous?.hash===hash?previous.date:today()};
   urls.push('  <url><loc>'+site.domain+(name==='index.html'?'/':'/'+name)+'</loc><lastmod>'+records[relative].date+'</lastmod></url>');
  }
  fs.writeFileSync(path.join(ROOT,site.directory,'sitemap.xml'),'<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'+urls.join('\n')+'\n</urlset>\n');
 }
 fs.writeFileSync(file,JSON.stringify(records,null,2)+'\n');console.log('Sitemap dates match changed page content; unchanged pages keep their dates.');
}
if(require.main===module)update();module.exports={update,today};
