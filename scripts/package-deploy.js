#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const {execFileSync} = require('child_process');
const ROOT = path.resolve(__dirname, '..');
const SITES = require('../config/regions.json');
const {prepareSite, INCLUDE} = require('./prepare-deploy');
const quote = value => "'" + value.replace(/'/g,"''") + "'";
function removeGenerated(target) {
 const resolved=path.resolve(target);
 const isZip=path.dirname(resolved)===ROOT && /^(?:spaceweb-upload-tech-dolphin|netlify-abroad-upload-tech-dolphin)-\d{4}-\d{2}-\d{2}\.zip$/.test(path.basename(resolved));
 if(!isZip)throw new Error('Refusing to remove an unexpected generated path: '+resolved);
 fs.rmSync(resolved,{recursive:true,force:true});
}
function listFiles(dir,base=dir) {
 return fs.readdirSync(dir,{withFileTypes:true}).flatMap(entry=>{
  const full=path.join(dir,entry.name);
  return entry.isDirectory()?listFiles(full,base):[path.relative(base,full).split(path.sep).join('/')];
 });
}
function validateArchive(actual,expected) {
 const names=new Set(actual.map(entry=>entry.name));
 if(names.size!==actual.length)throw new Error('Archive contains duplicate file names');
 const wanted=new Map(expected.map(entry=>[entry.name,entry]));
 for(const entry of actual){
  const source=wanted.get(entry.name);
  if(!source)throw new Error('Unexpected archive file: '+entry.name);
  if(source.length!==entry.length || source.sha256!==entry.sha256)throw new Error('Archive content differs: '+entry.name);
 }
 for(const entry of expected)if(!names.has(entry.name))throw new Error('Missing archive file: '+entry.name);
}
function packageSite(id='ru') {
 const site=SITES.find(candidate=>candidate.id===id);
 if(!site)throw Error('Unknown site '+id);
 const DIST=prepareSite(id);
 execFileSync('powershell.exe',['-NoProfile','-Command','Get-ChildItem -LiteralPath '+quote(DIST)+' -Recurse -Force | ForEach-Object { $_.Attributes = $_.Attributes -band (-bnot [System.IO.FileAttributes]::Hidden) }']);
 const zipPath=path.join(ROOT,(site.id==='ru'?'spaceweb-upload-tech-dolphin-':'netlify-abroad-upload-tech-dolphin-')+new Date().toISOString().slice(0,10)+'.zip');
 removeGenerated(zipPath);
 execFileSync('powershell.exe',['-NoProfile','-Command','Get-ChildItem -LiteralPath '+quote(DIST)+' -Force | Compress-Archive -DestinationPath '+quote(zipPath)+' -Force']);
 const command='Add-Type -AssemblyName System.IO.Compression.FileSystem; $archive=[System.IO.Compression.ZipFile]::OpenRead('+quote(zipPath)+'); try { $rows=@(foreach($entry in $archive.Entries) { if(-not $entry.Name) {continue}; $stream=$entry.Open(); $sha=[System.Security.Cryptography.SHA256]::Create(); try { [PSCustomObject]@{name=$entry.FullName.Replace([char]92,[char]47);length=$entry.Length;sha256=[BitConverter]::ToString($sha.ComputeHash($stream)).Replace("-", "").ToLowerInvariant()} } finally {$stream.Dispose();$sha.Dispose()} }); ConvertTo-Json -InputObject $rows -Compress } finally {$archive.Dispose()}';
 const actual=JSON.parse(execFileSync('powershell.exe',['-NoProfile','-Command',command],{encoding:'utf8'}).replace(/^\uFEFF/,''));
 const expected=listFiles(DIST).map(name=>{const bytes=fs.readFileSync(path.join(DIST,name));return {name,length:bytes.length,sha256:crypto.createHash('sha256').update(bytes).digest('hex')};});
 validateArchive(actual,expected);
 console.log('Verified '+expected.length+' exact file names and SHA-256 hashes: '+zipPath);
 return zipPath;
}
if(require.main===module){
 require('./build').build();
 require('./check-site').check();
 if(process.argv.includes('--all'))SITES.forEach(site=>packageSite(site.id));
 else {const index=process.argv.indexOf('--site');packageSite(index>=0?process.argv[index+1]:'ru');}
}
module.exports={packageSite,validateArchive,INCLUDE};
