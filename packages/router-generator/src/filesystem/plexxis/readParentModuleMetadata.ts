import fs from 'fs/promises'
import path from 'path'

export async function readParentModuleMetadata() {
  const parentPackageJsonPath = path.join(process.cwd(), 'package.json')

  try {
    const parentPackageJsonContent = await fs.readFile(
      parentPackageJsonPath,
      'utf-8',
    )
    const { name, productName, description } = JSON.parse(
      parentPackageJsonContent,
    )

    if (!name) {
      throw new Error('Parent package.json must have a name field')
    }

    if (!productName) {
      throw new Error('Parent package.json must have a productName field')
    }

    const moduleId = name.split('/').pop() as string

    return {
      id: moduleId,
      name: productName as string,
      description: description as string | undefined,
    }
  } catch (error) {
    throw new Error(`Error reading parent package.json: ${error}`)
  }
}
