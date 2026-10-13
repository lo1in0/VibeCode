const fs=require('fs'),vm=require('vm'),assert=require('node:assert/strict');
const source=fs.readFileSync(__dirname+'/src/assets/app.js','utf8');
const store=new Map(),errors=[];
const original={tasks:[{id:'old',text:'Existing task',day:'2026-10-12',done:false}],habits:[],plans:[],notes:[]};
const incoming={tasks:[{id:'new',text:'Restored task',day:'2026-10-13',done:true}],habits:[{id:'h',name:'Reading',binary:false,min:15,max:30,unit:'min',schedule:'daily',days:[0,1,2,3,4,5,6],times:3,start:'2026-10-01',end:'',logs:{'2026-10-12':10}}],plans:[],notes:[]};
let picked=incoming,accept=true,pending;
const ctx={db:structuredClone(original),STORE:'jdi.data.v1',console,formError:m=>errors.push(m),confirm:()=>accept,alert:()=>{},closeModal:()=>{},render:()=>{},
 localStorage:{setItem:(k,v)=>store.set(k,v),getItem:k=>store.get(k)},
 document:{createElement:()=>({files:[{size:100,text:async()=>JSON.stringify(picked)}],click(){pending=this.onchange()}})}};
vm.createContext(ctx);
for(const name of ['dayKey','parseDay','validBackup'])vm.runInContext(source.split('\n').find(l=>l.startsWith('function '+name+'(')),ctx);
vm.runInContext(source.split('\n').find(l=>l.startsWith('async function importData22(')),ctx);
(async()=>{
 assert.equal(vm.runInContext('validBackup(db)',ctx),true);
 await vm.runInContext('importData22()',ctx);await pending;
 assert.equal(ctx.db.tasks[0].id,'new');assert.equal(JSON.parse(store.get('jdi.backup.before-import')).tasks[0].id,'old');assert.equal(JSON.parse(store.get('jdi.data.v1')).habits[0].logs['2026-10-12'],10);
 ctx.db=structuredClone(original);accept=false;await vm.runInContext('importData22()',ctx);await pending;assert.equal(ctx.db.tasks[0].id,'old');
 accept=true;picked={...incoming,tasks:[{id:'bad',text:'Invalid date',day:'2026-02-31',done:false}]};await vm.runInContext('importData22()',ctx);await pending;assert.equal(ctx.db.tasks[0].id,'old');assert.equal(errors.length,1);
 picked=structuredClone(incoming);picked.habits[0].logs['2026-10-13']='NaN';await vm.runInContext('importData22()',ctx);await pending;assert.equal(errors.length,2);
 console.log('PASS: legacy schema, restore, prior-data backup, cancelled restore, invalid calendar date, invalid habit log');
})().catch(e=>{console.error(e);process.exitCode=1});
