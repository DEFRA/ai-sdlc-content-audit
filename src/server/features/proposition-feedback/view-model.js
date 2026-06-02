import { STATUS_META, STATUS_ORDER } from '../../services/audit/constants.js'

export const propositionFeedbackWidget = {
  commentMaxLength: 1000,
  statusOptions: STATUS_ORDER.map((value) => ({
    value,
    text: STATUS_META[value].label
  }))
}
