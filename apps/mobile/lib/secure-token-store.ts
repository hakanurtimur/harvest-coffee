import * as SecureStore from "expo-secure-store";
import { createMobileTokenStore } from "./token-store";

export const mobileTokenStore = createMobileTokenStore(SecureStore);
