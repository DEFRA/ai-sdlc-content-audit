import { buildNavigation } from '../../../../../src/config/nunjucks/context/build-navigation.js'

function mockRequest(options) {
  return { ...options }
}

describe('#buildNavigation', () => {
  test('Should provide expected navigation details', () => {
    expect(
      buildNavigation(mockRequest({ path: '/non-existent-path' }))
    ).toEqual([
      {
        current: false,
        text: 'Guidance audit',
        href: '/'
      }
    ])
  })

  test('Should highlight Guidance audit at root', () => {
    expect(buildNavigation(mockRequest({ path: '/' }))).toEqual([
      {
        current: true,
        text: 'Guidance audit',
        href: '/'
      }
    ])
  })

  test('Should highlight Guidance audit on /audit/* subpages', () => {
    expect(
      buildNavigation(mockRequest({ path: '/audit/subjects/equine' }))
    ).toEqual([
      {
        current: true,
        text: 'Guidance audit',
        href: '/'
      }
    ])
  })
})
