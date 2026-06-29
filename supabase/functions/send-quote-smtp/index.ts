import { createClient } from 'npm:@supabase/supabase-js@2'
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors'
import { SMTPClient } from 'https://deno.land/x/denomailer@1.6.0/mod.ts'

// ── Hostinger SMTP configuration (values from Lovable secrets) ──
const SMTP_HOST = Deno.env.get('SMTP_HOST') || 'smtp.hostinger.com'
const SMTP_PORT = Number(Deno.env.get('SMTP_PORT') || '465')
const SMTP_USER = Deno.env.get('SMTP_USER') || 'contact@j2lprint.fr'
const SMTP_PASSWORD = Deno.env.get('SMTP_PASSWORD') || ''
const EMAIL_FROM = Deno.env.get('EMAIL_FROM') || 'contact@j2lprint.fr'
const EMAIL_TO = Deno.env.get('EMAIL_TO') || 'contact@j2lprint.fr'
const FROM_NAME = 'J2L Print'

const esc = (v: unknown) =>
  String(v ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')

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
  typeof n === 'number' ? `${n.toFixed(2)} €` : '—'

function buildItemsHtml(items: QuoteItem[], signed: Record<string, string>) {
  if (!items.length) return '<p>Aucun produit précisé.</p>'
  return items
    .map((it) => {
      const opts = it.options
        ? Object.entries(it.options)
            .map(([k, v]) => `${esc(k)} : ${esc(v)}`)
            .join('<br/>')
        : '—'
      const fileLine = it.fileName
        ? signed[it.fileUrl ?? '']
          ? `<a href="${esc(signed[it.fileUrl ?? ''])}">${esc(it.fileName)}</a>`
          : esc(it.fileName)
        : 'Aucun fichier'
      return `
        <div style="border-left:3px solid #FFD100;padding:8px 12px;margin:0 0 12px;background:#fafafa;">
          <p style="margin:0 0 4px;font-weight:bold;color:#0B0B0B;">${esc(it.productName || 'Produit')}</p>
          <p style="margin:2px 0;font-size:13px;color:#333;">Référence : ${esc(it.sku || '—')}</p>
          <p style="margin:2px 0;font-size:13px;color:#333;">Quantité : ${esc(it.quantity ?? '—')}</p>
          <p style="margin:2px 0;font-size:13px;color:#333;">Dimensions / format : ${esc(it.dimensions || '—')}</p>
          <p style="margin:2px 0;font-size:13px;color:#333;">Options : ${opts}</p>
          <p style="margin:2px 0;font-size:13px;color:#333;">Fichier joint : ${fileLine}</p>
        </div>`
    })
    .join('')
}

function buildNotificationHtml(p: QuotePayload, signed: Record<string, string>) {
  const now = new Date().toLocaleString('fr-FR', { timeZone: 'Europe/Paris' })
  const clientName =
    p.name || [p.firstName, p.lastName].filter(Boolean).join(' ') || '—'
  const fullAddress =
    [p.address, [p.postalCode, p.city].filter(Boolean).join(' ')]
      .filter(Boolean)
      .join(', ') || '—'

  const totals =
    p.estimatedTotalHt != null
      ? `<div style="border:1px solid #eee;border-radius:8px;padding:12px 16px;margin:0 0 16px;">
          <p style="margin:2px 0;font-size:13px;">Sous-total produits HT : ${fmtMoney(p.productsTotalHt)}</p>
          <p style="margin:2px 0;font-size:13px;">Forfait livraison HT : ${fmtMoney(p.shippingHt)}</p>
          <p style="margin:6px 0 0;font-size:15px;font-weight:bold;">Total estimatif HT : ${fmtMoney(p.estimatedTotalHt)}</p>
        </div>`
      : ''

  return `
  <div style="font-family:Arial,Helvetica,sans-serif;max-width:640px;margin:0 auto;padding:24px;color:#0B0B0B;">
    <h1 style="font-size:20px;margin:0 0 4px;">Nouvelle demande de devis</h1>
    ${p.reference ? `<p style="font-size:13px;color:#555;margin:0 0 16px;font-weight:bold;">Référence : ${esc(p.reference)}</p>` : ''}

    <div style="border:1px solid #eee;border-radius:8px;padding:12px 16px;margin:0 0 16px;background:#fafafa;">
      <h2 style="font-size:15px;margin:0 0 10px;">Coordonnées client</h2>
      <p style="margin:2px 0;font-size:13px;">Nom et prénom : ${esc(clientName)}</p>
      <p style="margin:2px 0;font-size:13px;">Société : ${esc(p.company || '—')}</p>
      <p style="margin:2px 0;font-size:13px;">E-mail : ${esc(p.email || '—')}</p>
      <p style="margin:2px 0;font-size:13px;">Téléphone : ${esc(p.phone || '—')}</p>
      <p style="margin:2px 0;font-size:13px;">Adresse / code postal de livraison : ${esc(fullAddress)}</p>
      ${p.timeSlot ? `<p style="margin:2px 0;font-size:13px;">Créneau de rappel : ${esc(p.timeSlot)}</p>` : ''}
    </div>

    <div style="margin:0 0 16px;">
      <h2 style="font-size:15px;margin:0 0 10px;">Produit(s) / service(s) demandé(s)</h2>
      ${p.product ? `<p style="margin:0 0 10px;font-size:13px;">${esc(p.product)}</p>` : ''}
      ${buildItemsHtml(p.items || [], signed)}
    </div>

    ${totals}

    <div style="border:1px solid #eee;border-radius:8px;padding:12px 16px;margin:0 0 16px;">
      <h2 style="font-size:15px;margin:0 0 10px;">Message du client</h2>
      <p style="margin:0;font-size:13px;white-space:pre-wrap;">${esc(p.message || 'Aucun message.')}</p>
    </div>

    <div style="font-size:12px;color:#777;">
      <p style="margin:2px 0;">Page d'origine : ${esc(p.pageUrl || '—')}</p>
      <p style="margin:2px 0;">Date et heure : ${esc(now)}</p>
    </div>
  </div>`
}

function buildConfirmationHtml(firstName: string) {
  return `
  <div style="font-family:Arial,Helvetica,sans-serif;max-width:600px;margin:0 auto;padding:24px;color:#0B0B0B;">
    <p>Bonjour ${esc(firstName || '')},</p>
    <p>Nous avons bien reçu votre demande de devis sur J2L Print.</p>
    <p>Nous allons l'étudier et vous répondrons dans les meilleurs délais.</p>
    <p style="margin-top:24px;">Cordialement,</p>
    <p style="margin:0;font-weight:bold;">J2L Print</p>
    <p style="margin:0;"><a href="mailto:contact@j2lprint.fr">contact@j2lprint.fr</a></p>
    <p style="margin:0;"><a href="https://www.j2lprint.fr">https://www.j2lprint.fr</a></p>
  </div>`
}

const confirmationText = (firstName: string) =>
  `Bonjour ${firstName || ''},

Nous avons bien reçu votre demande de devis sur J2L Print.

Nous allons l'étudier et vous répondrons dans les meilleurs délais.

Cordialement,

J2L Print
contact@j2lprint.fr
https://www.j2lprint.fr`

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
    payload.company ||
    payload.name ||
    [payload.firstName, payload.lastName].filter(Boolean).join(' ') ||
    'client'

  const client = new SMTPClient({
    connection: {
      hostname: SMTP_HOST,
      port: SMTP_PORT,
      tls: SMTP_PORT === 465,
      auth: { username: SMTP_USER, password: SMTP_PASSWORD },
    },
  })

  try {
    // 1) Notification interne → contact@j2lprint.fr, Reply-To = e-mail client
    await client.send({
      from: `${FROM_NAME} <${EMAIL_FROM}>`,
      to: EMAIL_TO,
      replyTo: payload.email || undefined,
      subject: `Nouvelle demande de devis J2L Print — ${clientLabel}`,
      html: buildNotificationHtml(payload, signed),
    })

    // 2) Accusé de réception → client (si e-mail fourni)
    if (payload.email) {
      const firstName =
        payload.firstName || (payload.name ? payload.name.split(' ')[0] : '')
      await client.send({
        from: `${FROM_NAME} <${EMAIL_FROM}>`,
        to: payload.email,
        replyTo: EMAIL_TO,
        subject: 'Votre demande de devis a bien été reçue — J2L Print',
        html: buildConfirmationHtml(firstName),
        content: confirmationText(firstName),
      })
    }

    await client.close()

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (e) {
    console.error('SMTP send failed:', e)
    try {
      await client.close()
    } catch (_) {
      // ignore close error
    }
    return new Response(
      JSON.stringify({ error: `Échec de l'envoi du mail : ${e instanceof Error ? e.message : String(e)}` }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  }
})
