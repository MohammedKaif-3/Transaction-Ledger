import { useState } from 'react';

function makeReference() {
  return `TXN-${Date.now().toString(36).toUpperCase()}`;
}

export default function TransactionForm({ accountName, onCreate, onCancel }) {
  const [type, setType] = useState('credit');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [referenceId, setReferenceId] = useState(makeReference);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  async function submit(event) {
    event.preventDefault();
    setError('');
    setSaving(true);
    try {
      await onCreate({ type, amount, description, reference_id: referenceId.trim() });
    } catch (cause) {
      setError(cause.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <form className="transaction-form" onSubmit={submit}>
      <div className="type-switch" role="group" aria-label="Transaction type">
        <button type="button" className={type === 'credit' ? 'type-selected credit-choice' : ''} onClick={() => setType('credit')}><span>↑</span> Credit</button>
        <button type="button" className={type === 'debit' ? 'type-selected debit-choice' : ''} onClick={() => setType('debit')}><span>↓</span> Debit</button>
      </div>
      <label htmlFor="transaction-amount">Amount</label>
      <div className="amount-input"><span>$</span><input id="transaction-amount" type="number" min="0.01" step="0.01" max="9999999999999.99" value={amount} onChange={(event) => setAmount(event.target.value)} placeholder="0.00" required /></div>
      <label htmlFor="transaction-description">Description <span className="optional-label">OPTIONAL</span></label>
      <input id="transaction-description" maxLength={500} value={description} onChange={(event) => setDescription(event.target.value)} placeholder={type === 'credit' ? 'e.g. Monthly deposit' : 'e.g. Office supplies'} />
      <label htmlFor="transaction-reference">Reference ID</label>
      <input id="transaction-reference" maxLength={100} value={referenceId} onChange={(event) => setReferenceId(event.target.value)} required />
      <p className="form-hint">Reference IDs must be unique within {accountName}.</p>
      {error && <p className="form-error" role="alert">{error}</p>}
      <div className="form-actions"><button className="button button-quiet" type="button" onClick={onCancel}>Cancel</button>
        <button className="button button-primary" type="submit" disabled={saving || !amount || !referenceId.trim()}>{saving ? 'Saving…' : `Add ${type}`}</button></div>
    </form>
  );
}
