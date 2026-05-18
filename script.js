import { supabase } from './client.js';

// Supabase client is ready to use when database persistence is added.
// Example: await supabase.from('employees').select('*')
window.supabase = supabase;

const STAFF = [
  { id:1, name:'Maya R.', initials:'MR', color:'#E1F5EE', text:'#0F6E56', role:'Server' },
  { id:2, name:'Jordan T.', initials:'JT', color:'#E6F1FB', text:'#185FA5', role:'Server' },
  { id:3, name:'Priya S.', initials:'PS', color:'#EEEDFE', text:'#3C3489', role:'Server' },
  { id:4, name:'Caleb W.', initials:'CW', color:'#FAEEDA', text:'#633806', role:'Server' },
  { id:5, name:'Nina L.', initials:'NL', color:'#FAECE7', text:'#993C1D', role:'Server' },
  { id:6, name:'Ava M.', initials:'AM', color:'#EAF3DE', text:'#3B6D11', role:'Manager' },
  { id:7, name:'Luis G.', initials:'LG', color:'#FCEBEB', text:'#A32D2D', role:'Manager' },
  { id:8, name:'Tara B.', initials:'TB', color:'#EEEDFE', text:'#3C3489', role:'Manager' },
  { id:9, name:'Sam K.', initials:'SK', color:'#E6F1FB', text:'#185FA5', role:'Bartender' },
  { id:10, name:'Lexi P.', initials:'LP', color:'#EEEDFE', text:'#3C3489', role:'Bartender' },
  { id:11, name:'Owen D.', initials:'OD', color:'#FAECE7', text:'#993C1D', role:'Bartender' },
  { id:12, name:'Riley C.', initials:'RC', color:'#EAF3DE', text:'#3B6D11', role:'Bartender' },
  { id:13, name:'Chris V.', initials:'CV', color:'#FAEEDA', text:'#633806', role:'Barback' },
  { id:14, name:'Gia N.', initials:'GN', color:'#E1F5EE', text:'#0F6E56', role:'Busser' },
  { id:15, name:'Ty B.', initials:'TY', color:'#E6F1FB', text:'#185FA5', role:'Busser' },
  { id:16, name:'Lena F.', initials:'LF', color:'#EEEDFE', text:'#3C3489', role:'FoodRunner' },
];
const SERVER_IDS = [1,2,3,4,5];
const BARTENDER_IDS = [9,10,11,12];
const BARBACK_IDS = [13];
const BUSSER_IDS = [14,15];
const FOODRUNNER_IDS = [16];
const MANAGER_IDS = [6,7,8];
const EMPLOYEE_IDS = STAFF.filter(s=>s.role!=='Manager').map(s=>s.id);
const DAYS = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
const LONG_DAYS = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'];

let weekOffset = 0, role = 'manager', activeTab = 'schedule', scheduleMode = 'regular', upcomingPage = 0, activeEmployeeId = 1;
let activeTemplate = 'regular';
let managerScheduleView = 'draft';

let managersByDay = {
  0:{staffId:6,time:'1pm'}, 1:{staffId:7,time:'4pm'}, 2:{staffId:8,time:'1pm'},
  3:{staffId:6,time:'4pm'}, 4:{staffId:7,time:'1pm'}, 5:{staffId:8,time:'4pm'}, 6:{staffId:6,time:'1pm'}
};

let requests = [
  {id:1,staffId:activeEmployeeId,name:staffById(activeEmployeeId).name,dates:'Jun 14–15',reason:'Family event',status:'pending',submitted:'May 12'},
  {id:2,staffId:3,name:'Priya S.',dates:'Jun 20',reason:'Doctor appointment',status:'pending',submitted:'May 14'},
  {id:3,staffId:5,name:'Nina L.',dates:'Jun 10',reason:'Moving day',status:'approved',submitted:'May 8'},
  {id:4,staffId:2,name:'Jordan T.',dates:'Jun 7',reason:'Personal',status:'denied',submitted:'May 5'},
];
let nextId = 5;

let availability = {
  1:{0:{'4pm':true,'5pm':true},1:{'4pm':true,'5pm':false},2:{'4pm':true,'5pm':true},3:{'4pm':false,'5pm':true},4:{'4pm':true,'5pm':true},5:{'4pm':true,'5pm':true},6:{'4pm':false,'5pm':true}},
  2:{0:{'4pm':true,'5pm':true},1:{'4pm':true,'5pm':true},2:{'4pm':false,'5pm':true},3:{'4pm':true,'5pm':true},4:{'4pm':true,'5pm':true},5:{'4pm':true,'5pm':false},6:{'4pm':true,'5pm':true}},
  3:{0:{'4pm':false,'5pm':true},1:{'4pm':true,'5pm':true},2:{'4pm':true,'5pm':true},3:{'4pm':true,'5pm':false},4:{'4pm':true,'5pm':true},5:{'4pm':true,'5pm':true},6:{'4pm':true,'5pm':true}},
  4:{0:{'4pm':true,'5pm':false},1:{'4pm':true,'5pm':true},2:{'4pm':true,'5pm':true},3:{'4pm':true,'5pm':true},4:{'4pm':false,'5pm':true},5:{'4pm':true,'5pm':true},6:{'4pm':true,'5pm':true}},
  5:{0:{'4pm':true,'5pm':true},1:{'4pm':false,'5pm':true},2:{'4pm':true,'5pm':true},3:{'4pm':true,'5pm':true},4:{'4pm':true,'5pm':false},5:{'4pm':true,'5pm':true},6:{'4pm':false,'5pm':true}}
};


let shiftRequests = [
  {id:1,type:'giveup',status:'pending',staffId:2,mode:'regular',day:4,slotIdx:1,submitted:'May 15'},
  {id:2,type:'swap',status:'approved',staffId:1,mode:'patio',day:5,slotIdx:0,targetStaffId:3,targetMode:'patio',targetDay:5,targetSlotIdx:2,submitted:'May 16'}
];
let nextShiftRequestId = 3;

let assignments = buildInitialAssignments();
let publishedAssignments = cloneSchedule(assignments);
let publishedManagersByDay = cloneSchedule(managersByDay);
let lastPublishedLabel = 'Not published yet';

function cloneSchedule(obj){ return JSON.parse(JSON.stringify(obj)); }

