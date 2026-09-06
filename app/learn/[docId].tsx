import { Redirect, useLocalSearchParams } from 'expo-router';

/**
 * Where a shared article link lands inside the app.
 *
 * Sharing produces https://joinmoma.org/learn/<id>, and the AASA claims
 * /learn/* — so on a phone that has møma, iOS hands the URL straight to the
 * app instead of opening the web page. The app had no /learn route, only
 * /discover/[docId], so every shared link opened on "Page not found": the one
 * case the whole share flow exists for.
 *
 * The public path stays /learn/<id> because that is what people have already
 * sent each other, and links outlive route names. This is the bridge between
 * the two.
 */
export default function LearnLinkRedirect() {
  const { docId } = useLocalSearchParams<{ docId: string }>();

  // A malformed link is better sent to the feed than to a blank article.
  if (!docId) return <Redirect href="/discover" />;

  return <Redirect href={{ pathname: '/discover/[docId]', params: { docId } }} />;
}
