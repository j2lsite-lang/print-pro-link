import { SITE_ORIGIN, productUrlFor } from './quote-origin.ts'

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

export interface QuoteItem {
  productName?: string
  sku?: string
  productUrl?: string | null
  quantity?: number | string
  copies?: number | string
  configuration?: Record<string, unknown> | null
  dimensions?: string
  options?: Record<string, unknown> | null
  fileName?: string | null
  fileUrl?: string | null // storage path inside the print-files bucket
}

export interface QuotePayload {
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
  productUrl?: string | null
  fileUrl?: string | null
  fileName?: string | null
  timeSlot?: string
  subject?: string
  items?: QuoteItem[]
  productsTotalHt?: number
  shippingHt?: number | null
  vatAmount?: number | null
  estimatedTotalTtc?: number | null
  estimatedTotalHt?: number | null
}

const fmtMoney = (n?: number | null) =>
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

/** Normalise le payload : un fichier joint envoyé à la racine devient un article. */
export function normalizeItems(p: QuotePayload): QuoteItem[] {
  const items = [...(p.items || [])]
  if (!items.length && (has(p.fileUrl) || has(p.fileName) || has(p.product))) {
    items.push({
      productName: p.product || p.subject || 'Demande',
      productUrl: p.productUrl || null,
      fileUrl: p.fileUrl || null,
      fileName: p.fileName || null,
    })
  } else if (items.length && (has(p.fileUrl) || has(p.fileName))) {
    if (!has(items[0].fileUrl) && !has(items[0].fileName)) {
      items[0] = { ...items[0], fileUrl: p.fileUrl || null, fileName: p.fileName || null }
    }
  }
  return items
}

