import { useEffect, useMemo, useState } from 'react';
import type { FormEvent, ReactNode } from 'react';
import { QueryClient, QueryClientProvider, useQueryClient } from '@tanstack/react-query';
import { BrowserRouter, Link, Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import {
  ArrowDownRight, ArrowRight, Bookmark, Check, CheckCircle2, CircleHelp,
  ClipboardList, Compass, FileCheck2, Filter, LayoutDashboard, LogIn,
  LogOut, Menu, Search, ShieldCheck, Sparkles, Sprout, UserRound, X, MapPin,
} from 'lucide-react';
import {
  getGetCurrentUserQueryKey, getGetDashboardSummaryQueryKey, getGetProfileQueryKey,
  getGetSchemeMatchesQueryKey, getListSavedSchemesQueryKey, getListSchemesQueryKey,
  useDeleteSavedScheme, useGenerateSchemePlan, useGetCurrentUser, useGetDashboardSummary,
  useGetProfile, useGetSchemeMatches, useListSavedSchemes, useListSchemes, useLogin,
  useHealthCheck, useLogout, useRegister, useSaveProfile, useSaveScheme, useUpdateSavedScheme,
} from '@workspace/api-client-react';
import type {
  ApplicationPlan, ProfileInput, SavedScheme, SavedSchemeStatus, Scheme, SchemeMatch,
} from '@workspace/api-client-react';

const queryClient = new QueryClient({ defaultOptions: { queries: { retry: 1, staleTime: 20_000 } } });
const categories = ['Agriculture','Business','Education','Energy','Financial Inclusion','Healthcare','Housing','Insurance','Pension','Savings','Skills'];
const states = ['Andhra Pradesh','Arunachal Pradesh','Assam','Bihar','Chhattisgarh','Goa','Gujarat','Haryana','Himachal Pradesh','Jharkhand','Karnataka','Kerala','Madhya Pradesh','Maharashtra','Manipur','Meghalaya','Mizoram','Nagaland','Odisha','Punjab','Rajasthan','Sikkim','Tamil Nadu','Telangana','Tripura','Uttar Pradesh','Uttarakhand','West Bengal','Andaman and Nicobar Islands','Chandigarh','Dadra and Nagar Haveli and Daman and Diu','Delhi','Jammu and Kashmir','Ladakh','Lakshadweep','Puducherry'];

function Brand() {
  return <Link to="/" className="brand"><span className="brand-mark"><Sprout size={19}/></span><span>SchemeSetu</span></Link>;
}

function PublicNav() {
  const [userMenu, setUserMenu] = useState(false);
  const { data: user } = useGetCurrentUser({ query: { queryKey: getGetCurrentUserQueryKey(), retry: false } });
  const logout = useLogout();
  const client = useQueryClient();
  return <header className="topbar"><Brand/><nav className="navlinks">
    <Link to="/schemes">Explore schemes</Link><a href="/#how-it-works" className="optional">How it works</a>
    {user ? <><Link to="/dashboard">My space</Link><button className="button" onClick={() => logout.mutate(undefined, {onSuccess: () => {client.clear(); setUserMenu(false);}})}>{logout.isPending?'Signing out…':'Sign out'}</button></> :
      <><Link to="/login">Sign in</Link><Link to="/register" className="button">Get started <ArrowRight size={15}/></Link></>}
  </nav><button className="mobile-menu" aria-label="Open navigation" onClick={()=>setUserMenu(!userMenu)}><Menu/></button>
  {userMenu && <div className="mobile-nav"><Link to="/schemes">Explore schemes</Link><Link to="/dashboard">My space</Link><Link to="/profile">Eligibility profile</Link><Link to="/tracker">Application tracker</Link>{user?<button onClick={()=>logout.mutate(undefined,{onSuccess:()=>client.clear()})}>Sign out</button>:<Link to="/login">Sign in</Link>}</div>}</header>;
}

function LoadingCards({ count = 3 }: { count?: number }) {
  return <div className="scheme-grid">{Array.from({length:count},(_,i)=><div className="skeleton" key={i}/>)}</div>;
}
function QueryError({ retry }: { retry: () => void }) {
  return <div className="error-box" role="alert"><span>We couldn’t load this right now. Please try again.</span><button className="button soft" onClick={retry}>Retry</button></div>;
}
function EmptyState({ title, detail, action, href }: { title:string;detail:string;action?:string;href?:string }) {
  return <div className="empty"><Compass size={27}/><h3>{title}</h3><p>{detail}</p>{action&&href&&<Link to={href} className="button soft">{action}<ArrowRight size={15}/></Link>}</div>;
}

function SchemeCard({ scheme, matched = false, onSaved }: { scheme: Scheme | SchemeMatch; matched?: boolean; onSaved?: () => void }) {
  const save = useSaveScheme();
  const [savedMessage, setSavedMessage] = useState('');
  const matchedScheme = matched && 'match_score' in scheme ? scheme : null;
  return <article className="scheme-card" data-testid={`card-scheme-${scheme.id}`}>
    <span className="scheme-tag">{scheme.category}</span>
    {matchedScheme && <div className="match" style={{marginTop:12}}><span className="match-meter"><i style={{width:`${matchedScheme.match_score}%`}}/></span>{matchedScheme.match_score}% fit</div>}
    <h3>{scheme.name}</h3>
    <p>{scheme.description}</p>
    <div className="scheme-benefit"><strong>Benefit</strong> · {scheme.benefits}</div>
    {matchedScheme && matchedScheme.reasons_matched?.length>0&&<p style={{fontSize:11,marginTop:0}}>Good fit: {matchedScheme.reasons_matched.slice(0,2).join(' · ')}</p>}
    <div className="card-foot">
      <span className="small-label" style={{letterSpacing:'.08em'}}><MapPin size={12} style={{display:'inline',verticalAlign:'-2px'}}/> {scheme.states?.length ? scheme.states.slice(0,2).join(', ') : 'Across India'}</span>
      <button className="button soft" disabled={save.isPending} onClick={()=>save.mutate({data:{scheme_id:scheme.id,status:'saved'}},{onSuccess:()=>{setSavedMessage('Added to your tracker');onSaved?.();},onError:()=>setSavedMessage('Sign in to save this scheme')})}>
        {save.isPending?'Saving…':savedMessage||<><Bookmark size={14}/> Save</>}
      </button>
    </div>
    {save.isError&&<p role="alert" style={{color:'#a65146',fontSize:11,margin:'8px 0 0'}}>Could not save. Sign in and try again.</p>}
  </article>;
}

function Home() {
  const catalog = useListSchemes({sort:'benefit'});
  const health = useHealthCheck();
  return <div className="page-wrap"><PublicNav/><section className="hero">
    <div className="hero-inner"><div className="eyebrow">A clearer path to public support</div>
      <h1>Good schemes.<br/>Made <em>for you.</em></h1>
      <p>India’s government schemes, translated into clear next steps. Tell us a little about yourself and find the support you may be entitled to.</p>
      <div className="hero-actions"><Link to="/register" className="button">Find my schemes <ArrowRight size={16}/></Link><Link to="/schemes" className="button outline">Browse all schemes</Link></div>
    </div>
    <div className="hero-aside"><strong>One guide.</strong><span>Less searching. More moving forward.</span><div style={{height:1,background:'#d9d8ca',margin:'15px 0'}}/><div style={{fontSize:12,color:'#65736c'}}>Clear eligibility · Document checklist · Application tracker</div></div>
  </section>
  <main>
    <section className="section container" id="how-it-works"><div className="section-head"><div><div className="small-label">A simpler way through</div><h2>From “could I?”<br/>to “here’s how.”</h2></div><p>SchemeSetu helps you make sense of the details that matter: who qualifies, what to gather, and where to apply.</p></div>
      <div className="feature-strip"><div className="feature"><div className="feature-number">01</div><h3>Share what matters</h3><p>A few details about your circumstances help us find relevant support.</p></div><div className="feature"><div className="feature-number">02</div><h3>See your best fits</h3><p>Understand why schemes match, with eligibility explained in plain language.</p></div><div className="feature"><div className="feature-number">03</div><h3>Take the next step</h3><p>Keep documents, progress and application notes together in one place.</p></div></div>
    </section>
    <section className="section" style={{background:'#eeeee5'}}><div className="container">
      <div className="section-head"><div><div className="small-label">Start exploring</div><h2>Support worth knowing.</h2></div><Link className="button outline" to="/schemes">View scheme directory <ArrowRight size={15}/></Link></div>
      {catalog.isLoading?<LoadingCards count={3}/>:catalog.isError?<QueryError retry={()=>catalog.refetch()}/>:catalog.data?.length?<div className="scheme-grid">{catalog.data.slice(0,3).map(s=><SchemeCard key={s.id} scheme={s}/>)}</div>:<EmptyState title="The scheme directory is being refreshed" detail="Please check back soon, or explore again in a moment."/>}
    </div></section>
    <section className="section container"><div className="panel" style={{display:'grid',gridTemplateColumns:'1fr auto',gap:25,alignItems:'center',background:'#e8ece2',padding:32}}>
      <div><div className="small-label">Your next step can be simple</div><h2 style={{fontSize:32,margin:'10px 0'}}>Make your eligibility profile work for you.</h2><p style={{color:'#68776c',maxWidth:540,lineHeight:1.6}}>Create an account and discover public support that fits your life, not just a long list of rules.</p></div>
      <Link to="/register" className="button">Get started <ArrowRight size={16}/></Link>
    </div></section>
    <footer className="container" style={{padding:'22px 0 32px',borderTop:'1px solid #e1e1d7',color:'#7b867d',display:'flex',justifyContent:'space-between',fontSize:12}}><Brand/><span><i className={health.isError?'health-dot offline':'health-dot'}/>{health.isError?'Service status unavailable':'Scheme information is provided for guidance. Please confirm details with the official source.'}</span></footer>
  </main></div>;
}

function AuthPage({ mode }: { mode:'login'|'register' }) {
  const navigate = useNavigate();
  const [form,setForm] = useState({name:'',email:'',password:''});
  const [error,setError] = useState('');
  const client=useQueryClient();
  const login=useLogin();
  const register=useRegister();
  const submitting=login.isPending||register.isPending;
  const submit=(e:FormEvent<HTMLFormElement>)=>{
    e.preventDefault();setError('');
    const done=(res:{user:{id:number,name:string,email:string,created_at:string}})=>{client.setQueryData(getGetCurrentUserQueryKey(),res.user);navigate('/dashboard');};
    if(mode==='login') login.mutate({data:{email:form.email,password:form.password}},{onSuccess:done,onError:(e)=>setError((e as Error).message||'Unable to sign in. Check your details and try again.')});
    else register.mutate({data:{name:form.name,email:form.email,password:form.password}},{onSuccess:done,onError:(e)=>setError((e as Error).message||'Unable to create your account. Please try again.')});
  };
  return <div className="auth-page"><section className="auth-story"><Brand/><div><div className="eyebrow">SchemeSetu · Your public-service guide</div><h1>Clarity for the support you deserve.</h1><p>Government schemes can open doors. We help you find the right ones, understand the requirements and keep your application moving.</p></div><div className="auth-quote">“The first step is knowing what’s available. The next one should be clear.”</div></section>
    <section className="auth-form-side"><div className="auth-card"><div className="small-label">{mode==='login'?'Welcome back':'Start with a few details'}</div><h2>{mode==='login'?'Sign in':'Create your account'}</h2><p>{mode==='login'?'Pick up where you left off.':'A personal guide to schemes that may fit your circumstances.'}</p>
      <form className="auth-fields" onSubmit={submit}>
        {mode==='register'&&<div className="field"><label htmlFor="name">Full name</label><input id="name" className="input" required minLength={1} autoComplete="name" value={form.name} onChange={e=>setForm({...form,name:e.target.value})} placeholder="Your name"/></div>}
        <div className="field"><label htmlFor="email">Email address</label><input id="email" className="input" required type="email" autoComplete="email" value={form.email} onChange={e=>setForm({...form,email:e.target.value})} placeholder="you@example.com"/></div>
        <div className="field"><label htmlFor="password">Password</label><input id="password" className="input" required type="password" minLength={8} autoComplete={mode==='login'?'current-password':'new-password'} value={form.password} onChange={e=>setForm({...form,password:e.target.value})} placeholder="At least 8 characters"/></div>
        {error&&<div className="error-box" role="alert">{error}</div>}
        <button className="button" type="submit" disabled={submitting}>{submitting?'Please wait…':mode==='login'?'Sign in securely':'Create account'} <ArrowRight size={16}/></button>
      </form><div className="auth-note">{mode==='login'?'New to SchemeSetu? ':'Already have an account? '}<Link to={mode==='login'?'/register':'/login'} style={{color:'#315a4d',fontWeight:700}}>{mode==='login'?'Create an account':'Sign in'}</Link></div>
      <div className="auth-note" style={{marginTop:28,display:'flex',alignItems:'center',justifyContent:'center',gap:6}}><ShieldCheck size={14}/> Your information is used to check eligibility.</div>
    </div></section></div>;
}

const navItems=[{path:'/dashboard',label:'Overview',Icon:LayoutDashboard},{path:'/matches',label:'Find schemes',Icon:Compass},{path:'/tracker',label:'My tracker',Icon:ClipboardList},{path:'/profile',label:'Eligibility profile',Icon:UserRound}];
function AppShell({children}:{children:ReactNode}) {
  const { pathname: path } = useLocation();
  const [open,setOpen]=useState(false);
  const {data:user,isLoading}=useGetCurrentUser();
  const logout=useLogout();const client=useQueryClient();const navigate=useNavigate();
  return <div className="app-shell">
    <aside className={`sidebar ${open?'open':''}`}><Brand/><nav className="side-nav">{navItems.map(({path:href,label,Icon})=><Link key={href} to={href} className={path===href?'active':''} onClick={()=>setOpen(false)}><Icon size={17}/>{label}</Link>)}</nav>
      <div className="side-bottom"><div style={{fontSize:12,color:'#c2d1c5',padding:'0 10px 7px'}}>A more informed next step.</div><button onClick={()=>logout.mutate(undefined,{onSuccess:()=>{client.clear();navigate('/');}})} className="side-nav-link"><LogOut size={16}/>{logout.isPending?'Signing out…':'Sign out'}</button></div></aside>
    <div className="main-area"><div className="dash-top"><div style={{display:'flex',alignItems:'center',gap:10}}><button className="mobile-menu" onClick={()=>setOpen(!open)} aria-label="Toggle menu"><Menu/></button><div><strong style={{fontSize:14}}>Your SchemeSetu</strong><br/><small>Find the support that fits.</small></div></div>
      <div className="user-chip">{isLoading?<span className="pulse-text">Loading account…</span>:user?.name?<><span>{user.name}</span><div className="avatar">{user.name.slice(0,1).toUpperCase()}</div></>:<Link to="/login" className="button soft"><LogIn size={14}/> Sign in</Link>}</div>
    </div>{children}</div>
  </div>;
}

function PageHeading({eyebrow,title,description,action}:{eyebrow:string;title:string;description:string;action?:React.ReactNode}) {
  return <div className="page-title"><div><div className="small-label">{eyebrow}</div><h1>{title}</h1><p>{description}</p></div>{action}</div>;
}
function Dashboard() {
  const summary=useGetDashboardSummary();
  const profile=useGetProfile();
  const {data:user}=useGetCurrentUser();
  const recent=summary.data?.recent_saved||[];
  const complete=summary.data?.profile_complete??!!profile.data?.profile;
  return <AppShell><main className="content">
    <PageHeading eyebrow="Your overview" title={`Good to see you${user?.name?`, ${user.name.split(' ')[0]}`:''}.`} description="A clear view of your eligibility and the steps you’re taking." action={<Link className="button" to={complete?'/matches':'/profile'}>{complete?'See my matches':'Complete my profile'}<ArrowRight size={15}/></Link>}/>
    {!complete&&<div className="panel" style={{marginBottom:20,background:'#e8ece2',display:'flex',alignItems:'center',justifyContent:'space-between',gap:18}}><div><div className="small-label">Make it personal</div><h2 style={{margin:'7px 0'}}>Complete your eligibility profile</h2><p style={{margin:0,color:'#718078',fontSize:13}}>Your details help us show schemes that are relevant to you.</p></div><Link to="/profile" className="button">Add details <ArrowRight size={15}/></Link></div>}
    {summary.isLoading?<><div className="stat-grid">{[1,2,3,4].map(n=><div className="skeleton" style={{height:96}} key={n}/>)}</div><div className="skeleton"/></>:summary.isError?<QueryError retry={()=>summary.refetch()}/>:<>
      <div className="stat-grid"><div className="stat"><span>Matched schemes</span><strong>{summary.data?.total_matches ?? '—'}</strong></div><div className="stat"><span>Saved for later</span><strong>{summary.data?.saved ?? '—'}</strong></div><div className="stat"><span>Applications started</span><strong>{summary.data?.applied ?? '—'}</strong></div><div className="stat"><span>Approved</span><strong>{summary.data?.approved ?? '—'}</strong></div></div>
      <div className="panel"><div className="panel-header"><h2>Recently saved</h2><Link to="/tracker" style={{fontSize:12,color:'#315a4d',textDecoration:'none',fontWeight:700}}>Open tracker <ArrowRight size={13} style={{verticalAlign:'-3px'}}/></Link></div>
        {recent.length===0?<EmptyState title="Your tracker starts here" detail="Save a scheme that interests you and keep the next steps close." action="Explore matched schemes" href="/schemes"/>:
          recent.map(item=><div className="tracker-row" key={item.id}><div><span className={`status-pill status-${item.status}`}>{item.status}</span><h3 style={{marginTop:8}}>{item.scheme.name}</h3><p>{item.scheme.category} · Saved {new Date(item.created_at).toLocaleDateString()}</p></div><Link to="/tracker" className="button soft">View details <ArrowRight size={14}/></Link></div>)}
      </div>
    </>}
    {profile.isError&&<p style={{color:'#9a594d',fontSize:12,marginTop:15}}>Eligibility profile could not be loaded. <Link to="/profile">Try again</Link></p>}
  </main></AppShell>;
}

function SchemeSearch({matched=false}:{matched?:boolean}) {
  const [q,setQ]=useState('');const [category,setCategory]=useState('');const [state,setState]=useState('');
  const listParams=useMemo(()=>({q:q||undefined,category:category||undefined,state:state||undefined,sort:'name' as const}),[q,category,state]);
  const matchParams=useMemo(()=>({q:q||undefined,category:category||undefined,state:state||undefined,sort:'score' as const}),[q,category,state]);
  const list=useListSchemes(listParams,{query:{enabled:!matched,queryKey:getListSchemesQueryKey(listParams)}});
  const matches=useGetSchemeMatches(matchParams,{query:{enabled:matched,queryKey:getGetSchemeMatchesQueryKey(matchParams)}});
  const data=matched?matches.data:list.data;const isLoading=matched?matches.isLoading:list.isLoading;const isError=matched?matches.isError:list.isError;const refetch=matched?matches.refetch:list.refetch;
  const content = <main className="content">
    <PageHeading eyebrow={matched?'Picked for your profile':'Scheme directory'} title={matched?'Your possible matches':'Explore schemes'} description={matched?'Schemes ranked by how closely they fit your eligibility details.':'Search public support by name, category or state.'} action={matched?<Link to="/profile" className="button outline"><UserRound size={15}/> Edit profile</Link>:undefined}/>
    {matched&&<div className="panel" style={{marginBottom:18,padding:15,display:'flex',gap:11,alignItems:'center',fontSize:12,color:'#65736c'}}><Sparkles size={17} color="#a98047"/> Match scores are a guide based on the profile details you’ve shared. Check the official scheme rules before applying.</div>}
    <div className="toolbar"><div className="searchbox"><Search size={17}/><input className="input" type="search" aria-label="Search schemes" placeholder="Search schemes or support…" value={q} onChange={e=>setQ(e.target.value)} data-testid="input-scheme-search"/></div>
      <select className="select" aria-label="Filter by category" value={category} onChange={e=>setCategory(e.target.value)}><option value="">All categories</option>{categories.map(c=><option key={c}>{c}</option>)}</select>
      <select className="select" aria-label="Filter by state" value={state} onChange={e=>setState(e.target.value)}><option value="">All states</option>{states.map(s=><option key={s}>{s}</option>)}</select>
    </div>
    {isLoading?<LoadingCards count={4}/>:isError?<QueryError retry={()=>refetch()}/>:data?.length?<><div style={{fontSize:12,color:'#7d887f',marginBottom:13}}>{data.length} scheme{data.length===1?'':'s'} found</div><div className="scheme-grid">{data.map(s=><SchemeCard key={s.id} scheme={s} matched={matched}/>)}</div></>:<EmptyState title="No schemes found for these filters" detail="Try another search term or broaden your filters." action="Clear filters" href={matched?'/matches':'/schemes'}/>}
  </main>;
  return matched ? <AppShell>{content}</AppShell> : <div className="page-wrap"><PublicNav/>{content}</div>;
}

function MatchesPage() {
  const profile = useGetProfile();
  if (profile.isLoading) {
    return <AppShell><main className="content"><div className="skeleton" style={{height:320}}/></main></AppShell>;
  }
  if (profile.isError) {
    return <AppShell><main className="content"><QueryError retry={()=>profile.refetch()}/></main></AppShell>;
  }
  if (!profile.data?.profile) {
    return <AppShell><main className="content">
      <PageHeading eyebrow="A more personal search" title="See schemes that fit" description="Add a few eligibility details first. We use those details for rule-based matches, not AI decisions."/>
      <div className="panel" style={{background:'#e8ece2',display:'flex',alignItems:'center',justifyContent:'space-between',gap:18}}>
        <div><div className="small-label">One quick step</div><h2 style={{margin:'7px 0'}}>Complete your eligibility profile</h2><p style={{margin:0,color:'#718078',fontSize:13}}>Your profile helps us compare your details with the scheme rules in our directory.</p></div>
        <Link to="/profile" className="button">Add details <ArrowRight size={15}/></Link>
      </div>
    </main></AppShell>;
  }
  return <SchemeSearch matched/>;
}

const defaultProfile:ProfileInput={age:0,gender:'',state:'',annual_income:0,category:'',occupation:'',is_student:false,is_farmer:false,has_disability:false};
function ProfilePage() {
  const profile=useGetProfile();
  const save=useSaveProfile();
  const client=useQueryClient();
  const [form,setForm]=useState<ProfileInput>(defaultProfile);
  const [initialized,setInitialized]=useState(false);
  const [notice,setNotice]=useState('');
  useEffect(()=>{if(profile.data&&!initialized){if(profile.data.profile)setForm({
    age:profile.data.profile.age,gender:profile.data.profile.gender,state:profile.data.profile.state,annual_income:profile.data.profile.annual_income,
    category:profile.data.profile.category,occupation:profile.data.profile.occupation,is_student:profile.data.profile.is_student,is_farmer:profile.data.profile.is_farmer,has_disability:profile.data.profile.has_disability,
  });setInitialized(true);}},[profile.data,initialized]);
  const update=(key:keyof ProfileInput,value:string|boolean)=>setForm(current=>({...current,[key]:key==='age'||key==='annual_income'?Number(value):value}));
  const submit=(event:FormEvent)=>{event.preventDefault();setNotice('');save.mutate({data:form},{onSuccess:(value)=>{client.setQueryData(getGetProfileQueryKey(),{profile:value});client.invalidateQueries({queryKey:getGetSchemeMatchesQueryKey()});client.invalidateQueries({queryKey:getGetDashboardSummaryQueryKey()});setNotice('Your eligibility profile is up to date.');},onError:()=>setNotice('We couldn’t save those details. Please try again.')});};
  return <AppShell><main className="content"><PageHeading eyebrow="About your circumstances" title="Eligibility profile" description="A few details help us point you toward relevant support."/>
    {profile.isLoading?<div className="skeleton" style={{height:480}}/>:profile.isError?<QueryError retry={()=>profile.refetch()}/>:<form className="panel" onSubmit={submit}>
      <div className="small-label">Personal details</div><p style={{fontSize:12,color:'#77847c',margin:'6px 0 22px'}}>Fields marked as required help us check basic eligibility. Your details stay in your account.</p>
      <div className="form-grid">
        <div className="field"><label htmlFor="age">Age</label><input id="age" className="input" type="number" min="0" max="120" required value={form.age||''} onChange={e=>update('age',e.target.value)} placeholder="Your age"/></div>
        <div className="field"><label htmlFor="gender">Gender</label><select id="gender" className="select" required value={form.gender} onChange={e=>update('gender',e.target.value)}><option value="">Choose an option</option><option>Female</option><option>Male</option><option>Other</option><option>Prefer not to say</option></select></div>
        <div className="field"><label htmlFor="state">State or union territory</label><select id="state" className="select" required value={form.state} onChange={e=>update('state',e.target.value)}><option value="">Select your state</option>{states.map(s=><option key={s}>{s}</option>)}</select></div>
        <div className="field"><label htmlFor="income">Annual household income (₹)</label><input id="income" className="input" type="number" min="0" required value={form.annual_income||''} onChange={e=>update('annual_income',e.target.value)} placeholder="For example, 250000"/></div>
        <div className="field"><label htmlFor="category">Social category</label><select id="category" className="select" required value={form.category} onChange={e=>update('category',e.target.value)}><option value="">Choose a category</option><option>General</option><option>SC</option><option>ST</option><option>OBC</option><option>EWS</option><option>Other</option></select></div>
        <div className="field"><label htmlFor="occupation">Occupation</label><input id="occupation" className="input" required value={form.occupation} onChange={e=>update('occupation',e.target.value)} placeholder="For example, artisan, teacher"/></div>
      </div>
      <div style={{marginTop:24}}><div className="small-label">Also applies to you</div><div className="form-grid" style={{marginTop:8}}>
        {([{key:'is_student',label:'I am currently a student'},{key:'is_farmer',label:'I work in agriculture or farming'},{key:'has_disability',label:'I have a disability'}] as const).map(({key,label})=><label className="check-row" key={key}><input type="checkbox" checked={form[key]} onChange={e=>update(key,e.target.checked)}/>{label}</label>)}
      </div></div>
      <div className="form-actions"><span style={{fontSize:12,color:notice.includes('up to date')?'#31704c':'#a65146'}}>{notice}</span><button className="button" disabled={save.isPending}>{save.isPending?'Saving profile…':<><Check size={15}/> Save profile</>}</button></div>
    </form>}
  </main></AppShell>;
}

function Tracker() {
  const saved=useListSavedSchemes();
  const update=useUpdateSavedScheme();
  const remove=useDeleteSavedScheme();
  const generate=useGenerateSchemePlan();
  const client=useQueryClient();
  const [filter,setFilter]=useState('all');
  const [activePlan,setActivePlan]=useState<{title:string;plan:ApplicationPlan}|null>(null);
  const [planError,setPlanError]=useState('');
  const rows=saved.data?.filter(item=>filter==='all'||item.status===filter)||[];
  const invalidate=()=>{client.invalidateQueries({queryKey:getListSavedSchemesQueryKey()});client.invalidateQueries({queryKey:getGetDashboardSummaryQueryKey()});};
  const updateStatus=(row:SavedScheme,status:SavedSchemeStatus)=>update.mutate({id:row.id,data:{status}},{onSuccess:invalidate});
  const createPlan=(row:SavedScheme)=>{setPlanError('');generate.mutate({id:row.scheme_id},{onSuccess:plan=>{setActivePlan({title:row.scheme.name,plan});invalidate();},onError:()=>setPlanError('We couldn’t prepare this plan right now. Please try again.')});};
  return <AppShell><main className="content"><PageHeading eyebrow="Your progress" title="Application tracker" description="Keep promising schemes, notes and application progress together." action={<Link to="/matches" className="button"><Compass size={15}/> Find schemes</Link>}/>
    <div className="toolbar"><Filter size={16} color="#718078"/><select className="select" aria-label="Filter tracker status" value={filter} onChange={e=>setFilter(e.target.value)}><option value="all">All statuses</option><option value="saved">Saved</option><option value="applied">Applied</option><option value="approved">Approved</option><option value="rejected">Not approved</option></select></div>
    {saved.isLoading?<div className="skeleton" style={{height:350}}/>:saved.isError?<QueryError retry={()=>saved.refetch()}/>:rows.length?<div className="panel">{rows.map(row=><TrackerRow key={row.id} row={row} onStatus={status=>updateStatus(row,status)} onDelete={()=>{if(window.confirm(`Remove ${row.scheme.name} from your tracker?`))remove.mutate({id:row.id},{onSuccess:invalidate});}} onPlan={()=>createPlan(row)} onViewPlan={()=>row.ai_plan&&setActivePlan({title:row.scheme.name,plan:row.ai_plan})} busy={update.isPending||remove.isPending||generate.isPending}/>)}</div>:<EmptyState title={filter==='all'?'No schemes in your tracker yet':`No ${filter} schemes`} detail={filter==='all'?'Save a scheme to keep it close and track each next step.':'Schemes with this status will appear here.'} action="Explore schemes" href="/schemes"/>}
    {(update.isError||remove.isError||planError)&&<div className="error-box" style={{marginTop:14}} role="alert">{planError||'That change could not be saved. Please try again.'}<button className="button soft" onClick={()=>{setPlanError('');update.reset();remove.reset();}}>Dismiss</button></div>}
    {activePlan&&<PlanDialog title={activePlan.title} plan={activePlan.plan} onClose={()=>setActivePlan(null)}/>}
  </main></AppShell>;
}
function TrackerRow({row,onStatus,onDelete,onPlan,onViewPlan,busy}:{row:SavedScheme;onStatus:(s:SavedSchemeStatus)=>void;onDelete:()=>void;onPlan:()=>void;onViewPlan:()=>void;busy:boolean}) {
  const [note,setNote]=useState(row.notes||'');
  const [noteSaved,setNoteSaved]=useState(true);
  const update=useUpdateSavedScheme();
  const client=useQueryClient();
  const saveNote=()=>update.mutate({id:row.id,data:{notes:note}},{onSuccess:()=>{setNoteSaved(true);client.invalidateQueries({queryKey:getListSavedSchemesQueryKey()});}});
  return <div className="tracker-row"><div>
    <span className={`status-pill status-${row.status}`}>{row.status}</span><h3 style={{marginTop:8}}>{row.scheme.name}</h3><p>{row.scheme.category} · Updated {new Date(row.updated_at).toLocaleDateString()}</p>
    <div style={{display:'flex',alignItems:'center',gap:8,marginTop:12}}><select className="select" style={{padding:'8px 10px',minHeight:35}} value={row.status} onChange={e=>onStatus(e.target.value as SavedSchemeStatus)} aria-label={`Update ${row.scheme.name} status`}><option value="saved">Saved</option><option value="applied">Applied</option><option value="approved">Approved</option><option value="rejected">Not approved</option></select><a href={row.scheme.apply_url} target="_blank" rel="noreferrer" className="text-link">Official application <ArrowDownRight size={13}/></a></div>
    <div style={{display:'flex',gap:8,marginTop:12,maxWidth:550}}><input className="input" value={note} onChange={e=>{setNote(e.target.value);setNoteSaved(false);}} placeholder="Add a private note…" aria-label={`Notes for ${row.scheme.name}`}/><button className="button soft" disabled={noteSaved||update.isPending} onClick={saveNote}>{update.isPending?'Saving…':'Save note'}</button></div>
    {row.ai_plan&&<button className="plain-action" onClick={onViewPlan}><FileCheck2 size={14}/> View application plan</button>}
  </div><div className="tracker-actions"><button className="button soft" disabled={busy} onClick={onPlan}><Sparkles size={14}/>{row.ai_plan?'Refresh plan':'Make a plan'}</button><button className="icon-button" disabled={busy} aria-label={`Remove ${row.scheme.name}`} onClick={onDelete}><X size={16}/></button></div>
  </div>;
}
function PlanDialog({title,plan,onClose}:{title:string;plan:ApplicationPlan;onClose:()=>void}) {
  return <div className="modal-backdrop" onMouseDown={e=>{if(e.target===e.currentTarget)onClose();}}><section className="modal" role="dialog" aria-modal="true" aria-label="Application plan"><div className="modal-top"><div><div className="small-label">Your application guide</div><h2>{title}</h2></div><button className="icon-button" onClick={onClose} aria-label="Close plan"><X size={17}/></button></div>
    <div className="panel" style={{padding:15,background:'#e9eee5'}}><strong style={{fontSize:12}}>Scheme overview</strong><p style={{fontSize:13,lineHeight:1.6,color:'#617168',margin:'7px 0 0'}}>{plan.overview}</p></div>
    <h3 style={{fontSize:17,margin:'23px 0 7px'}}>Steps to take</h3><ol className="plan-list">{plan.steps.map((item,i)=><li key={i}>{item}</li>)}</ol>
    <h3 style={{fontSize:17,margin:'23px 0 7px'}}>Documents to prepare</h3><ul className="plan-list">{plan.documents_checklist.map((item,i)=><li key={i}><CheckCircle2 size={13} style={{display:'inline',marginRight:7,color:'#508367'}}/>{item}</li>)}</ul>
    {plan.tips.length>0&&<><h3 style={{fontSize:17,margin:'23px 0 7px'}}>Helpful tips</h3><ul className="plan-list">{plan.tips.map((item,i)=><li key={i}>{item}</li>)}</ul></>}
    {plan.warnings.length>0&&<div className="error-box" style={{marginTop:18}}><div><strong>Keep in mind</strong><ul style={{margin:'6px 0 0',paddingLeft:18}}>{plan.warnings.map((item,i)=><li key={i}>{item}</li>)}</ul></div></div>}
    <div style={{textAlign:'right',marginTop:22}}><button className="button" onClick={onClose}>Done</button></div>
  </section></div>;
}

function LandingCatalog() { return <SchemeSearch/>; }
function NotFound() { return <div className="page-wrap"><PublicNav/><main className="content"><div className="empty"><CircleHelp size={28}/><h3>We couldn’t find that page</h3><p>The page may have moved, or the address may be incomplete.</p><Link className="button" to="/">Return home</Link></div></main></div>; }
function RouteGuard({children}:{children:ReactNode}) {
  const user=useGetCurrentUser();
  if(user.isLoading)return <div className="page-wrap"><main className="content"><div className="small-label">Checking your account</div><div className="skeleton" style={{height:280,marginTop:18}}/></main></div>;
  if(user.isError||!user.data)return <Navigate to="/login" replace/>;
  return <>{children}</>;
}
function RoutedApp() {
  return <Routes>
    <Route path="/" element={<Home/>}/>
    <Route path="/login" element={<AuthPage mode="login"/>}/>
    <Route path="/register" element={<AuthPage mode="register"/>}/>
    <Route path="/dashboard" element={<RouteGuard><Dashboard/></RouteGuard>}/>
    <Route path="/profile" element={<RouteGuard><ProfilePage/></RouteGuard>}/>
    <Route path="/schemes" element={<LandingCatalog/>}/>
    <Route path="/matches" element={<RouteGuard><MatchesPage/></RouteGuard>}/>
    <Route path="/tracker" element={<RouteGuard><Tracker/></RouteGuard>}/>
    <Route path="*" element={<NotFound/>}/>
  </Routes>;
}
function App() {
  return <QueryClientProvider client={queryClient}><BrowserRouter basename={import.meta.env.BASE_URL.replace(/\/$/,'')}><RoutedApp/></BrowserRouter></QueryClientProvider>;
}
export default App;
