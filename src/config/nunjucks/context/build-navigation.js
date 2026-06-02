export function buildNavigation(request) {
  const path = request?.path ?? ''
  return [
    {
      text: 'Home',
      href: '/',
      current: path === '/'
    },
    {
      text: 'Guidance audit',
      href: '/audit',
      current: path.startsWith('/audit') && path !== '/audit/dashboard'
    },
    {
      text: 'Improvement dashboard',
      href: '/audit/dashboard',
      current: path === '/audit/dashboard'
    }
  ]
}
