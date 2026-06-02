import { homeViewModel } from './view-model.js'

export const homeController = {
  handler(request, h) {
    try {
      return h.view('features/home/index', homeViewModel.get())
    } catch (error) {
      request.logger.error({ err: error }, 'homeController failed')
      return h.view('error/index').code(500)
    }
  }
}
