export type OAuthClient = {
  name: string;
  id: string;
  secret?: string;
  redirectUris: string[];
  grants: string[];
  accessTokenLifetime: number;
  refreshTokenLifetime: number;
  userId: string;
  createdDate: string;
};
