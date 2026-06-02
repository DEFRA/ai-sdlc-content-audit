import { auditDashboardViewModel } from './view-model.js'

export const auditDashboardController = {
  handler(request, h) {
    try {
      return h.view(
        'features/audit-dashboard/index',
        auditDashboardViewModel.get()
      )
    } catch (error) {
      request.logger.error({ err: error }, 'auditDashboardController failed')
      return h.view('error/index').code(500)
    }
  }
}
