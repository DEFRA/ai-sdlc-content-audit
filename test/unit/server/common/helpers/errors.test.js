import { vi } from 'vitest'

import { catchAll } from '../../../../../src/server/common/helpers/errors.js'
import { statusCodes } from '../../../../../src/server/common/constants/status-codes.js'

const mockErrorLogger = vi.fn()
const mockStack = 'Mock error stack'
const errorPage = 'error/index'

const mockRequest = (statusCode) => ({
  response: {
    isBoom: true,
    stack: mockStack,
    output: {
      statusCode
    }
  },
  logger: { error: mockErrorLogger }
})

const mockToolkitView = vi.fn()
const mockToolkitCode = vi.fn()
const mockToolkit = {
  view: mockToolkitView.mockReturnThis(),
  code: mockToolkitCode.mockReturnThis()
}

describe('#catchAll', () => {
  test('returns Not Found page for 404', () => {
    catchAll(mockRequest(statusCodes.notFound), mockToolkit)

    expect(mockToolkitView).toHaveBeenCalledWith(errorPage, {
      pageTitle: 'Page not found',
      heading: statusCodes.notFound,
      message: 'Page not found'
    })
    expect(mockToolkitCode).toHaveBeenCalledWith(statusCodes.notFound)
  })

  test('returns Forbidden page for 403', () => {
    catchAll(mockRequest(statusCodes.forbidden), mockToolkit)

    expect(mockToolkitView).toHaveBeenCalledWith(errorPage, {
      pageTitle: 'Forbidden',
      heading: statusCodes.forbidden,
      message: 'Forbidden'
    })
    expect(mockToolkitCode).toHaveBeenCalledWith(statusCodes.forbidden)
  })

  test('returns Unauthorized page for 401', () => {
    catchAll(mockRequest(statusCodes.unauthorized), mockToolkit)

    expect(mockToolkitView).toHaveBeenCalledWith(errorPage, {
      pageTitle: 'Unauthorized',
      heading: statusCodes.unauthorized,
      message: 'Unauthorized'
    })
    expect(mockToolkitCode).toHaveBeenCalledWith(statusCodes.unauthorized)
  })

  test('returns Bad Request page for 400', () => {
    catchAll(mockRequest(statusCodes.badRequest), mockToolkit)

    expect(mockToolkitView).toHaveBeenCalledWith(errorPage, {
      pageTitle: 'Bad Request',
      heading: statusCodes.badRequest,
      message: 'Bad Request'
    })
    expect(mockToolkitCode).toHaveBeenCalledWith(statusCodes.badRequest)
  })

  test('returns generic error page for unrecognised status codes', () => {
    catchAll(mockRequest(statusCodes.imATeapot), mockToolkit)

    expect(mockToolkitView).toHaveBeenCalledWith(errorPage, {
      pageTitle: 'Something went wrong',
      heading: statusCodes.imATeapot,
      message: 'Something went wrong'
    })
    expect(mockToolkitCode).toHaveBeenCalledWith(statusCodes.imATeapot)
  })

  test('returns generic error page and logs stack for 500', () => {
    catchAll(mockRequest(statusCodes.internalServerError), mockToolkit)

    expect(mockErrorLogger).toHaveBeenCalledWith(mockStack)
    expect(mockToolkitView).toHaveBeenCalledWith(errorPage, {
      pageTitle: 'Something went wrong',
      heading: statusCodes.internalServerError,
      message: 'Something went wrong'
    })
    expect(mockToolkitCode).toHaveBeenCalledWith(
      statusCodes.internalServerError
    )
  })
})
