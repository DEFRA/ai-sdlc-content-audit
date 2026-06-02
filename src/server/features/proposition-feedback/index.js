import { propositionFeedbackController } from './controller.js'

export const propositionFeedback = {
  plugin: {
    name: 'proposition-feedback',
    register(server) {
      server.route({
        method: 'POST',
        path: '/audit/subjects/{categoryId}/pages/{pageId}/propositions/{propositionMatchId}/feedback',
        ...propositionFeedbackController
      })
    }
  }
}
