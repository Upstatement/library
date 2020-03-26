const {getTree, getFilenames, getMeta, getTagged} = require('./list')
const {getTemplates, sortDocs, stringTemplate, getConfig} = require('./utils')

async function getTopNav() {
  const tree = await getTree()
  return buildDisplayCategories(tree)
}

async function getSideNav() {
  const tree = await getTree()
  const navItems = tree.children.protocols.children

  const asArray = Object.values(navItems).sort((a, b) => {
    return parseInt(a.sort) - parseInt(b.sort)
  })

  return asArray
}

function buildDisplayCategories(tree) {
  const categories = Object.keys(tree.children).map((key) => {
    const data = tree.children[key]
    data.path = `/${key}` // for now
    return data
  })

  return categories
  .map((c) => Object.assign({}, c, getMeta(c.id)))
  .filter(({resourceType, tags, isTrashCan}) => !tags.includes('hidden') && !isTrashCan)
  .sort(sortDocs).reverse()
  .map((category) => {
    category.children = Object.values(category.children || {}).map(({id}) => {
      const {prettyName: name, path: url, resourceType, sort, tags} = getMeta(id)
      return {name, resourceType, url, sort, tags}
    })
      .filter(({tags}) => !tags.includes('hidden'))
      .sort(sortDocs)
    return category
  })
}

exports.getTopNav = getTopNav
exports.getSideNav = getSideNav
