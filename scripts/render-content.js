const fs = require('fs');
const path = require('path');
const vm = require('vm');
const ROOT = path.resolve(__dirname, '..');
const SITES = require('../config/regions.json');
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
if(require.main===module)require('./build').build();
module.exports={dictionary,translateMarkup,SITES,PAGES};
