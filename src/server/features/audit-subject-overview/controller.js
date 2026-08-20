import { createReadStream } from 'node:fs'

import Boom from '@hapi/boom'

import { statusCodes } from '../../common/constants/status-codes.js'
import { LAW_TO_GUIDANCE_FILTER_STATUSES } from '../../services/audit/constants.js'
import { auditSubjectOverviewViewModel } from './view-model.js'

const VIEW_VALUES = new Set(['content-review', 'law-to-guidance'])
const STATUS_VALUES = new Set(LAW_TO_GUIDANCE_FILTER_STATUSES)
const PAIRS_CSV_CONTENT_TYPE = 'text/csv; charset=utf-8'

export const auditSubjectOverviewController = {
  handler(request, h) {
    try {
      const categoryId = request.params.categoryId
      const viewParam = VIEW_VALUES.has(request.query.view)
        ? request.query.view
        : null
      const statusParam = STATUS_VALUES.has(request.query.status)
        ? request.query.status
        : null

      const viewModel = auditSubjectOverviewViewModel.get(categoryId, {
        view: viewParam,
        status: statusParam
      })
      if (!viewModel) return Boom.notFound()

      return h.view('features/audit-subject-overview/index', viewModel)
    } catch (error) {
      request.logger.error(
        { err: error },
        'auditSubjectOverviewController failed'
      )
      return h.view('error/index').code(statusCodes.internalServerError)
    }
  }
}

export const auditSubjectPairsCsvController = {
  handler(request, h) {
    try {
      const pairsCsv = auditSubjectOverviewViewModel.getPairsCsv(
        request.params.categoryId
      )
      if (!pairsCsv) return Boom.notFound()

      return h
        .response(createReadStream(pairsCsv.path))
        .type(PAIRS_CSV_CONTENT_TYPE)
        .header(
          'content-disposition',
          `attachment; filename="${pairsCsv.filename}"`
        )
        .code(statusCodes.ok)
    } catch (error) {
      request.logger.error(
        { err: error },
        'auditSubjectPairsCsvController failed'
      )
      return h.view('error/index').code(statusCodes.internalServerError)
    }
  }
}
