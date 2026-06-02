import { feedbackService } from '../../services/feedback/service.js'
import { adminFeedbackViewModel } from './view-model.js'

export const adminFeedbackIndexController = {
  async handler(request, h) {
    try {
      const viewModel = await adminFeedbackViewModel.get(request.query)
      return h.view('features/admin-feedback/index', viewModel)
    } catch (error) {
      request.logger.error(
        { err: error },
        'adminFeedbackIndexController failed'
      )
      return h.view('error/index').code(500)
    }
  }
}

export const adminFeedbackDownloadController = {
  async handler(request, h) {
    try {
      const entries = await feedbackService.listAll()
      return h
        .response(JSON.stringify(entries, null, 2))
        .type('application/json')
        .header('content-disposition', 'attachment; filename="feedback.json"')
    } catch (error) {
      request.logger.error(
        { err: error },
        'adminFeedbackDownloadController failed'
      )
      return h.view('error/index').code(500)
    }
  }
}

export const adminFeedbackClearController = {
  async handler(request, h) {
    try {
      await feedbackService.clear()
      return h.redirect('/admin?cleared=1').code(303)
    } catch (error) {
      request.logger.error(
        { err: error },
        'adminFeedbackClearController failed'
      )
      return h.view('error/index').code(500)
    }
  }
}