function getStaffIdsForRole(roleName){
  if(roleName==='Server') return SERVER_IDS;
  if(roleName==='Bartender') return BARTENDER_IDS;
  if(roleName==='Barback') return BARBACK_IDS;
  if(roleName==='Busser') return BUSSER_IDS;
  if(roleName==='FoodRunner') return FOODRUNNER_IDS;
  return EMPLOYEE_IDS;
}
function buildInitialAssignments(){
  const a = {};
  ['regular','patio'].forEach(mode=>{
    getSlotsForWeek(mode).forEach((slots, day)=>{
      a[`${mode}-${day}`] = slots.map((slot, i)=>{
        const ids = getStaffIdsForRole(slot.role || 'Server');
        return {...slot, staffId: ids.length ? ids[(day+i)%ids.length] : null};
      });
    });
  });
  getSlotsForWeek('regular').forEach((slots, day)=>{
    a[`managerRegular-${day}`] = slots.map((slot)=>({...slot, staffId:null}));
  });
  return a;
}

function getWeekDays() {
  const today = new Date();
  const dow = today.getDay();
  const mon = new Date(today);
  mon.setDate(today.getDate() - (dow===0?6:dow-1) + weekOffset*7);
  return Array.from({length:7},(_,i)=>{ const d=new Date(mon); d.setDate(mon.getDate()+i); return d; });
}
function isToday(d) { const t=new Date(); return d.getDate()===t.getDate()&&d.getMonth()===t.getMonth()&&d.getFullYear()===t.getFullYear(); }
function fmt(d) { return d.toLocaleDateString('en-US',{month:'short',day:'numeric'}); }
function pendingCount() { return requests.filter(r=>r.status==='pending').length + shiftRequests.filter(r=>r.status==='pending').length; }
function staffById(id){ return STAFF.find(s=>s.id===id); }
function populateLogin(){
  const sel = document.getElementById('login-user');
  if(!sel) return;
  sel.innerHTML = STAFF.map(s=>`<option value="${s.id}">${s.name} — ${s.role}</option>`).join('');
}
function login(){
  const selected = +document.getElementById('login-user').value;
  const user = staffById(selected) || STAFF[0];
  activeEmployeeId = user.role === 'Manager' ? activeEmployeeId : user.id;
  role = user.role === 'Manager' ? 'manager' : 'employee';
  activeTab = 'schedule';
  upcomingPage = 0;
  document.getElementById('login-screen').style.display = 'none';
  document.getElementById('app').style.display = 'flex';
  render();
}
window.login = function() {
  document.getElementById('app').style.display = 'none';
  document.getElementById('login-screen').style.display = 'flex';
}
function renderUserChip(){
  const chip = document.getElementById('user-chip');
  if(!chip) return;
  const user = role === 'manager' ? staffById(6) : staffById(activeEmployeeId);
  const name = user ? user.name : 'User';
  const userRole = user ? user.role : '';
  chip.innerHTML = `<div><strong>${name}</strong><span>${role==='manager'?'Manager view':userRole+' view'}</span></div><button class="btn-secondary" onclick="logout()"><i class="ti ti-logout"></i> Log out</button>`;
}

function changeWeek(dir) { weekOffset+=dir; render(); }
function setRole(r) {
  role=r; activeTab='schedule'; upcomingPage=0;
  const bm=document.getElementById('btn-manager'), be=document.getElementById('btn-employee');
  if(bm) bm.classList.toggle('active',r==='manager');
  if(be) be.classList.toggle('active',r==='employee');
  render();
}
function setTab(t) { activeTab=t; render(); }
function setActiveEmployee(id){ activeEmployeeId=+id; upcomingPage=0; render(); }
function setMode(m){ scheduleMode=m; render(); }
function setManagerTemplate(t){ activeTemplate=t; render(); }
function setManagerScheduleView(v){ managerScheduleView=v; render(); }

function getSlotsForWeek(mode){ return Array.from({length:7},(_,day)=>getSlotsForDay(mode, day)); }
function serverSlotsForDay(mode, day){
  if(mode==='regular'){
    if(day===4 || day===5) return [
      {role:'Server', area:'Server', time:'4pm'}, {role:'Server', area:'Server', time:'4pm'},
      {role:'Server', area:'Server', time:'5pm'}, {role:'Server', area:'Server', time:'5pm'},
      {role:'Server', area:'On call', time:'5pm', oncall:true}
    ];
    return [{role:'Server', area:'Server', time:'4pm'}, {role:'Server', area:'Server', time:'5pm'}, {role:'Server', area:'On call', time:'5pm', oncall:true}];
  }
  if(day===0) return [
    {role:'Server', area:'Patio', time:'4pm', patio:true}, {role:'Server', area:'Patio', time:'4pm', patio:true},
    {role:'Server', area:'Downstairs', time:'4pm'}, {role:'Server', area:'On call', time:'5pm', oncall:true}
  ];
  if(day>=1 && day<=3) return [
    {role:'Server', area:'Downstairs', time:'4pm'}, {role:'Server', area:'Downstairs', time:'5pm'},
    {role:'Server', area:'Upstairs', time:'4pm', patio:true}, {role:'Server', area:'On call', time:'5pm', oncall:true}
  ];
  if(day===4 || day===5) return [
    {role:'Server', area:'Downstairs', time:'4pm'}, {role:'Server', area:'Downstairs', time:'5pm'},
    {role:'Server', area:'Upstairs', time:'4pm', patio:true}, {role:'Server', area:'Upstairs', time:'5pm', patio:true},
    {role:'Server', area:'On call', time:'5pm', oncall:true}
  ];
  if(day===6) return [
    {role:'Server', area:'Patio', time:'4pm', patio:true}, {role:'Server', area:'Patio', time:'4pm', patio:true},
    {role:'Server', area:'Downstairs', time:'4pm'}, {role:'Server', area:'On call', time:'5pm', oncall:true}
  ];
  return [];
}
function bartenderSlotsForDay(day){
  if(day===4 || day===5) return [
    {role:'Bartender', area:'Inside bar', time:'3:30pm'}, {role:'Bartender', area:'Inside bar', time:'5pm'},
    {role:'Bartender', area:'Patio bar', time:'3:30pm', patio:true}, {role:'Bartender', area:'Patio bar', time:'5pm', patio:true}
  ];
  return [
    {role:'Bartender', area:'Inside bar', time:'3:30pm'},
    {role:'Bartender', area:'Patio bar', time:'3:30pm', patio:true},
    {role:'Bartender', area:'Float', time:'5pm'}
  ];
}
function supportSlotsForDay(day){
  const slots = [{role:'FoodRunner', area:'Food runner', time:'4pm'}];
  if(day===4 || day===5){
    slots.push({role:'Barback', area:'Barback', time:'4pm'});
    slots.push({role:'Busser', area:'Downstairs busser', time:'3:30pm'});
    slots.push({role:'Busser', area:'Upstairs busser', time:'3:30pm', patio:true});
    slots.push({role:'Busser', area:'Float busser', time:'5pm'});
  } else {
    slots.push({role:'Busser', area:'Busser', time:'3:30pm'});
    slots.push({role:'Busser', area:'Float busser', time:'5pm'});
  }
  return slots;
}
function getSlotsForDay(mode, day){
  if(mode==='blank') return [];
  return [...serverSlotsForDay(mode, day), ...bartenderSlotsForDay(day), ...supportSlotsForDay(day)];
}
function visibleSlotsForRole(slots, viewerRole){
  if(role==='manager' || !viewerRole) return slots;
  return slots.filter(slot => slot.role === viewerRole);
}

