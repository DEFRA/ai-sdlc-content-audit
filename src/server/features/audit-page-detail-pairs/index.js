import { auditPageDetailPairsController } from './controller.js'

export const auditPageDetailPairs = {
  plugin: {
    name: 'audit-page-detail-pairs',
    register(server) {
      server.route({
        method: 'GET',
        path: '/audit/subjects/{categoryId}/pages/{pageId}/pairs',
        ...auditPageDetailPairsController
      })
    }
  }
}
