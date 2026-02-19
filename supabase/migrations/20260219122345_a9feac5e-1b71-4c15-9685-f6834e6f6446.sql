-- Create a public bucket for category images
INSERT INTO storage.buckets (id, name, public)
VALUES ('category-images', 'category-images', true)
ON CONFLICT (id) DO NOTHING;

-- Allow public read access
CREATE POLICY "Public read category images"
ON storage.objects FOR SELECT
USING (bucket_id = 'category-images');
