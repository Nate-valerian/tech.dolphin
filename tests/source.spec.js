const {test,expect}=require('@playwright/test');
const fs=require('fs');
const path=require('path');
const {createOutputs,dictionaryFor}=require('../scripts/build');
const {SITES}=require('../scripts/render-content');
test('A17: both static sites exactly match one canonical source',()=>{
 const first=createOutputs(),second=createOutputs();expect([...first.keys()]).toEqual([...second.keys()]);
 for(const [file,bytes] of first){expect(bytes.equals(second.get(file))).toBe(true);expect(fs.readFileSync(path.resolve(__dirname,'..',file)).equals(bytes),file).toBe(true);}
 require('../scripts/check-site').check();
});
test('A17: every region preserves business identity and currency in either language',()=>{
 for(const region of SITES){const t=dictionaryFor(region);for(const language of ['ru','en']){
  expect(t[language].privacy_p1).toContain(region.operatorTokens[language]);
  for(let i=1;i<=4;i++)expect(t[language]['chat_budget_'+i]).toContain(region.currency==='USD'?'$':'₽');
 }}
});
