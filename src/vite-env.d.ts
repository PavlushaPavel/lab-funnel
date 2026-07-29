/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_ANALYTICS_URL?: string;
  readonly VITE_CHECKOUT_URL?: string;
  readonly VITE_ASSISTANT_CA_URL?: string;
  readonly VITE_ASSISTANT_ADS_URL?: string;
  readonly VITE_SUPPORT_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
