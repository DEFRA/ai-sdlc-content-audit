import { auditSubjectSelectController } from './controller.js'

export const auditSubjectSelect = {
  plugin: {
    name: 'audit-subject-select',
    register(server) {
      server.route({
        method: 'GET',
        path: '/audit',
        ...auditSubjectSelectController
      })
    }
  }
}