function render() {
  const days = getWeekDays();
  document.getElementById('weekLabel').textContent = fmt(days[0])+' – '+fmt(days[6]);
  const isMgr = role==='manager';
  renderUserChip();

  const sb = document.getElementById('sidebar');
  if (isMgr) {
    sb.style.display='block';
    sb.innerHTML = `<div class="sidebar-title">Staff</div>` + STAFF.map(s=>`<div class="staff-item">
      <div class="avatar" style="background:${s.color};color:${s.text}">${s.initials}</div>
      <div><div class="staff-name">${s.name}</div><div class="staff-role-tag">${s.role}</div></div>
    </div>`).join('');
  } else { sb.style.display='none'; }

  const pc = pendingCount();
  document.getElementById('tabs').innerHTML = isMgr ? `
    <div class="tab ${activeTab==='schedule'?'active':''}" onclick="setTab('schedule')"><i class="ti ti-layout-grid"></i> Schedule</div>
    <div class="tab ${activeTab==='templates'?'active':''}" onclick="setTab('templates')"><i class="ti ti-copy"></i> Manager templates</div>
    <div class="tab ${activeTab==='availability'?'active':''}" onclick="setTab('availability')"><i class="ti ti-user-check"></i> Availability</div>
    <div class="tab ${activeTab==='requests'?'active':''}" onclick="setTab('requests')"><i class="ti ti-calendar-off"></i> Requests ${pc?`<span class="badge">${pc}</span>`:''}</div>` : `
    <div class="tab ${activeTab==='schedule'?'active':''}" onclick="setTab('schedule')"><i class="ti ti-layout-grid"></i> My schedule</div>
    <div class="tab ${activeTab==='availability'?'active':''}" onclick="setTab('availability')"><i class="ti ti-user-check"></i> Availability</div>
    <div class="tab ${activeTab==='requests'?'active':''}" onclick="setTab('requests')"><i class="ti ti-calendar-off"></i> Requests</div>`;

  const tc = document.getElementById('tab-content');
  if (activeTab==='schedule') tc.innerHTML = isMgr ? renderManagerScheduleView(days) : renderEmployeeView(days);
  else if (activeTab==='templates') tc.innerHTML = renderTemplates(days);
  else if (activeTab==='availability') tc.innerHTML = isMgr ? renderAvailabilityOverview() : renderAvailabilityForm();
  else if (isMgr) tc.innerHTML = renderManagerRequests();
  else tc.innerHTML = renderEmployeeRequests(days);
}

function renderManagerScheduleView(days){
  return renderSchedule(days, true, managerScheduleView);
}
function renderModeToggle(view){
  const isDraft = view === 'draft';
  return `<div class="schedule-status">
    <div><div class="status-title"><i class="ti ${isDraft?'ti-pencil':'ti-checkup-list'}"></i>${isDraft?'Creating upcoming schedule':'Current published schedule'} <span class="${isDraft?'status-badge-draft':'status-badge-published'}">${isDraft?'Draft':'Published'}</span></div>
    <div class="status-copy">${isDraft?'Make changes here before staff sees the new week.':'This is the schedule employees should treat as current. Last published: '+lastPublishedLabel}</div></div>
    <div class="template-group"><button class="pill-btn ${managerScheduleView==='current'?'active':''}" onclick="setManagerScheduleView('current')">Current schedule</button><button class="pill-btn ${managerScheduleView==='draft'?'active':''}" onclick="setManagerScheduleView('draft')">New upcoming schedule</button></div>
  </div>
  <div class="template-bar"><div class="template-group"><span class="template-label">Schedule type</span>
    <button class="pill-btn ${scheduleMode==='regular'?'active':''}" ${isDraft?'': 'disabled'} onclick="setMode('regular')">Regular</button>
    <button class="pill-btn ${scheduleMode==='patio'?'active':''}" ${isDraft?'': 'disabled'} onclick="setMode('patio')">Patio season</button>
    <button class="pill-btn ${scheduleMode==='blank'?'active':''}" ${isDraft?'': 'disabled'} onclick="setMode('blank')">Blank schedule</button>
  </div><div class="manager-tools">${isDraft?`<button class="btn-save" onclick="autoGenerateSchedule()"><i class="ti ti-wand"></i> Auto-generate draft</button><button class="btn-save" onclick="publishSchedule()"><i class="ti ti-upload"></i> Publish schedule</button>`:''}<button class="btn-secondary" onclick="exportCSV()"><i class="ti ti-download"></i> Export CSV</button></div><div class="summary-line">Servers use 4pm / 5pm. Bartenders use 3:30pm / 5pm. Support staff varies by role.</div></div>`;
}
function renderSchedule(days, isMgr, view='published') {
  const keyPrefix = scheduleMode;
  const source = (isMgr && view==='draft') ? assignments : publishedAssignments;
  const managerSource = (isMgr && view==='draft') ? managersByDay : publishedManagersByDay;
  const editable = isMgr && view==='draft';
  let h = `<div class="schedule-wrap">${isMgr?renderModeToggle(view):''}`;
  h += `<div class="day-headers"><div></div>` + days.map((d,i)=>`<div class="day-header${isToday(d)?' today':''}">${DAYS[i]}<span class="num">${d.getDate()}</span></div>`).join('')+`</div>`;
  h += `<div class="manager-strip"><div class="manager-label">Manager on duty</div>` + days.map((d,i)=>{
    const m=managerSource[i], s=staffById(m.staffId);
    return `<div class="manager-cell" ${editable?`onclick="editManager(${i})" title="Click to edit manager"`:''}>
      <div class="manager-name">${s?s.name:'Unassigned'}</div><div class="manager-time">${m.time} start</div></div>`;
  }).join('') + `</div>`;
  h += `<div class="slot-grid">`;
  for(let d=0; d<7; d++){
    const viewer = staffById(activeEmployeeId);
    const rawSlots = visibleSlotsForRole(source[`${keyPrefix}-${d}`] || [], viewer && viewer.role);
    // Published/current schedule views should not show unassigned/open slots.
    // Draft editing still shows them so managers can build the schedule.
    const slots = editable ? rawSlots : rawSlots.filter(slot => !!slot.staffId);
    h += `<div class="template-day-card"><div class="template-day-title"><span>${LONG_DAYS[d]}</span><span class="template-day-date">${fmt(days[d])}</span></div>`;
    if(!slots.length && !editable){
      h += `<div class="empty-day-note">No assigned shifts</div>`;
    }
    slots.forEach((slot, i)=>{
      const s = staffById(slot.staffId);
      const cls = slot.special ? 'special' : slot.oncall ? 'oncall' : slot.patio ? 'patio' : 'filled';
      const ok = !slot.staffId || isAvailable(slot.staffId,d,slot);
      h += `<div class="slot ${cls}" ${editable?`onclick="editSlot('${keyPrefix}',${d},${i})" title="Click to assign"`:''}>
        <div class="slot-area">${slot.area} <span class="role-chip">${slot.role || 'Server'}</span></div><div class="slot-main">${s?s.name:'Unassigned'}${s?` <span class="role-chip">${s.role}</span>`:''}</div><div class="slot-time">${slot.time}${slot.oncall?' · on call':''}${slot.patio?' · patio':''}${slot.special?' · special event':''}</div>${!ok?'<div class="warning-text">Not available</div>':''}
      </div>`;
    });
    if(editable) h += `<button class="btn-secondary" style="width:100%;justify-content:center;margin-top:6px" onclick="addSlot('${keyPrefix}',${d})"><i class="ti ti-plus"></i> Add shift</button>`;
    h += `</div>`;
  }
  h += `</div><div class="legend">
    <span class="leg-item"><span class="leg-dot" style="background:#E6F1FB;border:1px solid #85B7EB"></span>Server / Downstairs</span>
    <span class="leg-item"><span class="leg-dot" style="background:#E1F5EE;border:1px solid #5DCAA5"></span>Patio / Upstairs</span>
    <span class="leg-item"><span class="leg-dot" style="background:#FAEEDA;border:1px solid #FAC775"></span>On call</span>
    <span class="leg-item"><span class="leg-dot" style="background:#FCEBEB;border:1px solid #F09595"></span>Special event</span>
  </div></div>`;
  return h;
}

