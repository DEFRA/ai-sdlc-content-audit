import Boom from '@hapi/boom'

import { auditPropositionsOverviewViewModel } from './view-model.js'

export const auditPropositionsOverviewController = {
  handler(request, h) {
    try {
      const categoryId = Number(request.params.categoryId)
      const viewModel = auditPropositionsOverviewViewModel.get(categoryId)
      if (!viewModel) return Boom.notFound()

      return h.view('features/audit-propositions-overview/index', viewModel)
    } catch (error) {
      request.logger.error(
        { err: error },
        'auditPropositionsOverviewController failed'
      )
      return h.view('error/index').code(500)
    }
  }
}
