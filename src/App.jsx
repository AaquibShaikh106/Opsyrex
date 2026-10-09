import { useEffect, useMemo, useState } from 'react';
import {
  Activity, AlertTriangle, ArrowDownRight, ArrowRight, ArrowUpRight, Bell,
  BookOpen, Check, CheckCircle2, ChevronDown, ChevronLeft, ChevronRight,
  CircleHelp, Clock3, Cloud, Cpu, Ellipsis, ExternalLink, Gauge, GitBranch,
  HeartPulse, Layers3, LifeBuoy, ListFilter, LoaderCircle, LockKeyhole,
  Menu, MoreHorizontal, Network, Plus, RefreshCw, Search, Server, Settings,
  ShieldCheck, SlidersHorizontal, Sparkles, X, Zap,
} from 'lucide-react';

const baseMetrics = { cpu: 42, memory: 51, requests: 120, latency: 180, errors: .4, risk: 12, instances: 2 };
const seededServices = [
  { id: 'api-gateway', name: 'API gateway', endpoint: 'Ingress · us-east-1', health: 'Healthy', instances: 1, latency: 42, kind: 'Edge' },
  { id: 'service-a', name: 'Service A', endpoint: 'Application · us-east-1', health: 'Healthy', instances: 2, latency: 180, kind: 'Application' },
  { id: 'worker-pool', name: 'Worker pool', endpoint: 'Async jobs · us-east-1', health: 'Healthy', instances: 2, latency: 96, kind: 'Compute' },
];
const initialRunbooks = [
  { id: 'scale-out', name: 'Scale out Service A', summary: 'Add two instances when CPU is high and request volume surges.', trigger: 'High CPU + high traffic', action: 'Scale · 2 → 4', enabled: true, approvals: 'Approval required' },
  { id: 'restart', name: 'Restart unhealthy service', summary: 'Restart a service after its health check fails.', trigger: 'Service health check fails', action: 'Restart service', enabled: true, approvals: 'Approval required' },
  { id: 'reroute', name: 'Reroute unhealthy traffic', summary: 'Shift requests to a healthy peer while Service A recovers.', trigger: 'Service A unhealthy · peer healthy', action: 'Shift traffic', enabled: false, approvals: 'Manual only' },
  { id: 'scale-in', name: 'Scale in during low demand', summary: 'Reduce capacity when request volume and resource use return to low levels.', trigger: 'Low traffic + low CPU', action: 'Scale down', enabled: false, approvals: 'Approval required' },
];
const initialEvents = [{ id: 1, title: 'All systems operational', detail: '3 monitored services · us-east-1', time: Date.now(), type: 'success' }];
const safeLoad = (key, fallback) => { try { const value = localStorage.getItem(`opsyrex.${key}`); return value ? JSON.parse(value) : fallback; } catch { return fallback; } };
const safeSave = (key, value) => { try { localStorage.setItem(`opsyrex.${key}`, JSON.stringify(value)); } catch { /* The page remains usable when browser storage is unavailable. */ } };
const paths = { overview: '#/overview', services: '#/services', incidents: '#/incidents', runbooks: '#/runbooks', architecture: '#/architecture', settings: '#/settings' };
const pageFromPath = () => Object.keys(paths).find((key) => paths[key] === location.hash) || 'overview';
const navSections = [
  { label: 'WORKSPACE', items: [['overview', 'Overview', Activity], ['services', 'Services', Layers3], ['incidents', 'Incidents', AlertTriangle], ['runbooks', 'Runbooks', BookOpen]] },
  { label: 'SYSTEM', items: [['architecture', 'Architecture', Network], ['settings', 'Settings', Settings]] },
];
const titles = {
  overview: ['Cloud health, at a glance', 'A closed-loop view of your infrastructure, decisions, and recovery.'],
  services: ['Service fleet', 'Inspect service health, capacity, and response time across your environment.'],
  incidents: ['Incident center', 'A single, auditable place to investigate and resolve service disruptions.'],
  runbooks: ['Recovery runbooks', 'Review the response examples and their approval controls.'],
  architecture: ['How OPSYREX works', 'A transparent control loop, from raw signals to verified recovery.'],
  settings: ['Workspace settings', 'Manage your workspace, alert thresholds, and response preferences.'],
};

