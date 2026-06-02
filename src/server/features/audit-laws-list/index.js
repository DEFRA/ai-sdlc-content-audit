import { auditLawsListController } from './controller.js'

export const auditLawsList = {
  plugin: {
    name: 'audit-laws-list',
    register(server) {
      server.route({
        method: 'GET',
        path: '/audit/subjects/{categoryId}/laws',
        ...auditLawsListController
      })
    }
  }
}
