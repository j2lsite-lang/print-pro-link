
-- Add missing top-level categories matching Realisaprint navigation
INSERT INTO product_categories (name, slug, description, sort_order) VALUES
  ('Carte de visite', 'carte-de-visite', 'Cartes de visite professionnelles personnalisées.', 1),
  ('Flyer', 'flyer', 'Flyers et tracts publicitaires.', 2),
  ('Brochure', 'brochure', 'Brochures, dépliants et catalogues.', 3),
  ('Étiquette Rouleau', 'etiquette-rouleau', 'Étiquettes en rouleau personnalisées.', 4),
  ('Film DTF', 'film-dtf', 'Films de transfert DTF pour textile et objets.', 5),
  ('Livre', 'livre', 'Livres, dos carré collé et brochures reliées.', 6),
  ('Adhésif', 'adhesif', 'Adhésifs, vinyles et autocollants grand format.', 7),
  ('Panneau rigide', 'panneau-rigide', 'Panneaux Akilux, Forex, Dibond et supports rigides.', 8),
  ('Imprimerie', 'imprimerie', 'Tous produits d''imprimerie : papeterie, enveloppes, blocs-notes.', 9),
  ('Signalétique', 'signaletique', 'Enseignes, totems, bâches et signalétique.', 10),
  ('PLV Stand', 'plv-stand', 'Roll-ups, X-banners, murs d''image et PLV.', 11),
  ('Décoration', 'decoration', 'Papier peint, toiles, affiches décoratives.', 12),
  ('Marquage textile', 'marquage-textile', 'Textile personnalisé, sérigraphie, transfert.', 13),
  ('Packaging', 'packaging', 'Emballages, coffrets, sacs personnalisés.', 15)
ON CONFLICT DO NOTHING;

-- Update sort_order for existing categories that overlap
UPDATE product_categories SET sort_order = 14 WHERE slug = 'objets-publicitaires';
UPDATE product_categories SET sort_order = 50 WHERE slug = 'impression-papier';
UPDATE product_categories SET sort_order = 51 WHERE slug = 'publicite-exterieure';
UPDATE product_categories SET sort_order = 52 WHERE slug = 'publicite-interieure';
UPDATE product_categories SET sort_order = 53 WHERE slug = 'etiquettes-stickers';
UPDATE product_categories SET sort_order = 54 WHERE slug = 'emballages-sacs';
UPDATE product_categories SET sort_order = 55 WHERE slug = 'textiles-accessoires';
UPDATE product_categories SET sort_order = 56 WHERE slug = 'panneaux-baches-vinyles';
UPDATE product_categories SET sort_order = 57 WHERE slug = 'publicite';