function Chart({ metrics, phase, range }) {
  const cpu = useMemo(() => Array.from({ length: 25 }, (_, i) => {
    if (phase === 'spike') return [38, 42, 40, 44, 41, 45, 42, 43, 40, 44, 42, 46, 51, 58, 69, 82, 91, 94, 89, 86, 94, 91, 88, 94, metrics.cpu][i];
    if (phase === 'recovered') return [88, 94, 91, 86, 76, 68, 62, 58, 55, 54, 56, 58, 59, 58, 57, 58, 58, 58, 58, 57, 58, 58, 58, 58, metrics.cpu][i];
    return 36 + ((i * 13 + (i % 4) * 7) % 15);
  }), [phase, metrics.cpu]);
  const latency = useMemo(() => Array.from({ length: 25 }, (_, i) => phase === 'spike'
    ? [172, 180, 176, 190, 183, 188, 180, 195, 230, 295, 450, 720, 1140, 1680, 2210, 2600, 2800, 2950, 2780, 2600, 2860, 2800, 2780, 2800, metrics.latency][i]
    : phase === 'recovered' ? [2800, 2750, 2400, 1600, 1100, 760, 520, 380, 330, 310, 300, 310, 318, 306, 310, 314, 306, 310, 312, 308, 310, 312, 308, 310, metrics.latency][i] : 130 + ((i * 47) % 90)), [phase, metrics.latency]);
  const line = (values, max) => values.map((v, i) => `${i ? 'L' : 'M'} ${(i / (values.length - 1)) * 700} ${(145 - (v / max) * 125).toFixed(1)}`).join(' ');
  const ticks = range === '60 min' ? ['60 min ago', '45 min', '30 min', '15 min', 'Now'] : ['24 min ago', '18 min', '12 min', '6 min', 'Now'];
  return <div className="chart-wrap"><div className="chart-scale-label">RELATIVE SCALE</div><div className="chart-ylabels"><span>100</span><span>75</span><span>50</span><span>25</span><span>0</span></div><svg className="chart" viewBox="0 0 700 170" preserveAspectRatio="none" role="img" aria-label={`Illustrative simulated CPU and latency trend over ${range}`}><defs><linearGradient id="chartFill" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stopColor="#9cf2c4" stopOpacity=".16"/><stop offset="100%" stopColor="#9cf2c4" stopOpacity="0"/></linearGradient></defs>{[20,51,82,113,145].map((y) => <line key={y} x1="0" x2="700" y1={y} y2={y} className="chart-grid"/>)}<path d={`${line(cpu, 100)} L700 145 L0 145 Z`} fill="url(#chartFill)"/><path d={line(cpu, 100)} className="chart-line"/><path d={line(latency, 3200)} className="chart-line latency"/></svg><div className="chart-xlabels">{ticks.map((tick) => <span key={tick}>{tick}</span>)}</div></div>;
}

function Metric({ label, value, unit, sub, icon: Icon, tone = 'normal' }) {
  return <article className={`metric ${tone}`}><div className="metric-label">{label}<span className="metric-icon"><Icon size={15}/></span></div><div className="metric-value">{value}<small>{unit}</small></div><div className={`metric-foot ${tone === 'alert' ? 'bad' : 'good'}`}>{sub}</div></article>;
}

