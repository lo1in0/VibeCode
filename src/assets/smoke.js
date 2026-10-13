(()=>{try{
 const check=(ok,msg)=>{if(!ok)throw Error(msg)};
 const click=s=>{const e=[...document.querySelectorAll(s)].find(x=>x.getClientRects().length);check(e,'Missing '+s);e.click()};
 const value=(s,v)=>{const e=[...document.querySelectorAll(s)].find(x=>x.getClientRects().length);check(e,'Missing '+s);e.value=v;e.dispatchEvent(new Event('change',{bubbles:true}))};
 const data=()=>JSON.parse(localStorage.getItem('jdi.data.v1'));
 const key=d=>`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
 const today=key(new Date());
 window.confirm=()=>true;window.alert=message=>{window.lastAlert=message};
 if(localStorage.getItem('jdi.smoke.phase')==='reload'){
  check(data().tasks[0].done&&data().notes[0].favorite,'Saved tasks and notes after reload');
  check(data().habits[0].name==='Читать каждый день','Habit persisted after reload');
  check(data().plans[0].text==='Встреча по проекту','Event persisted after reload');
  click('[data-view=habits]');click('[data-action=log-habit]');value('#result','10');click('#saveDialog');
  check(data().habits[0].logs[today]===10,'Replace daily result');
  check(!document.querySelector('.view.active [data-action=log-habit]').classList.contains('checked'),'Partial result not completed');
  click('[data-action=log-habit]');click('[data-action=clear-habit-log]');check(data().habits[0].logs[today]===undefined,'Clear log');
  click('[data-action=log-habit]');value('#result','10');click('#saveDialog');
  click('[data-view=home]');
  return {ok:true,checks:['task create/edit/complete','event create/edit','notes create/favorite/search','unsaved cancel guard','habit create/edit/log preservation','numeric partial/result replacement/clear','binary completion','delete cancel/confirm','no horizontal overflow','reload persistence'],origin:location.origin};
 }
 check(document.querySelector('#pageTitle').textContent==='Главная','Home');
 click('[data-action=create-task]');value('#taskText','Подготовить план недели');click('#saveDialog');
 click('[data-action=edit-task]');value('#taskText','Подготовить вопросы к встрече');click('#saveDialog');check(data().tasks[0].text==='Подготовить вопросы к встрече','Edit task');click('[data-action=toggle-task]');
 click('[data-action=create-task]');value('#taskText','Отправить материалы к встрече');click('#saveDialog');
 click('[data-action=create-task]');value('#taskText','Купить продукты на ужин');click('#saveDialog');
 click('[data-view=notes]');click('[data-action=new-note]');value('#noteTitle','План работы над проектом');value('#noteBody','Перед встречей нужно собрать материалы в одном месте и договориться о понятной последовательности работы.\n\nПодготовить к встрече:\n• Собрать текущие материалы и последние версии файлов.\n• Записать вопросы, по которым требуется решение.\n• Проверить календарь и сроки ближайших задач.\n\nПосле обсуждения добавить принятые решения сюда же.');click('#saveDialog');click('.note-tools [data-action=favorite-note]');
 click('[data-action=edit-note]');value('#noteTitle','Несохранённый заголовок');window.confirm=()=>false;click('[data-action=close-modal]');check(document.getElementById('modal').classList.contains('show'),'Dirty guard');window.confirm=()=>true;click('[data-action=close-modal]');check(data().notes[0].title==='План работы над проектом','Cancel note');
 const search=document.querySelector('#noteSearch');search.value='нет такого текста';search.dispatchEvent(new Event('input',{bubbles:true}));check(!document.querySelector('#noteRows .note-row'),'Search none');search.value='';search.dispatchEvent(new Event('input',{bubbles:true}));check(document.querySelector('#noteRows .note-row'),'Search restored');
 click('[data-view=calendar]');check(document.querySelectorAll('.cal-day').length>=28,'Calendar');click('[data-action=create-plan]');value('#planText','Встреча');value('#planTime','14:00');click('#saveDialog');click('[data-action=edit-plan]');value('#planText','Встреча по проекту');click('#saveDialog');check(data().plans[0].text==='Встреча по проекту','Event edit');
 click('[data-view=habits]');click('[data-action=new-habit]');value('#hName','Чтение');click('#saveDialog');
 click('[data-action=log-habit]');value('#result','20');click('#saveDialog');check(data().habits[0].logs[today]===20,'Log numeric');
 click('[data-action=edit-habit]');value('#hName','Читать каждый день');click('#saveDialog');check(data().habits[0].logs[today]===20,'Logs preserved');
 click('[data-action=new-habit]');value('#hName','Утренняя зарядка');value('#hType','binary');click('#saveDialog');
 const binaryId=data().habits[1].id;click(`[data-action=log-habit][data-id="${binaryId}"]`);value('#binaryResult','1');click('#saveDialog');check(document.querySelector(`.view.active [data-action=log-habit][data-id="${binaryId}"]`).classList.contains('checked'),'Binary complete');
 click('[data-action=new-habit]');value('#hName','Удаляемая привычка');click('#saveDialog');const deleteId=data().habits[2].id;
 window.confirm=()=>false;click(`[data-action=delete-habit][data-id="${deleteId}"]`);check(data().habits.length===3,'Delete cancel');window.confirm=()=>true;click(`[data-action=delete-habit][data-id="${deleteId}"]`);check(data().habits.length===2,'Delete confirm');
 for(const view of ['home','tasks','habits','calendar','notes']){click(`[data-view=${view}]`);check(document.documentElement.scrollWidth<=innerWidth,'Overflow '+view);check(document.querySelectorAll('#pageAction .btn').length===1,'Single create '+view)}
 localStorage.setItem('jdi.smoke.phase','reload');return {reload:true};
}catch(e){return {ok:false,error:e.message,stack:e.stack}}})()

