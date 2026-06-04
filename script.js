import { supabase } from './client.js';
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
  { id:17, name:'Host 1', initials:'H1', color:'#F3E8FF', text:'#6B21A8', role:'Host' },
  { id:18, name:'Host 2', initials:'H2', color:'#F3E8FF', text:'#6B21A8', role:'Host' },
  { id:19, name:'Expo 1', initials:'E1', color:'#FFF3E0', text:'#E65100', role:'Expo' },
  { id:20, name:'Expo 2', initials:'E2', color:'#FFF3E0', text:'#E65100', role:'Expo' },
];
const SERVER_IDS = [1,2,3,4,5];
const BARTENDER_IDS = [9,10,11,12];
const BARBACK_IDS = [13];
const BUSSER_IDS = [14,15];
const FOODRUNNER_IDS = [16];
const MANAGER_IDS = [6,7,8];
const HOST_IDS = [17,18];
const EXPO_IDS = [19,20];
const EMPLOYEE_IDS = STAFF.filter(s=>s.role!=='Manager').map(s=>s.id);
const DAYS = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
const LONG_DAYS = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'];

let role = 'manager', activeTab = 'schedule', scheduleMode = 'blank-regular', upcomingPage = 0, activeEmployeeId = 1;
let currentUser = null;
let managerScheduleView = 'draft';

let managersByDay = {
  0:{staffId:6,time:'1pm'}, 1:{staffId:7,time:'4pm'}, 2:{staffId:8,time:'1pm'},
  3:{staffId:6,time:'4pm'}, 4:{staffId:7,time:'1pm'}, 5:{staffId:8,time:'4pm'}, 6:{staffId:6,time:'1pm'}
};

let preferredShifts = {
  1:3, 2:3, 3:3, 4:3, 5:3,
  9:3, 10:3, 11:3, 12:3,
  13:3, 14:3, 15:3, 16:3,
  17:3, 18:3, 19:3, 20:3
};

let lastPublishedSnapshot = null;

