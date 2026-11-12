// LedgrStore — the frontend's data layer.
//
// Transactions now live in the Transaction Service database (Spring Boot + JPA),
// not in localStorage. The store keeps an in-memory copy for the UI and talks to
//   React UI -> REST API -> Transaction Service -> database
//
// The UI uses short field names (desc, cat, lowercase type); the API uses
// description, category and INCOME/EXPENSE. toClient()/toServer() translate.
(function(){
  const API = window.LEDGR_CONFIG.transactionApi;

  let entries = [];
  let status = "loading";   // "loading" | "ready" | "error"
  const listeners = new Set();
  const statusListeners = new Set();

  function toClient(t){
    return {
      id: t.id,
      type: String(t.type).toLowerCase(),
      desc: t.description,
      cat: t.category,
      amount: Number(t.amount),
      date: t.date
    };
  }
  function toServer(e){
    return {
      description: e.desc,
      type: String(e.type).toUpperCase(),
      category: e.cat,
      amount: Number(e.amount),
      date: e.date
    };
  }

  async function request(url, options){
    let response;
    try{
      response = await fetch(url, options);
    }catch(err){
      throw new Error("Cannot reach the Transaction Service. Check that it is running on port 8081.");
    }
    if(!response.ok){
      let message = "Request failed (" + response.status + ").";
      try{ const body = await response.json(); if(body && body.message) message = body.message; }catch(e){}
      throw new Error(message);
    }
    return response.status === 204 ? null : response.json();
  }
  const json = (method, body) => ({
    method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body)
  });

  function setEntries(next){
    entries = next;
    listeners.forEach(fn => fn(entries));
  }
  function setStatus(next){
    status = next;
    statusListeners.forEach(fn => fn(status));
  }

  window.LedgrStore = {
    // Starts loading from the API and returns the (initially empty) list.
    init(){ this.reload(); return entries; },
    get(){ return entries; },
    getStatus(){ return status; },

    subscribe(fn){ listeners.add(fn); return () => listeners.delete(fn); },
    subscribeStatus(fn){ statusListeners.add(fn); return () => statusListeners.delete(fn); },

    async reload(){
      setStatus("loading");
      try{
        const data = await request(API);
        setEntries(data.map(toClient));
        setStatus("ready");
      }catch(err){
        setStatus("error");
      }
    },

    // Each write resolves with the saved entry, or rejects with a readable Error.
    async add(entry){
      const saved = toClient(await request(API, json("POST", toServer(entry))));
      setEntries(entries.concat(saved));
      return saved;
    },
    async update(entry){
      const saved = toClient(await request(API + "/" + entry.id, json("PUT", toServer(entry))));
      setEntries(entries.map(e => e.id === saved.id ? saved : e));
      return saved;
    },
    async remove(id){
      await request(API + "/" + id, { method: "DELETE" });
      setEntries(entries.filter(e => e.id !== id));
    }
  };
})();