function renderTemplates(days){
  const tabs = `<div class="template-bar"><div class="template-group"><span class="template-label">Manager template</span>
    <button class="pill-btn ${activeTemplate==='regular'?'active':''}" onclick="setManagerTemplate('regular')">Regular</button>
    <button class="pill-btn ${activeTemplate==='patio'?'active':''}" onclick="setManagerTemplate('patio')">Patio</button>
    <button class="pill-btn ${activeTemplate==='managerRegular'?'active':''}" onclick="setManagerTemplate('managerRegular')">Blank regular</button>
  </div><div class="summary-line">Use these as starting patterns, then assign names as needed.</div></div>`;
  const oldMode = scheduleMode;
  let mode = activeTemplate==='patio'?'patio':'regular';
  let h=`<div class="schedule-wrap">${tabs}<div class="slot-grid">`;
  for(let d=0; d<7; d++){
    const slots = assignments[`${activeTemplate}-${d}`] || getSlotsForDay(mode,d).map(s=>({...s,staffId:null}));
    h += `<div class="template-day-card"><div class="template-day-title"><span>${LONG_DAYS[d]}</span></div>`;
    slots.forEach((slot,i)=>{
      const s=staffById(slot.staffId); const cls=slot.special?'special':slot.oncall?'oncall':slot.patio?'patio':'filled';
      h += `<div class="slot ${cls}" onclick="editSlot('${activeTemplate}',${d},${i})"><div class="slot-area">${slot.area}</div><div class="slot-main">${s?s.name:'Open slot'}</div><div class="slot-time">${slot.time}${slot.oncall?' · on call':''}${slot.patio?' · patio':''}${slot.special?' · special event':''}</div></div>`;
    });
    h += `<button class="btn-secondary" style="width:100%;justify-content:center;margin-top:6px" onclick="addSlot('${activeTemplate}',${d})"><i class="ti ti-plus"></i> Add shift</button>`;
    h += `</div>`;
  }
  return h+`</div></div>`;
}

