// BareMinimum v4 - Supabase sync (client-side) 
import React, { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";

// Read env variables (Vite)
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || "https://noaykcttfgbnufrnyiow.supabase.co";
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5vYXlrY3R0ZmdibnVmcm55aW93Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI3MDc4NzQsImV4cCI6MjA3ODI4Mzg3NH0.vi3F82hV7rEqnZwLTk1TRWCCSv7MNbmxOg5A_CK67Ks";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const currency = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 });

function uid(){ return Math.random().toString(36).slice(2,9) }

export default function App(){
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [localData, setLocalData] = useState({ expenses: [] });
  const [form, setForm] = useState({ amount:'', mode:'UPI', merchant:'', category:'Groceries', note:'' });
  const [loading, setLoading] = useState(false);

  const localKey = (u) => `baremin_v4_local_${u || 'anon'}`;

  // Load local data (always)
  useEffect(()=>{ const raw = localStorage.getItem(localKey('anon')); if(raw) setLocalData(JSON.parse(raw)); },[]);

  // Auth state listener
  useEffect(()=>{
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if(session?.user){
        // when logged in, attempt sync: pull remote -> merge local; then push local unsynced
        fetchAndMerge(session.user.id);
      }
    });
    // check session on load
    supabase.auth.getSession().then(res=>{ setSession(res.data.session); setUser(res.data.session?.user ?? null); if(res.data.session?.user) fetchAndMerge(res.data.session.user.id); });
    return ()=>{ authListener.subscription.unsubscribe(); };
  },[]);

  // Save localData every change
  useEffect(()=>{ localStorage.setItem(localKey('anon'), JSON.stringify(localData)); },[localData]);

  // Basic signup/login functions
  async function signUp(email, password){
    setLoading(true);
    const { error } = await supabase.auth.signUp({ email, password });
    setLoading(false);
    if(error) alert(error.message); else alert('Check your email for confirmation (if required).');
  }

  async function signIn(email, password){
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if(error) alert(error.message);
  }

  async function signInWithGoogle(){
    const { data, error } = await supabase.auth.signInWithOAuth({ provider: 'google' });
    if(error) alert(error.message);
    // OAuth redirect handled by Supabase; auth listener handles session
  }

  async function signOut(){
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
  }

  // Fetch remote expenses and merge into local store (simple merge by id)
  async function fetchAndMerge(uid){
    setLoading(true);
    const { data, error } = await supabase.from('expenses').select('*').eq('owner', uid).order('timestamp', { ascending: false });
    setLoading(false);
    if(error) return alert('Error fetching remote: ' + error.message);
    const remote = data || [];
    const local = localData.expenses || [];
    const map = new Map();
    remote.forEach(r=> map.set(r.id, {...r, synced:true}));
    local.forEach(l=>{ if(!map.has(l.id)) map.set(l.id, {...l, synced: false}); });
    const merged = Array.from(map.values()).sort((a,b)=> new Date(b.timestamp) - new Date(a.timestamp));
    const next = { expenses: merged };
    setLocalData(next);
    localStorage.setItem(localKey(uid), JSON.stringify(next));
  }

  // Push unsynced local items to Supabase
  async function pushLocalToRemote(){
    if(!user) return;
    const unsynced = (localData.expenses || []).filter(e=> !e.synced);
    if(unsynced.length===0) return;
    setLoading(true);
    for(const item of unsynced){
      const { data, error } = await supabase.from('expenses').insert([{ owner: user.id, amount: item.amount, mode: item.mode, merchant: item.merchant, category: item.category, note: item.note, timestamp: item.timestamp, quick: item.quick }]).select().single();
      if(error){ console.error('push error', error); continue; }
      setLocalData(prev=>{ 
        const next = { ...prev, expenses: prev.expenses.map(x=> x.id===item.id ? {...data, synced:true} : x) };
        localStorage.setItem(localKey(user.id), JSON.stringify(next));
        return next;
      });
    }
    setLoading(false);
    fetchAndMerge(user.id);
  }

  // Add expense locally and attempt push if online
  async function addExpense(e){
    e && e.preventDefault();
    const amt = parseFloat(form.amount);
    if(!amt || amt<=0) return alert('Enter a valid amount');
    const now = new Date().toISOString();
    const item = { id: uid(), amount: amt, mode: form.mode, merchant: form.merchant || 'Unknown', category: form.category || 'Misc', note: form.note || '', timestamp: now, quick: false, synced: false };
    // quick detection
    item.quick = (item.merchant||'').toLowerCase().split(' ').some(w=> ['blinkit','zepto','dunzo','blink','quick','groceries'].includes(w));
    setLocalData(prev=> ({ ...prev, expenses: [item, ...prev.expenses] }));
    setForm({ amount:'', mode: form.mode, merchant:'', category: form.category, note:'' });
    // try push
    if(navigator.onLine && user){
      await pushLocalToRemote();
    }
  }

  // delete locally + remote if synced
  async function deleteExpense(id){
    if(!confirm('Delete this expense?')) return;
    const item = localData.expenses.find(x=> x.id===id);
    setLocalData(prev=> ({ ...prev, expenses: prev.expenses.filter(x=> x.id!==id) }));
    if(user && item && item.synced){
      await supabase.from('expenses').delete().eq('id', id);
    }
  }

  // UI
  return (
    <div className="container">
      <div className="header card">
        <div>
          <h2 style={{margin:0}}>BareMinimum • v4 (Supabase)</h2>
          <div className="small">Multi-device sync via Supabase • Google & Email login</div>
        </div>
        <div style={{display:'flex', gap:8}}>
          {user ? (
            <div style={{display:'flex', flexDirection:'column', alignItems:'flex-end'}}>
              <div className="small">Signed in as <strong>{user.email}</strong></div>
              <div style={{display:'flex', gap:6, marginTop:6}}>
                <button className="input" onClick={() => pushLocalToRemote()}>Sync now</button>
                <button className="input" onClick={() => signOut()}>Sign out</button>
              </div>
            </div>
          ) : (
            <AuthUI onSignInWithGoogle={() => signInWithGoogle()} onSignInEmail={(email,pw) => signIn(email,pw)} onSignUpEmail={(email,pw) => signUp(email,pw)} loading={loading} />
          )}
        </div>
      </div>

      <div style={{display:'grid', gridTemplateColumns:'1fr 340px', gap:12, marginTop:12}}>
        <div className="card">
          <h3 style={{marginTop:0}}>Add expense (local-first)</h3>
          <form onSubmit={(e) => addExpense(e)} style={{display:'grid', gap:8}}>
            <div style={{display:'flex', gap:8}}>
              <input className="input" placeholder="Amount (₹)" value={form.amount} onChange={(e) => setForm({...form, amount: e.target.value})} />
              <select className="input" value={form.mode} onChange={(e) => setForm({...form, mode: e.target.value})}>
                <option>UPI</option><option>Card</option><option>Cash</option><option>Netbanking</option>
              </select>
            </div>
            <input className="input" placeholder="Merchant" value={form.merchant} onChange={(e) => setForm({...form, merchant: e.target.value})} />
            <div style={{display:'flex', gap:8}}>
              <select className="input" value={form.category} onChange={(e) => setForm({...form, category: e.target.value})}>
                <option>Groceries</option><option>Canteen</option><option>Travel</option><option>Bill</option><option>Rent</option><option>Investment</option><option>Gym</option><option>Shopping</option><option>Misc</option>
              </select>
              <input className="input" placeholder="Note" value={form.note} onChange={(e) => setForm({...form, note: e.target.value})} />
            </div>
            <div style={{display:'flex', gap:8}}>
              <button className="button" type="submit">Add</button>
              <button className="input" type="button" onClick={() => setForm({ amount:'', mode: form.mode, merchant:'', category: form.category, note:'' })}>Clear</button>
            </div>
          </form>

          <div style={{marginTop:12}}>
            <h4>Local data (merged view)</h4>
            <div className="exp-list">
              {(localData.expenses || []).map(e=> (
                <div className="exp-item" key={e.id}>
                  <div>
                    <div style={{fontWeight:700}}>{currency.format(e.amount)} <span className="small">· {e.merchant}</span></div>
                    <div className="small">{e.category} · {new Date(e.timestamp).toLocaleString()}</div>
                    {e.note && <div className="small">{e.note}</div>}
                    {e.synced ? <div className="small">Synced</div> : <div className="small">Local only</div>}
                  </div>
                  <div style={{display:'flex', flexDirection:'column', gap:6}}>
                    <button className="input" onClick={() => {/* mark as cash locally */ setLocalData(prev=>({...prev, expenses: prev.expenses.map(x=> x.id===e.id? {...x, mode:'Cash'}: x)}))}}>Mark as cash</button>
                    <button className="input" onClick={() => deleteExpense(e.id)}>Delete</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="card">
          <h4 style={{marginTop:0}}>Sync & Insights</h4>
          <div className="small">Daily UPI (local view): <strong>{currency.format((localData.expenses||[]).filter(x=> new Date(x.timestamp) >= new Date(new Date().setHours(0,0,0,0)) && x.mode==='UPI').reduce((s,x)=>s+x.amount,0))}</strong></div>
          <div style={{marginTop:8}}>
            <button className="button" onClick={() => pushLocalToRemote()}>Push local unsynced → Supabase</button>
          </div>
          <div style={{marginTop:12}} className="small">Auto-sync occurs on sign-in. You can also hit Sync now. Offline adds are saved locally and uploaded when you sign in & go online.</div>
        </div>
      </div>

      <div style={{height:80}}></div>
    </div>
  );
}

// Simple Auth UI component (minimal)
function AuthUI({ onSignInWithGoogle, onSignInEmail, onSignUpEmail, loading }){
  const [email, setEmail] = useState('');
  const [pw, setPw] = useState('');
  return (
    <div style={{display:'flex', flexDirection:'column', gap:8}}>
      <button className="button" onClick={() => onSignInWithGoogle()}>Sign in with Google</button>
      <div style={{display:'flex', gap:8}}>
        <input className="input" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
        <input className="input" placeholder="Password" type="password" value={pw} onChange={(e) => setPw(e.target.value)} />
        <button className="input" onClick={() => onSignInEmail(email,pw)}>Sign in</button>
        <button className="input" onClick={() => onSignUpEmail(email,pw)}>Sign up</button>
      </div>
    </div>
  );
}
