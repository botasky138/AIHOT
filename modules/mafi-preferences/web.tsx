import { defineWebModule } from "@aihot/web/modules";
import { ThumbsButtons } from "./web/actions.tsx";

export default defineWebModule({
  name: "mafi-preferences",
  itemActions: [{ key: "thumbs", Component: ThumbsButtons }],
});
