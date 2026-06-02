import { auditDashboardController } from './controller.js'

export const auditDashboard = {
  plugin: {
    name: 'audit-dashboard',
    register(server) {
      server.route({
        method: 'GET',
        path: '/audit/dashboard',
        ...auditDashboardController
      })
    }
  }
}
