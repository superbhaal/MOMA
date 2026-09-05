import { useRouter } from 'expo-router';
import { ShareReelSheet } from '@/components/discover/ShareReelSheet';

/**
 * Watch · "Share a recommendation", as a route.
 *
 * It used to be an in-page <ShareReelSheet>, which meant an RN Modal and no way
 * to pull it down to leave — our tester reported exactly that, having learnt the
 * gesture from Explore's "+". Explore's composer was a modal ROUTE all along,
 * so it inherited the native sheet's drag-to-dismiss for free. This makes the
 * two "+" buttons the same thing.
 *
 * The feed refetches on focus rather than through a callback: once this is a
 * route, the screen underneath is remounted-and-focused on the way back, which
 * is a more reliable signal than a prop threaded through a dismissal.
 */
export default function NewReelScreen() {
  const router = useRouter();
  const close = () => router.back();
  return <ShareReelSheet standalone visible onClose={close} onPosted={() => {}} />;
}
