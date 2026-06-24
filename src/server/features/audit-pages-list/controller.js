import Boom from '@hapi/boom'

import { auditPagesListViewModel } from './view-model.js'

export const auditPagesListController = {
  handler(request, h) {
    try {
      const categoryId = request.params.categoryId
      const statusFilter = request.query.status || null

      const viewModel = auditPagesListViewModel.get(categoryId, statusFilter)
      if (!viewModel) return Boom.notFound()

      return h.view('features/audit-pages-list/index', viewModel)
    } catch (error) {
      request.logger.error({ err: error }, 'auditPagesListController failed')
      return h.view('error/index').code(500)
    }
  }
}
