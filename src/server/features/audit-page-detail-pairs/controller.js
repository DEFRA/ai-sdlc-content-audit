import Boom from '@hapi/boom'

import { auditPageDetailPairsViewModel } from './view-model.js'

export const auditPageDetailPairsController = {
  async handler(request, h) {
    try {
      const categoryId = request.params.categoryId
      const pageId = request.params.pageId

      const viewModel = await auditPageDetailPairsViewModel.get(
        categoryId,
        pageId,
        request.query
      )
      if (!viewModel) return Boom.notFound()

      return h.view('features/audit-page-detail-pairs/index', viewModel)
    } catch (error) {
      request.logger.error(
        { err: error },
        'auditPageDetailPairsController failed'
      )
      return h.view('error/index').code(500)
    }
  }
}