function editManager(dayIdx){
  const m=managersByDay[dayIdx];
  showModal(`<div class="modal-title">Manager on duty — ${LONG_DAYS[dayIdx]}</div>
    <div class="fgroup"><label class="flabel">Manager</label><select id="m-manager">${MANAGER_IDS.map(id=>{const s=staffById(id); return `<option value="${id}"${id===m.staffId?' selected':''}>${s.name}</option>`}).join('')}</select></div>
    <div class="fgroup"><label class="flabel">Start time</label><select id="m-time"><option${m.time==='1pm'?' selected':''}>1pm</option><option${m.time==='4pm'?' selected':''}>4pm</option></select></div>
    <div class="modal-actions"><button class="btn-cancel" onclick="closeModal()">Cancel</button><button class="btn-save" onclick="saveManager(${dayIdx})"><i class="ti ti-check"></i> Save</button></div>`);
}
function saveManager(dayIdx){ managersByDay[dayIdx]={staffId:+document.getElementById('m-manager').value,time:document.getElementById('m-time').value}; closeModal(); render(); }
function slotTag(slot){
  if(slot.special) return 'special';
  if(slot.oncall) return 'oncall';
  if(slot.patio) return 'patio';
  return 'none';
}
function editSlot(prefix, dayIdx, slotIdx){
  const slot=assignments[`${prefix}-${dayIdx}`][slotIdx];
  showSlotModal(prefix, dayIdx, slotIdx, slot, false);
}
function addSlot(prefix, dayIdx){
  if(!assignments[`${prefix}-${dayIdx}`]) assignments[`${prefix}-${dayIdx}`] = [];
  showSlotModal(prefix, dayIdx, null, {area:'Server', time:'4pm', staffId:null}, true);
}
function showSlotModal(prefix, dayIdx, slotIdx, slot, isNew){
  showModal(`<div class="modal-title">${isNew?'Add':'Edit'} shift — ${LONG_DAYS[dayIdx]}</div>
    <div class="fgroup"><label class="flabel">Employee</label><select id="m-server"><option value="">Unassigned</option>${getStaffIdsForRole(slot.role || 'Server').map(id=>{const s=staffById(id); const ok=isAvailable(id,dayIdx,slot); return `<option value="${id}"${id===slot.staffId?' selected':''}>${s.name} — ${s.role}${ok?'':' (not available)'}</option>`}).join('')}</select></div>
    <div class="fgroup"><label class="flabel">Shift time</label><select id="m-shift-time"><option${slot.time==='3:30pm'?' selected':''}>3:30pm</option><option${slot.time==='4pm'?' selected':''}>4pm</option><option${slot.time==='5pm'?' selected':''}>5pm</option><option${slot.time==='1pm'?' selected':''}>1pm</option></select></div>
    <div class="fgroup"><label class="flabel">Job type</label><select id="m-job-role"><option${(slot.role||'Server')==='Server'?' selected':''}>Server</option><option${slot.role==='Bartender'?' selected':''}>Bartender</option><option${slot.role==='Barback'?' selected':''}>Barback</option><option${slot.role==='Busser'?' selected':''}>Busser</option><option${slot.role==='FoodRunner'?' selected':''}>FoodRunner</option></select></div><div class="fgroup"><label class="flabel">Area / label</label><input type="text" id="m-area" value="${slot.area || 'Server'}" placeholder="Server, Downstairs, Upstairs, Patio, Float..." /></div>
    <div class="fgroup"><label class="flabel">Tag</label><select id="m-tag">
      <option value="none"${slotTag(slot)==='none'?' selected':''}>None</option>
      <option value="patio"${slotTag(slot)==='patio'?' selected':''}>Patio</option>
      <option value="oncall"${slotTag(slot)==='oncall'?' selected':''}>On Call</option>
      <option value="special"${slotTag(slot)==='special'?' selected':''}>Special Event</option>
    </select></div>
    <div class="modal-actions">
      ${isNew?'':`<button class="btn-remove" onclick="removeSlot('${prefix}',${dayIdx},${slotIdx})"><i class="ti ti-trash"></i> Remove</button>`}
      <button class="btn-cancel" onclick="closeModal()">Cancel</button>
      <button class="btn-save" onclick="${isNew?`saveNewSlot('${prefix}',${dayIdx})`:`updateSlotDetails('${prefix}',${dayIdx},${slotIdx})`}"><i class="ti ti-check"></i> Save</button>
    </div>`);
}
function readSlotForm(){
  const tag=document.getElementById('m-tag').value;
  return {
    staffId: document.getElementById('m-server').value ? +document.getElementById('m-server').value : null,
    time: document.getElementById('m-shift-time').value,
    role: document.getElementById('m-job-role').value,
    area: document.getElementById('m-area').value.trim() || document.getElementById('m-job-role').value,
    patio: tag==='patio',
    oncall: tag==='oncall',
    special: tag==='special'
  };
}
function saveNewSlot(prefix, dayIdx){ assignments[`${prefix}-${dayIdx}`].push(readSlotForm()); closeModal(); render(); }
function updateSlotDetails(prefix, dayIdx, slotIdx){ assignments[`${prefix}-${dayIdx}`][slotIdx]=readSlotForm(); closeModal(); render(); }
function removeSlot(prefix, dayIdx, slotIdx){ assignments[`${prefix}-${dayIdx}`].splice(slotIdx,1); closeModal(); render(); }

function isAvailable(staffId, dayIdx, slot){
  const a = availability[staffId] && availability[staffId][dayIdx];
  if(!a) return false;
  if(!a) return staffById(staffId)?.role !== 'Server';
  if(slot.oncall) return !!a['5pm'];
  if(a[slot.time] !== undefined) return !!a[slot.time];
  if(slot.time==='3:30pm') return true;
  return true;
}
function autoGenerateSchedule(){
  const keyPrefix = scheduleMode;
  const usedCounts = Object.fromEntries(EMPLOYEE_IDS.map(id=>[id,0]));
  for(let d=0; d<7; d++){
    const usedToday = new Set();
    const slots = getSlotsForDay(keyPrefix,d).map(slot=>({...slot, staffId:null}));
    slots.forEach(slot=>{
      const candidates = getStaffIdsForRole(slot.role || 'Server')
        .filter(id=>!usedToday.has(id) && isAvailable(id,d,slot))
        .sort((a,b)=>usedCounts[a]-usedCounts[b] || a-b);
      if(candidates.length){
        slot.staffId = candidates[0];
        usedToday.add(candidates[0]);
        usedCounts[candidates[0]]++;
      }
    });
    assignments[`${keyPrefix}-${d}`] = slots;
  }
  render();
}
function publishSchedule(){
  publishedAssignments = cloneSchedule(assignments);
  publishedManagersByDay = cloneSchedule(managersByDay);
  lastPublishedLabel = new Date().toLocaleString('en-US',{month:'short',day:'numeric',hour:'numeric',minute:'2-digit'});
  managerScheduleView = 'current';
  render();
}
function csvEscape(v){ return `"${String(v ?? '').replaceAll('"','""')}"`; }
function exportCSV(){
  const days=getWeekDays();
  const source = managerScheduleView==='draft' ? assignments : publishedAssignments;
  const managerSource = managerScheduleView==='draft' ? managersByDay : publishedManagersByDay;
  const rows=[['Date','Day','Schedule View','Type','Job Role','Area','Time','Employee','Employee Role','Manager on Duty','Manager Start','Status']];
  for(let d=0; d<7; d++){
    const m=managerSource[d], mgr=staffById(m.staffId);
    (source[`${scheduleMode}-${d}`]||[]).forEach(slot=>{
      const emp=staffById(slot.staffId);
      rows.push([fmt(days[d]),LONG_DAYS[d],managerScheduleView,scheduleMode,slot.role||'Server',slot.area,slot.time+(slot.oncall?' on call':'')+(slot.patio?' patio':'')+(slot.special?' special event':''),emp?emp.name:'Unassigned',emp?emp.role:'',mgr?mgr.name:'Unassigned',m.time,slot.staffId && !isAvailable(slot.staffId,d,slot)?'Not available':'']);
    });
  }
  const csv=rows.map(r=>r.map(csvEscape).join(',')).join('\n');
  const blob=new Blob([csv],{type:'text/csv;charset=utf-8;'});
  const url=URL.createObjectURL(blob);
  const a=document.createElement('a'); a.href=url; a.download=`${managerScheduleView}-${scheduleMode}-schedule-${fmt(days[0]).replace(' ','-')}.csv`; a.click(); URL.revokeObjectURL(url);
}
function renderAvailabilityForm(){
  const staffId=activeEmployeeId;
  let h=`<div class="emp-view"><div class="sub-head"><i class="ti ti-user-check"></i> My availability</div><div class="availability-note" style="margin-bottom:12px">Servers only need to mark whether they can work the 4pm or 5pm shift. On-call coverage uses the 5pm availability.</div><div class="availability-grid">`;
  for(let d=0; d<7; d++){
    const a=availability[staffId][d];
    h+=`<div class="availability-card"><div class="availability-day">${LONG_DAYS[d]}</div>
      <label class="check-row"><input type="checkbox" ${a['4pm']?'checked':''} onchange="setAvailability(${staffId},${d},'4pm',this.checked)"> 4pm shift</label>
      <label class="check-row"><input type="checkbox" ${a['5pm']?'checked':''} onchange="setAvailability(${staffId},${d},'5pm',this.checked)"> 5pm shift</label>
    </div>`;
  }
  return h+`</div></div>`;
}
function setAvailability(staffId, dayIdx, key, value){ availability[staffId][dayIdx][key]=value; }
function renderAvailabilityOverview(){
  let h=`<div class="requests-wrap"><div class="sub-head"><i class="ti ti-user-check"></i> Server availability</div><div class="availability-grid">`;
  for(let d=0; d<7; d++){
    h+=`<div class="availability-card"><div class="availability-day">${LONG_DAYS[d]}</div>`;
    SERVER_IDS.forEach(id=>{ const s=staffById(id), a=availability[id][d]; h+=`<div class="avail-mini"><strong>${s.name}</strong>: ${a['4pm']?'4pm ':''}${a['5pm']?'5pm ':''}${(!a['4pm']&&!a['5pm'])?'Unavailable':''}</div>`; });
    h+=`</div>`;
  }
  return h+`</div></div>`;
}

