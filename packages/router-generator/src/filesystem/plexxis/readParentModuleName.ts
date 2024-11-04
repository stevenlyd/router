import path from "path";
import fs from "fs/promises";

export async function readParentModuleName() {
  try {
    const parentIndexPath = path.join(process.cwd(), "src", "components", "index.ts");

    const fileContent = await fs.readFile(parentIndexPath, "utf-8");

    const nameMatch = fileContent.match(
      /export\s+const\s+properties\s*:\s*[^=]+=\s*{[^}]*name\s*:\s*["'`](.*?)["'`]/,
    );

    if (!nameMatch) {
      throw new Error("Unable to locate `name` property in properties object.");
    }

    return nameMatch[1];
  } catch (error) {
    throw new Error(`Error reading parent properties: ${error}`);
  }
}
