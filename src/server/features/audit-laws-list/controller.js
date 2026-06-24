import Boom from '@hapi/boom'

import { auditLawsListViewModel } from './view-model.js'

export const auditLawsListController = {
  handler(request, h) {
    try {
      const categoryId = request.params.categoryId
      const viewModel = auditLawsListViewModel.get(categoryId)
      if (!viewModel) return Boom.notFound()

      return h.view('features/audit-laws-list/index', viewModel)
    } catch (error) {
      request.logger.error({ err: error }, 'auditLawsListController failed')
      return h.view('error/index').code(500)
    }
  }
}
