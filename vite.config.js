import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig(({ mode }) => {
  // Load ALL .env vars (no prefix filter) so non-VITE_ Azure vars are readable
  // here in the config — they are NEVER bundled into the browser.
  const env = loadEnv(mode, process.cwd(), '')

  const azureEndpoint   = env.AZURE_OPENAI_ENDPOINT
  const azureKey        = env.AZURE_OPENAI_KEY
  const chatDeployment  = env.AZURE_OPENAI_DEPLOYMENT          || 'gpt-4o'
  const embedDeployment = env.AZURE_OPENAI_EMBEDDING_DEPLOYMENT || 'text-embedding-3-large'
  const apiVersion      = '2024-02-01'

  // Build proxy only when Azure creds are present in .env
  const azureProxy = azureEndpoint && azureKey ? {
    '/api/azure/chat': {
      target:       azureEndpoint,
      changeOrigin: true,
      rewrite:      () => `/openai/deployments/${chatDeployment}/chat/completions?api-version=${apiVersion}`,
      headers:      { 'api-key': azureKey },
    },
    '/api/azure/embed': {
      target:       azureEndpoint,
      changeOrigin: true,
      rewrite:      () => `/openai/deployments/${embedDeployment}/embeddings?api-version=${apiVersion}`,
      headers:      { 'api-key': azureKey },
    },
  } : {}

  return {
    plugins: [react()],
    resolve: {
      alias: { '@': path.resolve(__dirname, './src') },
    },
    server: {
      port:  3000,
      proxy: azureProxy,
    },
  }
})
