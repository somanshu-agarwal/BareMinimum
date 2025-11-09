// BareMinimum - UPI & Expense Tracker
import React, { useState, useEffect } from 'react';

const QUICK_COMMERCE_KEYWORDS = [
  'blinkit','zepto','zepto.co','grocery','quick','groceries','insta','blink','dunzo'
];

const defaultState = {
  expenses: [],
  limits: { daily: 0, weekly: 0 },
  impulseLockMinutes: 15,
  savingsGoal: 0,
};

function uid(){return Math.random().toString(36).slice(2,9)}

export default function App(){
  const [state, setState] = useState(()=>{
    try{ return JSON.parse(localStorage.getItem('baremin_state')) || defaultState }catch(e){ return defaultState }
  });
  const [form, setForm] = useState({amount:'', mode:'UPI', merchant:'', category:'Misc', note:'', date: new Date().toISOString().slice(0,10)});
  const [impulseBlockedUntil, setImpulseBlockedUntil] = useState(null);
  const [filter, setFilter] = useState('all');

  useEffect(()=>{ localStorage.setItem('baremin_state', JSON.stringify(state)) },[state]);
  useEffect(()=>{
    if(impulseBlockedUntil){
      const t = setInterval(()=>{
        if(new Date() > new Date(impulseBlockedUntil)) setImpulseBlockedUntil(null);
      },1000);
      return ()=>clearInterval(t);
    }
  },[impulseBlockedUntil]);

  function addExpense(e){
    e && e.preventDefault();
    const amt = parseFloat(form.amount);
    if(!amt || amt<=0) return alert('Enter valid amount');

    if(form.mode === 'UPI' && impulseBlockedUntil && new Date() < new Date(impulseBlockedUntil)){
      return alert('Impulse control: wait a bit before recording more UPI expenses.');
    }

    const isQuick = QUICK_COMMERCE_KEYWORDS.some(k=> form.merchant.toLowerCase().includes(k));
    const item = { id: uid(), amount: amt, mode: form.mode, merchant: form.merchant || 'Unknown', category: form.category, note: form.note, date: form.date, quick: !!isQuick };
    setState(prev=>({ ...prev, expenses: [item, ...prev.expenses] }));

    if(isQuick){
      if(confirm('This looks like a quick-commerce purchase. Start a 30-min cooling-off?')){
        const until = new Date(Date.now() + 30*60*1000);
        setImpulseBlockedUntil(until.toISOString());
      }
    }
    setForm({...form, amount:'', merchant:'', note:''});
  }

  function startCooling(minutes){
    const until = new Date(Date.now() + minutes*60*1000);
    setImpulseBlockedUntil(until.toISOString());
    alert('Cooling-off started for '+minutes+' minutes');
  }

  function exportCSV(){
    const rows = [['id','date','amount','mode','merchant','category','note','quick']].concat(state.expenses.map(x=>[x.id,x.date,x.amount,x.mode,x.merchant,x.category,x.note,x.quick]));
    const csv = rows.map(r=>r.map(cell=>`"${String(cell).replace(/"/g,'""')}"`).join(',')).join('\n');
    const blob = new Blob([csv],{type:'text/csv'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href=url; a.download='baremin-expenses.csv'; a.click(); URL.revokeObjectURL(url);
  }

  function deleteExpense(id){ if(!confirm('Delete this expense?')) return; setState(prev=>({ ...prev, expenses: prev.expenses.filter(e=>e.id!==id) })) }

  const todayStr = new Date().toISOString().slice(0,10);
  const todays = state.expenses.filter(e=> e.date === todayStr);
  const thisWeek = (()=>{
    const now = new Date(); const day = now.getDay(); const start = new Date(now); start.setDate(now.getDate()-day); start.setHours(0,0,0,0);
    return state.expenses.filter(e=> new Date(e.date) >= start);
  })();
  const total = state.expenses.reduce((s,e)=>s+e.amount,0);
  const cashTotal = state.expenses.filter(e=>e.mode==='Cash').reduce((s,e)=>s+e.amount,0);
  const upiTotal = state.expenses.filter(e=>e.mode!=='Cash').reduce((s,e)=>s+e.amount,0);
  const quickTotal = state.expenses.filter(e=>e.quick).reduce((s,e)=>s+e.amount,0);

  const visible = state.expenses.filter(e=> filter==='all' ? true : (filter==='quick' ? e.quick : e.mode===filter));

  return (
    <div style={{fontFamily:'Inter, system-ui, sans-serif', maxWidth:980, margin:'18px auto', padding:16}}>
      <h1>BareMinimum — UPI & Expense Tracker</h1>
      <p>Track UPI/cash/card, stop impulse buys, encourage cash, and save more.</p>

      <form onSubmit={addExpense}>
        <input value={form.amount} onChange={e=>setForm({...form, amount:e.target.value})} placeholder="Amount"/>
        <select value={form.mode} onChange={e=>setForm({...form, mode:e.target.value})}><option>UPI</option><option>Card</option><option>Cash</option></select>
        <input value={form.merchant} onChange={e=>setForm({...form, merchant:e.target.value})} placeholder="Merchant"/>
        <input value={form.note} onChange={e=>setForm({...form, note:e.target.value})} placeholder="Note"/>
        <button type="submit">Add</button>
      </form>

      <button onClick={()=>startCooling(state.impulseLockMinutes)}>Start {state.impulseLockMinutes}m Cooling</button>
      <button onClick={exportCSV}>Export CSV</button>

      <h3>Expenses ({state.expenses.length})</h3>
      {visible.map(e=>(
        <div key={e.id}>
          ₹{e.amount} - {e.merchant} [{e.mode}] {e.quick?'(Quick)':''}
          <button onClick={()=>deleteExpense(e.id)}>X</button>
        </div>
      ))}

      <h3>Summary</h3>
      <div>Total: ₹{total} | Cash: ₹{cashTotal} | UPI/Card: ₹{upiTotal} | Quick: ₹{quickTotal}</div>
    </div>
  );
}
