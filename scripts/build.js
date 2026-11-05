const fs=require('fs');
const path=require('path');
const crypto=require('crypto');
const {SITES,PAGES,translateMarkup}=require('./render-content');
const ROOT=path.resolve(__dirname,'..');
const read=file=>fs.readFileSync(path.join(ROOT,file),'utf8').replace(/\r\n/g,'\n');
const hash=bytes=>crypto.createHash('sha256').update(bytes).digest('hex');
const escape=value=>String(value).replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;');
const icons=JSON.parse(read('src/content/icons.json'));
const labels={phone:'☎',sms:'✉',email:'@',max:'MAX'};
function icon(contact){return icons[contact.kind]||'<span class="nav-contact-symbol" aria-hidden="true">'+labels[contact.kind]+'</span>';}
function contactLink(contact,kind,language='en'){
 const key='contact_'+contact.id;
 const external=contact.href.startsWith('https:')?' target="_blank" rel="noopener noreferrer"':'';
 if(kind==='header')return '<a class="nav-contact-link" data-contact-key="'+key+'" aria-label="'+escape(contact.label[language])+'" href="'+escape(contact.href)+'"'+external+'>'+icon(contact)+'</a>';
 return '<a class="'+(kind==='contact'?'contact-link':'')+'" href="'+escape(contact.href)+'"'+external+'>'+(contact.kind==='max'?'':icon(contact))+' <span data-i18n="'+key+'">'+escape(contact.label[language])+'</span></a>';
}
function dictionaryFor(site){
 const common=JSON.parse(read('src/i18n/common.json'));
 for(const lang of ['ru','en']){
  Object.assign(common[lang],site.localized[lang]);
  for(const contact of site.contacts)common[lang]['contact_'+contact.id]=contact.label[lang];
 }
 return common;
}
function expand(template,values){
 let value=template;
 for(let i=0;i<8 && /\{\{[A-Z_]+\}\}/.test(value);i++)value=value.replace(/\{\{([A-Z_]+)\}\}/g,(_,key)=>{if(values[key]===undefined)throw Error('Unknown template slot '+key);return values[key];});
 return value;
}
function date(){const parts=Object.fromEntries(new Intl.DateTimeFormat('en',{timeZone:'Europe/Moscow',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(new Date()).map(p=>[p.type,p.value]));return parts.year+'-'+parts.month+'-'+parts.day;}
function createOutputs(){
 const outputs=new Map();
 const put=(file,bytes)=>outputs.set(file,Buffer.isBuffer(bytes)?bytes:Buffer.from(bytes));
 const component=name=>read('src/templates/components/'+name+'.html');
 const layout=read('src/templates/layout.html');
 let dates={};try{dates=JSON.parse(read('config/content-dates.json'));}catch(_){}
 for(const site of SITES){
  const directory=site.directory==='.'?'':site.directory+'/';
  const t=dictionaryFor(site);
  const runtime={id:site.id,domain:site.domain,language:site.language,geoLanguage:site.geoLanguage,currency:site.currency,locale:site.locale,prices:site.prices,leadRecipients:site.leadRecipients};
  put(directory+'js/region.js','/* Generated from config/regions.json. */\nwindow.TechDolphinRegion = Object.freeze('+JSON.stringify(runtime,null,2)+');\nwindow.TechDolphinAnalyticsConfig = { yandexMetricaId: '+site.analyticsId+' };\n');
  put(directory+'js/i18n.js','/* Generated from src/i18n/common.json and regional settings. */\nconst T = '+JSON.stringify(t,null,2)+';\n');
  for(const name of ['main.js','analytics.js','storage.js'])put(directory+'js/'+name,read('src/js/'+name));
  put(directory+'css/style.css',read('src/styles/site.css'));
  put(directory+'site.webmanifest',read('src/static/site.webmanifest'));
  if(site.id==='ru')put('yandex_3d97a29ea20ba61d.html',read('src/static/yandex_3d97a29ea20ba61d.html'));
  if(directory)for(const name of fs.readdirSync(path.join(ROOT,'assets')))put(directory+'assets/'+name,fs.readFileSync(path.join(ROOT,'assets',name)));
  const defaultT={...t[site.language]};defaultT.footer_copy=defaultT.footer_copy.replace('{year}',date().slice(0,4));
  const menu=[['index.html','lnav_home'],['projects.html','nav_projects_page'],['pricing.html','lnav_calc'],['faq.html','nav_faq'],['contact.html','nav_contact']];
  const menus=(active)=>menu.map(([href,key])=>'<a href="'+href+'" data-i18n="'+key+'"'+(href===active?' class="active-page" aria-current="page"':'')+'>'+escape(defaultT[key])+'</a>').join('\n');
  const primary=site.contacts.find(contact=>contact.primary),email=site.contacts.find(contact=>contact.kind==='email');
  const vars={LANGUAGE:site.language,LANGUAGE_SHORT:site.language==='ru'?'EN':'RU',LANGUAGE_LONG:site.language==='ru'?'English':'Русский',MENU_CLOSE:defaultT.menu_close,MENU_LABEL:defaultT.menu_label,QUICK_CONTACTS:defaultT.quick_contacts,LEFT_NAV:'',COOKIES:component('cookies'),NAVIGATION:component('navigation'),FOOTER:component('footer'),BRIEF:component('brief'),FOOTER_LINKS:menus(null),MENU_CONTACTS:site.contacts.map(contact=>contactLink(contact,'menu',site.language)).join('\n'),HEADER_CONTACTS:site.contacts.filter(contact=>contact.header).map(contact=>contactLink(contact,'header',site.language)).join('\n'),CONTACT_LINKS:site.contacts.map(contact=>contactLink(contact,'contact',site.language)).join('\n'),FOOTER_PHONE:contactLink(primary,'contact',site.language),HOME_PROJECTS:read('src/content/home-projects-'+site.id+'.html')};
  const version=file=>hash(outputs.get(directory+file)).slice(0,12);
  for(const name of PAGES){
   const page=name==='index.html'?'home':name.slice(0,-5);
   const title=defaultT['meta_'+page+'_title'],description=defaultT['meta_'+page+'_desc'];
   const suffix=name==='index.html'?'/':'/'+name;
   const url=site.domain+suffix;
   let head='<meta charset="UTF-8">\n<meta name="viewport" content="width=device-width, initial-scale=1">\n<title>'+escape(title)+'</title>\n<meta name="description" content="'+escape(description)+'">\n<meta name="robots" content="index, follow">\n';
   for(const [key,value] of Object.entries({'og:title':title,'og:description':description,'og:type':'website','og:url':url,'og:image':site.domain+'/assets/logo.png','og:locale':site.language==='ru'?'ru_RU':'en_US'}))head+='<meta property="'+key+'" content="'+escape(value)+'">\n';
   for(const [key,value] of Object.entries({'twitter:card':'summary_large_image','twitter:title':title,'twitter:description':description,'twitter:image':site.domain+'/assets/logo.png','theme-color':'#F6F5F1'}))head+='<meta name="'+key+'" content="'+escape(value)+'">\n';
   head+='<link rel="canonical" href="'+url+'">\n';
   for(const alternative of SITES)head+='<link rel="alternate" hreflang="'+alternative.language+'" href="'+alternative.domain+suffix+'">\n';
   head+='<link rel="alternate" hreflang="x-default" href="'+SITES[0].domain+suffix+'">\n<link rel="icon" href="assets/logo.png">\n<link rel="apple-touch-icon" href="assets/logo.png">\n<link rel="manifest" href="site.webmanifest">\n<link rel="preconnect" href="https://fonts.googleapis.com">\n<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>\n<link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">\n<link rel="stylesheet" href="css/style.css?v='+version('css/style.css')+'">';
   if(page==='home'){
    const schema={'@context':'https://schema.org','@type':'ProfessionalService',name:'Tech Dolphin',url:site.domain,logo:site.domain+'/assets/logo.png',telephone:primary.href.slice(4),email:email.href.slice(7),areaServed:site.id==='ru'?'RU':'Worldwide'};
    if(site.id==='international')schema.parentOrganization={'@type':'Organization',name:'Datvida LLC'};
    head+='\n<script type="application/ld+json">'+JSON.stringify(schema,null,2)+'</script>';
   }
   const scripts=['region.js','storage.js','i18n.js','analytics.js','main.js'].map(file=>'<script src="js/'+file+'?v='+version('js/'+file)+'"></script>').join('\n')+'\n<script async src="https://cdn.jsdelivr.net/npm/@emailjs/browser@4/dist/email.min.js"></script>';
   const values={...vars,HEAD:head,NAV_LINKS:menus(name),CONTENT:read('src/templates/pages/'+name),LEFT_NAV:page==='home'?component('left-nav'):'',SCRIPTS:scripts};
   const html=translateMarkup(expand(layout,values),defaultT);
   put(directory+name,html);
   const key=directory+name,digest=hash(Buffer.from(html));const old=dates[key];dates[key]={hash:digest,date:old?.hash===digest?old.date:date()};
  }
  const urls=PAGES.map(name=>{const key=directory+name;return '  <url><loc>'+site.domain+(name==='index.html'?'/':'/'+name)+'</loc><lastmod>'+dates[key].date+'</lastmod></url>';});
  put(directory+'sitemap.xml','<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'+urls.join('\n')+'\n</urlset>\n');
  put(directory+'robots.txt','User-agent: *\nAllow: /\n\nSitemap: '+site.domain+'/sitemap.xml\n');
  if(site.id==='international')put(directory+'_redirects',
   '# Generated by npm run build. Keep aliases on the canonical HTML URLs.\n'+
   PAGES.map(name=>'/'+name.slice(0,-5)+' '+(name==='index.html'?'/':'/'+name)+' 301!').join('\n')+'\n');
 }
 put('config/content-dates.json',JSON.stringify(dates,null,2)+'\n');
 return outputs;
}
function build(options={}){
 const outputs=createOutputs(),changed=[];
 for(const [relative,bytes] of outputs){const full=path.join(ROOT,relative);if(!fs.existsSync(full)||!fs.readFileSync(full).equals(bytes)){changed.push(relative);if(!options.check){fs.mkdirSync(path.dirname(full),{recursive:true});fs.writeFileSync(full,bytes);}}}
 if(options.check&&changed.length)throw Error('Generated files differ from shared source. Run npm run build:\n'+changed.join('\n'));
 console.log(options.check?'Generated files match the shared source.':'Built both regions from shared source ('+changed.length+' files updated).');
 return outputs;
}
if(require.main===module)build({check:process.argv.includes('--check')});
module.exports={build,createOutputs,dictionaryFor};
