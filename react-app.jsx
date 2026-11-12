const { useState, useEffect, useMemo } = React;

function currency(n){
  return "₹" + Number(n||0).toLocaleString("en-IN", { maximumFractionDigits: 0 });
}

// Reusable hook: subscribes to the shared LedgrStore so any component
// re-renders whenever the transaction data changes, from anywhere.
function useLedgrEntries(){
  const [entries, setEntries] = useState(() => LedgrStore.get());
  useEffect(() => {
    const unsubscribe = LedgrStore.subscribe(setEntries);
    return unsubscribe;
  }, []);
  return entries;
}

// Reusable hook: persists a small piece of UI state to localStorage.
// Used here for search/sort preferences (NOT the transaction data itself,
// which stays in the single "ledgr_entries" key via LedgrStore).
function useLocalStorage(key, initialValue){
  const [value, setValue] = useState(() => {
    try{
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : initialValue;
    }catch(e){ return initialValue; }
  });
  useEffect(() => {
    try{ localStorage.setItem(key, JSON.stringify(value)); }catch(e){}
  }, [key, value]);
  return [value, setValue];
}

/* ---------------- 6.1 React Analytics ---------------- */
function FinancialAnalytics({ entries }){
  const stats = useMemo(() => {
    const income = entries.filter(e => e.type === "income");
    const expense = entries.filter(e => e.type === "expense");
    const totalIncome = income.reduce((s,e) => s + Number(e.amount), 0);
    const totalExpense = expense.reduce((s,e) => s + Number(e.amount), 0);
    const savings = totalIncome - totalExpense;
    const savingsPct = totalIncome > 0 ? (savings / totalIncome) * 100 : 0;
    const avgExpense = expense.length ? totalExpense / expense.length : 0;
    const highestExpense = expense.reduce((m,e) => Math.max(m, Number(e.amount)), 0);
    const highestIncome = income.reduce((m,e) => Math.max(m, Number(e.amount)), 0);

    const monthly = {};
    entries.forEach(e => {
      const m = e.date.slice(0,7);
      if(!monthly[m]) monthly[m] = { income: 0, expense: 0 };
      monthly[m][e.type] += Number(e.amount);
    });
    const months = Object.keys(monthly).sort();

    return { totalIncome, totalExpense, savings, savingsPct, avgExpense, highestExpense, highestIncome, count: entries.length, months, monthly };
  }, [entries]);

  const maxMonthly = Math.max(1, ...stats.months.map(m => Math.max(stats.monthly[m].income, stats.monthly[m].expense)));

  return (
    <div>
      <div className="section-title">
        <span>Financial Analytics<span className="react-badge">React</span></span>
      </div>

      <div className="analytics-grid">
        <div className="analytics-stat">
          <div className="a-label">Transactions</div>
          <div className="a-value mono">{stats.count}</div>
        </div>
        <div className="analytics-stat">
          <div className="a-label">Average Expense</div>
          <div className="a-value mono">{currency(stats.avgExpense)}</div>
        </div>
        <div className="analytics-stat">
          <div className="a-label">Highest Expense</div>
          <div className="a-value mono expense">{currency(stats.highestExpense)}</div>
        </div>
        <div className="analytics-stat">
          <div className="a-label">Highest Income</div>
          <div className="a-value mono income">{currency(stats.highestIncome)}</div>
        </div>
        <div className="analytics-stat">
          <div className="a-label">Savings</div>
          <div className="a-value mono">{currency(stats.savings)}</div>
        </div>
        <div className="analytics-stat">
          <div className="a-label">Savings Rate</div>
          <div className="a-value mono">{stats.savingsPct.toFixed(1)}%</div>
        </div>
      </div>

      {stats.months.length > 0 ? (
        <div>
          <div className="monthly-chart">
            {stats.months.map(m => (
              <div className="month-col" key={m}>
                <div className="bars">
                  <div className="bar income-bar" style={{ height: (stats.monthly[m].income / maxMonthly * 100) + "%" }} title={"Income: " + currency(stats.monthly[m].income)}></div>
                  <div className="bar expense-bar" style={{ height: (stats.monthly[m].expense / maxMonthly * 100) + "%" }} title={"Expense: " + currency(stats.monthly[m].expense)}></div>
                </div>
                <div className="month-label">{m}</div>
              </div>
            ))}
          </div>
          <div className="chart-legend">
            <span><i className="income-bar"></i>Income</span>
            <span><i className="expense-bar"></i>Expense</span>
          </div>
        </div>
      ) : (
        <div className="empty-state">Not enough data for a monthly chart yet.</div>
      )}
    </div>
  );
}

