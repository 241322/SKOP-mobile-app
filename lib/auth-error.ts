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
    case 'auth/too-many-requests':
      return 'Too many attempts. Please wait and try again.';
    case 'auth/weak-password':
      return 'Use a password with at least 6 characters.';
    case 'auth/operation-not-allowed':
      return 'Email login is not enabled in Firebase yet.';
    default:
      return 'Firebase could not complete this request.';
  }
}