function findSlot(mode, day, slotIdx){
  return publishedAssignments[`${mode}-${day}`] && publishedAssignments[`${mode}-${day}`][slotIdx];
}
function shiftStartDate(dayIdx, time){
  const days=getWeekDays();
  const d=new Date(days[dayIdx]);
  const hour = time==='1pm' ? 13 : time==='3:30pm' ? 15 : time==='4pm' ? 16 : time==='5pm' ? 17 : 17;
  const minute = time==='3:30pm' ? 30 : 0;
  d.setHours(hour,minute,0,0);
  return d;
}
function canRequestChange(dayIdx, time){
  const start=shiftStartDate(dayIdx,time);
  return start.getTime() - Date.now() > 4*60*60*1000;
}
function shiftLabel(mode, day, slotIdx){
  const slot=findSlot(mode,day,slotIdx);
  if(!slot) return 'Missing shift';
  return `${LONG_DAYS[day]} ${slot.time} · ${slot.area}${slot.oncall?' · on call':''}${slot.patio?' · patio':''}${slot.special?' · special event':''} · ${mode}`;
}
function renderManagerRequests() {
  const pending = requests.filter(r=>r.status==='pending'), resolved = requests.filter(r=>r.status!=='pending');
  const pendingShift = shiftRequests.filter(r=>r.status==='pending'), resolvedShift = shiftRequests.filter(r=>r.status!=='pending');
  let h=`<div class="requests-wrap">`;
  if(!pending.length&&!resolved.length&&!pendingShift.length&&!resolvedShift.length) h+=`<div class="empty-state"><i class="ti ti-calendar-check"></i>No requests yet</div>`;
  if(pending.length){ h+=`<div class="sec-title">Pending time off</div>`+pending.map(r=>reqCard(r,true)).join(''); }
  if(pendingShift.length){ h+=`<div class="sec-title section-gap">Pending shift coverage / swaps</div>`+pendingShift.map(r=>shiftReqCard(r,true)).join(''); }
  if(resolved.length){ h+=`<div class="sec-title section-gap">Resolved time off</div>`+resolved.map(r=>reqCard(r,false)).join(''); }
  if(resolvedShift.length){ h+=`<div class="sec-title section-gap">Resolved shift coverage / swaps</div>`+resolvedShift.map(r=>shiftReqCard(r,false)).join(''); }
  return h+`</div>`;
}
function reqCard(r, actions) {
  const s=staffById(r.staffId); const badge = r.status==='approved'?'sa':r.status==='denied'?'sd':'spe'; const label = r.status==='approved'?'Approved':r.status==='denied'?'Denied':'Pending';
  return `<div class="req-card"><div class="avatar" style="background:${s.color};color:${s.text}">${s.initials}</div><div class="req-info"><div class="req-name">${r.name}</div><div class="req-detail"><i class="ti ti-calendar" style="font-size:12px;margin-right:3px"></i>${r.dates}</div><div class="req-reason">${r.reason}</div></div>${actions?`<div class="req-actions"><button class="btn-approve" onclick="resolve(${r.id},'approved')"><i class="ti ti-check"></i> Approve</button><button class="btn-deny" onclick="resolve(${r.id},'denied')"><i class="ti ti-x"></i> Deny</button></div>`:`<span class="status-badge ${badge}">${label}</span>`}</div>`;
}
function shiftReqCard(r, actions){
  const s=staffById(r.staffId), slot=findSlot(r.mode,r.day,r.slotIdx);
  const badge = r.status==='approved'?'sa':r.status==='denied'?'sd':'spe';
  const label = r.status==='approved'?'Approved':r.status==='denied'?'Denied':'Pending';
  const type = r.type==='giveup'?'Give up shift':r.type==='swap'?'Swap shift':'Claim open shift';
  const target = r.type==='swap' ? `<div class="req-reason">Swap with: ${staffById(r.targetStaffId)?.name || 'Unknown'} — ${shiftLabel(r.targetMode,r.targetDay,r.targetSlotIdx)}</div>` : '';
  const locked = slot && (r.type==='giveup' || r.type==='swap') && !canRequestChange(r.day, slot.time);
  return `<div class="req-card"><div class="avatar" style="background:${s.color};color:${s.text}">${s.initials}</div><div class="req-info"><div class="req-name">${type} — ${s.name}</div><div class="req-detail">${shiftLabel(r.mode,r.day,r.slotIdx)}</div>${target}<div class="req-meta">Submitted ${r.submitted}</div>${locked?'<div class="locked-note">Locked: less than 4 hours before shift start.</div>':''}</div>${actions?`<div class="req-actions"><button class="btn-approve" onclick="resolveShiftRequest(${r.id},'approved')"><i class="ti ti-check"></i> Approve</button><button class="btn-deny" onclick="resolveShiftRequest(${r.id},'denied')"><i class="ti ti-x"></i> Deny</button></div>`:`<span class="status-badge ${badge}">${label}</span>`}</div>`;
}
function getAvailableShifts(){
  const open=[];
  const mode = scheduleMode;
  for(let d=0; d<7; d++){
    (publishedAssignments[`${mode}-${d}`]||[]).forEach((slot,slotIdx)=>{
      if(!slot.staffId && slot.role === staffById(activeEmployeeId).role) open.push({mode,day:d,slotIdx,...slot});
    });
  }
  return open;
}
function hasPendingClaim(mode, day, slotIdx, staffId){
  return shiftRequests.some(r=>r.type==='claim' && r.status==='pending' && r.mode===mode && r.day===day && r.slotIdx===slotIdx && r.staffId===staffId);
}
function hasPendingGiveUp(mode, day, slotIdx, staffId){
  return shiftRequests.some(r=>r.type==='giveup' && r.status==='pending' && r.mode===mode && r.day===day && r.slotIdx===slotIdx && r.staffId===staffId);
}
function myPendingShiftRequests(){
  return shiftRequests.filter(r=>r.staffId===activeEmployeeId && r.status==='pending');
}
function renderAvailableShifts(days){
  const open = getAvailableShifts();
  let h=`<div class="section-gap"><div class="sub-head"><i class="ti ti-door-enter"></i> Available shifts to claim</div>`;
  if(!open.length){
    return h+`<div class="empty-state" style="padding:20px"><i class="ti ti-calendar-plus"></i>No available shifts right now. Given-up shifts and manager-added open shifts will appear here.</div></div>`;
  }
  open.forEach(v=>{
    const already=hasPendingClaim(v.mode,v.day,v.slotIdx,activeEmployeeId);
    h+=`<div class="my-shift-card"><span class="sdot" style="background:#D85A30"></span><div class="my-shift-info"><div class="day">${DAYS[v.day]}, ${fmt(days[v.day])}</div><div class="time">${v.time} · ${v.area}${v.oncall?' · on call':''}${v.patio?' · patio':''}${v.special?' · special event':''} · ${v.mode}</div><div class="req-meta">Claim requests require manager approval before being added to your schedule.</div></div><div class="shift-actions">${already?'<span class="status-badge spe">Pending</span>':`<button class="btn-save" onclick="claimShift('${v.mode}',${v.day},${v.slotIdx})"><i class="ti ti-hand-click"></i> Claim</button>`}</div></div>`;
  });
  return h+`</div>`;
}

