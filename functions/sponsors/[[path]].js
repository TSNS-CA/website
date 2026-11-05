// Eski sitenin /sponsors/<ad> sayfaları (ör. /sponsors/nikki-jafari) → /sponsorlar.
// Sunucuda 301: arama motorları ve önizleme botları da yeni adresi öğrensin.
// Logolar bu yüzden /sponsors/ değil /sponsor-logos/ altında.
export function onRequestGet({ request }) {
  return Response.redirect(new URL("/sponsorlar", request.url).toString(), 301);
}