function itemsHtml(items: QuoteItem[], signed: Record<string, string>) {
  return items
    .map((it) => {
      const url = productUrlFor(it.sku, it.productUrl)
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
        row('Exemplaires', has(it.copies) ? esc(it.copies) : '') +
        row('Configuration fournisseur', it.configuration ? esc(JSON.stringify(it.configuration)) : '') +
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

export function buildNotificationHtml(p: QuotePayload, signed: Record<string, string>) {
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

  const items = normalizeItems(p)
  const productInner = items.length
    ? itemsHtml(items, signed) +
      row(
        'Page consultée',
        has(p.pageUrl) ? `<a href="${esc(p.pageUrl)}" style="color:${DARK};">${esc(p.pageUrl)}</a>` : '',
      )
    : row('Produit demandé', has(p.product) ? `<strong>${esc(p.product)}</strong>` : '') +
      row('Objet', !has(p.product) && has(p.subject) ? esc(p.subject) : '') +
      row(
        'Page consultée',
        has(p.pageUrl) ? `<a href="${esc(p.pageUrl)}" style="color:${DARK};">${esc(p.pageUrl)}</a>` : '',
      )
  const productBlock = block('Produit demandé', productInner)

  const totalsBlock =
    p.productsTotalHt != null
      ? block(
          'Estimation',
          row('Sous-total produits', fmtMoney(p.productsTotalHt) ? esc(fmtMoney(p.productsTotalHt)) : '') +
            row('Livraison', esc(p.shippingHt == null ? 'Livraison calculée sur devis' : fmtMoney(p.shippingHt))) +
            row('Total estimatif HT', esc(fmtMoney(p.estimatedTotalHt) || 'À confirmer sur devis')) + row('TVA', esc(p.vatAmount == null ? 'À confirmer sur devis' : `${p.vatAmount.toFixed(2)} €`)) + row('Total estimatif TTC', esc(p.estimatedTotalTtc == null ? 'À confirmer sur devis' : `${p.estimatedTotalTtc.toFixed(2)} € TTC`)),
        )
      : ''

  const messageBlock = has(p.message)
    ? block(
        'Message du client',
        `<tr><td style="font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:1.55;color:${DARK};">${escMultiline(p.message)}</td></tr>`,
      )
    : ''

  const firstUrl =
    items.map((i) => productUrlFor(i.sku, i.productUrl)).find(Boolean) ||
    (has(p.productUrl) ? String(p.productUrl) : '') ||
    (has(p.pageUrl) ? String(p.pageUrl || '') : '')
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
export function buildNotificationText(p: QuotePayload, signed: Record<string, string>) {
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
  const items = normalizeItems(p)
  if (items.length) {
    for (const it of items) {
      if (has(it.productName)) out.push(`- ${it.productName}`)
      if (has(it.sku)) out.push(`  SKU : ${it.sku}`)
      const url = productUrlFor(it.sku, it.productUrl)
      if (url) out.push(`  Fiche : ${url}`)
      if (has(it.quantity)) out.push(`  Quantite : ${it.quantity}`)
      if (has(it.copies)) out.push(`  Exemplaires : ${it.copies}`)
      if (it.configuration) out.push(`  Configuration fournisseur : ${JSON.stringify(it.configuration)}`)
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
  if (p.productsTotalHt != null) {
    out.push('', 'ESTIMATION')
    if (p.productsTotalHt != null) out.push(`Sous-total produits : ${fmtMoney(p.productsTotalHt)}`)
    out.push(`Livraison : ${fmtMoney(p.shippingHt) || 'Livraison calculée sur devis'}`)
    out.push(`Total estimatif HT : ${fmtMoney(p.estimatedTotalHt) || 'À confirmer sur devis'}`, `TVA : ${p.vatAmount == null ? 'À confirmer sur devis' : p.vatAmount.toFixed(2) + ' €'}`, `Total estimatif TTC : ${p.estimatedTotalTtc == null ? 'À confirmer sur devis' : p.estimatedTotalTtc.toFixed(2) + ' € TTC'}`)
  }
  if (has(p.message)) out.push('', 'MESSAGE DU CLIENT', String(p.message))
  return out.map((l) => l.replace(/[ \t]+$/g, '')).join('\n')
}

/** Récapitulatif client : une ligne « Libellé » / valeur, uniquement si renseignée. */
function clientRow(label: string, value: string | null | undefined) {
  if (!value || !has(value)) return ''
  return `<tr><td style="padding:6px 0;font-family:Arial,Helvetica,sans-serif;font-size:14px;color:#bbbbbb;width:130px;vertical-align:top;">${esc(label)}</td><td style="padding:6px 0;font-family:Arial,Helvetica,sans-serif;font-size:14px;font-weight:bold;color:#ffffff;vertical-align:top;">${esc(value)}</td></tr>`
}

/** Ligne totale client : identique mais visuellement marquée. */
function clientTotalRow(label: string, value: string | null | undefined) {
  if (!value || !has(value)) return ''
  return `<tr><td style="padding:8px 0 6px;font-family:Arial,Helvetica,sans-serif;font-size:14px;color:${YELLOW};width:130px;vertical-align:top;border-top:1px solid #333333;">${esc(label)}</td><td style="padding:8px 0 6px;font-family:Arial,Helvetica,sans-serif;font-size:16px;font-weight:bold;color:#ffffff;vertical-align:top;border-top:1px solid #333333;">${esc(value)}</td></tr>`
}

export function buildConfirmationHtml(p: QuotePayload, firstName: string) {
  const items = normalizeItems(p)
  const first = items[0] || {}
  const productName = items.length
    ? items.map((i) => i.productName).filter(has).join(', ')
    : has(p.product) ? String(p.product) : ''
  const quantities = items
    .map((i) => i.quantity)
    .filter(has)
    .map(String)
    .join(', ')
  const subtotal = fmtMoney(p.productsTotalHt)
  const shipping = fmtMoney(p.shippingHt) || (p.productsTotalHt != null ? 'Livraison calculée sur devis' : '')
  const total = fmtMoney(p.estimatedTotalHt)
  const hasFile = items.some((i) => has(i.fileName) || has(i.fileUrl))

  const recapInner =
    clientRow('Produit', productName) +
    clientRow('Quantité', quantities) +
    clientRow('Sous-total produits', subtotal) +
    clientRow('Livraison', shipping) +
    clientTotalRow('Total estimatif HT', total || (p.productsTotalHt != null ? 'À confirmer sur devis' : '')) +
    clientRow('TVA', p.vatAmount == null ? (p.productsTotalHt != null ? 'À confirmer sur devis' : '') : `${p.vatAmount.toFixed(2)} €`) +
    clientTotalRow('Total estimatif TTC', p.estimatedTotalTtc == null ? (p.productsTotalHt != null ? 'À confirmer sur devis' : '') : `${p.estimatedTotalTtc.toFixed(2)} € TTC`) +
    (hasFile ? clientRow('Fichier transmis', 'Oui') : '')
  const recapBlock = recapInner
    ? `<tr><td style="padding:0 24px 20px;"><table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background:${DARK};border-radius:6px;border-left:4px solid ${YELLOW};"><tr><td style="padding:12px 16px 4px;font-family:Arial,Helvetica,sans-serif;font-size:12px;font-weight:bold;letter-spacing:1px;color:${YELLOW};text-transform:uppercase;">Récapitulatif</td></tr><tr><td style="padding:6px 16px 14px;"><table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">${recapInner}</table></td></tr></table></td></tr>`
    : ''

  const greeting = has(firstName) ? `Bonjour ${esc(firstName)},` : 'Bonjour,'
  const lines = [
    '<!DOCTYPE html>',
    '<html lang="fr"><head><meta charset="utf-8" /><meta name="viewport" content="width=device-width,initial-scale=1" /></head>',
    '<body style="margin:0;padding:0;background:#f4f4f4;">',
    '<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background:#f4f4f4;padding:16px 0;"><tr><td align="center">',
    `<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="600" style="width:600px;max-width:100%;background:#ffffff;border:1px solid ${BORDER};border-radius:8px;">`,
    `<tr><td style="background:${DARK};border-radius:8px 8px 0 0;padding:18px 24px;font-family:Arial,Helvetica,sans-serif;font-size:16px;font-weight:bold;color:${YELLOW};letter-spacing:.5px;">J2L PRINT</td></tr>`,
    `<tr><td style="padding:22px 24px 20px;font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:1.6;color:${DARK};">`,
    `${greeting}<br /><br />`,
    'Merci pour votre demande. Elle a bien été enregistrée par notre équipe.',
    '</td></tr>',
    recapBlock,
    `<tr><td style="padding:0 24px 20px;font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:1.6;color:${DARK};">`,
    'Nous allons vérifier votre configuration, vos fichiers et le tarif. Vous recevrez une réponse personnalisée sous 48 heures ouvrées.<br /><br />',
    'Pour toute précision, vous pouvez nous contacter au <a href="tel:+33329304479" style="color:' + DARK + ';font-weight:bold;">03 29 30 44 79</a> ou répondre directement à cet e-mail.<br /><br />',
    'Cordialement,<br />',
    '<strong>L&#39;équipe J2L Print</strong><br />',
    `<a href="mailto:contact@j2lprint.fr" style="color:${DARK};">contact@j2lprint.fr</a><br />`,
    `<a href="${SITE_ORIGIN}" style="color:${DARK};">j2lprint.fr</a>`,
    '</td></tr>',
    '</table></td></tr></table>',
    '</body></html>',
  ]
  return lines.map((l) => l.replace(/[ \t]+$/g, '')).join('\n')
}

export function confirmationText(p: QuotePayload, firstName: string) {
  const items = normalizeItems(p)
  const productName = items.length
    ? items.map((i) => i.productName).filter(has).join(', ')
    : has(p.product) ? String(p.product) : ''
  const quantities = items.map((i) => i.quantity).filter(has).map(String).join(', ')
  const hasFile = items.some((i) => has(i.fileName) || has(i.fileUrl))

  const out: string[] = []
  out.push(has(firstName) ? `Bonjour ${firstName},` : 'Bonjour,')
  out.push('', 'Merci pour votre demande. Elle a bien été enregistrée par notre équipe.')
  const subtotal = fmtMoney(p.productsTotalHt)
  const shipping = fmtMoney(p.shippingHt) || (p.productsTotalHt != null ? 'Livraison calculée sur devis' : '')
  const total = fmtMoney(p.estimatedTotalHt)
  const recap: string[] = []
  if (has(productName)) recap.push(`* Produit : ${productName}`)
  if (has(quantities)) recap.push(`* Quantité : ${quantities}`)
  if (has(subtotal)) recap.push(`* Sous-total produits : ${subtotal}`)
  if (has(shipping)) recap.push(`* Livraison : ${shipping}`)
  if (p.productsTotalHt != null) recap.push(`* Total estimatif HT : ${total || 'À confirmer sur devis'}`, `* TVA : ${p.vatAmount == null ? 'À confirmer sur devis' : p.vatAmount.toFixed(2) + ' €'}`, `* Total estimatif TTC : ${p.estimatedTotalTtc == null ? 'À confirmer sur devis' : p.estimatedTotalTtc.toFixed(2) + ' € TTC'}`)
  if (hasFile) recap.push('* Fichier transmis : Oui')
  if (recap.length) out.push('', 'Récapitulatif :', ...recap)
  out.push(
    '',
    'Nous allons vérifier votre configuration, vos fichiers et le tarif. Vous recevrez une réponse personnalisée sous 48 heures ouvrées.',
    '',
    'Pour toute précision, vous pouvez nous contacter au 03 29 30 44 79 ou répondre directement à cet e-mail.',
    '',
    'Cordialement,',
    "L'équipe J2L Print",
    'contact@j2lprint.fr',
    'https://j2lprint.fr',
  )
  return out.join('\n')
}

