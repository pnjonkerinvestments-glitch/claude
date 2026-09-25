const destinations = ['/', '/daily', '/profile', '/explore', '/how-to-play', '/world-geography-quiz', '/flags-quiz', '/capitals-quiz', '/europe-geography-quiz', '/africa-geography-quiz', '/country-map-quiz'];
export function returnDestination(state: any) {
  const source = state?.returnTo;
  return { path: destinations.includes(source?.path) ? source.path : '/', scroll: Number.isFinite(source?.scroll) ? Math.max(0, source.scroll) : 0 };
}
export function navigationState(path: string, scroll: number, state: any, href: string) {
  if (!/^\/(game|puzzle|rank)\//.test(href)) return {};
  return { returnTo: /^\/(game|puzzle|rank)\//.test(path) ? returnDestination(state) : returnDestination({ returnTo: { path, scroll } }) };
}
