import { createClient } from 'npm:@supabase/supabase-js@2'
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors'
import nodemailer from 'npm:nodemailer@6.9.16'

// ── Hostinger SMTP configuration (values from Lovable secrets) ──
const SMTP_HOST = Deno.env.get('SMTP_HOST') || 'smtp.hostinger.com'
const SMTP_PORT = Number(Deno.env.get('SMTP_PORT') || '465')
const SMTP_USER = Deno.env.get('SMTP_USER') || 'contact@j2lprint.fr'
const SMTP_PASSWORD = Deno.env.get('SMTP_PASSWORD') || ''
const EMAIL_FROM = Deno.env.get('EMAIL_FROM') || 'contact@j2lprint.fr'
// Expéditeur des notifications internes : distinct de la boîte de réception
// pour éviter l'auto-envoi contact@ -> contact@ (classé en indésirables).
const NOTIFY_FROM = Deno.env.get('NOTIFY_FROM') || 'no-reply@j2lprint.fr'
const EMAIL_TO = Deno.env.get('EMAIL_TO') || 'contact@j2lprint.fr'
const FROM_NAME = 'J2L Print'
import { productUrlFor } from '../_shared/quote-origin.ts'
import { buildNotificationHtml, buildNotificationText, buildConfirmationHtml, confirmationText, normalizeItems, type QuotePayload } from '../_shared/quote-email.ts'

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

  if (payload.reference && payload.type === 'devis') {
    const backendUrl = Deno.env.get('SUPABASE_URL')
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    if (!backendUrl || !serviceKey) return new Response(JSON.stringify({ error: 'Devis indisponible.' }), { status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    const admin = createClient(backendUrl, serviceKey)
    const { data: quote, error } = await admin.from('quote_requests').select('items,products_total_ht,supplier_shipping_ht,shipping_status,estimated_total_ht,vat_amount,estimated_total_ttc').eq('reference', payload.reference).eq('email', payload.email || '').maybeSingle()
    if (error || !quote) return new Response(JSON.stringify({ error: 'Devis non enregistré.' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    payload.items = (quote.items || []).map((item: any) => ({
      productName: item.product_name, sku: item.sku,
      productUrl: productUrlFor(item.sku, item.product_url),
      quantity: item.quantity, copies: item.copies, options: item.options,
      configuration: item.configuration, fileUrl: item.file_url, fileName: item.file_name,
    }))
    payload.pageUrl = payload.items?.[0]?.productUrl || payload.pageUrl
    payload.productsTotalHt = quote.products_total_ht
    payload.shippingHt = quote.shipping_status === 'calculated' ? quote.supplier_shipping_ht : null
    payload.estimatedTotalHt = quote.estimated_total_ht
    payload.vatAmount = quote.vat_amount
    payload.estimatedTotalTtc = quote.estimated_total_ttc
  }

  // ── Generate signed download links for any attached files (private bucket) ──
  const signed: Record<string, string> = {}
  const attachments: { filename: string; content: Uint8Array }[] = []
  let attachedBytes = 0
  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    const paths = normalizeItems(payload)
      .map((it) => it.fileUrl)
      .filter((v): v is string => !!v)
    if (supabaseUrl && serviceKey && paths.length) {
      const supabase = createClient(supabaseUrl, serviceKey)
      for (const path of paths) {
        const { data } = await supabase.storage
          .from('print-files')
          .createSignedUrl(path, 60 * 60 * 24 * 14) // 14 days
        if (data?.signedUrl) signed[path] = data.signedUrl

        // Pièce jointe réelle : le fichier est téléchargé puis attaché à l'e-mail
        // interne (limite 15 Mo cumulés pour rester acceptable par les serveurs).
        try {
          const { data: blob } = await supabase.storage.from('print-files').download(path)
          if (blob) {
            const bytes = new Uint8Array(await blob.arrayBuffer())
            if (bytes.byteLength > 0 && attachedBytes + bytes.byteLength <= 15 * 1024 * 1024) {
              attachedBytes += bytes.byteLength
              attachments.push({
                filename: path.split('/').pop() || 'fichier',
                content: bytes,
              })
            }
          }
        } catch (err) {
          console.error('Attachment download failed (non-blocking):', err)
        }
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

    const msgId = (tag: string) =>
      `<${tag}-${crypto.randomUUID()}@j2lprint.fr>`

    // 1) Notification interne → contact@j2lprint.fr, Reply-To = e-mail client
    // Expéditeur strictement aligné (en-tête From = enveloppe = compte SMTP)
    // pour que SPF/DKIM/DMARC valident et éviter le classement en indésirables.
    await sendMail({
      from: `${FROM_NAME} <${SMTP_USER}>`,
      envelope: { from: SMTP_USER, to: EMAIL_TO },
      to: EMAIL_TO,
      replyTo: payload.email || undefined,
      subject,
      messageId: msgId('devis'),
      date: new Date(),
      text: buildNotificationText(payload, signed),
      html: buildNotificationHtml(payload, signed),
      attachments: attachments.length ? attachments : undefined,
      headers: {
        'Auto-Submitted': 'auto-generated',
        'X-Auto-Response-Suppress': 'OOF, AutoReply',
      },
    })

    // 2) Accusé de réception → client (si e-mail fourni)
    if (payload.email) {
      const firstName =
        payload.firstName || (payload.name ? payload.name.split(' ')[0] : '')
      await sendMail({
        from: `${FROM_NAME} <${SMTP_USER}>`,
        envelope: { from: SMTP_USER, to: payload.email },
        to: payload.email,
        replyTo: EMAIL_TO,
        subject: 'Votre demande de devis J2L Print a bien été reçue',
        messageId: msgId('ar'),
        date: new Date(),
        text: confirmationText(payload, firstName),
        html: buildConfirmationHtml(payload, firstName),
        headers: {
          'Auto-Submitted': 'auto-generated',
          'X-Auto-Response-Suppress': 'OOF, AutoReply',
        },
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
