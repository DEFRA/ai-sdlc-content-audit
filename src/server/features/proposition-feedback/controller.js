import Boom from '@hapi/boom'
import Joi from 'joi'

import { PAGE_FILTER_STATUSES } from '../../services/audit/constants.js'
import { auditService } from '../../services/audit/service.js'
import { FEEDBACK_CHOICE_ORDER } from '../../services/feedback/constants.js'
import { feedbackService } from '../../services/feedback/service.js'
import { propositionFeedbackWidget } from './view-model.js'

const payloadSchema = Joi.object({
  choice: Joi.string()
    .valid(...FEEDBACK_CHOICE_ORDER)
    .required(),
  comment: Joi.string()
    .allow('')
    .max(propositionFeedbackWidget.commentMaxLength)
    .default(''),
  status: Joi.string()
    .valid(...PAGE_FILTER_STATUSES)
    .optional()
}).required()

export const propositionFeedbackController = {
  options: {
    validate: {
      params: Joi.object({
        categoryId: Joi.string().required(),
        pageId: Joi.string().required(),
        propositionMatchId: Joi.string().required()
      }),
      payload: payloadSchema,
      failAction(request, h, err) {
        throw err
      }
    }
  },
  async handler(request, h) {
    try {
      const { categoryId, pageId, propositionMatchId } = request.params
      const currentStatus = auditService.getMatchStatus(propositionMatchId)
      if (!currentStatus) return Boom.notFound()

      const { choice, comment, status } = request.payload

      await feedbackService.saveForMatch({
        categoryId,
        pageId,
        propositionMatchId,
        currentStatus,
        choice,
        comment: typeof comment === 'string' ? comment.trim() : ''
      })

      const statusQuery = status ? `&status=${encodeURIComponent(status)}` : ''
      return h
        .redirect(
          `/audit/subjects/${categoryId}/pages/${pageId}?feedback=saved&matchId=${propositionMatchId}${statusQuery}#completed-feedback-${propositionMatchId}`
        )
        .code(303)
    } catch (error) {
      request.logger.error(
        { err: error },
        'propositionFeedbackController failed'
      )
      return h.view('error/index').code(500)
    }
  }
}
