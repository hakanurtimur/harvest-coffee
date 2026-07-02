export const MOBILE_ACCESS_TOKEN_KEY = "harvest_mobile_access_token";

export type SecureTokenStorage = {
  deleteItemAsync(key: string): Promise<void>;
  getItemAsync(key: string): Promise<string | null>;
  setItemAsync(key: string, value: string): Promise<void>;
};

export function createMobileTokenStore(storage: SecureTokenStorage) {
  let accessToken: string | null = null;

  return {
    async clearAccessToken() {
      accessToken = null;
      await storage.deleteItemAsync(MOBILE_ACCESS_TOKEN_KEY);
    },
    getAccessToken() {
      return accessToken;
    },
    async loadAccessToken() {
      accessToken = await storage.getItemAsync(MOBILE_ACCESS_TOKEN_KEY);
      return accessToken;
    },
    async setAccessToken(token: string) {
      accessToken = token;
      await storage.setItemAsync(MOBILE_ACCESS_TOKEN_KEY, token);
    },
  };
}