let requests = [
  {id:1,staffId:1,name:'Maya R.',dates:['2025-06-14','2025-06-15'],reason:'Family event',status:'pending',submitted:'May 12'},
  {id:2,staffId:3,name:'Priya S.',dates:['2025-06-20'],reason:'Doctor appointment',status:'pending',submitted:'May 14'},
  {id:3,staffId:5,name:'Nina L.',dates:['2025-06-10'],reason:'Moving day',status:'approved',submitted:'May 8'},
  {id:4,staffId:2,name:'Jordan T.',dates:['2025-06-07'],reason:'Personal',status:'denied',submitted:'May 5'},
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

let selectedWeekStart = getMonday(new Date());
let schedulesByWeek = {};

function cloneSchedule(obj){ return JSON.parse(JSON.stringify(obj)); }

function getMonday(date) {
  const d = new Date(date);
  const day = d.getDay();
  d.setDate(d.getDate() - (day === 0 ? 6 : day - 1));
  d.setHours(0,0,0,0);
  return d;
}

function selectedWeekRangeLabel(){
  const days = getWeekDays();
  return `${fmt(days[0])} – ${fmt(days[6])}`;
}

function nextWeekRangeLabel(){
  const mon = getMonday(new Date());
  mon.setDate(mon.getDate() + 7);
  const sun = new Date(mon);
  sun.setDate(mon.getDate() + 6);
  return `${fmt(mon)} – ${fmt(sun)}`;
}

function isSameWeekKey(type){
  const selected = weekKey(selectedWeekStart);
  if(type === 'current') return selected === getCurrentWeekKey();
  if(type === 'next') return selected === getNextWeekKey();
  return false;
}

function weekKey(date) {
  return getMonday(date).toISOString().slice(0,10);
}

function getCurrentWeekKey() {
  return weekKey(new Date());
}

function getNextWeekKey() {
  const d = getMonday(new Date());
  d.setDate(d.getDate() + 7);
  return weekKey(d);
}

function currentWeekRangeLabel(){
  const mon = getMonday(new Date());
  const sun = new Date(mon);
  sun.setDate(mon.getDate() + 6);
  return `${fmt(mon)} – ${fmt(sun)}`;
}

function ensureSchedule(key) {
  if (!schedulesByWeek[key]) {
    schedulesByWeek[key] = {
      draftAssignments: buildInitialAssignments(),
      draftManagers: cloneSchedule(managersByDay),
      publishedAssignments: null,
      publishedManagers: null,
      publishedAt: null
    };
  }
  return schedulesByWeek[key];
}

function getStaffIdsForRole(roleName){
  if(roleName==='Server') return SERVER_IDS;
  if(roleName==='Bartender') return BARTENDER_IDS;
  if(roleName==='Barback') return BARBACK_IDS;
  if(roleName==='Busser') return BUSSER_IDS;
  if(roleName==='FoodRunner') return FOODRUNNER_IDS;
  if(roleName==='Host') return HOST_IDS;
  if(roleName==='Expo') return EXPO_IDS;
  return EMPLOYEE_IDS;
}

function buildInitialAssignments(){
  const a = {};
  ['regular','patio','blank-regular','blank-patio'].forEach(mode=>{
    const baseMode = mode === 'blank-regular' ? 'regular' : mode === 'blank-patio' ? 'patio' : mode;
    getSlotsForWeek(baseMode).forEach((slots, day)=>{
      a[`${mode}-${day}`] = slots.map((slot)=>({...slot, staffId: null}));
    });
  });
  return a;
}

function getWeekDays() {
  const mon = new Date(selectedWeekStart);
  return Array.from({length:7},(_,i)=>{
    const d = new Date(mon);
    d.setDate(mon.getDate()+i);
    return d;
  });
}

function selectWeek(type) {
  if (type === 'current') selectedWeekStart = getMonday(new Date());
  if (type === 'next') {
    selectedWeekStart = getMonday(new Date());
    selectedWeekStart.setDate(selectedWeekStart.getDate() + 7);
  }
  render();
}

function pickWeekDate(value) {
  if (!value) return;
  selectedWeekStart = getMonday(new Date(value + 'T00:00:00'));
  render();
}

function isToday(d) { const t=new Date(); return d.getDate()===t.getDate()&&d.getMonth()===t.getMonth()&&d.getFullYear()===t.getFullYear(); }
function fmt(d) { return d.toLocaleDateString('en-US',{month:'short',day:'numeric'}); }
function pendingCount() { return requests.filter(r=>r.status==='pending').length + shiftRequests.filter(r=>r.status==='pending').length; }
function staffById(id){ return STAFF.find(s=>s.id===id); }

window.login = async function() {
  const email = document.getElementById('login-email').value.trim();
  const password = document.getElementById('login-password').value;
  const errEl = document.getElementById('login-error');
  errEl.style.display = 'none';

  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if(error){
    errEl.textContent = error.message;
    errEl.style.display = 'block';
    return;
  }

  const { data: staffRow } = await supabase
    .from('staff')
    .select('*')
    .eq('id', data.user.id)
    .single();

  if(!staffRow){
    errEl.textContent = 'No staff profile found. Contact your manager.';
    errEl.style.display = 'block';
    await supabase.auth.signOut();
    return;
  }

  currentUser = staffRow;
  activeEmployeeId = staffRow.id;
  role = staffRow.role === 'Manager' ? 'manager' : 'employee';
  activeTab = 'schedule';
  upcomingPage = 0;
  document.getElementById('login-screen').style.display = 'none';
  document.getElementById('app').style.display = 'flex';
  render();
}

window.logout = async function() {
  await supabase.auth.signOut();
  document.getElementById('app').style.display = 'none';
  document.getElementById('login-screen').style.display = 'flex';
}

function renderUserChip(){
  const chip = document.getElementById('user-chip');
  if(!chip) return;
  const name = currentUser ? currentUser.name : 'User';
  const userRole = currentUser ? currentUser.role : '';
  chip.innerHTML = `<div><strong>${name}</strong><span>${role==='manager'?'Manager view':userRole+' view'}</span></div><button class="btn-secondary" onclick="logout()"><i class="ti ti-logout"></i> Log out</button>`;
}


function changeWeek(dir){
  selectedWeekStart.setDate(selectedWeekStart.getDate() + (dir * 7));
  render();
}

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
function setManagerScheduleView(v){ managerScheduleView=v; render(); }

function getSlotsForWeek(mode){ return Array.from({length:7},(_,day)=>getSlotsForDay(mode, day)); }

function serverSlotsForDay(mode, day){
  if(mode==='regular'){
    if(day===4 || day===5) return [
      {role:'Server', area:'Server', time:'4pm'}, {role:'Server', area:'Server', time:'4pm'},
      {role:'Server', area:'Server', time:'5pm'}, {role:'Server', area:'Server', time:'5pm'},
      {role:'Server', area:'On call', time:'5pm', oncall:true}
    ];
    return [
      {role:'Server', area:'Server', time:'4pm'},
      {role:'Server', area:'Server', time:'5pm'},
      {role:'Server', area:'On call', time:'5pm', oncall:true}
    ];
  }
  if(mode==='patio'){
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
  }
  return [];
}

function bartenderSlotsForDay(mode, day){
  if(mode === 'patio'){
    if(day===4 || day===5) return [
      {role:'Bartender', area:'Inside bar', time:'3:30pm'},
      {role:'Bartender', area:'Inside bar', time:'5pm'},
      {role:'Bartender', area:'Patio bar', time:'3:30pm', patio:true},
      {role:'Bartender', area:'Patio bar', time:'5pm', patio:true}
    ];
    return [
      {role:'Bartender', area:'Inside bar', time:'3:30pm'},
      {role:'Bartender', area:'Patio bar', time:'3:30pm', patio:true},
      {role:'Bartender', area:'Float', time:'5pm'}
    ];
  }
  // regular — inside bar only
  if(day===4 || day===5) return [
    {role:'Bartender', area:'Inside bar', time:'3:30pm'},
    {role:'Bartender', area:'Inside bar', time:'5pm'},
  ];
  return [
    {role:'Bartender', area:'Inside bar', time:'3:30pm'},
  ];
}

function hostSlotsForDay(){
  return [
    {role:'Host', area:'Host', time:'4pm'},
    {role:'Host', area:'Host', time:'4pm'},
  ];
}

function supportSlotsForDay(day){
  const slots = [
    {role:'FoodRunner', area:'Food runner', time:'4pm'},
    {role:'Expo', area:'Expo', time:'4pm'},
  ];
  if(day===4 || day===5){
    slots.push({role:'Barback', area:'Barback', time:'4pm'});
    slots.push({role:'Busser', area:'Downstairs busser', time:'3:30pm'});
    slots.push({role:'Busser', area:'Patio busser', time:'3:30pm', patio:true});
    slots.push({role:'Busser', area:'Float busser', time:'5pm'});
  } else {
    slots.push({role:'Busser', area:'Busser', time:'3:30pm'});
    slots.push({role:'Busser', area:'Float busser', time:'5pm'});
  }
  return slots;
}

function getSlotsForDay(mode, day){
  if(mode==='blank') return [];
  if(mode==='blank-regular'){
    return [
      ...hostSlotsForDay(),
      ...serverSlotsForDay('regular', day),
      ...bartenderSlotsForDay('regular', day),
      ...supportSlotsForDay(day)
    ].map(slot => ({...slot, staffId: null}));
  }
  if(mode==='blank-patio'){
    return [
      ...hostSlotsForDay(),
      ...serverSlotsForDay('patio', day),
      ...bartenderSlotsForDay('patio', day),
      ...supportSlotsForDay(day)
    ].map(slot => ({...slot, staffId: null}));
  }
  return [
    ...hostSlotsForDay(),
    ...serverSlotsForDay(mode, day),
    ...bartenderSlotsForDay(mode, day),
    ...supportSlotsForDay(day)
  ];
}

function visibleSlotsForRole(slots, viewerRole){
  if(role==='manager' || !viewerRole) return slots;
  return slots.filter(slot => slot.role === viewerRole);
}

function render() {
  const days = getWeekDays();
  document.getElementById('todayLabelTop').textContent =
    'Today: ' + new Date().toLocaleDateString('en-US', {weekday:'long',month:'short',day:'numeric'});
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
    <div class="tab ${activeTab==='availability'?'active':''}" onclick="setTab('availability')"><i class="ti ti-user-check"></i> Availability</div>
    <div class="tab ${activeTab==='requests'?'active':''}" onclick="setTab('requests')"><i class="ti ti-calendar-off"></i> Requests ${pc?`<span class="badge">${pc}</span>`:''}</div>` : `
    <div class="tab ${activeTab==='schedule'?'active':''}" onclick="setTab('schedule')"><i class="ti ti-layout-grid"></i> My schedule</div>
    <div class="tab ${activeTab==='availability'?'active':''}" onclick="setTab('availability')"><i class="ti ti-user-check"></i> Availability</div>
    <div class="tab ${activeTab==='requests'?'active':''}" onclick="setTab('requests')"><i class="ti ti-calendar-off"></i> Requests</div>`;

  const tc = document.getElementById('tab-content');
  if (activeTab==='schedule') tc.innerHTML = isMgr ? renderManagerScheduleView(days) : renderEmployeeView(days);
  else if (activeTab==='availability') tc.innerHTML = isMgr ? renderAvailabilityOverview() : renderAvailabilityForm();
  else if (isMgr) tc.innerHTML = renderManagerRequests();
  else tc.innerHTML = renderEmployeeRequests(days);
}

function renderManagerScheduleView(days){
  return renderSchedule(days, true, managerScheduleView);
}

function renderModeToggle(view){
  const key = weekKey(selectedWeekStart);
  const week = ensureSchedule(key);
  const isPublished = !!week.publishedAssignments;

  return `<div class="schedule-status">
    <div>
      <div class="status-title">
        <i class="ti ${isPublished?'ti-check':'ti-pencil'}"></i>
        ${selectedWeekRangeLabel()}
        <span class="${isPublished?'status-badge-published':'status-badge-draft'}">
          ${isPublished?'Published':'Draft'}
        </span>
      </div>
      <div class="status-copy">
        ${isPublished ? 'This week has been published. Staff can see it.' : 'This week is still unpublished. Staff cannot see it yet.'}
      </div>
    </div>
    <div class="template-group">
      <button class="pill-btn ${isSameWeekKey('current') ? 'active' : ''}" onclick="selectWeek('current')">
        Current schedule (${currentWeekRangeLabel()})
      </button>
      <button class="pill-btn ${isSameWeekKey('next') ? 'active' : ''}" onclick="selectWeek('next')">
        Next week (${nextWeekRangeLabel()})
      </button>
      <div class="picked-week-label">Selected week: ${selectedWeekRangeLabel()}</div>
      <input type="date" onchange="pickWeekDate(this.value)">
    </div>
  </div>
  <div class="template-bar">
    <div class="template-group">
      <span class="template-label">Schedule type</span>
      <button class="pill-btn ${scheduleMode==='blank-regular'?'active':''}" onclick="setMode('blank-regular')">Blank regular</button>
      <button class="pill-btn ${scheduleMode==='blank-patio'?'active':''}" onclick="setMode('blank-patio')">Blank patio</button>
      <button class="pill-btn" onclick="loadPreviousSchedule()"><i class="ti ti-history"></i> Previous schedule</button>
    </div>
    <div class="manager-tools">
      <button class="btn-save" onclick="autoGenerateSchedule()"><i class="ti ti-wand"></i> Auto-generate draft</button>
      <button class="btn-save" onclick="publishSchedule()"><i class="ti ti-upload"></i> Publish this week</button>
      <button class="btn-secondary" onclick="exportCSV()"><i class="ti ti-download"></i> Export schedule</button>
    </div>
  </div>`;
}

function renderSchedule(days, isMgr, view='published') {
  const keyPrefix = scheduleMode;
  const editable = isMgr && view === 'draft';
  const key = weekKey(selectedWeekStart);
  const week = ensureSchedule(key);
  const source = editable ? week.draftAssignments : (week.publishedAssignments || {});
  const managerSource = editable ? week.draftManagers : (week.publishedManagers || {});
  const supportRoles = ['Busser','Barback','FoodRunner','Expo'];

  let h = `<div class="schedule-wrap">${isMgr?renderModeToggle(view):''}`;
  h += `<div class="day-headers"><div></div>` + days.map((d,i)=>`<div class="day-header${isToday(d)?' today':''}">${DAYS[i]}<span class="num">${d.getDate()}</span></div>`).join('')+`</div>`;
  h += `<div class="manager-strip"><div class="manager-label">Manager on duty</div>` + days.map((d,i)=>{
    const m = managerSource[i] || { staffId: null, time: '' };
    const s = staffById(m.staffId);
    return `<div class="manager-cell" ${editable?`onclick="editManager(${i})" title="Click to edit manager"`:''}> 
      <div class="manager-name">${s?s.name:'Unassigned'}</div><div class="manager-time">${m.time ? m.time + ' start' : ''}</div></div>`;
  }).join('') + `</div>`;

  h += `<div class="slot-grid">`;

  for(let d=0; d<7; d++){
    const viewer = staffById(activeEmployeeId);
    const rawSlots = visibleSlotsForRole(source[`${keyPrefix}-${d}`] || [], viewer && viewer.role);
    const slots = editable ? rawSlots : rawSlots.filter(slot => !!slot.staffId);
    const days2 = getWeekDays();

    h += `<div class="template-day-card"><div class="template-day-title"><span>${LONG_DAYS[d]}</span><span class="template-day-date">${fmt(days[d])}</span></div>`;

    if(!slots.length && !editable){
      h += `<div class="empty-day-note">No assigned shifts</div>`;
    } else {
      const byRole = {};
      slots.forEach((slot, i) => {
        const r = slot.role || 'Server';
        if(!byRole[r]) byRole[r] = [];
        byRole[r].push({slot, i});
      });

    const sections = [
      { label: 'Hosts', roles: ['Host'] },
      { label: 'Servers', roles: ['Server'] },
      { label: 'Bar', roles: ['Bartender'] },
      { label: 'Support Staff', roles: ['Busser','Barback','FoodRunner','Expo'] },
    ];

      sections.forEach(section => {
        const sectionSlots = section.roles.flatMap(r => byRole[r] || []);
        if(!sectionSlots.length) return;

        h += `<div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.05em;color:var(--text3);padding:8px 0 4px;border-top:1px solid var(--border);margin-top:6px">${section.label}</div>`;

        sectionSlots.forEach(({slot, i}) => {
          const s = staffById(slot.staffId);
          const cls = slot.special?'special':slot.oncall?'oncall':slot.patio?'patio':'filled';
          const ok = !slot.staffId || isAvailable(slot.staffId, d, slot);

          // check time-off conflict
          const hasConflict = s && requests.some(r =>
            r.staffId === slot.staffId &&
            r.status === 'approved' &&
            Array.isArray(r.dates) &&
            r.dates.some(rd => new Date(rd+'T00:00:00').toDateString() === days[d].toDateString())
          );

          const areaLabel = supportRoles.includes(slot.role) ? ` - ${slot.area}` : '';
          const timeStr = slot.time
            + (slot.oncall ? ' - on call' : '')
            + (slot.patio ? ' - patio' : '')
            + (slot.special ? ' - special event' : '')
            + areaLabel;

          h += `<div class="slot ${cls}" ${editable?`onclick="editSlot('${keyPrefix}',${d},${i})" title="Click to assign"`:''}> 
            <div class="slot-area">${slot.area} <span class="role-chip">${slot.role||'Server'}</span></div>
            <div class="slot-main">${s?s.name:'Unassigned'}${s?` <span class="role-chip">${s.role}</span>`:''}</div>
            <div class="slot-time">${timeStr}</div>
            ${!ok?'<div class="warning-text">Not available</div>':''}
            ${hasConflict?'<div class="warning-text">⚠️ Approved time off this day</div>':''}
          </div>`;
        });
      });
    }

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

