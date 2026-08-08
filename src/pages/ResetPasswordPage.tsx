import { useState, type FormEvent } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { gql, useMutation } from '@apollo/client';
import { PasswordField } from '../components/ui/PasswordField';

const RESET_PASSWORD_MUTATION = gql`
  mutation ResetPassword($token: String!, $newPassword: String!) {
    resetPassword(token: $token, newPassword: $newPassword)
  }
`;

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') ?? '';
  const [resetPassword] = useMutation(RESET_PASSWORD_MUTATION);

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');

    if (password !== confirm) {
      setError('Passwords do not match');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    setLoading(true);
    try {
      await resetPassword({ variables: { token, newPassword: password } });
      setSuccess(true);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to reset password';
      setError(msg.replace(/GraphQL error: /i, ''));
    } finally {
      setLoading(false);
    }
  }

  if (!token) {
    return (
      <div className="auth-page">
        <div className="auth-card">
          <div className="auth-error-block">
            <h2 className="auth-error-block__title">Invalid link</h2>
            <p className="auth-error-block__body">
              No reset token found in the link. Request a new one below.
            </p>
          </div>
          <p className="auth-card__footer">
            <Link to="/forgot-password" className="auth-link">Request a new link</Link>
          </p>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="auth-page">
        <div className="auth-card">
          <div className="auth-success">
            <h2 className="auth-success__title">Password updated</h2>
            <p className="auth-success__body">
              Your password has been reset. Sign in with your new password.
            </p>
          </div>
          <p className="auth-card__footer">
            <Link to="/login" className="auth-link">Go to sign in</Link>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-card__header">
          <h1 className="auth-card__title">Schedule Tracker</h1>
          <p className="auth-card__subtitle">Choose a new password</p>
        </div>

        <form className="auth-form" onSubmit={handleSubmit} noValidate>
          <PasswordField
            id="password"
            label="New password"
            value={password}
            onChange={setPassword}
            autoComplete="new-password"
          />

          <PasswordField
            id="confirm"
            label="Confirm new password"
            value={confirm}
            onChange={setConfirm}
            autoComplete="new-password"
          />

          {error && <p className="auth-error" role="alert">{error}</p>}

          <button className="auth-btn" type="submit" disabled={loading}>
            {loading ? 'Updating…' : 'Update password'}
          </button>
        </form>

        <p className="auth-card__footer">
          <Link to="/login" className="auth-link">Back to sign in</Link>
        </p>
      </div>
    </div>
  );
}