function AnalyticsMount(){
  const entries = useLedgrEntries();
  return <FinancialAnalytics entries={entries} />;
}

/* ---------------- 6.2 / 6.3 React Search + Sort ---------------- */
function TransactionTools(){
  const [prefs, setPrefs] = useLocalStorage("ledgr_ui_prefs", { search: "", sort: "newest" });

  useEffect(() => {
    window.LedgrFilters = prefs;
    if(window.renderTransactionsPage) window.renderTransactionsPage();
  }, [prefs]);

  return (
    <div className="react-tools-bar">
      <input
        type="text"
        className="react-search-input"
        placeholder="Search by description, category or amount…"
        value={prefs.search}
        onChange={e => setPrefs({ ...prefs, search: e.target.value })}
        aria-label="Search transactions"
      />
      <select
        className="react-sort-select"
        value={prefs.sort}
        onChange={e => setPrefs({ ...prefs, sort: e.target.value })}
        aria-label="Sort transactions"
      >
        <option value="newest">Newest First</option>
        <option value="oldest">Oldest First</option>
        <option value="highest">Highest Amount</option>
        <option value="lowest">Lowest Amount</option>
      </select>
    </div>
  );
}

/* ---------------- 6.6 React Toast Notifications ---------------- */
function ToastHost(){
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    window.LedgrToast = {
      show(message){
        const id = Date.now() + Math.random();
        setToasts(t => [...t, { id, message }]);
        setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 3200);
      }
    };
  }, []);

  return (
    <div className="toast-stack" aria-live="polite">
      {toasts.map(t => <div className="toast" key={t.id}>{t.message}</div>)}
    </div>
  );
}

/* ---------------- 6.4 / 6.5 Edit + Delete Modal ---------------- */
const EXPENSE_CATS_R = ["Food","Transport","Bills","Shopping","Health","Other"];
const INCOME_CATS_R = ["Salary","Freelance","Other"];

function validateEntry(f){
  const errs = {};
  if(!f.desc || !String(f.desc).trim()) errs.desc = "Description is required";
  if(!f.amount || Number(f.amount) <= 0) errs.amount = "Amount must be greater than 0";
  if(!f.cat) errs.cat = "Category is required";
  if(!f.date) errs.date = "Date is required";
  return errs;
}

