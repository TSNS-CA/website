// WhatsApp/Facebook önizlemesi için sunucu tarafı Open Graph etiketleri.
// Bkz. functions/_lib/og.js. Sayfanın kendisi yine SPA olarak yüklenir.
import { handleHtmlWithMeta } from "./_lib/og.js";
export const onRequestGet = handleHtmlWithMeta;
