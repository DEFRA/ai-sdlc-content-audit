import { highlightPlaceholders } from '../../../../../src/config/nunjucks/filters/highlight-placeholders.js'

describe('#highlightPlaceholders', () => {
  test('wraps bracket-delimited tokens in mark elements', () => {
    const input = 'Review [DOCUMENT] about [TOPIC] and summarise.'
    const result = highlightPlaceholders(input)

    expect(result).toBe(
      'Review <mark class="defra-placeholder">[DOCUMENT]</mark> about <mark class="defra-placeholder">[TOPIC]</mark> and summarise.'
    )
  })

  test('returns text unchanged when no placeholders are present', () => {
    const input = 'Review the document and summarise.'
    const result = highlightPlaceholders(input)

    expect(result).toBe('Review the document and summarise.')
  })
})
