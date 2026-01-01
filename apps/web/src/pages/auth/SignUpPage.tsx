import { useState } from 'react';
import { useSignUp } from '@clerk/clerk-react';
import { useNavigate, Link } from 'react-router-dom';
import { FormCard, Input, Button, Text } from '@agent-kit/ui';
import { SignUpPageSkeleton } from '../../components/skeletons';

const AFTER_SIGN_UP_URL = import.meta.env.VITE_AFTER_SIGN_UP_URL || '/app';

export function SignUpPage() {
  const { isLoaded, signUp, setActive } = useSignUp();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pendingVerification, setPendingVerification] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLoaded) return;

    setIsSubmitting(true);
    setError('');

    try {
      await signUp.create({
        emailAddress: email,
        password,
      });

      await signUp.prepareEmailAddressVerification({ strategy: 'email_code' });
      setPendingVerification(true);
    } catch (err) {
      const clerkError = err as { errors?: { message: string }[] };
      setError(clerkError.errors?.[0]?.message || 'An error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVerification = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLoaded) return;

    setIsSubmitting(true);
    setError('');

    try {
      const completeSignUp = await signUp.attemptEmailAddressVerification({
        code: verificationCode,
      });

      if (completeSignUp.status === 'complete') {
        await setActive({ session: completeSignUp.createdSessionId });
        navigate(AFTER_SIGN_UP_URL);
      }
    } catch (err) {
      const clerkError = err as { errors?: { message: string }[] };
      setError(clerkError.errors?.[0]?.message || 'Invalid verification code');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleSignUp = async () => {
    if (!isLoaded) return;

    try {
      await signUp.authenticateWithRedirect({
        strategy: 'oauth_google',
        redirectUrl: '/sso-callback',
        redirectUrlComplete: AFTER_SIGN_UP_URL,
      });
    } catch (err) {
      const clerkError = err as { errors?: { message: string }[] };
      setError(clerkError.errors?.[0]?.message || 'An error occurred');
    }
  };

  if (!isLoaded) {
    return <SignUpPageSkeleton />;
  }

  if (pendingVerification) {
    return (
      <div className="flex flex-1 items-center justify-center p-4">
        <FormCard
          title="Verify your email"
          description="Enter the verification code sent to your email"
          className="animate-slide-up"
          footer={
            <Text variant="muted" size="14" as="span">
              {"Didn't receive the code? "}
              <button
                type="button"
                onClick={() =>
                  signUp.prepareEmailAddressVerification({
                    strategy: 'email_code',
                  })
                }
                className="text-primary hover:underline"
              >
                Resend
              </button>
            </Text>
          }
        >
          <form onSubmit={handleVerification} className="space-y-4">
            <Input
              id="verification-code"
              label="Verification Code"
              type="text"
              value={verificationCode}
              onChange={(e) => setVerificationCode(e.target.value)}
              placeholder="Enter code"
              error={error}
              required
            />
            <Button
              type="submit"
              className="w-full"
              size="lg"
              isLoading={isSubmitting}
            >
              Verify Email
            </Button>
          </form>
        </FormCard>
      </div>
    );
  }

  return (
    <div className="flex flex-1 items-center justify-center p-4">
      <FormCard
        title="Create your account"
        className="animate-slide-up"
        footer={
          <>
            Already have an account?{' '}
            <Link to="/sign-in" className="text-primary hover:underline">
              Sign In
            </Link>
          </>
        }
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            id="email"
            label="Email Address"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email"
            required
            autoComplete="email"
          />
          <Input
            id="password"
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Create a password"
            error={error}
            required
            autoComplete="new-password"
          />
          <Button
            type="submit"
            className="w-full"
            size="lg"
            isLoading={isSubmitting}
          >
            Create Account
          </Button>
        </form>

        <div className="my-6 flex items-center gap-4">
          <div className="h-px flex-1 bg-border" />
          <span className="text-sm text-muted-foreground">or</span>
          <div className="h-px flex-1 bg-border" />
        </div>

        <Button
          type="button"
          variant="outline"
          className="w-full"
          size="lg"
          onClick={handleGoogleSignUp}
        >
          <svg className="h-5 w-5" viewBox="0 0 24 24">
            <path
              fill="currentColor"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
          Continue with Google
        </Button>
      </FormCard>
    </div>
  );
}
