import { AuthScreen } from '@/components/skop/AuthScreen';

// reuses the auth layout in login mode
export default function LoginRoute() {
  return <AuthScreen mode="login" />;
}
