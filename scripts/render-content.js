const fs = require('fs');
const path = require('path');
const vm = require('vm');
const ROOT = path.resolve(__dirname, '..');
const SITES = [
  { directory:'.', domain:'https://techdolphin.ru', language:'ru' },
  { directory:'netlify-abroad', domain:'https://nate-web3.com', language:'en' }
];
const PAGES = ['index.html','projects.html','pricing.html','faq.html','contact.html'];
const escape = value => String(value).replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;');
function dictionary(directory) {
  const context=vm.createContext({});
  vm.runInContext(fs.readFileSync(path.join(ROOT,directory,'js/i18n.js'),'utf8'),context);
  return vm.runInContext('T',context);
}
function translateMarkup(html, translations) {
  const tokens=/<!--[\s\S]*?-->|<script\b[\s\S]*?<\/script\s*>|<style\b[\s\S]*?<\/style\s*>|<\/?([a-z][a-z0-9-]*)\b[^>]*>/gi;
  const voids=new Set(['input','img','source','meta','link','br','hr','area','base','embed','param','track','wbr']);
  const stack=[], edits=[];
  for(const match of html.matchAll(tokens)) {
    if(!match[1])continue;
    const tag=match[1].toLowerCase(),text=match[0];
    if(text.startsWith('</')) {
      const index=stack.map(item=>item.tag).lastIndexOf(tag);
      if(index<0)continue;
      const frame=stack[index];stack.length=index;
      if(frame.key && translations[frame.key]!==undefined && !['input','textarea'].includes(tag)) edits.push({start:frame.inner,end:match.index,text:translations[frame.key]});
    } else {
      const key=text.match(/data-i18n="([^"]+)"/)?.[1];
      if(key && translations[key]!==undefined && ['input','textarea'].includes(tag)) {
        const replacement=text.includes('placeholder=')?text.replace(/placeholder="[^"]*"/,'placeholder="'+escape(translations[key])+'"'):text.slice(0,-1)+' placeholder="'+escape(translations[key])+'">';
        edits.push({start:match.index,end:match.index+text.length,text:replacement});
      }
      if(!voids.has(tag) && !text.endsWith('/>'))stack.push({tag,key,inner:match.index+text.length});
    }
  }
  const outer=edits.filter(edit=>!edits.some(other=>other!==edit && other.start<=edit.start && other.end>=edit.end));
  for(const edit of outer.sort((a,b)=>b.start-a.start))html=html.slice(0,edit.start)+edit.text+html.slice(edit.end);
  return html;
}
function renderSite(site) {
  const t=dictionary(site.directory)[site.language];
  t.footer_copy=t.footer_copy.replace('{year}',new Intl.DateTimeFormat('en',{year:'numeric',timeZone:'Europe/Moscow'}).format(new Date()));
  for(const name of PAGES) {
    const file=path.join(ROOT,site.directory,name);
    let html=translateMarkup(fs.readFileSync(file,'utf8'),t);
    const key=name==='index.html'?'home':name.replace('.html','');
    const title=t['meta_'+key+'_title'],description=t['meta_'+key+'_desc'];
    html=html.replace(/<html lang="[^"]+"/,'<html lang="'+site.language+'"');
    html=html.replace(/<title>[\s\S]*?<\/title>/,'<title>'+title+'</title>');
    const values={'description':description,'og:title':title,'og:description':description,'og:locale':site.language==='ru'?'ru_RU':'en_US','twitter:title':title,'twitter:description':description};
    html=html.replace(/<meta (name|property)="([^"]+)" content="[^"]*">/g,(tag,attr,key)=>values[key]!==undefined?'<meta '+attr+'="'+key+'" content="'+escape(values[key])+'">':tag);
    if(site.directory!==' .') {
      html=html.replace(/https:\/\/nate-web3\.netlify\.app/g,'https://nate-web3.com');
      if(site.language==='en')html=html.replace(/(name="twitter:image" content=")https:\/\/techdolphin\.ru/g,'$1'+site.domain);
    }
    if(site.language==='en')html=html.replace(/("(?:url|logo)": ")https:\/\/techdolphin\.ru/g,'$1'+site.domain);
    fs.writeFileSync(file,html);
  }
}
function main(){SITES.forEach(renderSite);console.log('Rendered initial language content and metadata for both sites.');}
if(require.main===module)main();
module.exports={dictionary,translateMarkup,renderSite,SITES,PAGES};
