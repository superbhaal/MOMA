// The møma email shell — the one place that knows what our emails look like.
//
// Extracted from auth-email.ts, which had it to itself. The group-ready email
// went out as `text:` only: no header, no button, no typography, while a
// perfectly good template sat one directory away. Simon spotted it in his own
// inbox. Now both use this.
//
// Table-based, inline-styled, no external stylesheet and no webfont link.
// Google Fonts are stripped by Gmail and their presence reads as
// machine-generated, so the serif falls back to Georgia everywhere.

// Declared here rather than imported: auth-email.ts owns the canonical
// Locale and imports this file, so importing it back would be a cycle.
// Same literal union, so the two are interchangeable to the compiler.
type Locale = 'en' | 'fr' | 'es';

export const TAGLINE: Record<Locale, string> = {
  en: 'everyone brings something to the table',
  fr: 'chacune apporte quelque chose à la table',
  es: 'cada una trae algo a la mesa',
};

export interface ShellParts {
  /** Serif italic cobalt line under the wordmark. */
  heading: string;
  /** Body paragraph. */
  body: string;
  /** Button label. Omit the button by leaving cta or url empty. */
  cta?: string;
  url?: string;
  /** Small muted line under the button (link expiry, etc.). */
  note?: string;
  /** Footer line above the wordmark rule. */
  footer?: string;
}

export function renderShell(locale: Locale, p: ShellParts): string {
  const sans = "-apple-system,'Segoe UI',Helvetica,Arial,sans-serif";
  const serif = "Georgia,'Times New Roman',serif";
  const button =
    p.cta && p.url
      ? `<tr><td style="padding-bottom:28px;">
            <table role="presentation" cellpadding="0" cellspacing="0"><tr>
              <td style="background:#1A4BCC;border-radius:100px;">
                <a href="${p.url}" style="display:inline-block;padding:14px 30px;font-family:${sans};font-size:14px;font-weight:600;color:#ffffff;text-decoration:none;letter-spacing:0.4px;">${p.cta}</a>
              </td>
            </tr></table>
          </td></tr>`
      : '';
  const note = p.note
    ? `<tr><td style="font-family:${sans};font-size:13px;line-height:1.6;color:#6F6F88;padding-bottom:28px;">${p.note}</td></tr>`
    : '';
  return `<!doctype html>
<html lang="${locale}">
  <body style="margin:0;padding:0;background:#ffffff;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#ffffff;">
      <tr><td align="center" style="padding:40px 20px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;">
          <tr><td align="center" style="padding-bottom:28px;">
            <span style="font-family:${serif};font-size:30px;font-weight:300;color:#1A4BCC;letter-spacing:0.5px;">m&oslash;ma</span>
          </td></tr>
          <tr><td style="font-family:${serif};font-size:26px;font-style:italic;color:#1A4BCC;line-height:1.25;padding-bottom:16px;">${p.heading}</td></tr>
          <tr><td style="font-family:${sans};font-size:15px;line-height:1.6;color:#111118;padding-bottom:28px;">${p.body}</td></tr>
          ${button}
          ${note}
          <tr><td style="border-top:1px solid rgba(17,17,24,0.07);padding-top:20px;font-family:${sans};font-size:12px;line-height:1.6;color:#6F6F88;">
            ${p.footer ? `${p.footer}<br><br>` : ''}m&oslash;ma &middot; ${TAGLINE[locale]}
          </td></tr>
        </table>
      </td></tr>
    </table>
  </body>
</html>`;
}
