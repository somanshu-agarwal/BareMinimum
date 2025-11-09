// BareMinimum v2 - Multi-profile local expense tracker
import React, { useEffect, useState } from "react";

const QUICK_COMMERCE_KEYWORDS = [
  "blinkit","zepto","zepto.co","grocery","quick","groceries","insta","blink","dunzo"
];

const formatDateTime = (iso) => {
  try {
    const d = new Date(iso);
    return d.toLocaleString();
  } catch(e) { return iso }
}

const startOfDayISO = (date) => {
  const d = new Date(date);
  d.setHours(0,0,0,0);
  return d.toISOString();
}

const storageKeyForProfile = (profile) => `baremin_profile_${profile}`;

function uid(){ return Math.random().toString(36).slice(2,9) }

export default function App(){
  const [profiles, setProfiles] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("baremin_profiles") || "[]");
    } catch(e){ return []; }
  });
  const [activeProfile, setActiveProfile] = useState(profiles[0] || "");
  const [data, setData] = useState({ expenses: [], limits: { daily:0, weekly:0 }, impulseLockMinutes:15 });
  const [form, setForm] = useState({ amount:"", mode:"UPI", merchant:"", category:"Misc", note:"" });
  const [monthFilter, setMonthFilter] = useState("all");

  // Load profile data when activeProfile changes
  useEffect(()=>{
    if(!activeProfile) return;
    const key = storageKeyForProfile(activeProfile);
    try {
      const raw = localStorage.getItem(key);
      if(raw){
        setData(JSON.parse(raw));
      } else {
        setData({ expenses: [], limits:{daily:0,weekly:0}, impulseLockMinutes:15 });
      }
    } catch(e){
      setData({ expenses: [], limits:{daily:0,weekly:0}, impulseLockMinutes:15 });
    }
  }, [activeProfile]);

  // Save data whenever it changes (and profile exists)
  useEffect(()=>{
    if(!activeProfile) return;
    const key = storageKeyForProfile(activeProfile);
    localStorage.setItem(key, JSON.stringify(data));
  }, [data, activeProfile]);

  // Profiles list persistence
  useEffect(()=>{
    localStorage.setItem("baremin_profiles", JSON.stringify(profiles));
  }, [profiles]);

  function createProfile(name){
    if(!name) return alert("Enter a profile name");
    if(profiles.includes(name)) { setActiveProfile(name); return; }
    const next = [...profiles, name];
    setProfiles(next);
    setActiveProfile(name);
    // initialize empty data in storage
    localStorage.setItem(storageKeyForProfile(name), JSON.stringify({ expenses: [], limits:{daily:0,weekly:0}, impulseLockMinutes:15 }));
  }

  function deleteProfile(name){
    if(!confirm(`Delete profile ${name} and all its local data? This cannot be undone.`)) return;
    const next = profiles.filter(p=>p!==name);
    setProfiles(next);
    localStorage.removeItem(storageKeyForProfile(name));
    if(activeProfile===name){ setActiveProfile(next[0] || ""); setData({ expenses: [], limits:{daily:0,weekly:0}, impulseLockMinutes:15 }); }
  }

  function addExpense(e){
    e && e.preventDefault();
    const amt = parseFloat(form.amount);
    if(!amt || amt<=0) return alert("Enter a valid amount");
    const now = new Date();
    const isQuick = QUICK_COMMERCE_KEYWORDS.some(k=> form.merchant.toLowerCase().includes(k));
    const item = {
      id: uid(),
      amount: amt,
      mode: form.mode,
      merchant: form.merchant || "Unknown",
      category: form.category || "Misc",
      note: form.note || "",
      timestamp: now.toISOString(),
      quick: !!isQuick
    };
    setData(prev=>({ ...prev, expenses: [item, ...prev.expenses] }));
    setForm({ amount:"", mode: form.mode, merchant:"", category: form.category, note:"" });
  }

  function deleteExpense(id){
    if(!confirm("Delete this expense?")) return;
    setData(prev=>({ ...prev, expenses: prev.expenses.filter(x=>x.id!==id) }));
  }

  function markAsCash(id){
    setData(prev=>({ ...prev, expenses: prev.expenses.map(x=> x.id===id ? {...x, mode:"Cash"} : x) }));
  }

  // Computations
  const today = new Date();
  const todayISOstart = startOfDayISO(today);
  const sameDay = (iso, dayStartISO) => new Date(iso) >= new Date(dayStartISO) && new Date(iso) < new Date(new Date(dayStartISO).getTime() + 24*60*60*1000);

  const expensesFilteredByMonth = (()=>{
    if(monthFilter==="all") return data.expenses;
    const sel = parseInt(monthFilter,10);
    return data.expenses.filter(x => new Date(x.timestamp).getMonth() === sel);
  })();

  const dailyExpenses = data.expenses.filter(x => sameDay(x.timestamp, todayISOstart));
  const dailyUPI = dailyExpenses.filter(x=> x.mode==="UPI").reduce((s,x)=> s + x.amount, 0);

  const monthIndex = monthFilter==="all" ? null : parseInt(monthFilter,10);
  const monthlyExpenses = monthIndex===null ? data.expenses : data.expenses.filter(x => new Date(x.timestamp).getMonth()===monthIndex);
  const monthlyTotal = monthlyExpenses.reduce((s,x)=> s + x.amount, 0);
  const dailyTotal = dailyExpenses.reduce((s,x)=> s + x.amount, 0);

  // UI small helpers
  const monthOptions = [{label:"All months", val:"all"}].concat(Array.from({length:12}).map((_,i)=>({label: new Date(2020, i, 1).toLocaleString(undefined, {month: 'long'}), val: String(i)})));


  return (
    <div className="container">
      <div className="header">
        <div>
          <h2 style={{margin:0}}>BareMinimum • v2</h2>
          <div className="small">Live minimal • track UPI & cash • local-only profiles</div>
        </div>

        <div className="row">
          <label className="small">Profile:</label>
          <select className="input profile-select" value={activeProfile} onChange={e=>setActiveProfile(e.target.value)}>
            <option value="">-- choose profile --</option>
            {profiles.map(p=> <option key={p} value={p}>{p}</option>)}
          </select>
          <button className="input" onClick={()=>{
            const name = prompt("Create profile name (e.g. Somanshu / Guest):");
            if(name) createProfile(name.trim());
          }}>New</button>
          {activeProfile && <button className="input" onClick={()=>deleteProfile(activeProfile)}>Delete</button>}
        </div>
      </div>

      {!activeProfile ? (
        <div className="card">
          <div style={{marginBottom:8}}>No profile selected. Create a simple local profile to separate data for different users (no passwords).</div>
          <div className="row">
            <input className="input" placeholder="Quick profile name" id="profileName" />
            <button className="button" onClick={()=>{
              const el = document.getElementById("profileName");
              if(el && el.value) createProfile(el.value.trim());
            }}>Create profile</button>
          </div>
          <div className="footer-small">Profiles are stored locally in your browser only. To share your app across devices you'd need a cloud backup (optional).</div>
        </div>
      ) : (
        <>
          <div style={{display:'grid', gridTemplateColumns:'1fr 320px', gap:12}}>
            <div className="card">
              <h3 style={{marginTop:0}}>Add expense</h3>
              <form onSubmit={addExpense} style={{display:'grid', gap:8}}>
                <div style={{display:'flex', gap:8}}>
                  <input className="input" placeholder="Amount (₹)" value={form.amount} onChange={e=>setForm({...form, amount:e.target.value})} autoFocus />
                  <select className="input" value={form.mode} onChange={e=>setForm({...form, mode:e.target.value})}>
                    <option>UPI</option>
                    <option>Card</option>
                    <option>Cash</option>
                    <option>Netbanking</option>
                  </select>
                </div>
                <input className="input" placeholder="Merchant (blinkit / store name)" value={form.merchant} onChange={e=>setForm({...form, merchant:e.target.value})} />
                <input className="input" placeholder="Category (e.g. Food, Travel)" value={form.category} onChange={e=>setForm({...form, category:e.target.value})} />
                <input className="input" placeholder="Note (why did I buy?)" value={form.note} onChange={e=>setForm({...form, note:e.target.value})} />
                <div style={{display:'flex', gap:8}}>
                  <button className="button" type="submit">Add expense</button>
                  <button className="input" type="button" onClick={()=>{
                    if(confirm("Start a 30 minute cooling-off (this is only a nudge, you can still add expenses)?")){
                      alert("Cooling-off noted — use it to pause and rethink impulse buys.");
                    }
                  }}>Start 30m cooling</button>
                </div>
              </form>

              <div style={{marginTop:12}}>
                <div className="small">Tip: Prefer cash for small daily purchases. Use "Mark as cash" on an item if you paid cash later.</div>
              </div>
            </div>

            <div className="card">
              <h4 style={{marginTop:0}}>Quick summary</h4>
              <div className="small">Profile: <strong>{activeProfile}</strong></div>
              <div style={{marginTop:8}}>Today total: <strong>₹{dailyTotal.toFixed(2)}</strong></div>
              <div style={{marginTop:6}}>This month total: <strong>₹{monthlyTotal.toFixed(2)}</strong></div>
              <div style={{marginTop:6}}>UPI today: <strong>{dailyUPI.toFixed(2)}</strong> {dailyUPI>400 && <span className="alert"> • Alert: UPI > ₹400 today</span>}</div>
              <div style={{marginTop:8}}><label className="small">Filter month:</label>
                <select className="input" value={monthFilter} onChange={e=>setMonthFilter(e.target.value)}>
                  {monthOptions.map(m=> <option key={m.val} value={m.val}>{m.label}</option>)}
                </select>
              </div>
            </div>
          </div>

          <div style={{display:'flex', gap:12, marginTop:12}}>
            <div style={{flex:1}} className="card">
              <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                <h3 style={{margin:0}}>Expenses ({expensesFilteredByMonth.length})</h3>
                <div className="small">Showing: {monthFilter==="all" ? "All months" : monthOptions.find(m=>m.val===monthFilter)?.label}</div>
              </div>

              <div style={{marginTop:8}}>
                <div className="row" style={{gap:6}}>
                  <button className="input" onClick={()=>{ setData(prev=>({ ...prev, expenses: prev.expenses.slice().sort((a,b)=> new Date(b.timestamp)-new Date(a.timestamp)) })) }}>Sort newest</button>
                  <button className="input" onClick={()=>{ setData(prev=>({ ...prev, expenses: prev.expenses.slice().sort((a,b)=> new Date(a.timestamp)-new Date(b.timestamp)) })) }}>Sort oldest</button>
                </div>
              </div>

              <div className="exp-list">
                {expensesFilteredByMonth.length===0 && <div className="small" style={{padding:12}}>No expenses yet for this month.</div>}
                {expensesFilteredByMonth.map(e=> (
                  <div className="exp-item" key={e.id}>
                    <div>
                      <div style={{fontWeight:700}}>₹{e.amount.toFixed(2)} <span className="small" style={{marginLeft:8}}>· {e.merchant}</span></div>
                      <div className="small">{e.category} · {formatDateTime(e.timestamp)}</div>
                      {e.note && <div style={{marginTop:6}} className="small">{e.note}</div>}
                      {e.quick && <div style={{marginTop:6}} className="tag">Quick-commerce flagged</div>}
                    </div>
                    <div style={{display:'flex', flexDirection:'column', gap:6, alignItems:'flex-end'}}>
                      <button className="input" onClick={()=>markAsCash(e.id)}>Mark as cash</button>
                      <button className="input" onClick={()=>deleteExpense(e.id)}>Delete</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div style={{width:320}} className="card">
              <h4 style={{marginTop:0}}>Insights</h4>
              <div style={{marginBottom:8}}>Monthly total: <strong>₹{monthlyTotal.toFixed(2)}</strong></div>
              <div style={{marginBottom:8}}>Daily total: <strong>₹{dailyTotal.toFixed(2)}</strong></div>
              <div style={{marginBottom:8}}>UPI today: <strong>₹{dailyUPI.toFixed(2)}</strong> {dailyUPI>400 ? <div className="alert">Limit exceeded</div> : <div className="small">Under ₹400</div>}</div>
              <hr />
              <h5 style={{marginBottom:6}}>Small rituals</h5>
              <ol className="small">
                <li>Set a daily small cash allowance and record withdrawals.</li>
                <li>Before UPI, pause for 15 minutes and consider cash if needed.</li>
                <li>Flag quick-commerce merchants and review spend weekly.</li>
              </ol>
              <div className="footer-small">Data is local to this device and profile only.</div>
            </div>
          </div>
        </>
      )}

    </div>
  );
}
