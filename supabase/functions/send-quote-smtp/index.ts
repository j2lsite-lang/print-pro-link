import { createClient } from 'npm:@supabase/supabase-js@2'
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors'
import nodemailer from 'npm:nodemailer@6.9.16'

// ── Hostinger SMTP configuration (values from Lovable secrets) ──
const SMTP_HOST = Deno.env.get('SMTP_HOST') || 'smtp.hostinger.com'
const SMTP_PORT = Number(Deno.env.get('SMTP_PORT') || '465')
const SMTP_USER = Deno.env.get('SMTP_USER') || 'contact@j2lprint.fr'
const SMTP_PASSWORD = Deno.env.get('SMTP_PASSWORD') || ''
const EMAIL_FROM = Deno.env.get('EMAIL_FROM') || 'contact@j2lprint.fr'
const EMAIL_TO = Deno.env.get('EMAIL_TO') || 'contact@j2lprint.fr'
const FROM_NAME = 'J2L Print'
const SITE_ORIGIN = 'https://j2lprint.fr'

const esc = (v: unknown) =>
  String(v ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')

/** Texte multi-ligne -> HTML avec retours à la ligne conservés. */
const escMultiline = (v: unknown) =>
  esc(v).replace(/\r\n|\r|\n/g, '<br />')

/** Valeur réellement renseignée ? (évite les champs vides / « — »). */
const has = (v: unknown) =>
  v !== null && v !== undefined && String(v).trim() !== '' && String(v).trim() !== '—'

interface QuoteItem {
  productName?: string
  sku?: string
  quantity?: number | string
  dimensions?: string
  options?: Record<string, unknown> | null
  fileName?: string | null
  fileUrl?: string | null // storage path inside the print-files bucket
}

interface QuotePayload {
  type?: 'devis' | 'callback'
  reference?: string
  firstName?: string
  lastName?: string
  name?: string
  company?: string
  email?: string
  phone?: string
  product?: string
  address?: string
  postalCode?: string
  city?: string
  message?: string
  pageUrl?: string
  timeSlot?: string
  subject?: string
  items?: QuoteItem[]
  productsTotalHt?: number
  shippingHt?: number
  estimatedTotalHt?: number
}

const fmtMoney = (n?: number) =>
  typeof n === 'number' ? `${n.toFixed(2)} € HT` : ''

const YELLOW = '#FFD100'
const DARK = '#0B0B0B'
const BORDER = '#e5e5e5'
const MUTED = '#555555'

/** Ligne « Libellé : valeur » — n'est rendue que si la valeur existe. */
function row(label: string, valueHtml: string | null | undefined) {
  if (!valueHtml) return ''
  return `<tr><td style="padding:3px 0;font-family:Arial,Helvetica,sans-serif;font-size:14px;color:${MUTED};width:150px;vertical-align:top;">${esc(label)}</td><td style="padding:3px 0;font-family:Arial,Helvetica,sans-serif;font-size:14px;color:${DARK};vertical-align:top;">${valueHtml}</td></tr>`
}

function block(title: string, innerHtml: string) {
  if (!innerHtml.trim()) return ''
  return `<tr><td style="padding:0 24px 16px;"><table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="border:1px solid ${BORDER};border-radius:6px;"><tr><td style="background:#fafafa;border-bottom:1px solid ${BORDER};padding:10px 16px;font-family:Arial,Helvetica,sans-serif;font-size:13px;font-weight:bold;letter-spacing:.5px;color:${DARK};text-transform:uppercase;">${esc(title)}</td></tr><tr><td style="padding:14px 16px;"><table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">${innerHtml}</table></td></tr></table></td></tr>`
}

/** Nom lisible d'une option technique (fallback : slug brut). */
const prettyKey = (k: string) =>
  k.replace(/[_-]+/g, ' ').replace(/^\w/, (c) => c.toUpperCase())

const productUrlFor = (sku?: string | null) =>
  sku && /^[a-z0-9][a-z0-9_-]*$/i.test(String(sku))
    ? `${SITE_ORIGIN}/products/${String(sku).toLowerCase()}`
    : ''

function itemsHtml(items: QuoteItem[], signed: Record<string, string>) {
  return items
    .map((it) => {
      const url = productUrlFor(it.sku)
      const optionRows = it.options
        ? Object.entries(it.options)
            .filter(([, v]) => has(v))
            .map(([k, v]) => `${esc(prettyKey(k))} : <strong>${esc(v)}</strong>`)
            .join('<br />')
        : ''
      const file = has(it.fileName)
        ? signed[it.fileUrl ?? '']
          ? `<a href="${esc(signed[it.fileUrl ?? ''])}" style="color:${DARK};">${esc(it.fileName)}</a> <span style="color:${MUTED};font-size:12px;">(lien sécurisé, valable 14 jours)</span>`
          : esc(it.fileName)
        : ''
      const inner =
        row('Produit', has(it.productName) ? `<strong>${esc(it.productName)}</strong>` : '') +
        row('Référence / SKU', has(it.sku) ? esc(it.sku) : '') +
        row('Fiche produit', url ? `<a href="${esc(url)}" style="color:${DARK};">${esc(url)}</a>` : '') +
        row('Quantité', has(it.quantity) ? `<strong>${esc(it.quantity)}</strong>` : '') +
        row('Format / dimensions', has(it.dimensions) ? esc(it.dimensions) : '') +
        row('Options', optionRows) +
        row('Fichier joint', file)
      if (!inner) return ''
      return `<tr><td style="padding:0 0 12px;"><table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="border-left:3px solid ${YELLOW};background:#fafafa;"><tr><td style="padding:10px 14px;"><table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">${inner}</table></td></tr></table></td></tr>`
    })
    .join('')
}

function button(label: string, href: string, primary: boolean) {
  const bg = primary ? YELLOW : '#ffffff'
  const color = DARK
  return `<td style="padding:0 8px 8px 0;"><a href="${esc(href)}" style="display:inline-block;background:${bg};border:1px solid ${primary ? YELLOW : BORDER};border-radius:6px;padding:11px 20px;font-family:Arial,Helvetica,sans-serif;font-size:14px;font-weight:bold;color:${color};text-decoration:none;">${esc(label)}</a></td>`
}

function buildNotificationHtml(p: QuotePayload, signed: Record<string, string>) {
  const now = new Date().toLocaleString('fr-FR', { timeZone: 'Europe/Paris' })
  const clientName =
    p.name || [p.firstName, p.lastName].filter(Boolean).join(' ') || ''
  const fullAddress = [p.address, [p.postalCode, p.city].filter(Boolean).join(' ')]
    .filter((v) => has(v))
    .join(', ')
  const isCallback = p.type === 'callback'
  const heading = isCallback
    ? 'NOUVELLE DEMANDE DE RAPPEL — J2L PRINT'
    : 'NOUVELLE DEMANDE DE DEVIS — J2L PRINT'

  const clientBlock = block(
    'Client',
    row('Nom et prénom', has(clientName) ? `<strong>${esc(clientName)}</strong>` : '') +
      row('Société', has(p.company) ? esc(p.company) : '') +
      row(
        'E-mail',
        has(p.email) ? `<a href="mailto:${esc(p.email)}" style="color:${DARK};">${esc(p.email)}</a>` : '',
      ) +
      row(
        'Téléphone',
        has(p.phone)
          ? `<a href="tel:${esc(String(p.phone).replace(/[^\d+]/g, ''))}" style="color:${DARK};">${esc(p.phone)}</a>`
          : '',
      ) +
      row('Adresse', has(fullAddress) ? esc(fullAddress) : '') +
      row('Créneau de rappel', has(p.timeSlot) ? esc(p.timeSlot) : ''),
  )

  const items = p.items || []
  const productInner = items.length
    ? itemsHtml(items, signed)
    : row('Produit demandé', has(p.product) ? `<strong>${esc(p.product)}</strong>` : '') +
      row('Objet', !has(p.product) && has(p.subject) ? esc(p.subject) : '') +
      row(
        'Page consultée',
        has(p.pageUrl) ? `<a href="${esc(p.pageUrl)}" style="color:${DARK};">${esc(p.pageUrl)}</a>` : '',
      )
  const productBlock = block('Produit demandé', productInner)

  const totalsBlock =
    p.estimatedTotalHt != null
      ? block(
          'Estimation',
          row('Sous-total produits', fmtMoney(p.productsTotalHt) ? esc(fmtMoney(p.productsTotalHt)) : '') +
            row('Forfait livraison', fmtMoney(p.shippingHt) ? esc(fmtMoney(p.shippingHt)) : '') +
            row('Total estimatif', `<strong>${esc(fmtMoney(p.estimatedTotalHt))}</strong>`),
        )
      : ''

  const messageBlock = has(p.message)
    ? block(
        'Message du client',
        `<tr><td style="font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:1.55;color:${DARK};">${escMultiline(p.message)}</td></tr>`,
      )
    : ''

  const firstUrl = items.map((i) => productUrlFor(i.sku)).find(Boolean) || (has(p.pageUrl) ? p.pageUrl! : '')
  const buttons =
    (has(p.email)
      ? button(
          'Répondre au client',
          `mailto:${p.email}?subject=${encodeURIComponent(`Votre demande de devis — J2L Print${p.reference ? ` (${p.reference})` : ''}`)}`,
          true,
        )
      : '') + (firstUrl ? button('Voir la fiche produit', firstUrl, false) : '')

  const buttonsRow = buttons
    ? `<tr><td style="padding:0 24px 20px;"><table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr>${buttons}</tr></table></td></tr>`
    : ''

  const lines = [
    '<!DOCTYPE html>',
    '<html lang="fr"><head>',
    '<meta charset="utf-8" />',
    '<meta name="viewport" content="width=device-width,initial-scale=1" />',
    `<title>${esc(heading)}</title>`,
    '</head>',
    '<body style="margin:0;padding:0;background:#f4f4f4;">',
    '<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background:#f4f4f4;padding:16px 0;">',
    '<tr><td align="center">',
    '<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="640" style="width:640px;max-width:100%;background:#ffffff;border:1px solid ' +
      BORDER +
      ';border-radius:8px;">',
    `<tr><td style="background:${DARK};border-radius:8px 8px 0 0;padding:20px 24px;font-family:Arial,Helvetica,sans-serif;font-size:17px;font-weight:bold;color:${YELLOW};letter-spacing:.5px;">${esc(heading)}</td></tr>`,
    p.reference
      ? `<tr><td style="padding:14px 24px 4px;font-family:Arial,Helvetica,sans-serif;font-size:13px;color:${MUTED};">Référence interne : <strong style="color:${DARK};">${esc(p.reference)}</strong></td></tr>`
      : '',
    `<tr><td style="padding:14px 24px 16px;font-family:Arial,Helvetica,sans-serif;font-size:13px;color:${MUTED};">Reçue le ${esc(now)}</td></tr>`,
    clientBlock,
    productBlock,
    totalsBlock,
    messageBlock,
    buttonsRow,
    `<tr><td style="border-top:1px solid ${BORDER};padding:14px 24px 18px;font-family:Arial,Helvetica,sans-serif;font-size:12px;color:${MUTED};">J2L Print — 22 B rue Robert Barret, 88390 Uxegney — 03 29 30 44 79 — contact@j2lprint.fr</td></tr>`,
    '</table>',
    '</td></tr>',
    '</table>',
    '</body></html>',
  ]

  // Une ligne par élément, sans espace de fin : évite les « =20 » ajoutés par
  // l'encodage quoted-printable sur les espaces en fin de ligne.
  return lines
    .filter(Boolean)
    .map((l) => l.replace(/[ \t]+$/g, ''))
    .join('\n')
}

/** Version texte brut (multipart/alternative) de la notification interne. */
function buildNotificationText(p: QuotePayload, signed: Record<string, string>) {
  const out: string[] = []
  const clientName = p.name || [p.firstName, p.lastName].filter(Boolean).join(' ')
  out.push(
    p.type === 'callback'
      ? 'NOUVELLE DEMANDE DE RAPPEL - J2L PRINT'
      : 'NOUVELLE DEMANDE DE DEVIS - J2L PRINT',
  )
  if (has(p.reference)) out.push(`Reference interne : ${p.reference}`)
  out.push('', 'CLIENT')
  if (has(clientName)) out.push(`Nom : ${clientName}`)
  if (has(p.company)) out.push(`Societe : ${p.company}`)
  if (has(p.email)) out.push(`E-mail : ${p.email}`)
  if (has(p.phone)) out.push(`Telephone : ${p.phone}`)
  const addr = [p.address, [p.postalCode, p.city].filter(Boolean).join(' ')]
    .filter((v) => has(v))
    .join(', ')
  if (has(addr)) out.push(`Adresse : ${addr}`)
  if (has(p.timeSlot)) out.push(`Creneau de rappel : ${p.timeSlot}`)
  out.push('', 'PRODUIT DEMANDE')
  const items = p.items || []
  if (items.length) {
    for (const it of items) {
      if (has(it.productName)) out.push(`- ${it.productName}`)
      if (has(it.sku)) out.push(`  SKU : ${it.sku}`)
      const url = productUrlFor(it.sku)
      if (url) out.push(`  Fiche : ${url}`)
      if (has(it.quantity)) out.push(`  Quantite : ${it.quantity}`)
      if (has(it.dimensions)) out.push(`  Format : ${it.dimensions}`)
      if (it.options) {
        for (const [k, v] of Object.entries(it.options)) {
          if (has(v)) out.push(`  ${prettyKey(k)} : ${v}`)
        }
      }
      if (has(it.fileName)) {
        out.push(`  Fichier : ${it.fileName}`)
        const link = signed[it.fileUrl ?? '']
        if (link) out.push(`  Lien : ${link}`)
      }
    }
  } else {
    if (has(p.product)) out.push(`Produit : ${p.product}`)
    else if (has(p.subject)) out.push(`Objet : ${p.subject}`)
    if (has(p.pageUrl)) out.push(`Page : ${p.pageUrl}`)
  }
  if (p.estimatedTotalHt != null) {
    out.push('', 'ESTIMATION')
    if (p.productsTotalHt != null) out.push(`Sous-total produits : ${fmtMoney(p.productsTotalHt)}`)
    if (p.shippingHt != null) out.push(`Forfait livraison : ${fmtMoney(p.shippingHt)}`)
    out.push(`Total estimatif : ${fmtMoney(p.estimatedTotalHt)}`)
  }
  if (has(p.message)) out.push('', 'MESSAGE DU CLIENT', String(p.message))
  return out.map((l) => l.replace(/[ \t]+$/g, '')).join('\n')
}

function buildConfirmationHtml(firstName: string) {
  const lines = [
    '<!DOCTYPE html>',
    '<html lang="fr"><head><meta charset="utf-8" /><meta name="viewport" content="width=device-width,initial-scale=1" /></head>',
    '<body style="margin:0;padding:0;background:#f4f4f4;">',
    '<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background:#f4f4f4;padding:16px 0;"><tr><td align="center">',
    `<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="600" style="width:600px;max-width:100%;background:#ffffff;border:1px solid ${BORDER};border-radius:8px;">`,
    `<tr><td style="background:${DARK};border-radius:8px 8px 0 0;padding:18px 24px;font-family:Arial,Helvetica,sans-serif;font-size:16px;font-weight:bold;color:${YELLOW};">J2L PRINT</td></tr>`,
    `<tr><td style="padding:20px 24px;font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:1.6;color:${DARK};">`,
    `Bonjour ${esc(firstName || '')},<br /><br />`,
    'Nous avons bien reçu votre demande de devis sur J2L Print.<br />',
    'Nous allons l&#39;étudier et vous répondrons dans les meilleurs délais.<br /><br />',
    'Cordialement,<br />',
    '<strong>J2L Print</strong><br />',
    `<a href="mailto:contact@j2lprint.fr" style="color:${DARK};">contact@j2lprint.fr</a><br />`,
    `<a href="${SITE_ORIGIN}" style="color:${DARK};">j2lprint.fr</a>`,
    '</td></tr>',
    '</table></td></tr></table>',
    '</body></html>',
  ]
  return lines.map((l) => l.replace(/[ \t]+$/g, '')).join('\n')
}

const confirmationText = (firstName: string) =>
  `Bonjour ${firstName || ''},

Nous avons bien reçu votre demande de devis sur J2L Print.

Nous allons l'étudier et vous répondrons dans les meilleurs délais.

Cordialement,

J2L Print
contact@j2lprint.fr
https://j2lprint.fr`

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  if (!SMTP_PASSWORD) {
    return new Response(
      JSON.stringify({ error: 'SMTP non configuré : mot de passe manquant.' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  }

  let payload: QuotePayload
  try {
    payload = await req.json()
  } catch {
    return new Response(JSON.stringify({ error: 'Corps de requête invalide.' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  // ── Generate signed download links for any attached files (private bucket) ──
  const signed: Record<string, string> = {}
  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    const paths = (payload.items || [])
      .map((it) => it.fileUrl)
      .filter((v): v is string => !!v)
    if (supabaseUrl && serviceKey && paths.length) {
      const supabase = createClient(supabaseUrl, serviceKey)
      for (const path of paths) {
        const { data } = await supabase.storage
          .from('print-files')
          .createSignedUrl(path, 60 * 60 * 24 * 14) // 14 days
        if (data?.signedUrl) signed[path] = data.signedUrl
      }
    }
  } catch (e) {
    console.error('Signed URL generation failed (non-blocking):', e)
  }

  const clientLabel =
    payload.name ||
    [payload.firstName, payload.lastName].filter(Boolean).join(' ') ||
    payload.company ||
    'Client'

  const productLabel =
    (payload.items || []).map((i) => i.productName).filter(Boolean)[0] ||
    payload.product ||
    payload.subject ||
    ''

  const subject =
    payload.type === 'callback'
      ? `Nouvelle demande de rappel J2L Print — ${clientLabel}${productLabel ? ` — ${productLabel}` : ''}`
      : `Nouvelle demande de devis J2L Print — ${clientLabel}${productLabel ? ` — ${productLabel}` : ''}`

  // Mode aperçu : renvoie le HTML sans rien envoyer (contrôle avant publication).
  const url = new URL(req.url)
  if (url.searchParams.get('preview') === '1') {
    return new Response(buildNotificationHtml(payload, signed), {
      status: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/html; charset=utf-8',
        'X-Subject': encodeURIComponent(subject),
      },
    })
  }

  const client = nodemailer.createTransport({
    host: SMTP_HOST,
    port: SMTP_PORT,
    secure: SMTP_PORT === 465,
    auth: { user: SMTP_USER, pass: SMTP_PASSWORD },
  })

  try {
    const sendMail = (message: Parameters<typeof client.sendMail>[0]) =>
      new Promise<void>((resolve, reject) => {
        client.sendMail(message, (error) => {
          if (error) reject(error)
          else resolve()
        })
      })

    // 1) Notification interne → contact@j2lprint.fr, Reply-To = e-mail client
    await sendMail({
      from: `${FROM_NAME} <${EMAIL_FROM}>`,
      to: EMAIL_TO,
      replyTo: payload.email || undefined,
      subject,
      content: buildNotificationText(payload, signed),
      html: buildNotificationHtml(payload, signed),
    })

    // 2) Accusé de réception → client (si e-mail fourni)
    if (payload.email) {
      const firstName =
        payload.firstName || (payload.name ? payload.name.split(' ')[0] : '')
      await sendMail({
        from: `${FROM_NAME} <${EMAIL_FROM}>`,
        to: payload.email,
        replyTo: EMAIL_TO,
        subject: 'Votre demande de devis a bien été reçue — J2L Print',
        content: confirmationText(firstName),
        html: buildConfirmationHtml(firstName),
      })
    }

    client.close()

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (e) {
    console.error('SMTP send failed:', e)
    try {
      client.close()
    } catch (_) {
      // ignore close error
    }
    return new Response(
      JSON.stringify({ error: `Échec de l'envoi du mail : ${e instanceof Error ? e.message : String(e)}` }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  }
})
