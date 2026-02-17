declare module "@americana/diplomat" {
  import type { Map as MaplibreMap } from "maplibre-gl";

  // MapLibre types expressions as `any`
  type Expression = any;

  export function getLanguageFromURL(url: URL): string | null;

  export function getLocales(): string[];

  export function getLocalizedNameExpression(
    locales: string[],
    options?: {
      includesLegacyFields?: boolean;
      unlocalizedNameProperty?: string;
      localizedNamePropertyFormat?: string;
    },
  ): Expression;

  export function updateVariable(
    letExpr: unknown[],
    variable: string,
    value: unknown,
  ): void;

  export function replacePropertyReferences(
    expression: unknown[],
    propertyName: string,
    replacement: unknown,
  ): unknown[] | undefined;

  export function listValuesExpression(
    valueList: Expression,
    separator: string | Expression,
    valueToOmit?: Expression,
  ): Expression;

  export function prepareLayer(
    layer: Record<string, unknown>,
    unlocalizedNameProperty?: string,
    glossLocalNames?: boolean,
  ): void;

  export function localizeLayers(
    layers: Record<string, unknown>[],
    locales?: string[],
    options?: {
      unlocalizedNameProperty?: string;
      localizedNamePropertyFormat?: string;
    },
  ): void;

  export function getLocalizedCountryNames(
    locales: string[],
    options?: { uppercase?: boolean },
  ): Record<string, string | undefined>;

  export function getGlobalStateForLocalization(
    locales: string[],
    options?: { uppercaseCountryNames?: boolean },
  ): Record<string, unknown>;

  export function getLocalizedCountryNameExpression(
    code: Expression,
  ): Expression;

  export function localizeStyle(
    map: MaplibreMap,
    locales?: string[],
    options?: {
      layers?: string[];
      sourceLayers?: string[];
      unlocalizedNameProperty?: string;
      localizedNamePropertyFormat?: string;
      glossLocalNames?: boolean;
      uppercaseCountryNames?: boolean;
    },
  ): void;

  export const localizedName: Expression;
  export const localizedNameInline: Expression;
  export const localizedNameWithLocalGloss: Expression;
}
