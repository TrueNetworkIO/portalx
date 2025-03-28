import { TrueApi } from "@truenetworkio/sdk";
import { getTrueNetworkInstance } from "../true-network/true.config";

// import the Mixpanel class
import Mixpanel from "mixpanel";
import { startListeningForEvents } from "./events";


const MIX_PANEL_PROJECT_TOKEN = process.env.MIX_PANEL_PROJECT_TOKEN;
if (!MIX_PANEL_PROJECT_TOKEN) {
  throw new Error("MIX_PANEL_PROJECT_TOKEN is not defined");
}


// initialize the Mixpanel instance
const mixpanel = Mixpanel.init(MIX_PANEL_PROJECT_TOKEN, {
  test: true
});

let trueApi: TrueApi | null;

const init = async () => {
  try {
    trueApi = await getTrueNetworkInstance();
    console.log("True Network instance initialized");

    startListeningForEvents({ trueApi, mixpanel });
  } catch (error) {
    console.error("Error initializing True Network instance", error);
  }
}

init();



