import { useCallback, useEffect, useState } from 'react';
import { api } from './api';
import AccountForm from './components/AccountForm';
import AccountList from './components/AccountList';
import TransactionForm from './components/TransactionForm';
import './transaction.css';

const currency = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });
const formatMoney = (value) => currency.format(Number(value || 0));
const greeting = () => {
  const hour = new Date().getHours();
  return hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
};

export default function App() {
  const [accounts, setAccounts] = useState([]);
  const [selected, setSelected] = useState(null);
  const [balance, setBalance] = useState('0.00');
  const [transactions, setTransactions] = useState([]);
  const [historyType, setHistoryType] = useState('all');
  const [historyPage, setHistoryPage] = useState(1);
  const [historyPagination, setHistoryPagination] = useState({ page: 1, limit: 6, total: 0, total_pages: 0 });
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState('');
  const [showAccountForm, setShowAccountForm] = useState(false);
  const [showTransactionForm, setShowTransactionForm] = useState(false);

  const refreshAccounts = useCallback(async (preferredId) => {
    const result = await api.accounts();
    const nextAccounts = result.data;
    setAccounts(nextAccounts);
    const nextSelected = nextAccounts.find((account) => String(account.id) === String(preferredId))
      || nextAccounts.find((account) => String(account.id) === String(selected?.id))
      || nextAccounts[0] || null;
    setSelected(nextSelected);
    return nextSelected;
  }, [selected?.id]);

  const loadHistory = useCallback(async (account, type = historyType, page = 1) => {
    if (!account) { setTransactions([]); setHistoryPagination({ page: 1, limit: 6, total: 0, total_pages: 0 }); return; }
    const result = await api.transactions(account.id, {
      page, limit: 6, ...(type === 'all' ? {} : { type }),
    });
    setTransactions(result.data);
    setHistoryPagination(result.pagination);
    setHistoryPage(page);
  }, [historyType]);

  const loadAccount = useCallback(async (account) => {
    if (!account) { setBalance('0.00'); setTransactions([]); return; }
    const [balanceResult, historyResult] = await Promise.all([
      api.balance(account.id), api.transactions(account.id, { page: 1, limit: 6, ...(historyType === 'all' ? {} : { type: historyType }) }),
    ]);
    setBalance(balanceResult.data.balance);
    setTransactions(historyResult.data);
    setHistoryPagination(historyResult.pagination);
    setHistoryPage(1);
  }, [historyType]);

  useEffect(() => {
    let active = true;
    async function initialize() {
      try {
        const result = await api.accounts();
        if (!active) return;
        setAccounts(result.data);
        const first = result.data[0] || null;
        setSelected(first);
        if (first) {
          const [balanceResult, historyResult] = await Promise.all([
            api.balance(first.id), api.transactions(first.id, { page: 1, limit: 6 }),
          ]);
          if (active) { setBalance(balanceResult.data.balance); setTransactions(historyResult.data); setHistoryPagination(historyResult.pagination); }
        }
      } catch (error) {
        if (active) setPageError(error.message);
      } finally {
        if (active) setLoading(false);
      }
    }
    initialize();
    return () => { active = false; };
  }, []);

  async function chooseAccount(account) {
    setSelected(account);
    setPageError('');
    try { await loadAccount(account); } catch (error) { setPageError(error.message); }
  }

  async function createAccount(name) {
    const result = await api.createAccount(name);
    const next = await refreshAccounts(result.data.id);
    await loadAccount(next);
    setShowAccountForm(false);
    setPageError('');
  }

  async function createTransaction(payload) {
    await api.createTransaction(selected.id, payload);
    setShowTransactionForm(false);
    setPageError('');
    const [balanceResult] = await Promise.all([api.balance(selected.id), loadHistory(selected, historyType, 1)]);
    setBalance(balanceResult.data.balance);
  }

  async function changeHistoryType(type) {
    setHistoryType(type);
    setPageError('');
    try { await loadHistory(selected, type, 1); } catch (error) { setPageError(error.message); }
  }

  async function changeHistoryPage(page) {
    setPageError('');
    try { await loadHistory(selected, historyType, page); } catch (error) { setPageError(error.message); }
  }

  return (
    <div className="app-frame" id="top">
      <AccountList accounts={accounts} selectedId={selected?.id} onSelect={chooseAccount}
        onAdd={() => setShowAccountForm(true)} />
      <main className="main-panel">
        <header className="topbar">
          <div className="breadcrumb"><span>Workspace</span><span className="crumb-separator">/</span><strong>Overview</strong></div>
          <div className="topbar-right"><span className="live-indicator"><i /> All systems normal</span><span className="top-avatar">K</span></div>
        </header>
        <div className="content-wrap">
          <div className="page-heading">
            <div><div className="date-label">{new Intl.DateTimeFormat('en-US', { weekday: 'long', month: 'long', day: 'numeric' }).format(new Date())}</div>
              <h1>{greeting()}<span className="heading-period">.</span></h1>
              <p>Here’s what’s happening with your money.</p>
            </div>
            <button className="button button-outline" type="button" onClick={() => setShowAccountForm(true)}><span>＋</span> Add account</button>
          </div>

          {pageError && <div className="notice" role="alert"><span>!</span>{pageError}<button onClick={() => setPageError('')} aria-label="Dismiss">×</button></div>}

          {loading ? <div className="loading-card">Loading your workspace…</div> : accounts.length === 0 ? (
            <section className="empty-state">
              <div className="empty-art"><div className="empty-card empty-card-back" /><div className="empty-card empty-card-front"><span>••••</span><i>＋</i></div><span className="spark spark-one">✳</span><span className="spark spark-two">✦</span></div>
              <span className="eyebrow">A FRESH START</span><h2>Your ledger starts here.</h2>
              <p>Create your first account to keep every transaction clear and in one place.</p>
              <button className="button button-primary" onClick={() => setShowAccountForm(true)}>Create your first account <span>→</span></button>
            </section>
          ) : (
            <>
              <section className="overview-grid">
                <article className="balance-card">
                  <div className="balance-card-top"><div><span className="card-label">CURRENT BALANCE</span><span className="balance-caption">For your selected account</span></div><span className="balance-icon">↗</span></div>
                  <div className="balance-amount">{formatMoney(balance)}</div>
                  <div className="balance-card-footer"><span className="balance-account"><span className="mini-avatar">{selected?.name?.charAt(0).toUpperCase()}</span>{selected?.name}</span><span className="balance-count">{accounts.length} {accounts.length === 1 ? 'account' : 'accounts'} total</span></div>
                </article>
                <article className="quick-card"><div className="quick-card-heading"><div><span className="card-label">QUICK ACTION</span><h2>Record a transaction</h2></div><span className="quick-icon">✳</span></div>
                  <p>Log a credit or debit for {selected?.name}. Your balance updates as one safe ledger entry.</p>
                  <div className="quick-actions"><button className="quick-action-chip action-button" onClick={() => setShowTransactionForm(true)}><i className="chip-credit">↑</i>Add transaction</button><span className="quick-action-hint">Securely recorded</span></div>
                </article>
              </section>
              <section className="activity-card">
                <div className="section-heading"><div><span className="card-label">YOUR LEDGER</span><h2>Transaction history</h2></div><div className="activity-heading-actions"><select className="filter-select" aria-label="Filter transaction type" value={historyType} onChange={(event) => changeHistoryType(event.target.value)}><option value="all">All types</option><option value="credit">Credits</option><option value="debit">Debits</option></select><button className="button button-outline small-button" onClick={() => setShowTransactionForm(true)}>＋ Add transaction</button></div></div>
                {transactions.length === 0 ? <div className="activity-empty"><span className="activity-empty-icon">↗</span><div><strong>No activity yet</strong><p>Transactions for {selected?.name} will show up here.</p></div></div> : (
                  <div className="transaction-list">{transactions.map((transaction) => <div className="transaction-row" key={transaction.id}>
                    <span className={`transaction-symbol ${transaction.type}`}>{transaction.type === 'credit' ? '↙' : '↗'}</span>
                    <div className="transaction-main"><strong>{transaction.description || (transaction.type === 'credit' ? 'Credit' : 'Debit')}</strong><span>{new Date(transaction.created_at).toLocaleString()} · Ref {transaction.reference_id}</span></div>
                    <span className={`transaction-amount ${transaction.type}`}>{transaction.type === 'credit' ? '+' : '−'}{formatMoney(transaction.amount)}</span>
                  </div>)}</div>
                )}
                <div className="activity-footer"><span>{historyPagination.total} {historyPagination.total === 1 ? 'transaction' : 'transactions'}</span><div className="pagination-controls"><span>Page {historyPage} of {Math.max(1, historyPagination.total_pages)}</span><button disabled={historyPage <= 1} onClick={() => changeHistoryPage(historyPage - 1)} aria-label="Previous page">←</button><button disabled={historyPage >= historyPagination.total_pages} onClick={() => changeHistoryPage(historyPage + 1)} aria-label="Next page">→</button></div></div>
              </section>
              <footer className="page-footer"><span>Ledger · Built for clarity.</span><span>Secure account records <b>✳</b></span></footer>
            </>
          )}
        </div>
      </main>
      {showAccountForm && <div className="modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) setShowAccountForm(false); }}>
        <section className="modal-card" role="dialog" aria-modal="true" aria-labelledby="modal-title">
          <button className="modal-close" onClick={() => setShowAccountForm(false)} aria-label="Close">×</button>
          <span className="eyebrow">NEW ACCOUNT</span><h2 id="modal-title">Add an account</h2><p className="modal-copy">Give your account a name. You can add transactions once it’s created.</p>
          <AccountForm onCreate={createAccount} onCancel={() => setShowAccountForm(false)} />
        </section>
      </div>}
      {showTransactionForm && <div className="modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) setShowTransactionForm(false); }}>
        <section className="modal-card" role="dialog" aria-modal="true" aria-labelledby="transaction-modal-title">
          <button className="modal-close" onClick={() => setShowTransactionForm(false)} aria-label="Close">×</button>
          <span className="eyebrow">LEDGER ENTRY · {selected?.name?.toUpperCase()}</span><h2 id="transaction-modal-title">Add a transaction</h2><p className="modal-copy">Record a credit or debit. Entries can’t be changed after they’re saved.</p>
          <TransactionForm accountName={selected?.name || 'this account'} onCreate={createTransaction} onCancel={() => setShowTransactionForm(false)} />
        </section>
      </div>}
    </div>
  );
}
