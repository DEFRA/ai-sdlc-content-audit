import { auditPagesListController } from './controller.js'

export const auditPagesList = {
  plugin: {
    name: 'audit-pages-list',
    register(server) {
      server.route({
        method: 'GET',
        path: '/audit/subjects/{categoryId}/pages',
        ...auditPagesListController
      })
    }
  }
}
