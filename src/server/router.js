import inert from '@hapi/inert'

import { home } from './features/home/index.js'
import { health } from './features/health/index.js'
import { auditSubjectSelect } from './features/audit-subject-select/index.js'
import { auditSubjectOverview } from './features/audit-subject-overview/index.js'
import { auditPagesList } from './features/audit-pages-list/index.js'
import { auditLawsList } from './features/audit-laws-list/index.js'
import { auditPageDetail } from './features/audit-page-detail/index.js'
import { auditDashboard } from './features/audit-dashboard/index.js'
import { propositionFeedback } from './features/proposition-feedback/index.js'
import { adminFeedback } from './features/admin-feedback/index.js'
import { serveStaticFiles } from './common/helpers/serve-static-files.js'

export const router = {
  plugin: {
    name: 'router',
    async register(server) {
      await server.register([inert])

      // Health-check route. Used by platform to check if service is running, do not remove!
      await server.register([health])

      // Application routes
      await server.register([home])

      // DEFRA Guidance Audit journey (standalone)
      await server.register([auditSubjectSelect])
      await server.register([auditSubjectOverview])
      await server.register([auditPagesList])
      await server.register([auditLawsList])
      await server.register([auditPageDetail])
      await server.register([auditDashboard])

      // Proposition feedback widget + admin review screen
      await server.register([propositionFeedback])
      await server.register([adminFeedback])

      // Static assets
      await server.register([serveStaticFiles])
    }
  }
}
