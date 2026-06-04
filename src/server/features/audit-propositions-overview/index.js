import { auditPropositionsOverviewController } from './controller.js'

export const auditPropositionsOverview = {
  plugin: {
    name: 'audit-propositions-overview',
    register(server) {
      server.route({
        method: 'GET',
        path: '/audit/subjects/{categoryId}/propositions',
        ...auditPropositionsOverviewController
      })
    }
  }
}