function renderEmployeeRequests(days) {
  let h=`<div class="emp-view">`;
  h+=`<div class="req-form"><div class="req-form-title"><i class="ti ti-calendar-off"></i> Request time off</div><div class="fgroup"><label class="flabel">Dates</label><input type="text" id="emp-dates" placeholder="e.g. Jun 14 or Jun 14–16" /></div><div class="fgroup"><label class="flabel">Reason <span style="color:var(--text3)">(optional)</span></label><textarea id="emp-reason" placeholder="Briefly describe..."></textarea></div><button class="btn-save" style="width:100%;justify-content:center" onclick="submitReq()"><i class="ti ti-send"></i> Submit request</button></div>`;
  const mine = requests.filter(r=>r.staffId===activeEmployeeId);
  const myShiftReqs = shiftRequests.filter(r=>r.staffId===activeEmployeeId || r.targetStaffId===activeEmployeeId);
  if(mine.length){ h+=`<div class="section-gap"><div class="sub-head">My time-off requests</div>`; mine.forEach(r=>{ const badge=r.status==='approved'?'sa':r.status==='denied'?'sd':'spe'; const label=r.status==='approved'?'Approved':r.status==='denied'?'Denied':'Pending'; h+=`<div class="req-card"><div class="req-info"><div class="req-name">${r.dates}</div><div class="req-reason">${r.reason}</div><div style="font-size:11px;color:var(--text3);margin-top:3px">Submitted ${r.submitted}</div></div><span class="status-badge ${badge}">${label}</span></div>`; }); h+=`</div>`; }
  if(myShiftReqs.length){ h+=`<div class="section-gap"><div class="sub-head">My shift requests</div>`+myShiftReqs.map(r=>shiftReqCard(r,false)).join('')+`</div>`; }
  return h+`</div>`;
}

