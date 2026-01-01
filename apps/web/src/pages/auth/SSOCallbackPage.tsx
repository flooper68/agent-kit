import { AuthenticateWithRedirectCallback } from '@clerk/clerk-react';
import { SSOCallbackSkeleton } from '../../components/skeletons';

export function SSOCallbackPage() {
  return (
    <>
      <AuthenticateWithRedirectCallback
        signInFallbackRedirectUrl="/app"
        signUpFallbackRedirectUrl="/app"
      />
      <SSOCallbackSkeleton />
    </>
  );
}
