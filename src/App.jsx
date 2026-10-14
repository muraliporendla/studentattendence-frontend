import React, { useEffect, useMemo, useState } from 'react';
import { GraduationCap, LayoutDashboard, Users, ClipboardCheck, ChartNoAxesCombined, LogOut, Plus, Search, CalendarDays, CheckCircle2, XCircle, Menu, BookOpen, Trash2, RefreshCw } from 'lucide-react';

const API = 'http://localhost:8080/api';
const today = () => new Date().toISOString().slice(0,10);
async function request(path, options={}) {
  const res = await fetch(API + path, {headers:{'Content-Type':'application/json'}, ...options});
  if (!res.ok) {
    let msg = 'Request failed';
    try { const data = await res.json(); msg = data.message || data.error || msg; } catch {}
    throw new Error(msg);
  }
  if (res.status === 204) return null;
  return res.json();
}
const demoUsers = [{username:'admin',password:'admin123',role:'ADMIN'},{username:'student',password:'student123',role:'STUDENT'}];

export default function App() {
  const [user,setUser] = useState(null);
  const [page,setPage] = useState('Dashboard');
  const [mobileOpen,setMobileOpen] = useState(false);
  const [error,setError] = useState('');
  const [toast,setToast] = useState('');
  const [students,setStudents] = useState([]);
  const [records,setRecords] = useState([]);
  const [reports,setReports] = useState([]);
  const [summary,setSummary] = useState({totalStudents:0,attendanceRecords:0,present:0,absent:0,attendanceRate:0});
  const [date,setDate] = useState(today());
  const [query,setQuery] = useState('');
  const [login,setLogin] = useState({username:'admin',password:'admin123'});
  const [studentForm,setStudentForm] = useState({name:'',rollNumber:'',department:'CSE',yearOfStudy:'1st Year',email:''});
  const [showForm,setShowForm] = useState(false);
  const [marking,setMarking] = useState({});
  const [busy,setBusy] = useState(false);

  async function refresh() {
    try {
      const [s,d,r,a] = await Promise.all([
        request('/students'), request('/dashboard'), request('/reports'), request('/attendance?date='+date)
      ]);
      setStudents(s); setSummary(d); setReports(r); setRecords(a);
      const map={}; a.forEach(x=>map[x.student.id]=x.status); setMarking(map);
      setError('');
    } catch(e) { setError(e.message + ' — make sure the Spring Boot backend and MySQL are running.'); }
  }
  useEffect(()=>{ if(user) refresh(); },[user,date]);
  const nav = [
    {name:'Dashboard',icon:LayoutDashboard},
    {name:'Students',icon:Users},
    {name:'Mark Attendance',icon:ClipboardCheck},
    {name:'Reports',icon:ChartNoAxesCombined}
  ];
  const filtered = useMemo(()=>students.filter(s=>[s.name,s.rollNumber,s.department,s.email].join(' ').toLowerCase().includes(query.toLowerCase())),[students,query]);

  async function signIn(e) {
    e.preventDefault(); setError(''); setBusy(true);
    try {
      const result = await request('/auth/login',{method:'POST',body:JSON.stringify(login)});
      setUser(result); setPage('Dashboard');
    } catch(e) { setError(e.message || 'Login failed'); }
    finally { setBusy(false); }
  }
  function notify(msg) { setToast(msg); setTimeout(()=>setToast(''),2600); }
  async function addStudent(e) {
    e.preventDefault();
    try {
      await request('/students',{method:'POST',body:JSON.stringify(studentForm)});
      setStudentForm({name:'',rollNumber:'',department:'CSE',yearOfStudy:'1st Year',email:''});
      setShowForm(false); await refresh(); notify('Student added successfully');
    } catch(e) { setError(e.message); }
  }
  async function deleteStudent(id) {
    if(!confirm('Delete this student?')) return;
    try { await request('/students/'+id,{method:'DELETE'}); await refresh(); notify('Student deleted'); }
    catch(e) { setError(e.message); }
  }
  async function saveAttendance(studentId,status) {
    try {
      await request('/attendance',{method:'POST',body:JSON.stringify({studentId:String(studentId),date,status})});
      setMarking(prev=>({...prev,[studentId]:status})); await refresh(); notify('Attendance saved');
    } catch(e) { setError(e.message); }
  }
  if (!user) return <div className="login-page">
    <div className="login-art">
      <div className="brand-mark"><GraduationCap size={36}/></div>
      <div className="eyebrow">CAMPUS MANAGEMENT</div>
      <h1>Every student.<br/>Every day.</h1>
      <p>A simpler way to manage attendance, understand class participation, and keep your campus in sync.</p>
      <div className="login-stat"><div><strong>01</strong><span>Mark attendance</span></div><div><strong>02</strong><span>Track progress</span></div><div><strong>03</strong><span>Generate reports</span></div></div>
      <div className="art-circle circle-one"></div><div className="art-circle circle-two"></div>
    </div>
    <div className="login-panel">
      <div className="mobile-brand"><GraduationCap/> Attendly</div>
      <div className="login-box"><div className="mini-label">WELCOME BACK</div><h2>Sign in to your account</h2><p className="muted">Enter your details to access your workspace.</p>
        <form onSubmit={signIn}>
          <label>Username</label><input value={login.username} onChange={e=>setLogin({...login,username:e.target.value})} placeholder="Enter username" required/>
          <label>Password</label><input type="password" value={login.password} onChange={e=>setLogin({...login,password:e.target.value})} placeholder="Enter password" required/>
          {error && <div className="error-box">{error}</div>}
          <button className="primary full" disabled={busy}>{busy?'Signing in…':'Sign in'} <span>→</span></button>
        </form>
        <div className="demo-credentials"><strong>Demo credentials</strong><p>Admin: <code>admin</code> / <code>admin123</code></p><p>Student: <code>student</code> / <code>student123</code></p></div>
      </div>
      <div className="login-footer">Student Attendance Management System · Academic demo</div>
    </div>
  </div>;

  return <div className="app-shell">
    <aside className={`sidebar ${mobileOpen?'sidebar-open':''}`}>
      <div className="brand"><div className="brand-icon"><GraduationCap size={24}/></div><div><b>Attendly</b><small>STUDENT PORTAL</small></div></div>
      <div className="nav-caption">WORKSPACE</div>
      <nav>{nav.map(item=><button key={item.name} className={'nav-item '+(page===item.name?'active':'')} onClick={()=>{setPage(item.name);setMobileOpen(false);setError('')}}><item.icon size={18}/><span>{item.name}</span>{item.name==='Mark Attendance'&&<i/>}</button>)}</nav>
      <div className="sidebar-bottom"><div className="help-card"><BookOpen size={20}/><b>Need a hand?</b><span>Keep your attendance records up to date.</span></div><button className="nav-item logout" onClick={()=>{setUser(null);setError('')}}><LogOut size={18}/>Sign out</button></div>
    </aside>
    {mobileOpen&&<div className="scrim" onClick={()=>setMobileOpen(false)}></div>}
    <main className="main-area">
      <header className="topbar"><button className="mobile-menu" onClick={()=>setMobileOpen(!mobileOpen)}><Menu/></button><div className="breadcrumb">Workspace <span>/</span> <b>{page}</b></div><div className="top-user"><div className="avatar">{user.username.slice(0,1).toUpperCase()}</div><div><b>{user.username}</b><small>{user.role==='ADMIN'?'Administrator':'Student account'}</small></div></div></header>
      <div className="content">
        <div className="page-heading"><div><div className="mini-label">{new Date().toLocaleDateString('en-IN',{weekday:'long',month:'long',day:'numeric'})}</div><h1>{page==='Dashboard'?'Dashboard overview':page}</h1><p className="muted">{page==='Dashboard'?'Here’s what is happening with attendance today.':page==='Students'?'Manage your student directory in one place.':page==='Mark Attendance'?'Record attendance for your class, one student at a time.':'Review student attendance and class participation.'}</p></div><button className="outline" onClick={refresh}><RefreshCw size={16}/> Refresh</button></div>
        {error&&<div className="error-box page-error">{error}<button onClick={()=>setError('')}>×</button></div>}
        {page==='Dashboard'&&<Dashboard summary={summary} students={students} records={records} setPage={setPage} date={date}/>}
        {page==='Students'&&<section className="panel"><div className="panel-head"><div><h3>Student directory</h3><p className="muted">{students.length} students registered</p></div><button className="primary" onClick={()=>setShowForm(!showForm)}><Plus size={17}/> Add student</button></div>
          {showForm&&<form className="student-form" onSubmit={addStudent}><div className="form-grid">
            <div><label>Full name</label><input required value={studentForm.name} onChange={e=>setStudentForm({...studentForm,name:e.target.value})} placeholder="Student name"/></div>
            <div><label>Roll number</label><input required value={studentForm.rollNumber} onChange={e=>setStudentForm({...studentForm,rollNumber:e.target.value})} placeholder="e.g. STU005"/></div>
            <div><label>Department</label><select value={studentForm.department} onChange={e=>setStudentForm({...studentForm,department:e.target.value})}><option>CSE</option><option>ECE</option><option>EEE</option><option>IT</option><option>MECH</option><option>CIVIL</option></select></div>
            <div><label>Year</label><select value={studentForm.yearOfStudy} onChange={e=>setStudentForm({...studentForm,yearOfStudy:e.target.value})}><option>1st Year</option><option>2nd Year</option><option>3rd Year</option><option>4th Year</option></select></div>
            <div className="span-two"><label>Email</label><input type="email" value={studentForm.email} onChange={e=>setStudentForm({...studentForm,email:e.target.value})} placeholder="student@college.edu"/></div>
          </div><div className="form-actions"><button type="button" className="outline" onClick={()=>setShowForm(false)}>Cancel</button><button className="primary">Save student</button></div></form>}
          <div className="table-toolbar"><div className="searchbox"><Search size={16}/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search students, roll no…"/></div><span className="muted">Showing {filtered.length} records</span></div>
          <div className="table-wrap"><table><thead><tr><th>STUDENT</th><th>ROLL NUMBER</th><th>DEPARTMENT</th><th>YEAR</th><th>EMAIL</th>{user.role==='ADMIN'&&<th></th>}</tr></thead><tbody>{filtered.map(s=><tr key={s.id}><td><div className="student-cell"><div className="student-avatar">{s.name?.split(' ').map(n=>n[0]).slice(0,2).join('')}</div><b>{s.name}</b></div></td><td>{s.rollNumber}</td><td><span className="dept-pill">{s.department||'—'}</span></td><td>{s.yearOfStudy||'—'}</td><td>{s.email||'—'}</td>{user.role==='ADMIN'&&<td><button className="icon-btn danger" title="Delete student" onClick={()=>deleteStudent(s.id)}><Trash2 size={16}/></button></td>}</tr>)}</tbody></table>{!filtered.length&&<div className="empty">No students found.</div>}</div>
        </section>}
        {page==='Mark Attendance'&&<section className="panel"><div className="panel-head"><div><h3>Daily attendance</h3><p className="muted">Choose each student’s status, then save it.</p></div><label className="date-field"><CalendarDays size={17}/><input type="date" value={date} onChange={e=>setDate(e.target.value)}/></label></div>
          <div className="attendance-summary"><div><span>Class strength</span><b>{students.length}</b></div><div><span>Present</span><b className="green-text">{students.filter(s=>['PRESENT','LATE'].includes(marking[s.id])).length}</b></div><div><span>Absent</span><b className="red-text">{students.filter(s=>marking[s.id]==='ABSENT').length}</b></div><div><span>Not marked</span><b>{students.filter(s=>!marking[s.id]).length}</b></div></div>
          <div className="table-wrap"><table><thead><tr><th>STUDENT</th><th>ROLL NUMBER</th><th>ATTENDANCE STATUS</th></tr></thead><tbody>{students.map(s=><tr key={s.id}><td><div className="student-cell"><div className="student-avatar">{s.name?.split(' ').map(n=>n[0]).slice(0,2).join('')}</div><div><b>{s.name}</b><small className="subline">{s.department} · {s.yearOfStudy}</small></div></div></td><td>{s.rollNumber}</td><td><div className="status-actions"><button className={'status-btn present '+(marking[s.id]==='PRESENT'?'selected':'')} onClick={()=>saveAttendance(s.id,'PRESENT')}><CheckCircle2 size={15}/> Present</button><button className={'status-btn absent '+(marking[s.id]==='ABSENT'?'selected':'')} onClick={()=>saveAttendance(s.id,'ABSENT')}><XCircle size={15}/> Absent</button><button className={'status-btn late '+(marking[s.id]==='LATE'?'selected':'')} onClick={()=>saveAttendance(s.id,'LATE')}>Late</button></div></td></tr>)}</tbody></table>{!students.length&&<div className="empty">Add students first to mark attendance.</div>}</div>
        </section>}
        {page==='Reports'&&<section className="panel"><div className="panel-head"><div><h3>Attendance performance</h3><p className="muted">Percentages are calculated from saved attendance records.</p></div><span className="report-tag">LIVE REPORT</span></div><div className="table-wrap"><table><thead><tr><th>STUDENT</th><th>ROLL NUMBER</th><th>TOTAL CLASSES</th><th>PRESENT</th><th>ABSENT</th><th>ATTENDANCE</th></tr></thead><tbody>{reports.map(r=><tr key={r.studentId}><td><b>{r.name}</b></td><td>{r.rollNumber}</td><td>{r.totalClasses}</td><td className="green-text">{r.present}</td><td className="red-text">{r.absent}</td><td><div className="percentage-cell"><div className="progress"><span style={{width:`${r.percentage}%`}}/></div><b>{r.percentage}%</b></div></td></tr>)}</tbody></table>{!reports.length&&<div className="empty">No report data available.</div>}</div><div className="report-note">Attendance percentage = (Present + Late) ÷ Total marked classes × 100.</div></section>}
      </div>
      <footer className="footer">© 2026 Attendly · Student Attendance Management System <span>Built with React + Spring Boot</span></footer>
    </main>
    {toast&&<div className="toast"><CheckCircle2 size={18}/>{toast}</div>}
  </div>;
}

