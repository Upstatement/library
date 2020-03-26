'use strict'

const search = require('../search')

const router = require('express-promise-router')()
const {fetchDoc} = require('../docs')
const {parseUrl} = require('../urlParser')

const {getTopNav, getSideNav} = require('../navigation')

const {getTree, getFilenames, getMeta, getTagged} = require('../list')
const {getTemplates, sortDocs, stringTemplate, getConfig} = require('../utils')

router.get('/', handlePage)
router.get('/:page', handlePage)

router.get('/filename-listing.json', async (req, res) => {
  res.header('Cache-Control', 'public, must-revalidate') // override no-cache
  const filenames = await getFilenames()
  res.json({filenames: filenames})
})

module.exports = router

const pages = getTemplates('pages')

const driveType = process.env.DRIVE_TYPE

// express-promsie-router will call next() if the return value is 'next'.
async function handlePage(req, res) {
  const page = req.params.page || 'index'
  if (!pages.has(page)) return 'next'

  const topNavigation = await getTopNav()
  const sideNavigation = await getSideNav()

  const template = `pages/${page}`
  const {q, autocomplete} = req.query
  if (page === 'search' && q) {
    return search.run(q, driveType).then((results) => {
      // special rule for the autocomplete case, go directly to the item if we find it.
      if (autocomplete) {
        // filter here first to make sure only _one_ document exists with this exact name
        const exactMatches = results.filter((i) => i.prettyName === q)
        if (exactMatches.length === 1) return res.redirect(exactMatches[0].path)
      }

      res.render(template, {q, results, template: stringTemplate, topNav: topNavigation})
    })
  }

  // TODO: repurpose old getFolders/folder view from move-file as tree view for files

  if (page === 'categories' || page === 'index' || page === 'about') {
    const tree = await getTree()
    const categories = buildDisplayCategories(tree)

    if (page === 'index') {
      const {meta, data} = await parseUrl('/homepage')
      const {id} = meta
      const {duplicates} = data

      const baseRenderData = Object.assign({}, {
        url: req.path,
        title: meta.prettyName,
        lastUpdatedBy: (meta.lastModifyingUser || {}).displayName,
        modifiedAt: meta.modifiedTime,
        createdAt: meta.createdTime,
        editLink: meta.mimeType === 'text/html' ? meta.folder.webViewLink : meta.webViewLink,
        id,
        template: stringTemplate,
        duplicates
      })

      const content = await getPageContent(page, tree, req)

      res.render(template, Object.assign({}, categories, baseRenderData, {
        content: content,
        topNav: topNavigation,
        sideNav: topNavigation
      }), (err, html) => {
        if (err) throw err
        res.end(html)
      })
    }

    if (page === 'about') {
      const {meta, data} = await parseUrl(req.path)
      const {id} = meta
      const {duplicates} = data

      const baseRenderData = Object.assign({}, {
        url: req.path,
        title: meta.prettyName,
        lastUpdatedBy: (meta.lastModifyingUser || {}).displayName,
        modifiedAt: meta.modifiedTime,
        createdAt: meta.createdTime,
        editLink: meta.mimeType === 'text/html' ? meta.folder.webViewLink : meta.webViewLink,
        id,
        template: stringTemplate,
        duplicates
      })

      const content = await getPageContent(page, tree, req)

      res.render(template, Object.assign({}, categories, baseRenderData, {
        content: content,
        topNav: topNavigation
      }), (err, html) => {
        if (err) throw err
        res.end(html)
      })
    }

    res.render(template, {
      ...categories,
      template: stringTemplate,
      topNav: topNavigation,
      sideNav: sideNavigation
    })
    return
  }

  res.render(template, {template: stringTemplate, topNav: topNavigation})
}
}

async function getPageContent(page, tree, req) {
  const categories = Object.keys(tree.children).map((key) => {
    const data = tree.children[key]
    data.path = `/${key}` // for now
    return data
  })

  const all = categories
  .map((c) => Object.assign({}, c, getMeta(c.id)))
  .filter(({resourceType, tags, isTrashCan}) => resourceType !== 'folder' && !tags.includes('hidden') && !isTrashCan)
  .sort(sortDocs)
  .map((category) => {
    category.children = Object.values(category.children || {}).map(({id}) => {
      const {prettyName: name, path: url, resourceType, sort, tags} = getMeta(id)
      return {name, resourceType, url, sort, tags}
    })
      .filter(({tags}) => !tags.includes('hidden'))
      .sort(sortDocs)
    return category
  })

  if (page === 'index') {
    page = 'homepage'
  }

  const thisPage = all.filter((filterpage) => filterpage.path === `/${page}`)

  if (thisPage.length) {
    const pageToUse = thisPage[0]
    const {html} = await fetchDoc(pageToUse.id, pageToUse.resourceType, req)
    return html
  }

  return ''
};

function buildDisplayCategories(tree) {
  const categories = Object.keys(tree.children).map((key) => {
    const data = tree.children[key]
    data.path = `/${key}` // for now
    return data
  })

  // Ignore pages at the root of the site on the category page
  const all = categories
    .map((c) => Object.assign({}, c, getMeta(c.id)))
    .filter(({resourceType, tags, isTrashCan}) => resourceType === 'folder' && !tags.includes('hidden') && !isTrashCan)
    .sort(sortDocs)
    .map((category) => {
      category.children = Object.values(category.children || {}).map(({id}) => {
        const {prettyName: name, path: url, resourceType, sort, tags} = getMeta(id)
        return {name, resourceType, url, sort, tags}
      })
        .filter(({tags}) => !tags.includes('hidden'))
        .sort(sortDocs)
      return category
    })

  const modulesConfig = getConfig('landing.modules') || []

  const modules = modulesConfig.map((module) => {
    const items = getTagged(module.tag)
      .map(getMeta)
      .sort(sortDocs)

    return {...module, items}
  })

  return {all, modules}
}
