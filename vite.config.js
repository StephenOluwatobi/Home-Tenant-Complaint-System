import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { createAuthHandler } from './api/auth.js'
import { createComplaintsHandler } from './api/complaints.js'
import { createTenantsHandler } from './api/tenants.js'
import { createAnnouncementsHandler } from './api/announcements.js'
import { createSettingsHandler } from './api/settings.js'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), 'TCMS_')
  const handlers = new Map([
    ['/api/auth', createAuthHandler(env)],
    ['/api/complaints', createComplaintsHandler(env)],
    ['/api/tenants', createTenantsHandler(env)],
    ['/api/announcements', createAnnouncementsHandler(env)],
    ['/api/settings', createSettingsHandler(env)],
  ])
  const mountApi = (server) => {
    server.middlewares.use((req, res, next) => {
      const handler = handlers.get(req.url?.split('?', 1)[0])
      return handler ? handler(req, res) : next()
    })
  }
  return {
    plugins: [
      react(),
      { name: 'portal-api', configureServer: mountApi, configurePreviewServer: mountApi },
    ],
  }
})
