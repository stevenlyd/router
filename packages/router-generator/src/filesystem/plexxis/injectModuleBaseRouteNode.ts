import type { RouteNode } from '../../types'

export function injectModuleBaseRouteNode({
  moduleBaseRouteNode,
  routeTree,
}: {
  moduleBaseRouteNode: RouteNode
  routeTree: Array<RouteNode>
}) {
  moduleBaseRouteNode.children = [...routeTree]

  routeTree.forEach((node) => {
    node.parent = moduleBaseRouteNode
  })

  routeTree.length = 0
  routeTree.push(moduleBaseRouteNode)

  const stack: Array<RouteNode> = [moduleBaseRouteNode]

  while (stack.length) {
    const currentNode = stack.pop()

    if (currentNode?.children) {
      stack.push(...currentNode.children)
    }

    if (!currentNode || currentNode.isModuleBase || currentNode.isRoot) {
      continue
    }

    currentNode.routePath = `${moduleBaseRouteNode.routePath}${currentNode.routePath}`
  }
}
