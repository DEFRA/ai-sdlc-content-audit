import { auditPageDetailController } from './controller.js'

export const auditPageDetail = {
  plugin: {
    name: 'audit-page-detail',
    register(server) {
      server.route({
        method: 'GET',
        path: '/audit/subjects/{categoryId}/pages/{pageId}',
        ...auditPageDetailController
      })
    }
  }
}
