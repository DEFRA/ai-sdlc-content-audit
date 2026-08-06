import {
  createAll,
  Button,
  CharacterCount,
  Checkboxes,
  ErrorSummary,
  Header,
  Radios,
  SkipLink
} from 'govuk-frontend'

import { initOpenStatementDetails } from './open-statement-details.js'
import { initSortableTables } from './sortable-table.js'
import { initStickyTableScrolls } from './sticky-table-scroll.js'

createAll(Button)
createAll(CharacterCount)
createAll(Checkboxes)
createAll(ErrorSummary)
createAll(Header)
createAll(Radios)
createAll(SkipLink)
initSortableTables()
initStickyTableScrolls()
initOpenStatementDetails()
