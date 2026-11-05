const {test,expect}=require('@playwright/test');
const {validateArchive,INCLUDE}=require('../scripts/package-deploy');
test('A15: archives reject missing, disguised, duplicate, and modified files',()=>{
 const expected=[{name:'index.html',length:10,sha256:'a'},{name:'assets/hidden.mp4',length:20,sha256:'b'}];
 expect(()=>validateArchive(expected,expected)).not.toThrow();
 expect(()=>validateArchive([expected[0]],expected)).toThrow(/Missing/);
 expect(()=>validateArchive([expected[0],{...expected[1],name:'assets/hidden.mp4.backup'}],expected)).toThrow(/Unexpected/);
 expect(()=>validateArchive([expected[0],{...expected[1],sha256:'wrong'}],expected)).toThrow(/differs/);
 expect(()=>validateArchive([...expected,expected[0]],expected)).toThrow(/duplicate/);
 expect(INCLUDE).not.toContain('CHANGELOG.md');expect(INCLUDE).not.toContain('ui-smoke.spec.js');expect(INCLUDE).not.toContain('tests');
});
