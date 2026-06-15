import * as React from 'npm:react@18.3.1'
import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Row,
  Column,
  Section,
  Text,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

interface QuoteItem {
  product_name?: string
  sku?: string
  quantity?: number
  copies?: number
  options?: Record<string, any> | null
  unit_price?: number | null
  line_total?: number | null
  currency?: string | null
  file_url?: string | null
  file_name?: string | null
}

interface QuoteNotificationProps {
  reference?: string
  name?: string
  company?: string | null
  email?: string
  phone?: string | null
  address?: string | null
  postalCode?: string | null
  city?: string | null
  message?: string | null
  items?: QuoteItem[]
  productsTotalHt?: number
  shippingHt?: number
  estimatedTotalHt?: number
}

const fmt = (n?: number | null) =>
  typeof n === 'number' ? `${n.toFixed(2)} €` : '—'

const Email = ({
  reference = '—',
  name = '—',
  company = null,
  email = '—',
  phone = null,
  address = null,
  postalCode = null,
  city = null,
  message = null,
  items = [],
  productsTotalHt = 0,
  shippingHt = 11.9,
  estimatedTotalHt = 0,
}: QuoteNotificationProps) => {
  const fullAddress = [address, [postalCode, city].filter(Boolean).join(' ')]
    .filter(Boolean)
    .join(', ')

  return (
    <Html lang="fr" dir="ltr">
      <Head />
      <Preview>Nouvelle demande de devis J2L Print – {reference}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>Nouvelle demande de devis</Heading>
          <Text style={refStyle}>Référence : {reference}</Text>

          <Section style={card}>
            <Heading as="h2" style={h2}>Coordonnées client</Heading>
            <Field label="Nom" value={name} />
            <Field label="Société" value={company || '—'} />
            <Field label="E-mail" value={email} />
            <Field label="Téléphone" value={phone || '—'} />
            <Field label="Adresse" value={fullAddress || '—'} />
          </Section>

          <Section style={card}>
            <Heading as="h2" style={h2}>Produits</Heading>
            {items.length === 0 ? (
              <Text style={value}>Aucun produit.</Text>
            ) : (
              items.map((it, idx) => {
                const opts = it.options
                  ? Object.entries(it.options)
                      .map(([k, v]) => `${k}: ${String(v)}`)
                      .join(' · ')
                  : '—'
                return (
                  <div key={idx} style={itemBox}>
                    <Text style={itemTitle}>{it.product_name || 'Produit'}</Text>
                    <Field label="SKU" value={it.sku || '—'} />
                    <Field label="Quantité" value={String(it.quantity ?? '—')} />
                    <Field label="Configuration complète" value={opts} />
                    <Field
                      label="Fichier joint"
                      value={it.file_name ? it.file_name : 'Aucun fichier'}
                    />
                    {it.line_total != null && (
                      <Field label="Sous-total ligne HT" value={fmt(it.line_total)} />
                    )}
                  </div>
                )
              })
            )}
          </Section>

          <Section style={card}>
            <Heading as="h2" style={h2}>Récapitulatif tarifaire</Heading>
            <Row style={totalRow}>
              <Column><Text style={label}>Prix produits HT</Text></Column>
              <Column align="right"><Text style={value}>{fmt(productsTotalHt)}</Text></Column>
            </Row>
            <Row style={totalRow}>
              <Column><Text style={label}>Forfait livraison HT</Text></Column>
              <Column align="right"><Text style={value}>{fmt(shippingHt)}</Text></Column>
            </Row>
            <Hr style={hr} />
            <Row style={totalRow}>
              <Column><Text style={totalLabel}>Total estimatif HT</Text></Column>
              <Column align="right"><Text style={totalValue}>{fmt(estimatedTotalHt)}</Text></Column>
            </Row>
          </Section>

          <Section style={card}>
            <Heading as="h2" style={h2}>Message du client</Heading>
            <Text style={value}>{message || 'Aucun message.'}</Text>
          </Section>

          <Text style={footer}>
            Demande envoyée automatiquement depuis J2L Print.
          </Text>
        </Container>
      </Body>
    </Html>
  )
}

const Field = ({ label: l, value: v }: { label: string; value: string }) => (
  <Row style={fieldRow}>
    <Column style={{ width: '40%' }}><Text style={label}>{l}</Text></Column>
    <Column><Text style={value}>{v}</Text></Column>
  </Row>
)

export const template = {
  component: Email,
  subject: (data: QuoteNotificationProps) =>
    `Nouvelle demande de devis J2L Print – ${data?.reference ?? ''}`.trim(),
  displayName: 'Notification de demande de devis',
  to: 'contact@j2lpublicite.fr',
  previewData: {
    reference: 'DEVIS-AB12CD34',
    name: 'Jean Dupont',
    company: 'ACME SARL',
    email: 'jean@example.com',
    phone: '0612345678',
    address: '12 rue de la Paix',
    postalCode: '75002',
    city: 'Paris',
    message: 'Livraison souhaitée avant le 30.',
    items: [
      {
        product_name: 'Flyers A5',
        sku: 'FLY-A5-135',
        quantity: 1000,
        options: { papier: '135g', finition: 'Mat', format: 'A5' },
        line_total: 89.9,
        file_name: 'flyer-final.pdf',
      },
    ],
    productsTotalHt: 89.9,
    shippingHt: 11.9,
    estimatedTotalHt: 101.8,
  },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: 'Arial, Helvetica, sans-serif' }
const container = { padding: '24px', maxWidth: '640px', margin: '0 auto' }
const h1 = { fontSize: '22px', fontWeight: 'bold', color: '#0B0B0B', margin: '0 0 4px' }
const h2 = { fontSize: '16px', fontWeight: 'bold', color: '#0B0B0B', margin: '0 0 12px' }
const refStyle = { fontSize: '14px', color: '#555', margin: '0 0 20px', fontWeight: 'bold' }
const card = {
  border: '1px solid #eee',
  borderRadius: '8px',
  padding: '16px 18px',
  margin: '0 0 16px',
  backgroundColor: '#fafafa',
}
const itemBox = {
  borderLeft: '3px solid #FFD100',
  paddingLeft: '12px',
  margin: '0 0 14px',
}
const itemTitle = { fontSize: '14px', fontWeight: 'bold', color: '#0B0B0B', margin: '0 0 6px' }
const fieldRow = { margin: '0 0 2px' }
const totalRow = { margin: '0' }
const label = { fontSize: '13px', color: '#777', margin: '2px 0' }
const value = { fontSize: '13px', color: '#0B0B0B', margin: '2px 0' }
const totalLabel = { fontSize: '15px', color: '#0B0B0B', fontWeight: 'bold', margin: '4px 0' }
const totalValue = { fontSize: '17px', color: '#0B0B0B', fontWeight: 'bold', margin: '4px 0' }
const hr = { borderColor: '#e5e5e5', margin: '8px 0' }
const footer = { fontSize: '12px', color: '#999', textAlign: 'center' as const, marginTop: '16px' }
