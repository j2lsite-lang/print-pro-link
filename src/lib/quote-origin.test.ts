import { beforeEach, describe, expect, it } from 'vitest';
import { readQuoteOrigin, saveQuoteOrigin, productUrlFor, originSummary } from './quote-origin';
import { buildNotificationHtml, buildNotificationText } from '../../supabase/functions/_shared/quote-email';

const origin = {
  sku: 'garden-signs', productName: 'Panneaux de jardin',
  productUrl: 'https://j2lprint.fr/products/garden-signs', quantity: 1, copies: 50,
  options: { Dimensions: '60 × 40 cm', Support: 'Dibond', Impression: 'Recto verso', Accessoires: 'Piquets', Finition: 'Mat' },
  configuration: { copies: 50, size: '600x400', material: 'dibond', sides: 'double', accessories: 'stakes' },
};

describe('origine des demandes de devis', () => {
  beforeEach(() => sessionStorage.clear());
  it('conserve la fiche et la sélection après navigation vers le formulaire et relecture', () => {
    saveQuoteOrigin(origin);
    window.history.replaceState({}, '', '/#devis');
    expect(readQuoteOrigin()).toEqual(origin);
    expect(originSummary(readQuoteOrigin())).toContain('Fiche produit : https://j2lprint.fr/products/garden-signs');
    expect(originSummary(readQuoteOrigin())).toContain('Exemplaires : 50');
  });
  it('rend le vrai lien produit cliquable dans le contenu envoyé par e-mail', () => {
    const payload = { type: 'devis' as const, pageUrl: origin.productUrl, items: [origin] };
    const html = buildNotificationHtml(payload, {});
    const text = buildNotificationText(payload, {});
    expect(html).toContain('href="https://j2lprint.fr/products/garden-signs"');
    expect(html).not.toContain('/#devis');
    expect(text).toContain('Fiche : https://j2lprint.fr/products/garden-signs');
    expect(text).toContain('SKU : garden-signs');
    expect(text).toContain('Exemplaires : 50');
    for (const value of Object.values(origin.options)) expect(text).toContain(value);
    expect(text).toContain(JSON.stringify(origin.configuration));
  });
  it('garde un lien distinct pour chaque produit du panier', () => {
    const html = buildNotificationHtml({ items: [origin, { sku: 'flyers', productName: 'Flyers', copies: 100 }] }, {});
    expect(html).toContain('href="https://j2lprint.fr/products/garden-signs"');
    expect(html).toContain('href="https://j2lprint.fr/products/flyers"');
  });
  it('refuse une URL de formulaire ou étrangère et utilise la référence fournisseur', () => {
    expect(productUrlFor('garden-signs', 'https://j2lprint.fr/#devis')).toBe(origin.productUrl);
    expect(productUrlFor('garden-signs', 'https://example.com/products/garden-signs')).toBe(origin.productUrl);
    expect(productUrlFor(undefined, 'javascript:alert(1)')).toBe('');
  });
  it('ne fabrique pas de produit pour un formulaire général sans origine', () => {
    expect(readQuoteOrigin()).toBeNull();
    expect(originSummary(null)).toBe('');
  });
});