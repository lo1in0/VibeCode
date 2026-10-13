(()=>{try{
 const check=(ok,msg)=>{if(!ok)throw Error(msg)};
 const click=s=>{const e=document.querySelector(s);check(e,'Missing '+s);e.click()};
 const value=(s,v)=>{const e=document.querySelector(s);e.value=v;e.dispatchEvent(new Event('change',{bubbles:true}))};
 const data=()=>JSON.parse(localStorage.getItem('jdi.data.v1'));
 if(['reload','complete'].includes(localStorage.getItem('jdi.smoke.phase'))){
  check(data().tasks[0].done&&data().notes[0].favorite,'Saved tasks and notes after reload');
  check(data().habits.length===1&&data().habits[0].name==='Saved habit','Habit persisted after reload');
  localStorage.setItem('jdi.smoke.phase','complete');
  return {ok:true,checks:['tasks','notes','calendar','habit create','binary completion','edit prefill','edit cancel','logs preserved','delete cancel','delete confirm','reload persistence'],origin:location.origin};
 }
 check(document.querySelector('#pageTitle').textContent==='Главная','Home');
 click('[data-action=create-task]');value('#taskText','Desktop smoke task');click('#saveDialog');click('[data-action=toggle-task]');
 click('[data-action=new-note]');value('#noteTitle','Desktop smoke note');value('#noteBody','Saved from exe');click('#saveDialog');
 click('[data-view=notes]');click('[data-action=favorite-note]');
 click('[data-view=calendar]');check(document.querySelectorAll('.cal-day').length>=28,'Calendar');
 click('[data-view=habits]');click('[data-action=new-habit]');value('#hName','Binary habit');value('#hType','binary');value('#hSchedule','weekly');value('#hTimes','3');click('#saveDialog');
 check(data().habits[0].min===1,'Binary minimum');
 click('[data-action=log-habit]');value('#binaryResult','1');click('#saveDialog');
 check(document.querySelector('[data-action=log-habit]').classList.contains('checked'),'Binary completion');
 const before=data().habits[0];
 click('[data-action=edit-habit]');check(document.querySelector('#hType').value==='binary','Binary prefill');check(document.querySelector('#hSchedule').value==='weekly','Weekly prefill');value('#hName','Cancelled');click('[data-action=close-modal]');check(data().habits[0].name===before.name,'Edit cancel');
 click('[data-action=edit-habit]');value('#hName','Edited habit');value('#hSchedule','days');click('#saveDialog');
 check(JSON.stringify(data().habits[0].logs)===JSON.stringify(before.logs)&&data().habits[0].id===before.id,'Logs and id preserved');
 click('[data-action=edit-habit]');check(document.querySelector('#hSchedule').value==='days','Days prefill');click('[data-action=close-modal]');
 const originalConfirm=window.confirm;
 try{window.confirm=()=>false;click('[data-action=delete-habit]');check(data().habits.length===1,'Delete cancel');window.confirm=()=>true;click('[data-action=delete-habit]');check(data().habits.length===0,'Delete confirm')}finally{window.confirm=originalConfirm}
 click('[data-action=new-habit]');value('#hName','Saved habit');click('#saveDialog');
 localStorage.setItem('jdi.smoke.phase','reload');return {reload:true};
}catch(e){return {ok:false,error:e.message,stack:e.stack}}})()
