import { auditSubjectSelectViewModel } from './view-model.js'

export const auditSubjectSelectController = {
  handler(request, h) {
    try {
      const selectedId = request.query.subject ?? null
      return h.view(
        'features/audit-subject-select/index',
        auditSubjectSelectViewModel.get(selectedId)
      )
    } catch (error) {
      request.logger.error(
        { err: error },
        'auditSubjectSelectController failed'
      )
      return h.view('error/index').code(500)
    }
  }
}
