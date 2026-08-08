import { useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { gql, useMutation } from '@apollo/client';

const VERIFY_EMAIL_MUTATION = gql`
  mutation VerifyEmail($token: String!) {
    verifyEmail(token: $token) {
      id
      email
    }
  }
`;

type Status = 'pending' | 'success' | 'error';

export default function VerifyEmailPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') ?? '';
  const [verifyEmail] = useMutation(VERIFY_EMAIL_MUTATION);
  const called = useRef(false);

  const [status, setStatus] = useState<Status>('pending');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (called.current) return;
    called.current = true;

    if (!token) {
      setStatus('error');
      setErrorMsg('No verification token found in the link.');
      return;
    }

    verifyEmail({ variables: { token } })
      .then(() => setStatus('success'))
      .catch((err: unknown) => {
        setStatus('error');
        const msg = err instanceof Error ? err.message : 'Verification failed';
        setErrorMsg(msg.replace(/GraphQL error: /i, ''));
      });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="auth-page">
      <div className="auth-card">
        {status === 'pending' && (
          <p className="auth-card__subtitle">Verifying your email…</p>
        )}

        {status === 'success' && (
          <div className="auth-success">
            <h2 className="auth-success__title">Email verified!</h2>
            <p className="auth-success__body">
              Your account is ready. Sign in to get started.
            </p>
          </div>
        )}

        {status === 'error' && (
          <div className="auth-error-block">
            <h2 className="auth-error-block__title">Verification failed</h2>
            <p className="auth-error-block__body">
              {errorMsg || 'The link may have expired or already been used.'}
            </p>
          </div>
        )}

        <p className="auth-card__footer">
          <Link to="/login" className="auth-link">Go to sign in</Link>
        </p>
      </div>
    </div>
  );
}
