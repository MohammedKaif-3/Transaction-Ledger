import { useState } from 'react';

function makeReference() {
  return `TRF-${Date.now().toString(36).toUpperCase()}`;
}

export default function TransferForm({ accounts, source, onTransfer, onCancel }) {
  const [destinationId, setDestinationId] = useState(accounts.find((item) => String(item.id) !== String(source.id))?.id || '');
  const [amount, setAmount] = useState('');
  const [referenceId, setReferenceId] = useState(makeReference);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  async function submit(event) {
    event.preventDefault();
    setError('');
    setSaving(true);
    try {
      await onTransfer({ source_account_id: source.id, destination_account_id: destinationId, amount, reference_id: referenceId.trim() });
    } catch (cause) {
      setError(cause.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <form className="transaction-form" onSubmit={submit}>
      <label htmlFor="transfer-from">From</label>
      <input id="transfer-from" value={source.name} readOnly />
      <label htmlFor="transfer-to">To</label>
      <select id="transfer-to" className="transfer-select" value={destinationId} onChange={(event) => setDestinationId(event.target.value)} required>
        {accounts.filter((account) => String(account.id) !== String(source.id)).map((account) => <option key={account.id} value={account.id}>{account.name}</option>)}
      </select>
      <label htmlFor="transfer-amount">Amount</label>
      <div className="amount-input"><span>$</span><input id="transfer-amount" type="number" min="0.01" step="0.01" max="9999999999999.99" value={amount} onChange={(event) => setAmount(event.target.value)} placeholder="0.00" required /></div>
      <label htmlFor="transfer-reference">Reference ID</label>
      <input id="transfer-reference" maxLength={100} value={referenceId} onChange={(event) => setReferenceId(event.target.value)} required />
      <p className="form-hint">Transfer is recorded as a debit and credit together. Both entries use this reference.</p>
      {error && <p className="form-error" role="alert">{error}</p>}
      <div className="form-actions"><button className="button button-quiet" type="button" onClick={onCancel}>Cancel</button>
        <button className="button button-primary" type="submit" disabled={saving || !amount || !destinationId || !referenceId.trim()}>{saving ? 'Transferring…' : 'Transfer funds'}</button></div>
    </form>
  );
}
