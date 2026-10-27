export default function AccountList({ accounts, selectedId, onSelect, onAdd }) {
  return (
    <aside className="sidebar">
      <a className="brand" href="#top" aria-label="Ledger home">
        <span className="brand-mark">L</span><span>ledger<span className="brand-period">.</span></span>
      </a>
      <div className="sidebar-label">WORKSPACE</div>
      <button className="nav-item nav-item-active" type="button"><span className="nav-icon">◫</span>Overview</button>
      <div className="account-heading">
        <span className="sidebar-label">YOUR ACCOUNTS</span>
        <button className="icon-button add-account" onClick={onAdd} aria-label="Add account" title="Add account">+</button>
      </div>
      <nav className="account-nav" aria-label="Accounts">
        {accounts.map((account, index) => (
          <button key={account.id} type="button"
            className={`account-nav-item ${String(selectedId) === String(account.id) ? 'account-nav-selected' : ''}`}
            onClick={() => onSelect(account)}>
            <span className={`account-avatar avatar-${index % 4}`}>{account.name.trim().charAt(0).toUpperCase()}</span>
            <span className="account-nav-name">{account.name}</span>
            {String(selectedId) === String(account.id) && <span className="selected-dot" />}
          </button>
        ))}
      </nav>
      <button className="sidebar-add" type="button" onClick={onAdd}><span>＋</span> New account</button>
      <div className="sidebar-bottom"><span className="secure-icon">✳</span><span>Private by design<br /><small>Your ledger stays yours.</small></span></div>
    </aside>
  );
}