function EditDeleteModal(){
  const [mode, setMode] = useState(null); // 'edit' | 'delete' | null
  const [tx, setTx] = useState(null);
  const [form, setForm] = useState(null);
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    window.LedgrModal = {
      openEdit(transaction){
        setTx(transaction);
        setForm({ ...transaction });
        setErrors({});
        setApiError("");
        setMode("edit");
      },
      openDelete(transaction){
        setTx(transaction);
        setApiError("");
        setMode("delete");
      }
    };
  }, []);

  function close(){ setMode(null); setTx(null); setForm(null); setErrors({}); setApiError(""); setBusy(false); }

  async function saveEdit(){
    const errs = validateEntry(form);
    setErrors(errs);
    if(Object.keys(errs).length) return;
    const updated = { ...tx, desc: form.desc.trim(), amount: Number(form.amount), cat: form.cat, date: form.date, type: form.type };
    setBusy(true);
    setApiError("");
    try{
      await LedgrStore.update(updated);
      window.LedgrToast && window.LedgrToast.show("Transaction updated successfully");
      close();
    }catch(err){
      setApiError(err.message);
      setBusy(false);
    }
  }

  async function confirmDelete(){
    setBusy(true);
    setApiError("");
    try{
      await LedgrStore.remove(tx.id);
      window.LedgrToast && window.LedgrToast.show("Transaction deleted successfully");
      close();
    }catch(err){
      setApiError(err.message);
      setBusy(false);
    }
  }

  if(!mode) return null;

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true" onClick={e => { if(e.target === e.currentTarget) close(); }}>
      <div className="modal-box card">
        {mode === "edit" && form && (
          <div>
            <div className="section-title">Edit Transaction</div>
            <div className="field">
              <label htmlFor="editDesc">Description</label>
              <input id="editDesc" type="text" value={form.desc} onChange={e => setForm({ ...form, desc: e.target.value })} />
              {errors.desc && <div className="field-error">{errors.desc}</div>}
            </div>
            <div className="field">
              <label htmlFor="editAmount">Amount (₹)</label>
              <input id="editAmount" type="number" min="0" step="0.01" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} />
              {errors.amount && <div className="field-error">{errors.amount}</div>}
            </div>
            <div className="field">
              <label>Type</label>
              <div className="type-toggle">
                <button type="button" className={"sel-expense" + (form.type === "expense" ? " on" : "")}
                  onClick={() => setForm({ ...form, type: "expense", cat: EXPENSE_CATS_R[0] })}>− Expense</button>
                <button type="button" className={"sel-income" + (form.type === "income" ? " on" : "")}
                  onClick={() => setForm({ ...form, type: "income", cat: INCOME_CATS_R[0] })}>+ Income</button>
              </div>
            </div>
            <div className="field">
              <label htmlFor="editCat">Category</label>
              <select id="editCat" value={form.cat} onChange={e => setForm({ ...form, cat: e.target.value })}>
                {(form.type === "expense" ? EXPENSE_CATS_R : INCOME_CATS_R).map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              {errors.cat && <div className="field-error">{errors.cat}</div>}
            </div>
            <div className="field">
              <label htmlFor="editDate">Date</label>
              <input id="editDate" type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} />
              {errors.date && <div className="field-error">{errors.date}</div>}
            </div>
            {apiError && <div className="field-error" role="alert">{apiError}</div>}
            <div className="modal-actions">
              <button type="button" className="submit-btn" onClick={saveEdit} disabled={busy}>{busy ? "Saving…" : "Save Changes"}</button>
              <button type="button" className="cancel-btn" onClick={close}>Cancel</button>
            </div>
          </div>
        )}
        {mode === "delete" && tx && (
          <div>
            <div className="section-title">Delete Transaction</div>
            <p>Are you sure you want to delete <strong>{tx.desc}</strong> ({currency(tx.amount)})? This can't be undone.</p>
            {apiError && <div className="field-error" role="alert">{apiError}</div>}
            <div className="modal-actions">
              <button type="button" className="submit-btn delete-confirm" onClick={confirmDelete} disabled={busy}>{busy ? "Deleting…" : "Delete"}</button>
              <button type="button" className="cancel-btn" onClick={close}>Cancel</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ---------------- 6.8 Add Entry Validation ---------------- */
function AddEntryValidation(){
  const [errors, setErrors] = useState({});

  useEffect(() => {
    window.LedgrValidation = {
      validate: validateEntry,
      showErrors(errs){ setErrors(errs); },
      clearErrors(){ setErrors({}); }
    };
  }, []);

  const items = Object.values(errors);
  if(!items.length) return null;

  return (
    <div>
      {items.map((msg,i) => <div className="field-error" key={i}>{msg}</div>)}
    </div>
  );
}

/* ---------------- Connection banner (Transaction Service) ---------------- */
function useStoreStatus(){
  const [status, setStatus] = useState(() => LedgrStore.getStatus());
  useEffect(() => LedgrStore.subscribeStatus(setStatus), []);
  return status;
}

function ConnectionBanner(){
  const status = useStoreStatus();
  if(status !== "error") return null;
  return (
    <div className="connection-banner" role="alert">
      <span>Unable to load transactions. Check that the Transaction Service is running on port 8081.</span>
      <button type="button" onClick={() => LedgrStore.reload()}>Retry</button>
    </div>
  );
}

/* ---------------- Login / Register (User Service) ---------------- */
const USER_API = window.LEDGR_CONFIG.userApi;
const SESSION_KEY = "ledgr_user";

// Remembers who signed in. This only stores the name/email the User Service
// returned (never a password); it is not a secure session or token.
function readSavedUser(){
  try{
    const raw = localStorage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  }catch(e){ return null; }
}
function saveUser(user){
  try{
    if(user) localStorage.setItem(SESSION_KEY, JSON.stringify(user));
    else localStorage.removeItem(SESSION_KEY);
  }catch(e){}
}

function AuthPage({ onLogin }){
  const [mode, setMode] = useState("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");
  const [loading, setLoading] = useState(false);

  function changeMode(nextMode){
    setMode(nextMode);
    setMessage("");
    setMessageType("");
    setPassword("");
  }

  async function handleSubmit(event){
    event.preventDefault();
    setMessage("");
    setMessageType("");
    setLoading(true);

    const isLogin = mode === "login";
    const endpoint = isLogin ? USER_API + "/login" : USER_API;
    const requestBody = isLogin ? { email, password } : { name, email, password };

    try{
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody)
      });
      const data = await response.json().catch(() => ({}));
      if(!response.ok){
        throw new Error(data.message || (isLogin ? "Invalid email or password." : "Registration failed."));
      }
      if(isLogin){
        onLogin({ id: data.id, name: data.name, email: data.email });
      }else{
        setMessage("Account created successfully! Welcome, " + data.name + ". Please log in.");
        setMessageType("success");
        setMode("login");
        setName("");
        setPassword("");
      }
    }catch(error){
      setMessage(
        error instanceof TypeError
          ? "Unable to connect to the User Service. Check that it is running on port 8082."
          : error.message
      );
      setMessageType("error");
    }finally{
      setLoading(false);
    }
  }

  return (
    <section className="auth-page">
      <div className="card panel auth-card">
        <span className="eyebrow">Passbook Access</span>
        <h1 className="serif auth-title">Welcome to Ledgr</h1>
        <p className="auth-lead">
          {mode === "login" ? "Sign in to open your passbook." : "Create your account and start tracking."}
        </p>

        <div className="type-toggle auth-tabs">
          <button type="button" className={"sel-auth" + (mode === "login" ? " on" : "")} onClick={() => changeMode("login")}>Login</button>
          <button type="button" className={"sel-auth" + (mode === "register" ? " on" : "")} onClick={() => changeMode("register")}>Register</button>
        </div>

        <form onSubmit={handleSubmit}>
          {mode === "register" && (
            <div className="field">
              <label htmlFor="authName">Full Name</label>
              <input id="authName" type="text" name="name" value={name} onChange={e => setName(e.target.value)}
                placeholder="Enter your full name" autoComplete="name" required />
            </div>
          )}
          <div className="field">
            <label htmlFor="authEmail">Email Address</label>
            <input id="authEmail" type="email" name="email" value={email} onChange={e => setEmail(e.target.value)}
              placeholder="Enter your email" autoComplete="email" required />
          </div>
          <div className="field">
            <label htmlFor="authPassword">Password</label>
            <input id="authPassword" type="password" name="password" value={password} onChange={e => setPassword(e.target.value)}
              placeholder={mode === "login" ? "Enter your password" : "Create a password (min 6 characters)"}
              autoComplete={mode === "login" ? "current-password" : "new-password"}
              minLength={mode === "register" ? 6 : undefined} required />
          </div>
          {mode === "login" && <p className="forgot-password">Forgot Password? (Coming soon)</p>}
          <button type="submit" className="submit-btn" disabled={loading}>
            {loading ? "Please wait…" : mode === "login" ? "Login" : "Create Account"}
          </button>
          {message && (
            <p role="status" aria-live="polite" className={messageType === "success" ? "auth-success" : "auth-error"}>{message}</p>
          )}
        </form>
      </div>
    </section>
  );
}

