(function(){
  const EXPENSE_CATS = ["Food","Transport","Bills","Shopping","Health","Other"];
  const INCOME_CATS  = ["Salary","Freelance","Other"];
  const ALL_CATS = ["All","Food","Transport","Bills","Shopping","Health","Salary","Freelance","Other"];

  let entries = LedgrStore.init();
  let activeFilter = "All";
  let selectedType = "expense";

  // Transactions come from the Transaction Service via LedgrStore. Whenever the
  // store changes (initial load, add, edit, delete) the vanilla UI re-renders.
  LedgrStore.subscribe(function(updated){
    entries = updated;
    renderDashboard();
    if(document.getElementById("page-transactions").classList.contains("active")) renderTransactionsPage();
  });

  function fmt(n){ return "₹" + Number(n).toLocaleString("en-IN", {maximumFractionDigits:0}); }
  function fmtDate(d){
    const dt = new Date(d+"T00:00:00");
    return dt.toLocaleDateString("en-IN", {day:"2-digit", month:"short", year:"numeric"});
  }

  // ---------- Navigation ----------
  document.querySelectorAll(".nav-links a").forEach(link=>{
    link.addEventListener("click", e=>{
      e.preventDefault();
      document.querySelectorAll(".nav-links a").forEach(a=>a.classList.remove("active"));
      link.classList.add("active");
      const target = link.dataset.page;
      document.querySelectorAll(".page").forEach(p=>p.classList.remove("active"));
      document.getElementById("page-"+target).classList.add("active");
      if(target==="transactions") renderTransactionsPage();
      if(target==="dashboard") renderDashboard();
    });
  });

  // ---------- Dashboard ----------
  function renderDashboard(){
    const income = entries.filter(e=>e.type==="income");
    const expense = entries.filter(e=>e.type==="expense");
    const totalIncome = income.reduce((s,e)=>s+Number(e.amount),0);
    const totalExpense = expense.reduce((s,e)=>s+Number(e.amount),0);
    document.getElementById("statBalance").textContent = fmt(totalIncome-totalExpense);
    document.getElementById("statIncome").textContent = fmt(totalIncome);
    document.getElementById("statExpense").textContent = fmt(totalExpense);
    document.getElementById("statIncomeCount").textContent = income.length + " entries";
    document.getElementById("statExpenseCount").textContent = expense.length + " entries";

    // category breakdown (expenses only)
    const byCat = {};
    expense.forEach(e=>{ byCat[e.cat] = (byCat[e.cat]||0) + Number(e.amount); });
    const maxVal = Math.max(1, ...Object.values(byCat));
    const catEl = document.getElementById("categoryBreakdown");
    const sorted = Object.entries(byCat).sort((a,b)=>b[1]-a[1]);
    catEl.innerHTML = sorted.length ? sorted.map(([cat,val])=>`
      <div class="cat-row">
        <div class="cat-name">${cat}</div>
        <div class="cat-track"><div class="cat-fill" style="width:${(val/maxVal*100).toFixed(0)}%"></div></div>
        <div class="cat-amount mono">${fmt(val)}</div>
      </div>`).join("") : `<div class="empty-state">No expenses logged yet.</div>`;

    // recent
    const recent = entries.slice().sort((a,b)=>new Date(b.date)-new Date(a.date)).slice(0,6);
    document.getElementById("recentList").innerHTML = recent.length ? recent.map(rowHtml).join("") :
      `<div class="empty-state">Nothing here yet — add your first entry.</div>`;
  }

  function rowHtml(e){
    const sign = e.type==="expense" ? "−" : "+";
    return `<div class="ledger-row">
      <div class="who">
        <span class="desc">${escapeHtml(e.desc)}<span class="tag ${e.cat}">${e.cat}</span></span>
        <span class="meta">${fmtDate(e.date)}</span>
      </div>
      <div class="leader"></div>
      <div class="amt ${e.type} mono">${sign} ${fmt(e.amount)}</div>
    </div>`;
  }
  function escapeHtml(s){
    return s.replace(/[&<>"']/g, c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  }

  // React enhancement: same row markup as rowHtml(), plus Edit/Delete
  // actions used only on the Transactions page. Dashboard rows (recent
  // entries, just added) are untouched and keep using rowHtml().
  function transactionRowHtml(e){
    const sign = e.type==="expense" ? "−" : "+";
    return `<div class="ledger-row with-actions" data-id="${e.id}">
      <div class="who">
        <span class="desc">${escapeHtml(e.desc)}<span class="tag ${e.cat}">${e.cat}</span></span>
        <span class="meta">${fmtDate(e.date)}</span>
      </div>
      <div class="leader"></div>
      <div class="amt ${e.type} mono">${sign} ${fmt(e.amount)}</div>
      <div class="row-actions">
        <button type="button" class="row-action-btn edit" data-action="edit" data-id="${e.id}" aria-label="Edit transaction">Edit</button>
        <button type="button" class="row-action-btn delete" data-action="delete" data-id="${e.id}" aria-label="Delete transaction">Delete</button>
      </div>
    </div>`;
  }

  // ---------- Transactions page ----------
  function renderFilterBar(){
    const bar = document.getElementById("filterBar");
    bar.innerHTML = ALL_CATS.map(c=>
      `<button class="filter-btn ${c===activeFilter?'active':''}" data-cat="${c}">${c}</button>`
    ).join("");
    bar.querySelectorAll(".filter-btn").forEach(btn=>{
      btn.addEventListener("click", ()=>{
        activeFilter = btn.dataset.cat;
        renderTransactionsPage();
      });
    });
  }
  function renderTransactionsPage(){
    renderFilterBar();
    // React enhancement: category filter pills still work exactly as before;
    // React's search + sort (window.LedgrFilters) is layered on top.
    const reactFilters = window.LedgrFilters || { search: "", sort: "newest" };
    let list = entries.slice().filter(e=> activeFilter==="All" || e.cat===activeFilter);

    if(reactFilters.search){
      const q = reactFilters.search.toLowerCase();
      list = list.filter(e =>
        e.desc.toLowerCase().includes(q) ||
        e.cat.toLowerCase().includes(q) ||
        String(e.amount).includes(q)
      );
    }
    switch(reactFilters.sort){
      case "oldest":  list.sort((a,b)=>new Date(a.date)-new Date(b.date)); break;
      case "highest": list.sort((a,b)=>b.amount-a.amount); break;
      case "lowest":  list.sort((a,b)=>a.amount-b.amount); break;
      default:        list.sort((a,b)=>new Date(b.date)-new Date(a.date));
    }

    document.getElementById("filterCount").textContent = list.length + " shown";
    document.getElementById("fullList").innerHTML = list.length ? list.map(transactionRowHtml).join("") :
      `<div class="empty-state">No entries match your filters.</div>`;
  }
  // React enhancement: exposed so the search/sort component can trigger a re-render
  window.renderTransactionsPage = renderTransactionsPage;

  // React enhancement: Edit/Delete buttons on each transactions-page row
  // open the React modal; deleting/editing happens through LedgrStore.
  document.getElementById("fullList").addEventListener("click", function(e){
    const btn = e.target.closest(".row-action-btn");
    if(!btn) return;
    const id = Number(btn.dataset.id);
    const tx = entries.find(en=>en.id===id);
    if(!tx || !window.LedgrModal) return;
    if(btn.dataset.action==="edit") window.LedgrModal.openEdit(tx);
    if(btn.dataset.action==="delete") window.LedgrModal.openDelete(tx);
  });

  // ---------- Add Entry page ----------
  const btnExpense = document.getElementById("btnExpense");
  const btnIncome = document.getElementById("btnIncome");
  const catSelect = document.getElementById("fCategory");

  function refreshCategoryOptions(){
    const cats = selectedType==="expense" ? EXPENSE_CATS : INCOME_CATS;
    catSelect.innerHTML = cats.map(c=>`<option value="${c}">${c}</option>`).join("");
  }
  btnExpense.addEventListener("click", ()=>{
    selectedType="expense";
    btnExpense.classList.add("on"); btnIncome.classList.remove("on");
    refreshCategoryOptions();
  });
  btnIncome.addEventListener("click", ()=>{
    selectedType="income";
    btnIncome.classList.add("on"); btnExpense.classList.remove("on");
    refreshCategoryOptions();
  });
  refreshCategoryOptions();
  document.getElementById("fDate").value = new Date().toISOString().slice(0,10);

  let justAdded = [];
  document.getElementById("entryForm").addEventListener("submit", function(e){
    e.preventDefault();
    const form = this;
    const submitBtn = form.querySelector(".submit-btn");
    const desc = document.getElementById("fDesc").value.trim();
    const amountRaw = document.getElementById("fAmount").value;
    const amount = parseFloat(amountRaw);
    const cat = catSelect.value;
    const date = document.getElementById("fDate").value;

    // React enhancement: validation is computed here but rendered by the
    // React AddEntryValidation component, in the existing Ledgr style.
    if(window.LedgrValidation){
      const errors = window.LedgrValidation.validate({ desc, amount: amountRaw, cat, date });
      if(Object.keys(errors).length){
        window.LedgrValidation.showErrors(errors);
        return;
      }
      window.LedgrValidation.clearErrors();
    } else if(!desc || !amount){
      return; // fallback to original behavior if React hasn't mounted yet
    }

    // Save through the Transaction Service; the form only resets once it succeeds.
    submitBtn.disabled = true;
    LedgrStore.add({ type: selectedType, desc, cat, amount, date })
      .then(function(saved){
        justAdded.unshift(saved);
        justAdded = justAdded.slice(0,5);
        document.getElementById("justAddedList").innerHTML = justAdded.map(rowHtml).join("");
        window.LedgrToast && window.LedgrToast.show("Transaction added successfully", "success");
        form.reset();
        document.getElementById("fDate").value = new Date().toISOString().slice(0,10);
        selectedType = "expense";
        btnExpense.classList.add("on"); btnIncome.classList.remove("on");
        refreshCategoryOptions();
      })
      .catch(function(err){
        window.LedgrToast && window.LedgrToast.show(err.message);
      })
      .finally(function(){ submitBtn.disabled = false; });
  });

  // ---------- init ----------
  renderDashboard();
})();