function App() {
  const [page, setPage] = useState(pageFromPath);
  const [phase, setPhase] = useState(() => safeLoad('phase', 'healthy'));
  const [metrics, setMetrics] = useState(() => safeLoad('metrics', baseMetrics));
  const [services, setServices] = useState(() => safeLoad('services', seededServices));
  const [runbooks, setRunbooks] = useState(() => safeLoad('runbooks', initialRunbooks));
  const [events, setEvents] = useState(() => safeLoad('events', initialEvents));
  const [acknowledged, setAcknowledged] = useState(() => safeLoad('acknowledged', false));
  const [threshold, setThreshold] = useState(() => safeLoad('threshold', 85));
  const [toast, setToast] = useState('');
  const [modal, setModal] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [serviceSearch, setServiceSearch] = useState('');
  const [incidentFilter, setIncidentFilter] = useState('All');
  const [range, setRange] = useState('24 min');

  useEffect(() => { safeSave('phase', phase); }, [phase]);
  useEffect(() => { safeSave('metrics', metrics); }, [metrics]);
  useEffect(() => { safeSave('services', services); }, [services]);
  useEffect(() => { safeSave('runbooks', runbooks); }, [runbooks]);
  useEffect(() => { safeSave('events', events); }, [events]);
  useEffect(() => { safeSave('acknowledged', acknowledged); }, [acknowledged]);
  useEffect(() => { safeSave('threshold', threshold); }, [threshold]);
  useEffect(() => {
    const onPop = () => setPage(pageFromPath());
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);
  useEffect(() => { if (!toast) return undefined; const t = setTimeout(() => setToast(''), 2800); return () => clearTimeout(t); }, [toast]);

  const navigate = (next) => {
    if (!paths[next]) return;
    history.pushState({}, '', paths[next]); setPage(next); setMenuOpen(false); window.scrollTo(0, 0);
  };
  const logEvent = (title, detail, type = 'success') => {
    setEvents((all) => [{ id: Date.now(), title, detail, time: Date.now(), type }, ...all].slice(0, 60));
  };
  const simulate = () => {
    if (phase === 'spike') { setToast('The active incident is ready for response.'); navigate('incidents'); return; }
    setPhase('spike'); setMetrics({ ...baseMetrics, cpu: 94, memory: 72, requests: 950, latency: 2800, errors: 8.7, risk: 87, instances: 2 }); setAcknowledged(false);
    setServices((list) => list.map((s) => s.id === 'service-a' ? { ...s, health: 'Degraded', latency: 2800 } : s));
    logEvent('Traffic anomaly detected', 'Service A · 7.9× baseline · 87% demo risk estimate', 'critical'); setToast('Traffic spike simulated · incident INC-001 opened.');
  };
  const recover = () => {
    if (phase !== 'spike') return;
    setPhase('recovered'); setMetrics({ ...baseMetrics, cpu: 58, memory: 60, requests: 520, latency: 310, errors: .8, risk: 12, instances: 4 }); setAcknowledged(false);
    setServices((list) => list.map((s) => s.id === 'service-a' ? { ...s, health: 'Healthy', latency: 310, instances: 4 } : s));
    logEvent('Recovery verified', 'Service A scaled from 2 to 4 · response latency 310 ms', 'success'); setToast('Scale-up completed · recovery checks passed.'); setModal(null);
  };
  const resetDemo = () => {
    setPhase('healthy'); setMetrics(baseMetrics); setAcknowledged(false); setServices(seededServices); logEvent('Demo reset', 'Signals and service capacity returned to baseline.', 'info'); setToast('Simulation returned to baseline.'); setModal(null);
  };
  const refresh = () => setToast('This is a local simulation. Run a scenario to change the displayed readings.');
  const addService = (form) => {
    const name = form.get('name')?.trim(); if (!name) return;
    const id = `service-${Date.now()}`;
    setServices((list) => [...list, { id, name, endpoint: `${form.get('endpoint')?.trim() || 'New service'} · us-east-1`, health: 'Healthy', instances: Number(form.get('instances')) || 1, latency: 80 + Math.floor(Math.random() * 100), kind: 'Application' }]);
    logEvent('Service added', `${name} · us-east-1`, 'info'); setToast(`${name} added to the service fleet.`); setModal(null);
  };
  const executeRunbook = (runbook) => {
    if (runbook.id === 'scale-out' && phase === 'spike') setModal({ type: 'approve', runbook });
    else if (runbook.id === 'scale-out') { setToast('No active anomaly · the runbook is standing by.'); }
    else { setToast('This build shows the restart and reroute examples, but simulates the Service A scale-up only.'); }
  };

  const activeIncident = phase === 'spike';
  const filteredServices = services.filter((s) => `${s.name} ${s.endpoint} ${s.kind}`.toLowerCase().includes(serviceSearch.toLowerCase()));
  const filteredEvents = events.filter((event) => incidentFilter === 'All' || (incidentFilter === 'Critical' ? event.type === 'critical' : event.type === 'success'));
  const meta = titles[page] || titles.overview;

  return <div className="app-shell">
    <aside className={`sidebar ${menuOpen ? 'open' : ''}`}>
      <button className="brand" onClick={() => navigate('overview')} aria-label="OPSYREX overview"><span className="brand-symbol"><Activity size={20}/></span><span><b>OPSYREX</b><small>CLOUD CONTROL PLANE</small></span></button>
      <div className="workspace-switch"><div className="workspace-avatar">TT</div><div><span>WORKSPACE</span><b>Tech Titans</b></div><ChevronDown size={15}/></div>
      {navSections.map((section) => <div className="nav-group" key={section.label}><div className="nav-label">{section.label}</div>{section.items.map(([key, label, Icon]) => <button key={key} className={`nav-link ${page === key ? 'active' : ''}`} onClick={() => navigate(key)}><Icon size={17}/><span>{label}</span>{key === 'incidents' && activeIncident && <i className="nav-badge">1</i>}</button>)}</div>)}
      <div className="sidebar-foot"><div className="cluster-card"><div><span className={`status-dot ${activeIncident ? 'dot-red' : ''}`}/><b>{activeIncident ? '1 service degraded' : 'All systems healthy'}</b></div><small>us-east-1 · {services.length} services</small><div className="cluster-meter"><i style={{ width: `${Math.min(metrics.cpu, 100)}%`, background: activeIncident ? 'var(--coral)' : undefined }}/></div></div><button className="profile" onClick={() => navigate('settings')}><span className="profile-avatar">TT</span><span><b>Tech Titans</b><small>Workspace owner</small></span><MoreHorizontal size={17}/></button></div>
    </aside>
    {menuOpen && <button aria-label="Close navigation" className="mobile-scrim" onClick={() => setMenuOpen(false)}/>}
    <main className="main-area">
      <header className="topbar"><div className="topbar-left"><button className="icon-button menu-toggle" onClick={() => setMenuOpen(!menuOpen)} aria-label="Toggle navigation"><Menu size={18}/></button><div className="breadcrumbs">Workspace <ChevronRight size={13}/><b>{page === 'overview' ? 'Overview' : titles[page]?.[0]}</b></div></div><div className="topbar-actions"><span className="environment"><i/>SIMULATION ENVIRONMENT</span><button className="icon-button" onClick={refresh} aria-label="Refresh telemetry"><RefreshCw size={16}/></button><button className="icon-button notification-button" onClick={() => navigate('incidents')} aria-label="View alerts"><Bell size={16}/>{activeIncident && <i/>}</button><button className="help-button" onClick={() => setModal({ type: 'about' })}><CircleHelp size={16}/><span>Help</span></button></div></header>
      <div className="page-content"><div className="page-heading"><div><div className="eyebrow"><span className="eyebrow-mark"/>CLOUD OPERATIONS / {page.toUpperCase()}</div><h1>{meta[0]}</h1><p>{meta[1]}</p></div><div className="heading-actions"><span className="last-updated"><span className="status-dot"/> Simulated · local data</span>{page === 'overview' && <button className="button button-primary" onClick={activeIncident ? () => navigate('incidents') : simulate}>{activeIncident ? <><AlertTriangle size={15}/> Investigate incident</> : <><Sparkles size={15}/> Run demo scenario</>}</button>}</div></div>
        {page === 'overview' && <Overview metrics={metrics} phase={phase} services={services} events={events} range={range} setRange={setRange} navigate={navigate} simulate={simulate} recover={recover} resetDemo={resetDemo} activeIncident={activeIncident}/>}
        {page === 'services' && <Services services={filteredServices} allCount={services.length} search={serviceSearch} setSearch={setServiceSearch} add={() => setModal({ type: 'add-service' })} remove={(service) => { setServices((all) => all.filter((s) => s.id !== service.id)); logEvent('Service removed', `${service.name} removed from monitoring.`, 'info'); setToast(`${service.name} removed.`); }} />}
        {page === 'incidents' && <Incidents events={filteredEvents} filter={incidentFilter} setFilter={setIncidentFilter} phase={phase} metrics={metrics} acknowledged={acknowledged} acknowledge={() => { setAcknowledged(true); setToast('Incident acknowledged.'); logEvent('Incident acknowledged', 'INC-001 · Tech Titans', 'info'); }} recover={recover} simulate={simulate} navigate={navigate}/>}
        {page === 'runbooks' && <Runbooks runbooks={runbooks} setRunbooks={setRunbooks} execute={executeRunbook} phase={phase} threshold={threshold}/>}
        {page === 'architecture' && <Architecture/>}
        {page === 'settings' && <SettingsPage threshold={threshold} setThreshold={setThreshold} phase={phase} resetDemo={resetDemo} toast={setToast}/>}
        <footer className="page-footer"><span>OPSYREX <i/> TECH TITANS · CODEASTRA 2.0</span><span><b>DEMO ENVIRONMENT</b> · Simulated signals only · <button onClick={() => setModal({ type: 'about' })}>About this workspace</button></span></footer>
      </div>
    </main>
    {toast && <div className="toast" role="status"><CheckCircle2 size={16}/>{toast}</div>}
    {modal && <Modal modal={modal} close={() => setModal(null)} addService={addService} recover={recover}/>}
  </div>;
}

function SectionHeading({ title, subtitle, action }) { return <div className="section-heading"><div><h2>{title}</h2>{subtitle && <p>{subtitle}</p>}</div>{action}</div>; }
function Overview({ metrics, phase, services, events, range, setRange, navigate, simulate, recover, resetDemo, activeIncident }) {
  const status = activeIncident ? ['DEGRADED · ACTION REQUIRED', 'Traffic anomaly detected', 'In this scenario, Service A receives a simulated traffic surge alongside high CPU, latency, and errors. The demo estimates an elevated failure risk from those signals.', 'rgba(255, 120, 107, .18)'] : phase === 'recovered' ? ['RECOVERY VERIFIED · STABLE', 'Service health restored', 'The simulated scale-up changes Service A from two to four instances. The demo then shows the brief’s recovery values: CPU 58%, latency 310 ms, errors 0.8%, risk 12%.', 'rgba(156, 242, 196, .14)'] : ['ALL SYSTEMS OPERATIONAL', 'Infrastructure operating normally.', 'Baseline simulation: CPU 42%, memory 51%, requests 120/sec, latency 180 ms, errors 0.4%, and estimated failure risk 12%. No action required.', 'rgba(156, 242, 196, .14)'];
  return <>
    <section className={`hero ${activeIncident ? 'hero-alert' : ''}`}><div className="hero-copy"><div className="hero-status"><span className={`status-dot ${activeIncident ? 'dot-red' : ''}`}/>{status[0]}</div><h2>{status[1]}</h2><p>{status[2]}</p><div className="hero-actions">{activeIncident ? <><button className="button button-danger" onClick={() => navigate('incidents')}><AlertTriangle size={15}/> Review incident</button><button className="button button-quiet" onClick={recover}><Zap size={15}/> Execute scale-up</button></> : <><button className="button button-primary" onClick={simulate}><Sparkles size={15}/> {phase === 'recovered' ? 'Simulate another incident' : 'Simulate traffic spike'}</button>{phase === 'recovered' && <button className="button button-quiet" onClick={resetDemo}><RefreshCw size={15}/> Reset demo</button>}</>}</div></div><div className="hero-visual"><div className="orbit orbit-one"/><div className="orbit orbit-two"/><div className="orbit-core"><Activity size={31}/></div><div className="orbit-node node-a"><Cpu size={15}/></div><div className="orbit-node node-b"><HeartPulse size={15}/></div><div className="orbit-node node-c"><ShieldCheck size={15}/></div><span className="orbit-caption">CONTROL LOOP ACTIVE</span></div><div className="hero-glow"/></section>
    <section className="metric-grid"><Metric label="CPU UTILIZATION" value={metrics.cpu} unit="%" sub={activeIncident ? '↑ Above threshold' : phase === 'recovered' ? '↓ Recovered' : '● Within baseline'} icon={Cpu} tone={activeIncident ? 'alert' : ''}/><Metric label="MEMORY USAGE" value={metrics.memory} unit="%" sub={activeIncident ? '↑ Elevated usage' : '● Within baseline'} icon={Layers3} tone={activeIncident ? 'warn' : ''}/><Metric label="REQUESTS / SEC" value={metrics.requests.toLocaleString()} unit="/s" sub={activeIncident ? '↑ 692% from baseline' : '● Steady traffic'} icon={Activity} tone={activeIncident ? 'alert' : ''}/><Metric label="RESPONSE LATENCY" value={metrics.latency >= 1000 ? (metrics.latency / 1000).toFixed(1) : metrics.latency} unit={metrics.latency >= 1000 ? ' s' : ' ms'} sub={activeIncident ? '↑ Critical degradation' : '● Healthy response'} icon={Gauge} tone={activeIncident ? 'alert' : ''}/><Metric label="ERROR RATE" value={metrics.errors} unit="%" sub={activeIncident ? '↑ Above baseline' : phase === 'recovered' ? '↓ Recovery checked' : '● Within baseline'} icon={AlertTriangle} tone={activeIncident ? 'alert' : ''}/><Metric label="FAILURE RISK" value={metrics.risk} unit="%" sub={activeIncident ? '● Elevated demo estimate' : '● Low demo estimate'} icon={ShieldCheck} tone={activeIncident ? 'alert' : ''}/></section>
    <section className="main-grid"><article className="panel telemetry-panel"><SectionHeading title="Infrastructure telemetry" subtitle={`Simulated CPU and response latency · ${range}`} action={<div className="chart-actions"><div className="legend"><span><i/>CPU</span><span><i/>Latency</span></div><select value={range} onChange={(e) => setRange(e.target.value)} aria-label="Chart time range"><option>24 min</option><option>60 min</option></select></div>}/><Chart metrics={metrics} phase={phase} range={range}/></article><article className="panel response-panel"><SectionHeading title="Autonomous response loop" subtitle="Example decision cycle · demo data" action={<span className={`pill ${activeIncident ? 'pill-red' : ''}`}><i/>{activeIncident ? 'IN PROGRESS' : 'ACTIVE'}</span>}/><div className="response-steps">{[['01','Observe signals', activeIncident ? `CPU ${metrics.cpu}% · latency ${metrics.latency.toLocaleString()} ms` : '5 signals · nominal'],['02','Detect anomaly', activeIncident ? 'Traffic 7.9× normal · errors 8.7%' : 'No unusual behavior detected'],['03','Estimate failure risk', `${metrics.risk}% · ${activeIncident ? 'elevated' : 'low'} prototype estimate`],['04', activeIncident ? 'Recommend action' : phase === 'recovered' ? 'Verify recovery' : 'Select response', activeIncident ? 'Scale Service A from 2 → 4' : phase === 'recovered' ? 'Scale-up successful · checks pass' : 'No action required']].map(([num, label, detail], i) => <div className={`response-step ${activeIncident && i === 3 ? 'step-pending' : ''}`} key={num}><div className="step-rail"><span>{activeIncident && i < 3 ? <Check size={12}/> : num}</span></div><div><b>{label}</b><small>{detail}</small></div></div>)}</div><button className="text-link response-link" onClick={() => navigate('architecture')}>Explore the control loop <ArrowRight size={14}/></button></article></section>
    <article className="panel insight-card"><span className="insight-icon"><Sparkles size={16}/></span><div><div className="insight-label">DEMO INSIGHT <span>RULE-BASED EXAMPLE</span></div><b>{activeIncident ? 'High traffic, CPU, latency, and error signals are present together.' : phase === 'recovered' ? 'The simulated scale-up is followed by improved service metrics.' : 'Infrastructure operating normally. No action required.'}</b><p>{activeIncident ? 'The brief’s example rule recommends scaling Service A from 2 to 4 instances. The shown 87% is a prototype risk estimate, not a model accuracy claim.' : phase === 'recovered' ? 'The example returns CPU to 58%, latency to 310 ms, errors to 0.8%, and estimated risk to 12%.' : 'This screen uses deterministic demo data and example rules. The brief describes anomaly detection and risk estimation as prototype implementation steps.'}</p></div></article>
    <section className="lower-grid"><article className="panel table-panel"><SectionHeading title="Monitored services" subtitle={`${services.length} services · us-east-1`} action={<button className="text-link" onClick={() => navigate('services')}>View fleet <ArrowRight size={14}/></button>}/><ServiceTable services={services.slice(0, 3)}/></article><article className="panel activity-panel"><SectionHeading title="Decision log" subtitle="A clear trail of simulated activity" action={<button className="text-link" onClick={() => navigate('incidents')}>View all <ArrowRight size={14}/></button>}/><div className="activity-list">{events.slice(0, 4).map((event) => <ActivityRow key={event.id} event={event}/>)}</div></article></section>
  </>;
}

function ServiceTable({ services, onRemove }) {
  return <div className="service-table"><div className="table-head"><span>SERVICE</span><span>HEALTH</span><span>INSTANCES</span><span>P95</span>{onRemove && <span/>}</div>{services.length ? services.map((s) => <div className="service-row" key={s.id}><div className="service-name"><span className="service-icon"><Server size={15}/></span><span><b>{s.name}</b><small>{s.endpoint}</small></span></div><span className={`health ${s.health === 'Degraded' ? 'health-alert' : ''}`}><i/>{s.health}</span><span className="mono">{s.instances} {s.instances === 1 ? 'instance' : 'instances'}</span><span className="mono">{s.latency >= 1000 ? `${(s.latency / 1000).toFixed(1)} s` : `${s.latency} ms`}</span>{onRemove && <button className="row-action" title={`Remove ${s.name}`} onClick={() => onRemove(s)}><Ellipsis size={17}/></button>}</div>) : <div className="empty-state"><Server size={20}/><b>No services match your search</b><span>Try a different name or endpoint.</span></div>}</div>;
}
function Services({ services, allCount, search, setSearch, add, remove }) {
  const healthy = services.filter((s) => s.health === 'Healthy').length;
  return <><div className="summary-strip"><div><span>MONITORED SERVICES</span><b>{allCount}</b><small>Across us-east-1</small></div><div><span>HEALTHY</span><b className="text-green">{services.filter((s) => s.health === 'Healthy').length}</b><small>Services responding</small></div><div><span>NEEDS ATTENTION</span><b className={services.length - healthy ? 'text-red' : ''}>{services.length - healthy}</b><small>Awaiting recovery</small></div><div><span>ACTIVE INSTANCES</span><b>{services.reduce((n, s) => n + s.instances, 0)}</b><small>Provisioned capacity</small></div></div><article className="panel table-panel fleet-panel"><SectionHeading title="Your service fleet" subtitle="Application, edge, and infrastructure services" action={<button className="button button-primary" onClick={add}><Plus size={15}/> Add service</button>}/><div className="table-toolbar"><label className="search-field"><Search size={16}/><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search services…"/></label><button className="button button-secondary" onClick={() => setSearch('')}><ListFilter size={15}/> Filter <span className="filter-count">All</span></button></div><ServiceTable services={services} onRemove={remove}/><div className="panel-foot"><span>Showing {services.length} services</span><span>Telemetry refreshes automatically <i className="status-dot"/></span></div></article></>;
}

function ActivityRow({ event }) {
  const Icon = event.type === 'critical' ? AlertTriangle : event.type === 'info' ? Activity : Check;
  const when = Date.now() - event.time < 60000 ? 'Just now' : new Intl.DateTimeFormat(undefined, { hour: '2-digit', minute: '2-digit' }).format(event.time);
  return <div className="activity-row"><span className={`activity-symbol ${event.type}`}><Icon size={13}/></span><div><b>{event.title}</b><small>{event.detail}</small></div><time>{when}</time></div>;
}

function Incidents({ events, filter, setFilter, phase, metrics, acknowledged, acknowledge, recover, simulate, navigate }) {
  const active = phase === 'spike';
  return <><div className="incident-overview"><div><div className="incident-kicker"><span className={`status-dot ${active ? 'dot-red pulse' : ''}`}/>{active ? 'ACTIVE SIMULATED INCIDENT' : 'INCIDENT STATUS'}</div><h2>{active ? 'Traffic surge on Service A' : phase === 'recovered' ? 'No active incidents · recovery verified' : 'Your services are looking good.'}</h2><p>{active ? 'The demo reproduces the brief’s example values: request volume rises while CPU, latency, and errors increase. The risk score is a prototype estimate from the scenario, not a trained model prediction.' : 'This local simulation records demo events and decisions. Start the example traffic spike to explore the response workflow.'}</p>{active && <div className="incident-tags"><span>INC-001</span><span>High simulated risk</span><span>Local scenario</span></div>}</div><div className="incident-score"><span>PROTOTYPE RISK ESTIMATE</span><b className={active ? 'text-red' : ''}>{metrics.risk}<small>%</small></b><i><em style={{ width: `${metrics.risk}%`, background: active ? 'var(--coral)' : undefined }}/></i><small>{active ? 'Example action suggested' : 'Demo baseline estimate'}</small></div></div>
    {active && <div className="incident-detail-grid"><article className="panel detail-panel"><SectionHeading title="Example response" subtitle="Scale Service A from 2 to 4 instances" action={<span className="pill pill-amber">OPERATOR CONFIRMATION</span>}/><p>Traffic has reached <b>950 requests per second</b> and response latency is <b>2,800 ms</b>. The project brief’s example rule recommends scaling when traffic, CPU, and latency are high.</p><div className="recommendation-metrics"><span><small>CPU</small><b className="text-red">{metrics.cpu}%</b></span><ArrowRight size={15}/><span><small>CAPACITY</small><b>2 <ArrowRight size={12}/> 4</b></span><ArrowRight size={15}/><span><small>BRIEF RECOVERY EXAMPLE</small><b>310 ms</b></span></div><div className="detail-actions"><button className="button button-primary" onClick={recover}><Zap size={15}/> Approve &amp; simulate scale-up</button><button className="button button-secondary" onClick={acknowledge} disabled={acknowledged}>{acknowledged ? <><Check size={15}/> Acknowledged</> : 'Acknowledge incident'}</button></div></article><article className="panel detail-panel"><SectionHeading title="Scenario signals" subtitle="Values from the provided project brief"/><div className="signal-list">{[['Request rate','950 req/s','Baseline: 120 req/s'],['CPU utilization','94%','Baseline: 42%'],['Response latency','2,800 ms','Baseline: 180 ms'],['Error rate','8.7%','Baseline: 0.4%']].map(([name, value, note]) => <div key={name}><span>{name}<small>{note}</small></span><b className="text-red">{value}</b></div>)}</div></article></div>}
    <article className="panel activity-panel incident-log"><SectionHeading title="Incident & decision history" subtitle="An auditable record of events and system actions" action={<select value={filter} onChange={(e) => setFilter(e.target.value)}><option>All</option><option>Critical</option><option>Resolved</option></select>}/>{events.length ? <div className="event-list">{events.map((event) => <ActivityRow key={event.id} event={event}/>)}</div> : <div className="empty-state"><CheckCircle2 size={23}/><b>No incidents found</b><span>Events will appear here as the system responds.</span></div>}</article>
    <div className="incident-bottom"><div><ShieldCheck size={17}/><span><b>Human approval stays in control</b><small>Recovery actions ask for approval before changing service capacity.</small></span></div>{!active && <button className="button button-secondary" onClick={() => phase === 'recovered' ? navigate('overview') : simulate()}>{phase === 'recovered' ? 'Back to overview' : <><Sparkles size={15}/> Simulate incident</>}</button>}</div>
  </>;
}

function Runbooks({ runbooks, setRunbooks, execute, phase, threshold }) {
  return <><div className="runbook-banner"><span className="runbook-banner-icon"><ShieldCheck size={22}/></span><div><b>Example actions from the project brief</b><p>Toggle each example, inspect its trigger, and try the Service A scale-up during the simulated traffic spike.</p></div><span className="pill"><i/>SIMULATION</span></div><div className="runbook-list">{runbooks.map((book, i) => <article className="panel runbook-card" key={book.id}><div className="runbook-number">0{i + 1}</div><div className="runbook-info"><div className="runbook-title"><h3>{book.name}</h3><span className={`pill ${book.enabled ? '' : 'pill-muted'}`}><i/>{book.enabled ? 'ENABLED' : 'DISABLED'}</span></div><p>{book.summary}</p><div className="runbook-specs"><span><small>TRIGGER EXAMPLE</small><b>{book.id === 'scale-out' ? `CPU > ${threshold}% + high traffic + high latency` : book.trigger}</b></span><span><small>EXAMPLE ACTION</small><b>{book.action}</b></span><span><small>PROTOTYPE POLICY</small><b>{book.approvals}</b></span></div></div><div className="runbook-actions"><button className={`toggle ${book.enabled ? 'on' : ''}`} aria-label={`${book.enabled ? 'Disable' : 'Enable'} ${book.name}`} aria-pressed={book.enabled} onClick={() => setRunbooks((list) => list.map((item) => item.id === book.id ? { ...item, enabled: !item.enabled } : item))}><i/></button><button className="button button-secondary" disabled={!book.enabled} onClick={() => execute(book)}>{phase === 'spike' && book.id === 'scale-out' ? 'Review action' : book.id === 'scale-out' ? 'Run example' : 'Preview example'}<ArrowRight size={14}/></button></div></article>)}</div><div className="runbook-note"><LockKeyhole size={16}/><p><b>Demo scope</b><br/>Only the Service A scale-up is simulated in this build. Restart, reroute, and scale-down are examples from the brief and do not perform an action.</p></div></>;
}

function Architecture() {
  const nodes = [{ icon: Cloud, label: 'Infrastructure', detail: 'Services & clusters' }, { icon: Activity, label: 'Observe signals', detail: 'CPU · latency · errors' }, { icon: AlertTriangle, label: 'Detect anomaly', detail: 'Baseline comparison' }, { icon: Gauge, label: 'Estimate risk', detail: 'Severity & impact' }, { icon: GitBranch, label: 'Select response', detail: 'Runbook suggestion' }, { icon: ShieldCheck, label: 'Approve & act', detail: 'Human in control' }, { icon: HeartPulse, label: 'Verify recovery', detail: 'Health checks' }];
  return <><article className="panel architecture-panel"><SectionHeading title="The closed-loop control path" subtitle="A transparent operational cycle, designed to keep people in control." action={<span className="pill"><i/>7 STAGES</span>}/><div className="flow-diagram">{nodes.map(({ icon: Icon, label, detail }, i) => <div className="diagram-group" key={label}><div className="diagram-node"><span><Icon size={18}/></span><b>{label}</b><small>{detail}</small></div>{i < nodes.length - 1 && <ArrowRight className="diagram-arrow" size={17}/>}</div>)}</div><div className="diagram-foot"><span><i className="status-dot"/>Deterministic scenario using local demo data.</span><span>PROJECT BRIEF · MONITOR → DETECT → ESTIMATE → DECIDE → ACT → VERIFY</span></div></article><section className="architecture-cards"><article className="panel architecture-card"><span className="service-icon"><Activity size={17}/></span><h3>Monitor &amp; detect</h3><p>Use CPU, memory, request rate, latency, and error rate to illustrate normal and anomalous behavior.</p><span className="card-index">01 — SIGNALS</span></article><article className="panel architecture-card"><span className="service-icon"><Sparkles size={17}/></span><h3>Estimate &amp; decide</h3><p>The demo uses explicit example rules. The brief describes a lightweight anomaly detector and a prototype risk estimate as future implementation steps.</p><span className="card-index">02 — EXAMPLE RULES</span></article><article className="panel architecture-card"><span className="service-icon"><ShieldCheck size={17}/></span><h3>Act &amp; verify</h3><p>Show the example Service A scale-up, then compare simulated readings with the brief’s recovery values.</p><span className="card-index">03 — SIMULATED RECOVERY</span></article></section><div className="callout"><CircleHelp size={17}/><span><b>Prototype scope</b><small>This build is a local interactive frontend. It has no live cloud connection, trained ML model, authentication service, or production data source. The displayed scenario is deterministic and based on the provided project brief.</small></span></div></>;
}

function SettingsPage({ threshold, setThreshold, phase, resetDemo, toast }) {
  return <div className="settings-grid"><div className="settings-nav panel"><span>WORKSPACE</span><button className="selected"><Settings size={16}/> General settings</button><button onClick={() => toast('Alert routing preferences are managed in General settings for this demo.')}><Bell size={16}/> Alerts &amp; routing</button><button onClick={() => toast('Integrations are not connected in the demo environment.')}><GitBranch size={16}/> Integrations</button></div><div className="settings-content"><article className="panel settings-panel"><SectionHeading title="Workspace profile" subtitle="The identity and region used across your workspace."/><div className="settings-field"><label>Workspace name</label><input value="Tech Titans" readOnly/><small>Workspace details are read-only in the demo build.</small></div><div className="settings-field"><label>Environment</label><div className="setting-static"><span className="status-dot"/>Simulation environment</div></div><div className="settings-field"><label>Primary region</label><div className="setting-static"><Network size={15}/> us-east-1 · Northern Virginia</div></div></article><article className="panel settings-panel"><SectionHeading title="Detection thresholds" subtitle="Tune when OPSYREX marks service usage for attention."/><div className="settings-field"><label>CPU anomaly threshold <b>{threshold}%</b></label><input className="range-input" type="range" min="60" max="99" value={threshold} onChange={(e) => setThreshold(Number(e.target.value))}/><div className="range-labels"><span>60% · Sensitive</span><span>99% · Conservative</span></div><small>Runbook triggers and the dashboard use your saved threshold.</small></div><div className="preference-row"><span><b>Approval before infrastructure changes</b><small>Require an operator to approve every simulated action.</small></span><span className="pill"><LockKeyhole size={12}/> ALWAYS ON</span></div></article><article className="panel settings-panel danger-zone"><SectionHeading title="Demo data" subtitle="Restore the original service fleet and healthy baseline."/><div className="preference-row"><span><b>{phase === 'spike' ? 'Incident in progress' : 'Current scenario'}</b><small>{phase === 'healthy' ? 'Healthy baseline' : phase === 'spike' ? 'Traffic spike · action recommended' : 'Recovery verified'}</small></span><button className="button button-secondary" onClick={resetDemo}><RefreshCw size={14}/> Reset simulation</button></div></article><div className="settings-saved"><CheckCircle2 size={15}/> Changes save automatically to this browser.</div></div></div>;
}

function Modal({ modal, close, addService, recover }) {
  useEffect(() => { const onKey = (e) => e.key === 'Escape' && close(); window.addEventListener('keydown', onKey); return () => window.removeEventListener('keydown', onKey); }, [close]);
  let title = modal.type === 'add-service' ? 'Add a service' : modal.type === 'approve' ? 'Approve recovery action' : 'About this workspace';
  return <div className="modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && close()}><section className="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title"><header><div><div className="eyebrow">OPSYREX / WORKSPACE</div><h2 id="modal-title">{title}</h2></div><button className="icon-button" onClick={close} aria-label="Close dialog"><X size={18}/></button></header>
    {modal.type === 'add-service' && <form onSubmit={(e) => { e.preventDefault(); addService(new FormData(e.currentTarget)); }}><p className="modal-copy">Add a service to your local monitoring fleet.</p><label className="form-field">Service name<input name="name" placeholder="e.g. Notifications API" required autoFocus maxLength={48}/></label><label className="form-field">Service endpoint<input name="endpoint" placeholder="e.g. Notifications API" maxLength={60}/></label><label className="form-field">Initial instances<select name="instances" defaultValue="2"><option value="1">1 instance</option><option value="2">2 instances</option><option value="3">3 instances</option><option value="4">4 instances</option></select></label><footer><button type="button" className="button button-secondary" onClick={close}>Cancel</button><button type="submit" className="button button-primary"><Plus size={15}/> Add service</button></footer></form>}
    {modal.type === 'approve' && <div><div className="approval-callout"><LockKeyhole size={17}/><span><b>{modal.runbook?.name}</b><small>{modal.runbook?.summary}</small></span></div><p className="modal-copy">Review this action before proceeding. In this demo, approval updates the local service simulation.</p><div className="approval-spec"><span>APPROVAL POLICY</span><b>Operator confirmation</b></div><footer><button className="button button-secondary" onClick={close}>Cancel</button><button className="button button-primary" onClick={recover}><Check size={15}/> Approve &amp; execute</button></footer></div>}
    {modal.type === 'about' && <div><p className="modal-copy">OPSYREX is Tech Titans’ autonomous cloud operations project for CodeAstra 2.0. Its stated aim is to detect, predict, recover, and automate. This build presents the deterministic traffic spike, example scale-up, and recovery values from the project brief.</p><div className="about-grid"><span><b>Build</b><small>Interactive frontend demo</small></span><span><b>Environment</b><small>Local simulation</small></span><span><b>Cloud connection</b><small>Not connected</small></span><span><b>Data storage</b><small>This browser, when available</small></span></div><div className="team-list"><b>TECH TITANS</b><div><span>Bhoomi</span><small>Team lead · backend &amp; cloud</small></div><div><span>Komal</span><small>Frontend · dashboard</small></div><div><span>Luvvkush</span><small>AI/ML · decision engine · pitch</small></div></div><footer><button className="button button-primary" onClick={close}>Got it</button></footer></div>}
  </section></div>;
}

export default App;
