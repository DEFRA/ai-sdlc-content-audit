import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

import { createAuditService } from './create-audit-service.js'
import { loadAuditPresentation } from './load-presentation.js'

const auditDir = dirname(fileURLToPath(import.meta.url))
const runsDir = join(auditDir, 'runs')
const dataDir = join(auditDir, 'data')

// Pipeline-native shapes (Esther output). Loaded from one envelope per category
// under runs/<run-id>/output.json (preferred), or the legacy flat data/ dir.
const { merged: presentation, runIds: loadedRunIds } = loadAuditPresentation({
  runsDir,
  dataDir
})

export const auditService = createAuditService(presentation, loadedRunIds)
