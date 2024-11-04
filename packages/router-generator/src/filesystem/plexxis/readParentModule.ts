import { readParentModuleId } from "./readParentModuleId";
import { readParentModuleName } from "./readParentModuleName";

export async function readParentModule() {
  const [parentModuleId, parentModuleName] = await Promise.all([
    readParentModuleId(),
    readParentModuleName(),
  ]);

  return { parentModuleId, parentModuleName };
}