function renderEmployeeView(days) {
  const myShifts=[];
  const mode = scheduleMode;
  for(let d=0; d<7; d++){
    (publishedAssignments[`${mode}-${d}`]||[]).forEach((slot,slotIdx)=>{
      if(slot.staffId===activeEmployeeId) myShifts.push({day:d,mode,slotIdx,...slot});
    });
  }
  myShifts.sort((a,b)=> a.day-b.day || String(a.time).localeCompare(String(b.time)));

  const pageSize = 5;
  const totalPages = Math.max(1, Math.ceil(myShifts.length / pageSize));
  if(upcomingPage >= totalPages) upcomingPage = totalPages - 1;
  const pageStart = upcomingPage * pageSize;
  const visibleShifts = myShifts.slice(pageStart, pageStart + pageSize);

  const activeUser = staffById(activeEmployeeId);
  let h = `<div class="employee-schedule-view"><div class="emp-view compact-panel"><div class="job-type-note"><strong>${activeUser ? activeUser.name : 'Employee'}</strong> · ${activeUser ? activeUser.role : ''} schedule. Employees only see shifts for their own job type.</div></div>`;
  h += renderSchedule(days, false);

  h += `<div class="emp-view compact-panel"><div class="sub-head"><i class="ti ti-clock"></i> My upcoming shifts <span class="summary-line">Showing ${myShifts.length ? pageStart+1 : 0}-${Math.min(pageStart+pageSize,myShifts.length)} of ${myShifts.length}</span></div>`;
  if(!myShifts.length){
    h += `<div class="empty-state" style="padding:20px"><i class="ti ti-calendar"></i>No shifts scheduled this week</div>`;
  } else {
    visibleShifts.forEach(v=>{
      const locked=!canRequestChange(v.day,v.time);
      const pendingGiveUp=hasPendingGiveUp(v.mode,v.day,v.slotIdx,activeEmployeeId);
      const actions = locked
        ? ''
        : pendingGiveUp
          ? '<span class="status-badge spe">Give-up pending</span>'
          : `<button class="btn-secondary" onclick="requestGiveUp('${v.mode}',${v.day},${v.slotIdx})">Give up</button><button class="btn-secondary" onclick="openSwapModal('${v.mode}',${v.day},${v.slotIdx})">Swap</button>`;
      h += `<div class="my-shift-card"><span class="sdot" style="background:#378ADD"></span><div class="my-shift-info"><div class="day">${DAYS[v.day]}, ${fmt(days[v.day])}</div><div class="time">${v.time} · ${v.area}${v.oncall?' · on call':''}${v.patio?' · patio':''}${v.special?' · special event':''} · ${v.mode}</div>${locked?'<div class="locked-note">Changes locked within 4 hours of start time.</div>':''}${pendingGiveUp?'<div class="req-meta">Waiting for manager approval before this shift is released.</div>':''}</div><div class="shift-actions">${actions}</div></div>`;
    });
    if(totalPages > 1){
      h += `<div class="pager"><button class="btn-secondary" ${upcomingPage===0?'disabled':''} onclick="changeUpcomingPage(-1)"><i class="ti ti-chevron-left"></i> Previous</button><span class="pager-label">Page ${upcomingPage+1} of ${totalPages}</span><button class="btn-secondary" ${upcomingPage>=totalPages-1?'disabled':''} onclick="changeUpcomingPage(1)">Next <i class="ti ti-chevron-right"></i></button></div>`;
    }
  }
  h += `</div>`;

  const minePending = myPendingShiftRequests();
  if(minePending.length){
    h += `<div class="emp-view compact-panel"><div class="sub-head"><i class="ti ti-hourglass"></i> My pending shift requests</div>`;
    minePending.forEach(r=>{
      const label = r.type==='giveup' ? 'Give-up request' : r.type==='swap' ? 'Swap request' : 'Claim request';
      h += `<div class="my-shift-card"><span class="sdot" style="background:#FAC775"></span><div class="my-shift-info"><div class="day">${label}</div><div class="time">${shiftLabel(r.mode,r.day,r.slotIdx)}</div><div class="req-meta">Waiting for manager approval.</div></div><span class="status-badge spe">Pending</span></div>`;
    });
    h += `</div>`;
  }

  h += `<div class="emp-view compact-panel">${renderAvailableShifts(days).replace('<div class="section-gap">','<div>')}</div>`;

  return h + `</div>`;
}
function changeUpcomingPage(dir){ upcomingPage = Math.max(0, upcomingPage + dir); render(); }
function resolve(id,status){ requests.find(r=>r.id===id).status=status; render(); }
function resolveShiftRequest(id,status){
  const r=shiftRequests.find(r=>r.id===id); if(!r) return;
  const slot=findSlot(r.mode,r.day,r.slotIdx);
  if(status==='approved'){
    if(!slot || !canRequestChange(r.day,slot.time)){ alert('This shift is locked because it starts in less than 4 hours.'); return; }
    if(r.type==='giveup') slot.staffId=null;
    if(r.type==='swap'){
      const target=findSlot(r.targetMode,r.targetDay,r.targetSlotIdx);
      if(!target || !canRequestChange(r.targetDay,target.time)){ alert('One of these shifts is locked because it starts in less than 4 hours.'); return; }
      const temp=slot.staffId; slot.staffId=target.staffId; target.staffId=temp;
    }
    if(r.type==='claim'){
      if(!slot || slot.staffId){ alert('This shift is no longer available.'); return; }
      slot.staffId=r.staffId;
    }
  }
  r.status=status; render();
}
function todayLabel(){ return new Date().toLocaleDateString('en-US',{month:'short',day:'numeric'}); }
function requestGiveUp(mode,day,slotIdx){
  const slot=findSlot(mode,day,slotIdx);
  if(!slot){ alert('This shift could not be found.'); return; }
  if(slot.staffId !== activeEmployeeId){ alert('You can only give up shifts assigned to you.'); return; }
  if(!canRequestChange(day,slot.time)){ alert('This shift cannot be given up within 4 hours of the start time.'); return; }
  if(hasPendingGiveUp(mode,day,slotIdx,activeEmployeeId)){ alert('This give-up request is already pending manager approval.'); return; }
  shiftRequests.unshift({id:nextShiftRequestId++,type:'giveup',status:'pending',staffId:activeEmployeeId,mode,day,slotIdx,submitted:todayLabel()});
  alert('Give-up request submitted. A manager must approve it before the shift becomes available to claim.');
  render();
}
function openSwapModal(mode,day,slotIdx){
  const slot=findSlot(mode,day,slotIdx);
  if(!slot || !canRequestChange(day,slot.time)){ alert('This shift cannot be swapped within 4 hours of the start time.'); return; }
  const options=[];
  ['regular','patio','blank'].forEach(m=>{ for(let d=0;d<7;d++){ (publishedAssignments[`${m}-${d}`]||[]).forEach((other,i)=>{ if(other.staffId && other.staffId!==activeEmployeeId && canRequestChange(d,other.time)) options.push({m,d,i,other}); }); }});
  showModal(`<div class="modal-title">Request shift swap</div><div class="availability-note" style="margin-bottom:12px">Swap requests must be approved by a manager. Shifts within 4 hours of start time are not eligible.</div><div class="fgroup"><label class="flabel">Your shift</label><input type="text" value="${shiftLabel(mode,day,slotIdx)}" disabled /></div><div class="fgroup"><label class="flabel">Swap with</label><select id="swap-target">${options.map(o=>`<option value="${o.m}|${o.d}|${o.i}">${staffById(o.other.staffId).name} — ${shiftLabel(o.m,o.d,o.i)}</option>`).join('')}</select></div><div class="modal-actions"><button class="btn-cancel" onclick="closeModal()">Cancel</button><button class="btn-save" onclick="submitSwapRequest('${mode}',${day},${slotIdx})"><i class="ti ti-send"></i> Submit swap</button></div>`);
}
function submitSwapRequest(mode,day,slotIdx){
  const val=document.getElementById('swap-target').value;
  if(!val){ alert('No eligible shift is available to swap with.'); return; }
  const [targetMode,targetDay,targetSlotIdx]=val.split('|');
  const target=findSlot(targetMode,+targetDay,+targetSlotIdx);
  shiftRequests.unshift({id:nextShiftRequestId++,type:'swap',status:'pending',staffId:activeEmployeeId,mode,day,slotIdx,targetStaffId:target.staffId,targetMode,targetDay:+targetDay,targetSlotIdx:+targetSlotIdx,submitted:todayLabel()});
  closeModal(); render();
}
function claimShift(mode,day,slotIdx){
  const slot=findSlot(mode,day,slotIdx);
  if(!slot || slot.staffId){ alert('This shift is no longer available.'); return; }
  if(hasPendingClaim(mode,day,slotIdx,activeEmployeeId)){ alert('You already requested to claim this shift.'); return; }
  shiftRequests.unshift({id:nextShiftRequestId++,type:'claim',status:'pending',staffId:activeEmployeeId,mode,day,slotIdx,submitted:todayLabel()});
  render();
}
function submitReq(){ const dates=document.getElementById('emp-dates').value.trim(); const reason=document.getElementById('emp-reason').value.trim(); if(!dates){ alert('Please enter the dates.'); return; } const today=new Date(); requests.unshift({id:nextId++,staffId:activeEmployeeId,name:staffById(activeEmployeeId).name,dates,reason:reason||'No reason given',status:'pending',submitted:today.toLocaleDateString('en-US',{month:'short',day:'numeric'})}); render(); }
function showModal(content){ closeModal(); const ov=document.createElement('div'); ov.className='modal-overlay'; ov.id='modal-ov'; ov.innerHTML=`<div class="modal">${content}</div>`; ov.addEventListener('click',e=>{if(e.target===ov)closeModal();}); document.body.appendChild(ov); }
function closeModal(){ const m=document.getElementById('modal-ov'); if(m) m.remove(); }
populateLogin();
