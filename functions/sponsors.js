// /sponsors → /sponsorlar (301). Bkz. functions/sponsors/[[path]].js.
export function onRequestGet({ request }) {
  return Response.redirect(new URL("/sponsorlar", request.url).toString(), 301);
}
