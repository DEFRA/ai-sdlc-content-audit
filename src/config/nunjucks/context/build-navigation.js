export function buildNavigation(request) {
  const path = request?.path ?? ''
  return [
    {
      text: 'Guidance audit',
      href: '/',
      current: path === '/' || path.startsWith('/audit')
    }
  ]
}
