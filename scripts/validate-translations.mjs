import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import ts from "typescript";

const projectRoot = process.cwd();
const localesRoot = path.join(projectRoot, "src", "i18n", "locales");
const localeNames = fs
  .readdirSync(localesRoot, { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .map((entry) => entry.name)
  .sort();
const errors = [];
const dynamicExactKeys = new Set([
  "language.english",
  "language.portuguese",
  "language.spanish",
  "theme.switchToLight",
  "theme.switchToDark",
]);
const dynamicKeyPrefixes = [
  "categories.",
  "currencies.",
  "invites.status.",
  "roles.",
  "transactionTypes.",
];

function propertyNameText(name) {
  if (
    ts.isIdentifier(name) ||
    ts.isStringLiteral(name) ||
    ts.isNumericLiteral(name)
  ) {
    return name.text;
  }

  return name.getText();
}

function findDuplicateKeys(node, fileName, prefix = "") {
  if (!ts.isObjectLiteralExpression(node)) return;

  const keys = new Map();
  for (const property of node.properties) {
    if (!ts.isPropertyAssignment(property)) continue;

    const key = propertyNameText(property.name);
    const fullKey = prefix ? `${prefix}.${key}` : key;
    if (keys.has(key)) {
      errors.push(`${fileName}: duplicate key "${fullKey}"`);
    } else {
      keys.set(key, true);
    }

    findDuplicateKeys(property.initializer, fileName, fullKey);
  }
}

function flatten(value, prefix = "", output = new Map()) {
  for (const [key, child] of Object.entries(value)) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    if (child && typeof child === "object" && !Array.isArray(child)) {
      flatten(child, fullKey, output);
    } else {
      output.set(fullKey, child);
    }
  }

  return output;
}

function placeholders(value) {
  return [...String(value).matchAll(/\{\{\s*([^},\s]+)[^}]*\}\}/g)]
    .map((match) => match[1])
    .sort();
}

function sourceFiles(directory, output = []) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    if (["dist", "node_modules"].includes(entry.name)) continue;

    const entryPath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      sourceFiles(entryPath, output);
    } else if (/\.[jt]sx?$/.test(entry.name)) {
      output.push(entryPath);
    }
  }

  return output;
}

const catalogs = new Map();

for (const localeName of localeNames) {
  const filePath = path.join(localesRoot, localeName, "translation.json");
  const relativePath = path.relative(projectRoot, filePath);
  const source = fs.readFileSync(filePath, "utf8").replace(/^\uFEFF/, "");
  const sourceFile = ts.parseJsonText(filePath, source);

  for (const diagnostic of sourceFile.parseDiagnostics) {
    errors.push(
      `${relativePath}: ${ts.flattenDiagnosticMessageText(
        diagnostic.messageText,
        "\n",
      )}`,
    );
  }

  const rootExpression = sourceFile.statements[0]?.expression;
  if (rootExpression) {
    findDuplicateKeys(rootExpression, relativePath);
  }

  try {
    catalogs.set(localeName, flatten(JSON.parse(source)));
  } catch (error) {
    errors.push(`${relativePath}: ${error.message}`);
  }
}

const allKeys = [
  ...new Set(
    [...catalogs.values()].flatMap((catalog) => [...catalog.keys()]),
  ),
].sort();

for (const [localeName, catalog] of catalogs) {
  for (const key of allKeys) {
    if (!catalog.has(key)) {
      errors.push(`${localeName}: missing key "${key}"`);
      continue;
    }

    const value = catalog.get(key);
    if (typeof value !== "string") {
      errors.push(`${localeName}: "${key}" must contain a string`);
    } else if (value.trim() === "") {
      errors.push(`${localeName}: "${key}" must not be empty`);
    }
  }
}

for (const key of allKeys) {
  const signatures = new Map(
    [...catalogs].map(([localeName, catalog]) => [
      localeName,
      placeholders(catalog.get(key)).join(","),
    ]),
  );

  if (new Set(signatures.values()).size > 1) {
    errors.push(
      `${key}: incompatible interpolations (${[...signatures]
        .map(([localeName, signature]) => `${localeName}=[${signature}]`)
        .join(", ")})`,
    );
  }
}

const staticKeys = new Map();
for (const filePath of sourceFiles(path.join(projectRoot, "src"))) {
  const source = fs.readFileSync(filePath, "utf8");
  for (const match of source.matchAll(
    /\b(?:t|i18n\.t)\(\s*["'`]([^"'`$]+)["'`]/g,
  )) {
    const key = match[1];
    const locations = staticKeys.get(key) ?? [];
    locations.push(path.relative(projectRoot, filePath));
    staticKeys.set(key, locations);
  }
}

for (const [key, locations] of staticKeys) {
  for (const [localeName, catalog] of catalogs) {
    const hasPluralForms =
      catalog.has(`${key}_one`) && catalog.has(`${key}_other`);
    if (!catalog.has(key) && !hasPluralForms) {
      errors.push(
        `${localeName}: code uses missing key "${key}" (${[
          ...new Set(locations),
        ].join(", ")})`,
      );
    }
  }
}

const dynamicKeys = allKeys.filter(
  (key) =>
    dynamicExactKeys.has(key) ||
    dynamicKeyPrefixes.some((prefix) => key.startsWith(prefix)),
);
const unreferencedKeys = allKeys.filter((key) => {
  const pluralBase = key.replace(/_(one|other)$/, "");
  return (
    !staticKeys.has(key) &&
    !staticKeys.has(pluralBase) &&
    !dynamicExactKeys.has(key) &&
    !dynamicKeyPrefixes.some((prefix) => key.startsWith(prefix))
  );
});

for (const key of unreferencedKeys) {
  errors.push(`catalog contains an unreferenced key "${key}"`);
}

for (const [localeName, catalog] of catalogs) {
  console.log(`${localeName}: ${catalog.size} translation keys`);
}
console.log(`Code: ${staticKeys.size} statically referenced translation keys`);
console.log(`Code: ${dynamicKeys.length} dynamically referenced translation keys`);

if (errors.length > 0) {
  console.error(`\nTranslation validation failed with ${errors.length} error(s):`);
  for (const error of errors) {
    console.error(`- ${error}`);
  }
  process.exitCode = 1;
} else {
  console.log("\nTranslation catalogs are structurally compatible.");
}
