import { createContext, useContext, useEffect, useState } from "react";
import { useRouter } from "next/router";
import type { ReactNode } from "react";
import { translateUiText, type Lang } from "./uiDictionary";

type LanguageContextType = {
  lang: Lang;
  setLang: (lang: Lang) => void;
  toggleLang: () => void;
};

const LanguageContext = createContext<LanguageContextType | null>(null);

const STORAGE_KEY = "metro-ui-lang";
const originalTextMap = new WeakMap<Text, string>();
const originalAttrMap = new WeakMap<HTMLElement, Record<string, string>>();

function getTranslatedValue(currentValue: string, lang: Lang) {
  return translateUiText(currentValue, lang);
}

function rememberOriginalText(node: Text, lang: Lang) {
  const currentValue = node.nodeValue ?? "";
  const savedValue = originalTextMap.get(node);
  if (!savedValue) {
    originalTextMap.set(node, currentValue);
    return currentValue;
  }

  const translatedSavedValue = getTranslatedValue(savedValue, lang);
  if (currentValue !== savedValue && currentValue !== translatedSavedValue) {
    originalTextMap.set(node, currentValue);
    return currentValue;
  }

  return savedValue;
}

function rememberOriginalAttr(element: HTMLElement, attr: string, lang: Lang) {
  const currentValue = element.getAttribute(attr) ?? "";
  const savedAttrs = originalAttrMap.get(element) ?? {};
  const savedValue = savedAttrs[attr];

  if (!savedValue) {
    originalAttrMap.set(element, { ...savedAttrs, [attr]: currentValue });
    return currentValue;
  }

  const translatedSavedValue = getTranslatedValue(savedValue, lang);
  if (currentValue !== savedValue && currentValue !== translatedSavedValue) {
    originalAttrMap.set(element, { ...savedAttrs, [attr]: currentValue });
    return currentValue;
  }

  return savedValue;
}

function translateTextNode(node: Text, lang: Lang) {
  const value = node.nodeValue ?? "";
  if (!value.trim()) return;
  const originalValue = rememberOriginalText(node, lang);
  const translated = getTranslatedValue(originalValue, lang);
  if (translated !== value) node.nodeValue = translated;
}

function translateElementAttributes(element: HTMLElement, lang: Lang) {
  const attributes: Array<"placeholder" | "title" | "aria-label"> = [
    "placeholder",
    "title",
    "aria-label",
  ];

  for (const attr of attributes) {
    const currentValue = element.getAttribute(attr);
    if (!currentValue) continue;
    const originalValue = rememberOriginalAttr(element, attr, lang);
    const translated = getTranslatedValue(originalValue, lang);
    if (translated !== currentValue) element.setAttribute(attr, translated);
  }
}

function translateNodeTree(node: Node, lang: Lang) {
  if (node.nodeType === Node.TEXT_NODE) {
    translateTextNode(node as Text, lang);
    return;
  }

  if (node.nodeType !== Node.ELEMENT_NODE) return;

  const element = node as HTMLElement;
  if (["SCRIPT", "STYLE", "NOSCRIPT"].includes(element.tagName)) return;

  translateElementAttributes(element, lang);
  for (const child of Array.from(element.childNodes)) {
    translateNodeTree(child, lang);
  }
}

function translateDocumentMeta(lang: Lang) {
  if (typeof document === "undefined") return;

  document.documentElement.lang = lang === "vi" ? "vi" : "en";
  document.title = getTranslatedValue(document.title, lang);

  const metaNodes = document.querySelectorAll<HTMLMetaElement>("meta[name='description'], meta[property='og:title'], meta[property='og:description']");
  for (const meta of metaNodes) {
    const content = meta.getAttribute("content");
    if (!content) continue;
    const translated = getTranslatedValue(content, lang);
    if (translated !== content) meta.setAttribute("content", translated);
  }
}

function translateDom(lang: Lang) {
  if (typeof document === "undefined") return;
  translateNodeTree(document.body, lang);
  translateDocumentMeta(lang);
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [lang, setLangState] = useState<Lang>(() => {
    if (typeof window === "undefined") return "vi";
    const saved = window.localStorage.getItem(STORAGE_KEY) as Lang | null;
    return saved === "vi" || saved === "en" ? saved : "vi";
  });

  const setLang = (nextLang: Lang) => {
    setLangState(nextLang);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_KEY, nextLang);
    }
  };

  const toggleLang = () => setLang(lang === "vi" ? "en" : "vi");

  useEffect(() => {
    const onRouteDone = () => window.setTimeout(() => translateDom(lang), 50);
    onRouteDone();
    router.events.on("routeChangeComplete", onRouteDone);
    return () => router.events.off("routeChangeComplete", onRouteDone);
  }, [lang, router.events]);

  useEffect(() => {
    if (typeof document === "undefined") return;

    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (mutation.type === "characterData") {
          translateTextNode(mutation.target as Text, lang);
          continue;
        }

        if (mutation.type === "attributes" && mutation.target instanceof HTMLElement) {
          translateElementAttributes(mutation.target, lang);
          continue;
        }

        for (const addedNode of Array.from(mutation.addedNodes)) {
          translateNodeTree(addedNode, lang);
        }
      }
    });

    observer.observe(document.body, {
      subtree: true,
      childList: true,
      characterData: true,
      attributes: true,
      attributeFilter: ["placeholder", "title", "aria-label"],
    });

    return () => observer.disconnect();
  }, [lang]);

  return <LanguageContext.Provider value={{ lang, setLang, toggleLang }}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) throw new Error("useLanguage must be used within LanguageProvider");
  return context;
}
