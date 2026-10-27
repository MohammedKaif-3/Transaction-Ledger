import { useState } from 'react';

export default function AccountForm({ onCreate, onCancel }) {
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  async function submit(event) {
    event.preventDefault();
    setError('');
    setSaving(true);
    try {
      await onCreate(name.trim());
      setName('');
    } catch (cause) {
      setError(cause.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <form className="account-form" onSubmit={submit}>
      <label htmlFor="account-name">Account holder name</label>
      <input id="account-name" autoFocus maxLength={255} value={name}
        onChange={(event) => setName(event.target.value)} placeholder="e.g. Alex Morgan" required />
      <p className="form-hint">New accounts always start with a zero balance.</p>
      {error && <p className="form-error" role="alert">{error}</p>}
      <div className="form-actions">
        {onCancel && <button className="button button-quiet" type="button" onClick={onCancel}>Cancel</button>}
        <button className="button button-primary" type="submit" disabled={saving || !name.trim()}>
          {saving ? 'Creating…' : 'Create account'}
        </button>
      </div>
    </form>
  );
}
