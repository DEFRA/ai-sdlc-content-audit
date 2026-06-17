import {
  FEEDBACK_CHOICES,
  FEEDBACK_CHOICE_ORDER
} from '../../services/feedback/constants.js'

export const propositionFeedbackWidget = {
  commentMaxLength: 1000,
  choices: FEEDBACK_CHOICE_ORDER.map((value) => ({
    value,
    text: FEEDBACK_CHOICES[value].label
  }))
}
