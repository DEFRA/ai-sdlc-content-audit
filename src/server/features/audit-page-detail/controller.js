import Boom from '@hapi/boom'

import { auditPageDetailViewModel } from './view-model.js'

export const auditPageDetailController = {
  handler(request, h) {
    try {
      const categoryId = Number(request.params.categoryId)
      const pageId = Number(request.params.pageId)

      const viewModel = auditPageDetailViewModel.get(categoryId, pageId)
      if (!viewModel) return Boom.notFound()

      return h.view('features/audit-page-detail/index', viewModel)
    } catch (error) {
      request.logger.error({ err: error }, 'auditPageDetailController failed')
      return h.view('error/index').code(500)
    }
  }
}
