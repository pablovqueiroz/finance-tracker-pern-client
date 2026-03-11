export function getLocale(language?: string) {
  const normalizedLanguage = (language ?? "en").slice(0, 2);

  if (normalizedLanguage === "pt") return "pt-PT";
  if (normalizedLanguage === "es") return "es-ES";

  return "en-US";
}
