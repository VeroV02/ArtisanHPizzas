(() => {
  const routes = {
    dashboard: null,
    ventas: 'OtrosHtml/ventas.html',
    inventario: 'OtrosHtml/inventario.html',
    personal: 'OtrosHtml/personal.html',
    configuracion: 'OtrosHtml/configuracion.html',
  }
  const main = document.querySelector('main.main-content')
  const dashboardContent = main.innerHTML
  const navLinks = [...document.querySelectorAll('.nav-list a')]
  let navigationId = 0
  const titles = {
    dashboard: 'Artisan Hearth - Dashboard de Gestión',
    ventas: 'Artisan Hearth - Platillos & Ventas',
    inventario: 'Artisan Hearth - Gestión de Inventario',
    personal: 'Artisan Hearth - Personal de Cocina',
    configuracion: 'Artisan Hearth - Configuración',
  }

  function currentRoute() {
    const route = location.hash.replace(/^#\/?/, '').split('/')[0] || 'dashboard'
    return Object.hasOwn(routes, route) ? route : null
  }

  function setActive(route) {
    navLinks.forEach((link) => {
      const active = link.dataset.route === route
      link.closest('.nav-item')?.classList.toggle('active', active)
      if (active) link.setAttribute('aria-current', 'page')
      else link.removeAttribute('aria-current')
    })
  }

  async function render() {
    const requestId = ++navigationId
    const route = currentRoute()
    if (!route) {
      document.title = 'Página no encontrada | Artisan Hearth'
      setActive('')
      main.innerHTML = '<section class="card"><h1 class="main-title">Página no encontrada</h1><p class="main-subtitle">La sección solicitada no existe.</p><a class="btn btn-primary" href="#/">Volver al panel</a></section>'
      return
    }

    setActive(route)
    document.title = titles[route]
    if (route === 'dashboard') {
      main.innerHTML = dashboardContent
      return
    }

    main.setAttribute('aria-busy', 'true')
    main.innerHTML = '<p role="status" class="card">Cargando sección…</p>'
    try {
      const response = await fetch(routes[route])
      if (!response.ok) throw new Error(`HTTP ${response.status}`)
      const page = new DOMParser().parseFromString(await response.text(), 'text/html')
      if (requestId !== navigationId) return
      const content = page.querySelector('main.main-content')
      if (!content) throw new Error('No se encontró el contenido de la sección')
      main.innerHTML = content.innerHTML
      page.querySelectorAll('script:not([src])').forEach((oldScript) => {
        const script = document.createElement('script')
        script.textContent = oldScript.textContent
        document.body.append(script)
        script.remove()
      })
      main.removeAttribute('aria-busy')
    } catch (error) {
      if (requestId !== navigationId) return
      main.removeAttribute('aria-busy')
      main.innerHTML = '<section class="card" role="alert"><h1 class="main-title">No se pudo cargar esta sección</h1><p class="main-subtitle">Comprueba tu conexión y vuelve a intentarlo.</p><button class="btn btn-primary" type="button" onclick="location.reload()">Reintentar</button></section>'
      console.error('Error al cargar la vista:', error)
    }
  }

  navLinks.forEach((link) => {
    const label = link.querySelector('.nav-text')?.textContent.trim()
    const route = label === 'Dashboard' ? 'dashboard' : label?.includes('Ventas') ? 'ventas' : label?.includes('Inventario') ? 'inventario' : label?.includes('Personal') ? 'personal' : 'configuracion'
    link.dataset.route = route
    link.href = `#/${route === 'dashboard' ? '' : route}`
  })

  document.addEventListener('click', (event) => {
    const link = event.target.closest('a[href]')
    if (!link || event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || link.target || link.hasAttribute('download')) return
    const url = new URL(link.href, location.href)
    if (url.origin !== location.origin || !url.hash.startsWith('#/')) return
    event.preventDefault()
    if (url.hash === location.hash) return
    location.hash = url.hash
  })

  document.addEventListener('submit', (event) => {
    const form = event.target
    if (form instanceof HTMLFormElement && !form.getAttribute('action')) event.preventDefault()
  })
  window.addEventListener('hashchange', render)
  render()
})()
