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
        text: 'Home',
        href: '/'
      },
      {
        current: false,
        text: 'Guidance audit',
        href: '/audit'
      },
      {
        current: false,
        text: 'Improvement dashboard',
        href: '/audit/dashboard'
      }
    ])
  })

  test('Should provide expected highlighted navigation details', () => {
    expect(buildNavigation(mockRequest({ path: '/' }))).toEqual([
      {
        current: true,
        text: 'Home',
        href: '/'
      },
      {
        current: false,
        text: 'Guidance audit',
        href: '/audit'
      },
      {
        current: false,
        text: 'Improvement dashboard',
        href: '/audit/dashboard'
      }
    ])
  })
})
