import Boom from '@hapi/boom'
import Joi from 'joi'

import { STATUS_ORDER } from '../../services/audit/constants.js'
import { auditService } from '../../services/audit/service.js'
import { feedbackService } from '../../services/feedback/service.js'
import { propositionFeedbackWidget } from './view-model.js'

const payloadSchema = Joi.object({
  flag: Joi.any().strip(),
  suggested_status: Joi.string()
    .allow('')
    .valid('', ...STATUS_ORDER)
    .default(''),
  comment: Joi.string()
    .allow('')
    .max(propositionFeedbackWidget.commentMaxLength)
    .default('')
})
  .default({})
  .allow(null)

export const propositionFeedbackController = {
  options: {
    validate: {
      params: Joi.object({
        categoryId: Joi.number().integer().required(),
        pageId: Joi.number().integer().required(),
        propositionMatchId: Joi.number().integer().required()
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

      const payload = request.payload ?? {}
      const { suggested_status: suggestedStatus, comment } = payload

      await feedbackService.record({
        categoryId,
        pageId,
        propositionMatchId,
        currentStatus,
        suggestedStatus,
        comment: typeof comment === 'string' ? comment.trim() : ''
      })

      return h
        .redirect(
          `/audit/subjects/${categoryId}/pages/${pageId}?feedback=success&matchId=${propositionMatchId}#proposition-${propositionMatchId}`
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