function editManager(dayIdx){
  const week = ensureSchedule(weekKey(selectedWeekStart));
  const m = week.draftManagers[dayIdx] || {staffId:6, time:'1pm'};
  showModal(`<div class="modal-title">Manager on duty — ${LONG_DAYS[dayIdx]}</div>
    <div class="fgroup"><label class="flabel">Manager</label><select id="m-manager">${MANAGER_IDS.map(id=>{const s=staffById(id); return `<option value="${id}"${id===m.staffId?' selected':''}>${s.name}</option>`}).join('')}</select></div>
    <div class="fgroup"><label class="flabel">Start time</label><select id="m-time"><option${m.time==='1pm'?' selected':''}>1pm</option><option${m.time==='4pm'?' selected':''}>4pm</option></select></div>
    <div class="modal-actions"><button class="btn-cancel" onclick="closeModal()">Cancel</button><button class="btn-save" onclick="saveManager(${dayIdx})"><i class="ti ti-check"></i> Save</button></div>`);
}

function saveManager(dayIdx){
  const week = ensureSchedule(weekKey(selectedWeekStart));
  week.draftManagers[dayIdx] = {
    staffId: +document.getElementById('m-manager').value,
    time: document.getElementById('m-time').value
  };
  closeModal();
  render();
}

function slotTag(slot){
  if(slot.special) return 'special';
  if(slot.oncall) return 'oncall';
  if(slot.patio) return 'patio';
  return 'none';
}

