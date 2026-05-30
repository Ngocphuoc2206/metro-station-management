import type { AppProps } from "next/app";
import type { NextPage } from "next";
import { Provider } from "react-redux";
import { PersistGate } from "redux-persist/integration/react";
import { Toaster } from "react-hot-toast";

import { store, persistor } from "@stores/index";
import { LanguageProvider } from "@/features/i18n/LanguageProvider";
import LanguageSwitcher from "@/components/i18n/LanguageSwitcher";

import "@/pages/styles.css";
import "@/styles/globals.css";

export type NextPageWithLayout = NextPage & {
  getLayout?: (page: React.ReactElement) => React.ReactNode;
};

type AppPropsWithLayout = AppProps & {
  Component: NextPageWithLayout;
};

export default function MyApp({ Component, pageProps }: AppPropsWithLayout) {
  const getLayout = Component.getLayout ?? ((page) => page);

  return (
    <Provider store={store}>
      <PersistGate loading={null} persistor={persistor}>
        <LanguageProvider>
          <Toaster position="top-center" toastOptions={{ duration: 4000 }} />
          {getLayout(<Component {...pageProps} />)}
          <LanguageSwitcher />
        </LanguageProvider>
      </PersistGate>
    </Provider>
  );
}

