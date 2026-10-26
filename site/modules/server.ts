// The backend of the site's modules, installed by the api and the worker when they start (site/modules/index.ts).
import type { ServerModule } from "@aihot/backend/modules";
import readers from "@aihot/mafi-readers/server";
import preferences from "@aihot/mafi-preferences/server";

export const SERVER_MODULES: readonly ServerModule[] = [readers, preferences];