function editSlot(prefix, dayIdx, slotIdx){
  const week = ensureSchedule(weekKey(selectedWeekStart));
  const slot = week.draftAssignments[`${prefix}-${dayIdx}`][slotIdx];
  showSlotModal(prefix, dayIdx, slotIdx, slot, false);
}

function addSlot(prefix, dayIdx){
  const week = ensureSchedule(weekKey(selectedWeekStart));
  if(!week.draftAssignments[`${prefix}-${dayIdx}`]) {
    week.draftAssignments[`${prefix}-${dayIdx}`] = [];
  }
  showSlotModal(prefix, dayIdx, null, {area:'Server', time:'4pm', staffId:null}, true);
}

function showSlotModal(prefix, dayIdx, slotIdx, slot, isNew){
  showModal(`<div class="modal-title">${isNew?'Add':'Edit'} shift — ${LONG_DAYS[dayIdx]}</div>
    <div class="fgroup"><label class="flabel">Employee</label><select id="m-server"><option value="">Unassigned</option>${getStaffIdsForRole(slot.role || 'Server').map(id=>{const s=staffById(id); const ok=isAvailable(id,dayIdx,slot); return `<option value="${id}"${id===slot.staffId?' selected':''}>${s.name} — ${s.role}${ok?'':' (not available)'}</option>`}).join('')}</select></div>
    <div class="fgroup"><label class="flabel">Shift time</label><select id="m-shift-time"><option${slot.time==='3:30pm'?' selected':''}>3:30pm</option><option${slot.time==='4pm'?' selected':''}>4pm</option><option${slot.time==='5pm'?' selected':''}>5pm</option><option${slot.time==='1pm'?' selected':''}>1pm</option></select></div>
    <div class="fgroup"><label class="flabel">Job type</label><select id="m-job-role">
      <option${(slot.role||'Server')==='Server'?' selected':''}>Server</option>
      <option${slot.role==='Host'?' selected':''}>Host</option>
      <option${slot.role==='Bartender'?' selected':''}>Bartender</option>
      <option${slot.role==='Barback'?' selected':''}>Barback</option>
      <option${slot.role==='Busser'?' selected':''}>Busser</option>
      <option${slot.role==='FoodRunner'?' selected':''}>FoodRunner</option>
      <option${slot.role==='Expo'?' selected':''}>Expo</option>
    </select></div>
    <div class="fgroup"><label class="flabel">Area / label</label><input type="text" id="m-area" value="${slot.area || 'Server'}" placeholder="Server, Downstairs, Upstairs, Patio, Float..." /></div>
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

function saveNewSlot(prefix, dayIdx){
  const week = ensureSchedule(weekKey(selectedWeekStart));
  week.draftAssignments[`${prefix}-${dayIdx}`].push(readSlotForm());
  closeModal();
  render();
}

function updateSlotDetails(prefix, dayIdx, slotIdx){
  const week = ensureSchedule(weekKey(selectedWeekStart));
  week.draftAssignments[`${prefix}-${dayIdx}`][slotIdx] = readSlotForm();
  closeModal();
  render();
}

function removeSlot(prefix, dayIdx, slotIdx){
  const week = ensureSchedule(weekKey(selectedWeekStart));
  week.draftAssignments[`${prefix}-${dayIdx}`].splice(slotIdx,1);
  closeModal();
  render();
}

function isAvailable(staffId, dayIdx, slot){
  const a = availability[staffId] && availability[staffId][dayIdx];
  if(!a) return true; // non-server roles default to available
  if(slot.oncall) return !!a['5pm'];
  if(a[slot.time] !== undefined) return !!a[slot.time];
  if(slot.time==='3:30pm') return true;
  return true;
}

function autoGenerateSchedule(){
  const keyPrefix = scheduleMode;
  const week = ensureSchedule(weekKey(selectedWeekStart));
  const shiftCounts = Object.fromEntries(EMPLOYEE_IDS.map(id=>[id,0]));
  const days = getWeekDays();

  for(let d=0; d<7; d++){
    const usedToday = new Set();
    const slots = getSlotsForDay(keyPrefix,d).map(slot=>({...slot, staffId:null}));

    slots.forEach(slot=>{
      const roleIds = getStaffIdsForRole(slot.role || 'Server');

      // check time-off for this day
      const isOffToday = (id) => requests.some(r =>
        r.staffId === id &&
        r.status === 'approved' &&
        Array.isArray(r.dates) &&
        r.dates.some(rd => new Date(rd+'T00:00:00').toDateString() === days[d].toDateString())
      );

      // first pass — under preferred count, not off, available
      let candidates = roleIds
        .filter(id => !usedToday.has(id) && isAvailable(id,d,slot) && !isOffToday(id) && shiftCounts[id] < (preferredShifts[id] || 3))
        .sort((a,b) => {
          const diff = shiftCounts[a] - shiftCounts[b];
          return diff !== 0 ? diff : Math.random() - 0.5;
        });

      // second pass — anyone available and not off
      if(!candidates.length){
        candidates = roleIds
          .filter(id => !usedToday.has(id) && isAvailable(id,d,slot) && !isOffToday(id))
          .sort((a,b) => {
            const diff = shiftCounts[a] - shiftCounts[b];
            return diff !== 0 ? diff : Math.random() - 0.5;
          });
      }

      // third pass — anyone available (ignoring time off, slot must be filled)
      if(!candidates.length){
        candidates = roleIds
          .filter(id => !usedToday.has(id) && isAvailable(id,d,slot))
          .sort((a,b) => {
            const diff = shiftCounts[a] - shiftCounts[b];
            return diff !== 0 ? diff : Math.random() - 0.5;
          });
      }

      if(candidates.length){
        slot.staffId = candidates[0];
        usedToday.add(candidates[0]);
        shiftCounts[candidates[0]]++;
      }
    });

    week.draftAssignments[`${keyPrefix}-${d}`] = slots;
  }

  render();
}

function publishSchedule(){
  const key = weekKey(selectedWeekStart);
  const week = ensureSchedule(key);
  const days = getWeekDays();

  // check conflicts
  const conflicts = [];
  for(let d=0; d<7; d++){
    (week.draftAssignments[`${scheduleMode}-${d}`] || []).forEach(slot => {
      if(!slot.staffId) return;
      const emp = staffById(slot.staffId);
      const hasConflict = requests.some(r =>
        r.staffId === slot.staffId &&
        r.status === 'approved' &&
        Array.isArray(r.dates) &&
        r.dates.some(rd => new Date(rd+'T00:00:00').toDateString() === days[d].toDateString())
      );
      if(hasConflict) conflicts.push(`${emp.name} — ${LONG_DAYS[d]}`);
    });
  }

  if(conflicts.length){
    showModal(`<div class="modal-title">⚠️ Time-off conflicts</div>
      <div class="availability-note" style="margin-bottom:12px">The following staff are scheduled but have approved time off:</div>
      ${[...new Set(conflicts)].map(c=>`<div class="req-meta" style="margin-bottom:6px">• ${c}</div>`).join('')}
      <div class="modal-actions">
        <button class="btn-cancel" onclick="closeModal()">Go back and fix</button>
        <button class="btn-save" onclick="confirmPublish()"><i class="ti ti-upload"></i> Publish anyway</button>
      </div>`);
    return;
  }

  confirmPublish();
}

function confirmPublish(){
  const key = weekKey(selectedWeekStart);
  const week = ensureSchedule(key);

  week.publishedAssignments = cloneSchedule(week.draftAssignments);
  week.publishedManagers = cloneSchedule(week.draftManagers);
  week.publishedAt = new Date().toLocaleString('en-US',{month:'short',day:'numeric',hour:'numeric',minute:'2-digit'});

  lastPublishedSnapshot = {
    assignments: cloneSchedule(week.draftAssignments),
    managers: cloneSchedule(week.draftManagers)
  };

  closeModal();
  render();
}

function loadPreviousSchedule(){
  if(!lastPublishedSnapshot){
    alert('No previously published schedule found.');
    return;
  }
  const key = weekKey(selectedWeekStart);
  const week = ensureSchedule(key);
  week.draftAssignments = cloneSchedule(lastPublishedSnapshot.assignments);
  week.draftManagers = cloneSchedule(lastPublishedSnapshot.managers);
  render();
}

function csvEscape(v){ return `"${String(v ?? '').replaceAll('"','""')}"`; }

function exportCSV(){
  const days = getWeekDays();
  const key = weekKey(selectedWeekStart);
  const week = ensureSchedule(key);

  const source = week.publishedAssignments || week.draftAssignments;
  const managerSource = week.publishedManagers || week.draftManagers;

  const groups = {
    'Hosts': {},
    'Servers': {},
    'Bar': {},
    'Support Staff': {}
  };

  const groupForRole = (role) => {
    if(role === 'Host') return 'Hosts';
    if(role === 'Server') return 'Servers';
    if(role === 'Bartender') return 'Bar';
    return 'Support Staff';
  };

  for(let d = 0; d < 7; d++){
    const slots = source[`${scheduleMode}-${d}`] || [];
    slots.forEach(slot => {
      if(!slot.staffId) return;
      const emp = staffById(slot.staffId);
      if(!emp) return;
      const group = groupForRole(slot.role || 'Server');
      if(!groups[group][emp.name]) groups[group][emp.name] = Array(7).fill('');
      const existing = groups[group][emp.name][d];
      const isSupportRole = ['Busser','Barback','FoodRunner','Expo'].includes(slot.role);
      const roleLabel = isSupportRole ? ` - ${slot.role}` : '';

      // flag time-off conflicts
      const hasConflict = requests.some(r =>
        r.staffId === slot.staffId &&
        r.status === 'approved' &&
        Array.isArray(r.dates) &&
        r.dates.some(rd => new Date(rd+'T00:00:00').toDateString() === days[d].toDateString())
      );

      const label = slot.time
        + (slot.oncall ? ' - on call' : '')
        + (slot.patio ? ' - patio' : '')
        + roleLabel
        + (hasConflict ? ' ⚠️ time off' : '');

      groups[group][emp.name][d] = existing ? existing + ' / ' + label : label;
    });
  }

  const headerRow = ['', ...days.map((d, i) => `${DAYS[i]} ${fmt(d)}`)];
  const managerRow = ['Manager', ...days.map((d, i) => {
    const m = managerSource[i];
    const s = m ? staffById(m.staffId) : null;
    return s ? `${s.name} (${m.time})` : 'Unassigned';
  })];

  const rows = [headerRow, managerRow, Array(8).fill('')];

  Object.entries(groups).forEach(([groupName, staffMap]) => {
    if(Object.keys(staffMap).length === 0) return;
    rows.push([groupName, ...Array(7).fill('')]);
    Object.entries(staffMap).sort(([a],[b]) => a.localeCompare(b)).forEach(([name, shifts]) => {
      rows.push([name, ...shifts]);
    });
    rows.push(Array(8).fill(''));
  });

  const csv = rows.map(r => r.map(csvEscape).join(',')).join('\n');
  const blob = new Blob([csv], {type:'text/csv;charset=utf-8;'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `Weekly Schedule ${fmt(days[0])} - ${fmt(days[6])}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

function renderAvailabilityForm(){
  const staffId = activeEmployeeId;
  const hasAvail = !!availability[staffId];
  let h = `<div class="emp-view">
    <div class="sub-head"><i class="ti ti-user-check"></i> My availability</div>
    <div class="availability-note" style="margin-bottom:12px">Mark which shifts you can work each day.</div>
    <div class="fgroup" style="margin-bottom:16px">
      <label class="flabel">Preferred shifts per week</label>
      <input type="number" min="0" max="7" value="${preferredShifts[staffId] || 3}"
        onchange="setPreferredShifts(${staffId}, +this.value)"
        style="width:80px;padding:6px 10px;border-radius:8px;border:1px solid var(--border);font-size:14px">
    </div>
    <div class="availability-grid">`;

  for(let d=0; d<7; d++){
    const a = hasAvail ? availability[staffId][d] : {'4pm':true,'5pm':true};
    h+=`<div class="availability-card"><div class="availability-day">${LONG_DAYS[d]}</div>
      <label class="check-row"><input type="checkbox" ${a['4pm']?'checked':''} onchange="setAvailability(${staffId},${d},'4pm',this.checked)"> 4pm shift</label>
      <label class="check-row"><input type="checkbox" ${a['5pm']?'checked':''} onchange="setAvailability(${staffId},${d},'5pm',this.checked)"> 5pm shift</label>
    </div>`;
  }
  return h+`</div></div>`;
}

function setAvailability(staffId, dayIdx, key, value){
  if(!availability[staffId]) availability[staffId] = {};
  if(!availability[staffId][dayIdx]) availability[staffId][dayIdx] = {'4pm':true,'5pm':true};
  availability[staffId][dayIdx][key]=value;
}

function setPreferredShifts(staffId, value){
  preferredShifts[staffId] = value;
}

function renderAvailabilityOverview(){
  let h=`<div class="requests-wrap"><div class="sub-head"><i class="ti ti-user-check"></i> Staff availability</div>`;

  const sections = [
  { label: 'Hosts', ids: HOST_IDS },
  { label: 'Servers', ids: SERVER_IDS },
  { label: 'Bartenders', ids: BARTENDER_IDS },
  { label: 'Support Staff', ids: [...BARBACK_IDS, ...BUSSER_IDS, ...FOODRUNNER_IDS, ...EXPO_IDS] },
];

  sections.forEach(section => {
    if(!section.ids.length) return;
    h += `<div class="sec-title" style="margin-top:16px">${section.label}</div>`;
    h += `<div class="availability-grid">`;
    for(let d=0; d<7; d++){
      h += `<div class="availability-card"><div class="availability-day">${LONG_DAYS[d]}</div>`;
      section.ids.forEach(id => {
        const s = staffById(id);
        const a = availability[id] && availability[id][d];
        if(!s) return;
        if(a){
          h += `<div class="avail-mini"><strong>${s.name}</strong>: ${a['4pm']?'4pm ':''}${a['5pm']?'5pm ':''}${(!a['4pm']&&!a['5pm'])?'Unavailable':''}</div>`;
        } else {
          h += `<div class="avail-mini"><strong>${s.name}</strong>: —</div>`;
        }
      });
      h += `</div>`;
    }
    h += `</div>`;
  });

  return h + `</div>`;
}

function findSlot(mode, day, slotIdx){
  const week = ensureSchedule(weekKey(selectedWeekStart));
  return week.publishedAssignments?.[`${mode}-${day}`]?.[slotIdx];
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
  const s=staffById(r.staffId);
  const badge = r.status==='approved'?'sa':r.status==='denied'?'sd':'spe';
  const label = r.status==='approved'?'Approved':r.status==='denied'?'Denied':'Pending';
  const dateLabel = Array.isArray(r.dates)
    ? r.dates[0] + (r.dates.length > 1 ? ` – ${r.dates[r.dates.length-1]}` : '')
    : r.dates;
  return `<div class="req-card">
    <div class="avatar" style="background:${s.color};color:${s.text}">${s.initials}</div>
    <div class="req-info">
      <div class="req-name">${r.name}</div>
      <div class="req-detail"><i class="ti ti-calendar" style="font-size:12px;margin-right:3px"></i>${dateLabel}</div>
      <div class="req-reason">${r.reason}</div>
    </div>
    ${actions
      ? `<div class="req-actions">
          <button class="btn-approve" onclick="resolve(${r.id},'approved')"><i class="ti ti-check"></i> Approve</button>
          <button class="btn-deny" onclick="resolve(${r.id},'denied')"><i class="ti ti-x"></i> Deny</button>
        </div>`
      : `<span class="status-badge ${badge}">${label}</span>`
    }
  </div>`;
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
  const open = [];
  const mode = scheduleMode;
  const week = ensureSchedule(weekKey(selectedWeekStart));
  const published = week.publishedAssignments || {};

  for(let d=0; d<7; d++){
    (published[`${mode}-${d}`] || []).forEach((slot, slotIdx)=>{
      const isGivenUp = shiftRequests.some(r =>
        r.type === 'giveup' && r.status === 'pending' &&
        r.mode === mode && r.day === d && r.slotIdx === slotIdx
      );
      if(
        (!slot.staffId || isGivenUp) &&
        slot.staffId !== activeEmployeeId &&
        slot.role === staffById(activeEmployeeId)?.role
      ){
        open.push({mode, day:d, slotIdx, ...slot, isGivenUp});
      }
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
    return h+`<div class="empty-state" style="padding:20px"><i class="ti ti-calendar-plus"></i>No available shifts right now.</div></div>`;
  }
  open.forEach(v=>{
    const already=hasPendingClaim(v.mode,v.day,v.slotIdx,activeEmployeeId);
    h+=`<div class="my-shift-card"><span class="sdot" style="background:#D85A30"></span><div class="my-shift-info"><div class="day">${DAYS[v.day]}, ${fmt(days[v.day])}</div><div class="time">${v.time} · ${v.area}${v.oncall?' · on call':''}${v.patio?' · patio':''}${v.special?' · special event':''} · ${v.mode}</div><div class="req-meta">Claim requests require manager approval before being added to your schedule.</div></div><div class="shift-actions">${already?'<span class="status-badge spe">Pending</span>':`<button class="btn-save" onclick="claimShift('${v.mode}',${v.day},${v.slotIdx})"><i class="ti ti-hand-click"></i> Claim</button>`}</div></div>`;
  });
  return h+`</div>`;
}

function renderEmployeeRequests(days) {
  let h=`<div class="emp-view">`;
  h+=`<div class="req-form">
    <div class="req-form-title"><i class="ti ti-calendar-off"></i> Request time off</div>
    <div class="fgroup">
      <label class="flabel">Start date</label>
      <input type="date" id="emp-date-start" />
    </div>
    <div class="fgroup">
      <label class="flabel">End date <span style="color:var(--text3)">(leave blank for single day)</span></label>
      <input type="date" id="emp-date-end" />
    </div>
    <div class="fgroup">
      <label class="flabel">Reason <span style="color:var(--text3)">(optional)</span></label>
      <textarea id="emp-reason" placeholder="Briefly describe..."></textarea>
    </div>
    <button class="btn-save" style="width:100%;justify-content:center" onclick="submitReq()">
      <i class="ti ti-send"></i> Submit request
    </button>
  </div>`;

  const mine = requests.filter(r=>r.staffId===activeEmployeeId);
  const myShiftReqs = shiftRequests.filter(r=>r.staffId===activeEmployeeId || r.targetStaffId===activeEmployeeId);

  if(mine.length){
    h+=`<div class="section-gap"><div class="sub-head">My time-off requests</div>`;
    mine.forEach(r=>{
      const badge=r.status==='approved'?'sa':r.status==='denied'?'sd':'spe';
      const label=r.status==='approved'?'Approved':r.status==='denied'?'Denied':'Pending';
      const dateLabel = Array.isArray(r.dates)
        ? r.dates[0] + (r.dates.length > 1 ? ` – ${r.dates[r.dates.length-1]}` : '')
        : r.dates;
      h+=`<div class="req-card"><div class="req-info"><div class="req-name">${dateLabel}</div><div class="req-reason">${r.reason}</div><div style="font-size:11px;color:var(--text3);margin-top:3px">Submitted ${r.submitted}</div></div><span class="status-badge ${badge}">${label}</span></div>`;
    });
    h+=`</div>`;
  }
  if(myShiftReqs.length){ h+=`<div class="section-gap"><div class="sub-head">My shift requests</div>`+myShiftReqs.map(r=>shiftReqCard(r,false)).join('')+`</div>`; }
  return h+`</div>`;
}

function renderEmployeeView(days) {
  const myShifts = [];
  const mode = scheduleMode;
  const week = ensureSchedule(weekKey(selectedWeekStart));
  const published = week.publishedAssignments || {};

  for(let d = 0; d < 7; d++){
    (published[`${mode}-${d}`] || []).forEach((slot, slotIdx)=>{
      if(slot.staffId === activeEmployeeId) {
        myShifts.push({day:d, mode, slotIdx, ...slot});
      }
    });
  }

  myShifts.sort((a,b)=> a.day-b.day || String(a.time).localeCompare(String(b.time)));

  const pageSize = 5;
  const totalPages = Math.max(1, Math.ceil(myShifts.length / pageSize));
  if(upcomingPage >= totalPages) upcomingPage = totalPages - 1;
  const pageStart = upcomingPage * pageSize;
  const visibleShifts = myShifts.slice(pageStart, pageStart + pageSize);
  const activeUser = staffById(activeEmployeeId);

  let h = `<div class="employee-schedule-view">
    <div class="emp-view compact-panel">
      <div class="job-type-note">
        <strong>${activeUser ? activeUser.name : 'Employee'}</strong> · ${activeUser ? activeUser.role : ''} schedule.
        Employees only see shifts for their own job type.
      </div>
    </div>`;

  h += renderSchedule(days, false);

  h += `<div class="emp-view compact-panel">
    <div class="sub-head">
      <i class="ti ti-clock"></i> My upcoming shifts
      <span class="summary-line">Showing ${myShifts.length ? pageStart+1 : 0}-${Math.min(pageStart+pageSize,myShifts.length)} of ${myShifts.length}</span>
    </div>`;

  if(!myShifts.length){
    h += `<div class="empty-state" style="padding:20px"><i class="ti ti-calendar"></i>No shifts scheduled this week</div>`;
  } else {
    visibleShifts.forEach(v=>{
      const locked = !canRequestChange(v.day, v.time);
      const pendingGiveUp = hasPendingGiveUp(v.mode, v.day, v.slotIdx, activeEmployeeId);
      const actions = locked
        ? ''
        : pendingGiveUp
          ? '<span class="status-badge spe">Give-up pending</span>'
          : `<button class="btn-secondary" onclick="requestGiveUp('${v.mode}',${v.day},${v.slotIdx})">Give up</button>
             <button class="btn-secondary" onclick="openSwapModal('${v.mode}',${v.day},${v.slotIdx})">Swap</button>`;
      h += `<div class="my-shift-card">
        <span class="sdot" style="background:#378ADD"></span>
        <div class="my-shift-info">
          <div class="day">${DAYS[v.day]}, ${fmt(days[v.day])}</div>
          <div class="time">${v.time} · ${v.area}${v.oncall?' · on call':''}${v.patio?' · patio':''}${v.special?' · special event':''} · ${v.mode}</div>
          ${locked ? '<div class="locked-note">Changes locked within 4 hours of start time.</div>' : ''}
          ${pendingGiveUp ? '<div class="req-meta">Waiting for manager approval before this shift is released.</div>' : ''}
        </div>
        <div class="shift-actions">${actions}</div>
      </div>`;
    });
    if(totalPages > 1){
      h += `<div class="pager">
        <button class="btn-secondary" ${upcomingPage===0?'disabled':''} onclick="changeUpcomingPage(-1)"><i class="ti ti-chevron-left"></i> Previous</button>
        <span class="pager-label">Page ${upcomingPage+1} of ${totalPages}</span>
        <button class="btn-secondary" ${upcomingPage>=totalPages-1?'disabled':''} onclick="changeUpcomingPage(1)">Next <i class="ti ti-chevron-right"></i></button>
      </div>`;
    }
  }

  h += `</div>`;

  const minePending = myPendingShiftRequests();
  if(minePending.length){
    h += `<div class="emp-view compact-panel"><div class="sub-head"><i class="ti ti-hourglass"></i> My pending shift requests</div>`;
    minePending.forEach(r=>{
      const label = r.type==='giveup' ? 'Give-up request' : r.type==='swap' ? 'Swap request' : 'Claim request';
      h += `<div class="my-shift-card">
        <span class="sdot" style="background:#FAC775"></span>
        <div class="my-shift-info">
          <div class="day">${label}</div>
          <div class="time">${shiftLabel(r.mode,r.day,r.slotIdx)}</div>
          <div class="req-meta">Waiting for manager approval.</div>
        </div>
        <span class="status-badge spe">Pending</span>
      </div>`;
    });
    h += `</div>`;
  }

  h += `<div class="emp-view compact-panel">${renderAvailableShifts(days).replace('<div class="section-gap">','<div>')}</div>`;
  return h + `</div>`;
}

function changeUpcomingPage(dir){
  upcomingPage = Math.max(0, upcomingPage + dir);
  render();
}

function resolve(id,status){
  requests.find(r=>r.id===id).status=status;
  render();
}

function resolveShiftRequest(id, status){
  const r = shiftRequests.find(r => r.id === id);
  if(!r) return;
  const slot = findSlot(r.mode, r.day, r.slotIdx);
  if(status === 'approved'){
    if(!slot || !canRequestChange(r.day, slot.time)){ alert('This shift is locked because it starts in less than 4 hours.'); return; }
    if(r.type === 'giveup') slot.staffId = null;
    if(r.type === 'swap'){
      const target = findSlot(r.targetMode, r.targetDay, r.targetSlotIdx);
      if(!target || !canRequestChange(r.targetDay, target.time)){ alert('One of these shifts is locked because it starts in less than 4 hours.'); return; }
      const temp = slot.staffId; slot.staffId = target.staffId; target.staffId = temp;
    }
    if(r.type === 'claim'){
      if(isAlreadyScheduledThatDay(r.staffId, r.mode, r.day)){
        alert(`${staffById(r.staffId).name} is already scheduled that day. Cannot approve.`);
        return;
      }
      slot.staffId = r.staffId;
      const giveup = shiftRequests.find(g =>
        g.type === 'giveup' && g.status === 'pending' &&
        g.mode === r.mode && g.day === r.day && g.slotIdx === r.slotIdx
      );
      if(giveup) giveup.status = 'approved';
    }
  }
  r.status = status;
  render();
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
  const slot = findSlot(mode,day,slotIdx);
  if(!slot || !canRequestChange(day,slot.time)){ alert('This shift cannot be swapped within 4 hours of the start time.'); return; }
  const options = [];
  const week = ensureSchedule(weekKey(selectedWeekStart));
  const published = week.publishedAssignments || {};
  ['regular','patio','blank-regular','blank-patio'].forEach(m=>{
    for(let d=0; d<7; d++){
      (published[`${m}-${d}`] || []).forEach((other,i)=>{
        if(other.staffId && other.staffId !== activeEmployeeId && canRequestChange(d,other.time)){
          options.push({m,d,i,other});
        }
      });
    }
  });
  showModal(`<div class="modal-title">Request shift swap</div>
    <div class="availability-note" style="margin-bottom:12px">Swap requests must be approved by a manager.</div>
    <div class="fgroup"><label class="flabel">Your shift</label><input type="text" value="${shiftLabel(mode,day,slotIdx)}" disabled /></div>
    <div class="fgroup"><label class="flabel">Swap with</label><select id="swap-target">${options.map(o=>`<option value="${o.m}|${o.d}|${o.i}">${staffById(o.other.staffId).name} — ${shiftLabel(o.m,o.d,o.i)}</option>`).join('')}</select></div>
    <div class="modal-actions">
      <button class="btn-cancel" onclick="closeModal()">Cancel</button>
      <button class="btn-save" onclick="submitSwapRequest('${mode}',${day},${slotIdx})"><i class="ti ti-send"></i> Submit swap</button>
    </div>`);
}

function isAlreadyScheduledThatDay(staffId, mode, day){
  const week = ensureSchedule(weekKey(selectedWeekStart));
  const published = week.publishedAssignments || {};
  return (published[`${mode}-${day}`] || []).some(slot => slot.staffId === staffId);
}

function submitSwapRequest(mode,day,slotIdx){
  const val=document.getElementById('swap-target').value;
  if(!val){ alert('No eligible shift is available to swap with.'); return; }
  const [targetMode,targetDay,targetSlotIdx]=val.split('|');
  const target=findSlot(targetMode,+targetDay,+targetSlotIdx);
  shiftRequests.unshift({id:nextShiftRequestId++,type:'swap',status:'pending',staffId:activeEmployeeId,mode,day,slotIdx,targetStaffId:target.staffId,targetMode,targetDay:+targetDay,targetSlotIdx:+targetSlotIdx,submitted:todayLabel()});
  closeModal(); render();
}

function claimShift(mode, day, slotIdx){
  const slot = findSlot(mode, day, slotIdx);
  const isGivenUp = shiftRequests.some(r =>
    r.type === 'giveup' && r.status === 'pending' &&
    r.mode === mode && r.day === day && r.slotIdx === slotIdx
  );
  if(!slot){ alert('This shift could not be found.'); return; }
  if(slot.staffId && !isGivenUp){ alert('This shift is no longer available.'); return; }
  if(hasPendingClaim(mode, day, slotIdx, activeEmployeeId)){ alert('You already requested to claim this shift.'); return; }
  if(isAlreadyScheduledThatDay(activeEmployeeId, mode, day)){ alert('You are already scheduled for this day.'); return; }
  shiftRequests.unshift({id:nextShiftRequestId++, type:'claim', status:'pending', staffId:activeEmployeeId, mode, day, slotIdx, submitted:todayLabel()});
  render();
}

function submitReq(){
  const start = document.getElementById('emp-date-start').value;
  const end = document.getElementById('emp-date-end').value;
  if(!start){ alert('Please select a start date.'); return; }
  const dates = [];
  const cur = new Date(start + 'T00:00:00');
  const last = end ? new Date(end + 'T00:00:00') : new Date(start + 'T00:00:00');
  while(cur <= last){
    dates.push(cur.toISOString().slice(0,10));
    cur.setDate(cur.getDate() + 1);
  }
  const reason = document.getElementById('emp-reason').value.trim();
  const today = new Date();
  requests.unshift({
    id: nextId++,
    staffId: activeEmployeeId,
    name: staffById(activeEmployeeId).name,
    dates,
    reason: reason || 'No reason given',
    status: 'pending',
    submitted: today.toLocaleDateString('en-US',{month:'short',day:'numeric'})
  });
  render();
}

function showModal(content){ closeModal(); const ov=document.createElement('div'); ov.className='modal-overlay'; ov.id='modal-ov'; ov.innerHTML=`<div class="modal">${content}</div>`; ov.addEventListener('click',e=>{if(e.target===ov)closeModal();}); document.body.appendChild(ov); }
function closeModal(){ const m=document.getElementById('modal-ov'); if(m) m.remove(); }

async function initApp(){
  const hash = window.location.hash;
  if(hash && hash.includes('access_token')){
    const { data } = await supabase.auth.getSession();
    if(data?.session){
      document.getElementById('login-screen').style.display = 'flex';
      document.getElementById('app').style.display = 'none';
      document.getElementById('login-screen').querySelector('.login-card').innerHTML = `
        <div class="login-title"><i class="ti ti-tool-kitchen-2" style="color:#D85A30"></i> Set your password</div>
        <div class="login-subtitle">Choose a password to complete your account setup.</div>
        <div class="login-row">
          <label class="flabel">New password</label>
          <input type="password" id="new-password" placeholder="Min 6 characters" style="width:100%;padding:8px 10px;border-radius:8px;border:1px solid var(--border);font-size:14px" />
        </div>
        <div id="login-error" style="color:red;font-size:13px;margin-bottom:8px;display:none"></div>
        <button class="btn-save" style="width:100%;justify-content:center;margin-top:8px" onclick="setNewPassword()">
          <i class="ti ti-check"></i> Set password
        </button>
      `;
      return;
    }
  }

  const { data: { session } } = await supabase.auth.getSession();
  if(session){
    const { data: staffRow } = await supabase
      .from('staff')
      .select('*')
      .eq('id', session.user.id)
      .single();

    if(staffRow){
      currentUser = staffRow;
      activeEmployeeId = staffRow.id;
      role = staffRow.role === 'Manager' ? 'manager' : 'employee';
      document.getElementById('login-screen').style.display = 'none';
      document.getElementById('app').style.display = 'flex';
      render();
      return;
    }
  }

  document.getElementById('login-screen').style.display = 'flex';
  document.getElementById('app').style.display = 'none';
}

async function setNewPassword(){
  const password = document.getElementById('new-password').value;
  const errEl = document.getElementById('login-error');
  errEl.style.display = 'none';

  if(password.length < 6){
    errEl.textContent = 'Password must be at least 6 characters.';
    errEl.style.display = 'block';
    return;
  }

  const { error } = await supabase.auth.updateUser({ password });
  if(error){
    errEl.textContent = error.message;
    errEl.style.display = 'block';
    return;
  }

  window.history.replaceState(null, '', window.location.pathname);

  const { data: { session } } = await supabase.auth.getSession();
  const { data: staffRow } = await supabase
    .from('staff')
    .select('*')
    .eq('id', session.user.id)
    .single();

  if(staffRow){
    currentUser = staffRow;
    activeEmployeeId = staffRow.id;
    role = staffRow.role === 'Manager' ? 'manager' : 'employee';
    document.getElementById('login-screen').style.display = 'none';
    document.getElementById('app').style.display = 'flex';
    render();
  }
}

initApp();


window.selectWeek = selectWeek;
window.pickWeekDate = pickWeekDate;
window.requestGiveUp = requestGiveUp;
window.openSwapModal = openSwapModal;
window.claimShift = claimShift;
window.setNewPassword = setNewPassword;
window.submitSwapRequest = submitSwapRequest;
window.submitReq = submitReq;
window.resolve = resolve;
window.isAlreadyScheduledThatDay = isAlreadyScheduledThatDay;
window.resolveShiftRequest = resolveShiftRequest;
window.changeWeek = changeWeek;
window.setTab = setTab;
window.setMode = setMode;
window.setManagerScheduleView = setManagerScheduleView;
window.changeUpcomingPage = changeUpcomingPage;
window.editSlot = editSlot;
window.addSlot = addSlot;
window.saveNewSlot = saveNewSlot;
window.updateSlotDetails = updateSlotDetails;
window.removeSlot = removeSlot;
window.editManager = editManager;
window.saveManager = saveManager;
window.closeModal = closeModal;
window.setAvailability = setAvailability;
window.setPreferredShifts = setPreferredShifts;
window.autoGenerateSchedule = autoGenerateSchedule;
window.publishSchedule = publishSchedule;
window.confirmPublish = confirmPublish;
window.loadPreviousSchedule = loadPreviousSchedule;
window.exportCSV = exportCSV;
