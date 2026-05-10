// Design tokens — mirrors CSS :root variables
// Use these in inline styles or JS logic where Tailwind classes aren't convenient.

export const colors = {
  az:      '#0078D4',
  azDark:  '#005A9E',
  azLight: '#50ABF1',
  azDim:   '#003F72',
  cf:      '#F6821F',
  em:      '#00BCF2',
  s:       '#070D17',
  s2:      '#0B1220',
  s3:      '#101828',
  tx:      '#DCE8F8',
  mu:      '#5A7A9E',
  br:      'rgba(0,120,212,0.22)',
  success: '#16A34A',
  warn:    '#EAB308',
  danger:  '#DC2626',
  sb:      '#3ECF8E',   // Supabase green
  gcp:     '#34A853',   // Google Cloud green
  do:      '#0068DC',   // DigitalOcean blue
}

export const TICKET_STATUS = {
  OPEN:        'Open',
  IN_PROGRESS: 'In Progress',
  RESOLVED:    'Resolved',
}

export const TICKET_PRIORITY = {
  HIGH:   'HIGH',
  MEDIUM: 'MEDIUM',
  LOW:    'LOW',
}

export const RAG_CONFIG = {
  chunkSize:      512,
  topK:           5,
  matchThreshold: 0.75,
  embeddingModel: 'text-embedding-3-large',
  chatModel:      'gpt-4o',
}
