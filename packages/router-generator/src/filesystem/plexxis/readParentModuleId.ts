import fs from "fs/promises";
import path from "path";

export async function readParentModuleId() {
  const parentPackageJsonPath = path.join(process.cwd(), "package.json");

  try {
    const parentPackageJsonContent = await fs.readFile(parentPackageJsonPath, "utf-8");
    const parentPackageJson = JSON.parse(parentPackageJsonContent);
    const moduleId = parentPackageJson.name.split("/").pop() as string;

    return moduleId;
  } catch (error) {
    throw new Error(`Error reading parent package.json: ${error}`);
  }
}