// Decides whether to show the app or the login page, and keeps the nav
// (name, avatar, Logout button) in step with who is signed in.
function AuthGate(){
  const [user, setUser] = useState(readSavedUser);

  useEffect(() => {
    document.body.classList.toggle("auth-required", !user);
    if(user){
      const nameEl = document.getElementById("userNameLabel");
      const avatarEl = document.getElementById("avatarInitial");
      if(nameEl) nameEl.textContent = user.name;
      if(avatarEl) avatarEl.textContent = (user.name || "?").trim().charAt(0).toUpperCase();
    }
  }, [user]);

  useEffect(() => {
    const btn = document.querySelector(".logout-btn");
    if(!btn) return;
    const onLogout = () => { saveUser(null); setUser(null); };
    btn.addEventListener("click", onLogout);
    return () => btn.removeEventListener("click", onLogout);
  }, []);

  if(user) return null;
  return <AuthPage onLogin={u => { saveUser(u); setUser(u); }} />;
}

/* ---------------- Mount all React components into their roots ---------------- */
function mount(id, element){
  const el = document.getElementById(id);
  if(el) ReactDOM.createRoot(el).render(element);
}
mount("reactAnalyticsRoot", <AnalyticsMount />);
mount("reactTransactionToolsRoot", <TransactionTools />);
mount("reactModalRoot", <EditDeleteModal />);
mount("reactToastRoot", <ToastHost />);
mount("reactValidationRoot", <AddEntryValidation />);
mount("reactAuthRoot", <AuthGate />);
mount("reactConnectionRoot", <ConnectionBanner />);
