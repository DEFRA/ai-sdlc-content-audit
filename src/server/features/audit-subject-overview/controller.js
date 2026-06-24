import Boom from '@hapi/boom'

import { auditSubjectOverviewViewModel } from './view-model.js'

export const auditSubjectOverviewController = {
  handler(request, h) {
    try {
      const categoryId = request.params.categoryId
      const viewModel = auditSubjectOverviewViewModel.get(categoryId)
      if (!viewModel) return Boom.notFound()

      return h.view('features/audit-subject-overview/index', viewModel)
    } catch (error) {
      request.logger.error(
        { err: error },
        'auditSubjectOverviewController failed'
      )
      return h.view('error/index').code(500)
    }
  }
}
