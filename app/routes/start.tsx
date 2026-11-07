import { redirect } from "react-router";
import { Splash } from "~/components/ui";
import { read } from "~/lib/store";

export const clientLoader = () => redirect(read().active ? "/learn" : "/welcome");
export const HydrateFallback = Splash;
export default Splash;
