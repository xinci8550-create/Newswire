import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth';

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    if (password !== confirm) {
      setError('Passwords do not match');
      setBusy(false);
      return;
    }
    try {
      await register(email, password, name);
      navigate('/', { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="auth-wrap">
      <div className="panel">
        <h1>Create account</h1>
        <p className="sub">Join to bookmark articles and track your reading.</p>
        {error && <div className="alert error">{error}</div>}
        <form onSubmit={submit}>
          <div className="field">
            <label>Name (optional)</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} maxLength={60} autoComplete="name" />
          </div>
          <div className="field">
            <label>Email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" />
          </div>
          <div className="field">
            <label>Password</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8} autoComplete="new-password" />
            <small style={{ color: 'var(--text-muted)' }}>At least 8 characters.</small>
          </div>
          <div className="field">
            <label>Confirm password</label>
            <input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} required minLength={8} autoComplete="new-password" />
          </div>
          <button className="btn accent block" type="submit" disabled={busy}>Create account</button>
        </form>
        <p className="form-foot">Already have an account? <Link to="/login">Sign in</Link></p>
      </div>
    </div>
  );
}
