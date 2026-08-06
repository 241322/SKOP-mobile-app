import { FirebaseError } from 'firebase/app';

// turns firebase error codes into messages that make sense on the form
export function getAuthErrorMessage(error: unknown) {
  if (!(error instanceof FirebaseError)) {
    return 'Something went wrong. Please try again.';
  }

  switch (error.code) {
    case 'auth/email-already-in-use':
      return 'An account already uses this email.';
    case 'auth/invalid-email':
      return 'Enter a valid email address.';
    case 'auth/invalid-credential':
    case 'auth/user-not-found':
    case 'auth/wrong-password':
      return 'The email or password is incorrect.';
    case 'auth/network-request-failed':
      return 'Check your internet connection and try again.';
    case 'auth/expired-action-code':
      return 'This link has expired. Request a new email and try again.';
    case 'auth/invalid-action-code':
      return 'This link is no longer valid. Request a new email.';
    case 'auth/quota-exceeded':
      return 'Firebase has paused email requests. Please try again later.';
    case 'auth/too-many-requests':
      return 'Too many attempts. Please wait and try again.';
    case 'auth/requires-recent-login':
      return 'Log in again before changing this account.';
    case 'auth/user-token-expired':
      return 'Your session expired. Log in again.';
    case 'auth/weak-password':
      return 'Use a password with at least 6 characters.';
    case 'auth/operation-not-allowed':
      return 'Email login is not enabled in Firebase yet.';
    default:
      return 'Firebase could not complete this request.';
  }
}
