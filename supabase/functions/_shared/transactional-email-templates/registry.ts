import type * as React from 'npm:react@18.3.1'
import { template as quoteNotification } from './quote-notification.tsx'

// A registered transactional email template.
export interface TemplateEntry {
  // React Email component rendered to HTML/plain text.
  component: React.ComponentType<any>
  // Static subject or a function that derives it from templateData.
  subject: string | ((data: any) => string)
  // Human-friendly name for previews/logs.
  displayName?: string
  // Sample data used for previews.
  previewData?: Record<string, any>
  // Fixed recipient — overrides caller-provided recipientEmail when set.
  to?: string
}

export const TEMPLATES: Record<string, TemplateEntry> = {
  'quote-notification': quoteNotification,
}
