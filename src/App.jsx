
// BareMinimum v6.1 - Polished build with improved auth and UX
import React, { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || "https://noaykcttfgbnufrnyiow.supabase.co";
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || "";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const DEFAULT_TAGS = ["Groceries","Canteen","Travel","Bill","Rent","Investment","Gym","Shopping","Misc"];
const currency = new Intl.NumberFormat('en-IN',{style:'currency',currency:'INR',maximumFractionDigits:0});

function uid(){ return Math.random().toString(36).slice(2,9) }
function formatDateOnly(iso){ const d=new Date(iso); return d.toLocaleDateString(); }
function formatDateTime(iso){ const d=new Date(iso); return d.toLocaleString(); }
function startOfToday(){ const d=new Date(); d.setHours(0,0,0,0); return d; }

const storageProfilesKey = "baremin_profiles_v6";
function storageKey(profile){ return `baremin_v6_${profile}`; }

export default function App(){
  const [dark, setDark] = useState(false);
  const [profiles, setProfiles] = useState(()=>{ try{ return JSON.parse(localStorage.getItem(storageProfilesKey)||"[]") }catch(e){return []} });
  const [active, setActive] = useState(profiles[0]||"");
  const [data, setData] = useState({expenses:[],settings:{}});
  const [form, setForm] = useState({amount:"",mode:"UPI",merchant:"",category:"Groceries",note:""});
  const now = new Date();
  const [month, setMonth] = useState(String(now.getMonth()));
  const [year, setYear] = useState(String(now.getFullYear()));
  const [lastAddedId, setLastAddedId] = useState(null);
  const [showToast, setShowToast] = useState(false);
  const [sortOrder, setSortOrder] = useState("newest");
  const [user, setUser] = useState(null);
  const [loadingAuth, setLoadingAuth] = useState(true);
  const [authView, setAuthView] = useState("login"); // login | signup
  const [authEmail, setAuthEmail] = useState("");
  const [authPw, setAuthPw] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [message, setMessage] = useState(null);

  // auth listener + session restore
  useEffect(()=>{
    supabase.auth.getSession().then(res=>{ setUser(res.data.session?.user ?? null); setLoadingAuth(false); if(res.data.session?.user) fetchAndMerge(res.data.session.user.id); });
    const { data:listener } = supabase.auth.onAuthStateChange((event, session)=>{
      setUser(session?.user ?? null);
      if(session?.user) fetchAndMerge(session.user.id);
    });
    return ()=> listener.subscription.unsubscribe();
  },[]);

  useEffect(()=>{ localStorage.setItem(storageProfilesKey, JSON.stringify(profiles)) }, [profiles]);
  useEffect(()=>{ if(!active) return; const raw = localStorage.getItem(storageKey(active)); if(raw) setData(JSON.parse(raw)); else setData({expenses:[],settings:{}}); }, [active]);
  useEffect(()=>{ if(!active) return; localStorage.setItem(storageKey(active), JSON.stringify(data)); }, [data, active]);

  // Profiles
  function createProfile(name){ if(!name) return alert("Enter profile name"); if(profiles.includes(name)){ setActive(name); return; } const next=[...profiles,name]; setProfiles(next); setActive(name); localStorage.setItem(storageKey(name), JSON.stringify({expenses:[],settings:{}})); }
  function deleteProfile(name){ if(!confirm(`Delete profile ${name} and all data?`)) return; setProfiles(p=>p.filter(x=>x!==name)); localStorage.removeItem(storageKey(name)); if(active===name){ setActive(""); setData({expenses:[],settings:{}}); } }

  // Add expense locally + try push remote if signed in
  async function addExpense(e){ e && e.preventDefault(); const amt = parseFloat(form.amount); if(!amt || amt<=0) return alert("Enter valid amount"); const nowIso = new Date().toISOString(); const item = { id: uid(), amount: amt, mode: form.mode, merchant: form.merchant||"Unknown", category: form.category||"Misc", note: form.note||"", timestamp: nowIso, quick:false, synced:false }; item.quick = (item.merchant||"").toLowerCase().split(' ').some(w=> ['blinkit','zepto','dunzo','blink'].includes(w)); setData(prev=>({ ...prev, expenses:[item,...prev.expenses] })); setLastAddedId(item.id); setShowToast(true); setTimeout(()=>setShowToast(false),4000); setForm({ amount:"", mode: form.mode, merchant:"", category: form.category, note:"" }); if(user && navigator.onLine) await pushLocalToRemote(); }

  function undoLast(){ if(!lastAddedId) return; setData(prev=>({ ...prev, expenses: prev.expenses.filter(x=> x.id!==lastAddedId) })); setLastAddedId(null); setShowToast(false); }

  function deleteExpense(id){ if(!confirm("Delete this expense?")) return; setData(prev=>({ ...prev, expenses: prev.expenses.filter(x=> x.id!==id) })); if(user) supabase.from('expenses').delete().eq('id', id).then(()=> fetchAndMerge(user.id)).catch(()=>{}); }

  function editExpenseMode(id, newMode){ setData(prev=> ({ ...prev, expenses: prev.expenses.map(x=> x.id===id ? {...x, mode:newMode, synced:false} : x) })); }

  // Derived lists
  const expensesSorted = data.expenses.slice().sort((a,b)=> sortOrder==="newest" ? new Date(b.timestamp)-new Date(a.timestamp) : new Date(a.timestamp)-new Date(b.timestamp));

  const years = Array.from(new Set(data.expenses.map(e=> new Date(e.timestamp).getFullYear()))).sort((a,b)=>b-a);
  if(!years.includes(new Date().getFullYear())) years.unshift(new Date().getFullYear());
  const yearOptions = ["all", ...years.map(String)];

  const filtered = expensesSorted.filter(e=>{ if(month!=="all"){ if(new Date(e.timestamp).getMonth() !== parseInt(month,10)) return false } if(year!=="all"){ if(new Date(e.timestamp).getFullYear() !== parseInt(year,10)) return false } return true });

  const grouped = {};
  filtered.forEach(e=>{ const d = formatDateOnly(e.timestamp); if(!grouped[d]) grouped[d]=[]; grouped[d].push(e); });

  // Totals and summaries
  const todayStart = startOfToday();
  const dailyExpenses = data.expenses.filter(e=> new Date(e.timestamp) >= todayStart);
  const dailyUPI = dailyExpenses.filter(e=> e.mode==="UPI").reduce((s,x)=> s + x.amount, 0);
  const dailyTotal = dailyExpenses.reduce((s,x)=> s + x.amount, 0);
  const monthlyTotal = filtered.reduce((s,x)=> s + x.amount, 0);

  const typeTotals = { Cash:0, UPI:0, Card:0, Netbanking:0, Other:0 };
  filtered.forEach(e=>{ const k = ["Cash","UPI","Card","Netbanking"].includes(e.mode) ? e.mode : "Other"; typeTotals[k] = (typeTotals[k]||0) + e.amount });

  const categoryTotals = {};
  filtered.forEach(e=> { categoryTotals[e.category] = (categoryTotals[e.category] || 0) + e.amount });
  const categoryList = Object.keys(categoryTotals).map(k=> ({k, v: categoryTotals[k]})).sort((a,b)=> b.v - a.v);

  const monthLabel = month==="all" ? (year==="all" ? "All time" : `${year}`) : `${new Date(2020, parseInt(month,10), 1).toLocaleString(undefined,{month:'short'})} ${ year==="all" ? "" : year }`.trim();

  // Supabase sync functions
  async function fetchAndMerge(uid){ try{ const { data:remote, error } = await supabase.from('expenses').select('*').eq('owner', uid).order('timestamp', {ascending:false}); if(error) throw error; const local = data.expenses || []; const map = new Map(); remote.forEach(r=> map.set(r.id, {...r, synced:true})); local.forEach(l=>{ if(!map.has(l.id)) map.set(l.id, {...l, synced:false}) }); const merged = Array.from(map.values()).sort((a,b)=> new Date(b.timestamp)-new Date(a.timestamp)); setData({ expenses: merged, settings: data.settings }); localStorage.setItem(storageKey(uid), JSON.stringify({expenses:merged,settings:data.settings})); }catch(err){ console.error(err); } }

  async function pushLocalToRemote(){ if(!user) return; const unsynced = (data.expenses||[]).filter(e=> !e.synced); if(unsynced.length===0) return; for(const item of unsynced){ try{ const { data:inserted, error } = await supabase.from('expenses').insert([{ owner: user.id, amount: item.amount, mode: item.mode, merchant: item.merchant, category: item.category, note: item.note, timestamp: item.timestamp, quick: item.quick }]).select().single(); if(error) console.error(error); else{ setData(prev=> ({ ...prev, expenses: prev.expenses.map(x=> x.id===item.id ? {...inserted, synced:true} : x) })); } }catch(e){ console.error(e); } } fetchAndMerge(user.id); }

  // Auth helpers
  async function signUp(email, password){ setMessage(null); if(!email||!password) return setMessage({type:'error',text:'Enter email & password'}); if(password.length<6) return setMessage({type:'error',text:'Password must be at least 6 chars'}); const { error } = await supabase.auth.signUp({ email, password }); if(error) setMessage({type:'error',text:error.message}); else setMessage({type:'success',text:'Check your email to confirm/sign in'}); }

  async function signIn(email, password){ setMessage(null); const { error } = await supabase.auth.signInWithPassword({ email, password }); if(error) setMessage({type:'error',text:error.message}); }

  async function signInWithGoogle(){ setMessage(null); const { error } = await supabase.auth.signInWithOAuth({ provider: 'google' }); if(error) setMessage({type:'error',text:error.message}); }

  async function signOut(){ await supabase.auth.signOut(); setUser(null); setMessage({type:'info',text:'Signed out'}); }

  async function resetPassword(email){ if(!email) return setMessage({type:'error',text:'Enter your email'}); const { error } = await supabase.auth.resetPasswordForEmail(email); if(error) setMessage({type:'error',text:error.message}); else setMessage({type:'success',text:'Reset email sent'}); }

  // small helpers
  function showMsg(m){ setMessage(m); setTimeout(()=>setMessage(null),4000); }

  // UI
  if(loadingAuth) return (<div className="container"><div className="card small">Loading auth…</div></div>);

  if(!user) return (
    <div className={"container "+(dark?'dark':'') }>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:12}}>
        <div>
          <div className="logo">💸</div>
          <div className="small">Track less, live more 🌿</div>
        </div>
        <div className="switch">
          <label className="small">Dark</label>
          <input type="checkbox" checked={dark} onChange={e=>setDark(e.target.checked)} />
        </div>
      </div>

  ... (truncated) ...

  )
}