function Dashboard({summary,students,records,setPage,date}) {
  const cards=[
    {label:'Total students',value:summary.totalStudents,icon:Users,color:'blue',trend:'Registered in directory'},
    {label:'Attendance rate',value:summary.attendanceRate+'%',icon:ChartNoAxesCombined,color:'purple',trend:'Across marked records'},
    {label:'Present records',value:summary.present,icon:CheckCircle2,color:'green',trend:'Includes late arrivals'},
    {label:'Absent records',value:summary.absent,icon:XCircle,color:'orange',trend:'Needs follow-up'}
  ];
  return <>
    <div className="stat-grid">{cards.map(c=><div className="stat-card" key={c.label}><div className="stat-top"><span>{c.label}</span><div className={'stat-icon '+c.color}><c.icon size={19}/></div></div><div className="stat-number">{c.value}</div><div className="stat-foot">{c.trend}</div></div>)}</div>
    <div className="dashboard-grid"><section className="panel recent-panel"><div className="panel-head"><div><h3>Attendance for today</h3><p className="muted">{new Date(date+'T00:00:00').toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'})}</p></div><button className="text-btn" onClick={()=>setPage('Mark Attendance')}>Mark attendance →</button></div>
      <div className="quick-stats"><div><span className="dot green-dot"></span><span>Present</span><b>{records.filter(r=>r.status==='PRESENT'||r.status==='LATE').length}</b></div><div><span className="dot red-dot"></span><span>Absent</span><b>{records.filter(r=>r.status==='ABSENT').length}</b></div><div><span className="dot gray-dot"></span><span>Unmarked</span><b>{Math.max(0,students.length-records.length)}</b></div></div>
      <div className="mini-list">{students.slice(0,5).map(s=>{const r=records.find(x=>x.student.id===s.id);return <div className="mini-row" key={s.id}><div className="student-cell"><div className="student-avatar">{s.name?.split(' ').map(n=>n[0]).slice(0,2).join('')}</div><div><b>{s.name}</b><small className="subline">{s.rollNumber}</small></div></div><span className={'badge '+(r?.status==='PRESENT'?'badge-green':r?.status==='ABSENT'?'badge-red':r?.status==='LATE'?'badge-orange':'badge-gray')}>{r?.status||'Not marked'}</span></div>})}{!students.length&&<div className="empty">No students yet. Add students to get started.</div>}</div>
    </section>
    <section className="panel shortcuts"><div className="panel-head"><div><h3>Quick actions</h3><p className="muted">Jump straight into your work.</p></div></div><button className="shortcut" onClick={()=>setPage('Students')}><div className="shortcut-icon blue"><Users size={19}/></div><div><b>Manage students</b><small>Add or review student details</small></div><span>→</span></button><button className="shortcut" onClick={()=>setPage('Mark Attendance')}><div className="shortcut-icon green"><ClipboardCheck size={19}/></div><div><b>Mark attendance</b><small>Record today’s class status</small></div><span>→</span></button><button className="shortcut" onClick={()=>setPage('Reports')}><div className="shortcut-icon purple"><ChartNoAxesCombined size={19}/></div><div><b>View reports</b><small>Check attendance percentages</small></div><span>→</span></button><div className="tip-card"><div className="tip-icon">✦</div><div><b>Stay on top of attendance</b><p>Mark attendance regularly for accurate reports and insights.</p></div></div></section></div>
  </>;
}
