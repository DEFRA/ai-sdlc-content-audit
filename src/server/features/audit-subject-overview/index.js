import { auditSubjectOverviewController } from './controller.js'

export const auditSubjectOverview = {
  plugin: {
    name: 'audit-subject-overview',
    register(server) {
      server.route({
        method: 'GET',
        path: '/audit/subjects/{categoryId}',
        ...auditSubjectOverviewController
      })
    }
  }
}
