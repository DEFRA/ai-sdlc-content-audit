import {
  adminFeedbackClearController,
  adminFeedbackDownloadController,
  adminFeedbackIndexController
} from './controller.js'

export const adminFeedback = {
  plugin: {
    name: 'admin-feedback',
    register(server) {
      server.route({
        method: 'GET',
        path: '/admin',
        ...adminFeedbackIndexController
      })
      server.route({
        method: 'GET',
        path: '/admin/feedback.json',
        ...adminFeedbackDownloadController
      })
      server.route({
        method: 'POST',
        path: '/admin/clear',
        ...adminFeedbackClearController
      })
    }
  }
}
