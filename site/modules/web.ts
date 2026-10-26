// What the site's modules add to the web pages (site/modules/index.ts).
import type { WebModule } from "@aihot/web/modules";
import readers from "@aihot/mafi-readers/web";
import preferences from "@aihot/mafi-preferences/web";

export const WEB_MODULES: readonly WebModule[] = [readers, preferences];
