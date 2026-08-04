import { AuthScreen } from '@/components/skop/AuthScreen';

// reuses the auth layout in signup mode
export default function SignupRoute() {
  return <AuthScreen mode="signup" />;
}
