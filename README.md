# Diplomat

Diplomat prepares your interactive map for an international audience. With a few lines of code, your [MapLibre GL&nbsp;JS](https://github.com/maplibre/maplibre-gl-js/)–powered map will speak the user’s preferred language while informing them about local languages the world over.

| Before                                                                                                                  | After                                                                                                                                                                                   |
| ----------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| <img src="docs/navajo-nation.png" width="400" alt="Navajo Nation;Naabeehó Bináhásdzo">                                  | [<img src="docs/navajo-nation-es.png" width="400" alt="Nación Navajo (Navajo Nation • Naabeehó Bináhásdzo)">](https://americanamap.org/#map=9/36.2134/-109.2837&language=es)            |
| <img src="docs/north-sea.png" width="400" alt="North Sea / Nordsee / Noordzee / Nordsøen / Nordsjøen / Mer du Nord">    | [<img src="docs/north-sea-la.png" width="400" alt="Mare Germanicum">](https://americanamap.org/#map=4/56/3&language=la)                                                                 |
| <img src="docs/section-ross.png" width="400" alt="Ross Avenue;Tennesssee Avenue at Rhode Island Avenue;Section Avenue"> | [<img src="docs/section-ross-en.png" width="400" alt="Ross Avenue • Tennesssee Avenue at Rhode Island Avenue • Section Avenue">](https://americanamap.org/#map=17/39.168568/-84.460075) |

## Requirements

Diplomat is compatible with applications using MapLibre GL&nbsp;JS v5.13.0 and above.

The stylesheet must use the newer [expression](https://maplibre.org/maplibre-style-spec/expressions/) syntax; [legacy style functions](https://maplibre.org/maplibre-style-spec/deprecations/#function) are not supported. The stylesheet’s sources must conform to [Diplomat’s schema](#schema). Several popular vector tilesets already conform to this schema, including:

- [OpenMapTiles](https://openmaptiles.org/schema/) implementations, e.g., [MapTiler](https://cloud.maptiler.com/tiles/v3-openmaptiles/), [OpenFreeMap](https://openfreemap.org/), [OpenStreetMap U.S.](https://tiles.openstreetmap.us/vector/openmaptiles/), [Stadia Maps](https://docs.stadiamaps.com/vector/))
- [Tilezen](https://tilezen.readthedocs.io/en/latest/layers/) implementations, e.g., [Protomaps](https://protomaps.com/)

With additional configuration, Diplomat supports even more vector tilesets, including:

- [Mapbox Streets](https://docs.mapbox.com/data/tilesets/reference/mapbox-streets-v8/#names))
- [OpenHistoricalMap](https://wiki.openstreetmap.org/wiki/OpenHistoricalMap/Reuse#Vector_tiles)
- [Shortbread](https://shortbread-tiles.org/schema/): [OpenStreetMap.org](https://vector.openstreetmap.org/)

## Installation

This plugin is available as [an NPM package](https://www.npmjs.com/package/@americana/diplomat). To install it, run the following command:

```sh
npm install @americana/diplomat
```

Alternatively, you can include the plugin as a standalone script from a CDN such as [unpkg](https://unpkg.com/@americana/diplomat/index.js).

## Usage

After creating an instance of `maplibregl.Map`, register an event listener for the `styledata` event that localizes the map:

```js
map.once("styledata", (event) => {
  // Prepare layers to be localized.
  map.setLayoutProperty(
    "country-labels",
    "text-field",
    maplibregl.Diplomat.localizedName
  );
  map.setLayoutProperty(
    "city-labels",
    "text-field",
    maplibregl.Diplomat.localizedNameWithGloss
  );
  map.setLayoutProperty(
    "road-labels",
    "text-field",
    maplibregl.Diplomat.localizedNameInline
  );

  // Localize the layers.
  const locales = maplibregl.Diplomat.getLocales();
  const style = map.getStyle();
  map.localizeLayers(style.layers, locales);
  map.setStyle(style);
});
```

If your stylesheet uses a tileset that formats the name keys differently, such as OpenHistoricalMap or Shortbread, set the format when localizing the layers, for example:

```js
map.localizeLayers(style.layers, locales, {
  localizedNamePropertyFormat: "name_$1",
});
```

If you set the `hash` option to a string when creating the `Map`, you can have this code respond to a `language` parameter in the URL hash. Add a window event listener for whenever the hash changes, in order to update the layers:

```js
addEventListener("hashchange", (event) => {
  let oldLanguage = maplibregl.Diplomat.getLanguageFromURL(
    new URL(event.oldURL)
  );
  let newLanguage = maplibregl.Diplomat.getLanguageFromURL(
    new URL(event.newURL)
  );

  if (oldLanguage !== newLanguage) {
    let locales = maplibregl.Diplomat.getLocales();
    let style = map.getStyle();
    map.localizeLayers(style.layers, locales);
    map.setStyle(style);
  }
});
```

> [!NOTE]
> By default, MapLibre GL&nbsp;JS does not support bidirectional text. Arabic, Hebrew, and other right-to-left languages will be unreadable unless you [install the mapbox-gl-rtl-text plugin](https://maplibre.org/maplibre-gl-js/docs/examples/add-support-for-right-to-left-scripts/).

## Schema

Diplomat can manipulate any GeoJSON or vector tile source, as long as it includes the following properties on each feature:

- **`name`** (`string`): The name in the local or official language. You can customize this property by setting the `unlocalizedNameProperty` option when calling [`maplibregl.Map.prototype.localizeLayers()`](#maplibreglmapprototypelocalizelayers).
- **<code>name:<var>xyz</var></code>** (`string`): The name in another language, where <var>xyz</var> is a valid [IETF language tag](https://en.wikipedia.org/wiki/IETF_language_tag). For example, <code>name:zh</code> for Chinese, <code>name:zh-Hant</code> for Traditional Chinese, <code>name:zh-Hant-TW</code> for Traditional Chinese (Taiwan), and <code>name:zh-Latn-pinyin</code> for Chinese in pinyin. You can customize this format by setting the `localizedNamePropertyFormat` option when calling [`maplibregl.Map.prototype.localizeLayers()`](#maplibreglmapprototypelocalizelayers).

For compatibility with the [OpenMapTiles](https://openmaptiles.org/schema/) schema, `name_en` and `name_de` are also recognized as alternatives to `name:en` and `name:de` for English and German, respectively, but only in the `transportation_name` layer. For performance reasons, Diplomat does not look for this format by default for any other language or layer.

Each of the supported properties may be set to a list of values separated by [semicolons](https://wiki.openstreetmap.org/wiki/Semi-colon_value_separator). For example, if a place speaks both English and French, `name` should be `English Name;French Name`. Similarly, if a landmark has three equally common names in Spanish, regardless of dialect, `name:es` should be `Nombre Uno;Nombre Dos;Nombre Tres`. In the rare case that a single name contains a semicolon, it should be escaped as a double semicolon (`;;`).

## API

This plugin adds several constants to a `maplibregl.Diplomat` namespace and adds a single method to each instance of `maplibregl.Map`.

### `maplibregl.Diplomat.localizedName`

An expression that produces the names in the user's preferred language, each on a separate line.

This expression is appropriate for labeling a type of feature that almost always has a familiar translation in the user’s preferred language, such as the name of a country. It is also appropriate for minor features like points of interest, for which an extra local-language gloss would clutter the map.

Example:

```js
map.setLayoutProperty(
  "country-labels",
  "text-field",
  maplibregl.Diplomat.localizedName
);
```

### `maplibregl.Diplomat.localizedNameInline`

An expression that produces the names in the user's preferred language, all on the same line.

This expression is appropriate for labeling a linear feature, such as a road or waterway. The symbol layer’s [`symbol-placement`](https://maplibre.org/maplibre-style-spec/layers/#symbol-placement) layout property should be set to either `line` or `line-center`.

Example:

```js
map.setLayoutProperty(
  "road-labels",
  "text-field",
  maplibregl.Diplomat.localizedNameInline
);
```

### `maplibre.Diplomat.localizedNameWithLocalGloss`

An expression that produces the name in the user's preferred language, followed by the name in the local language in parentheses if it differs.

This expression is appropriate for labeling a type of feature that is only sometimes translated into user’s preferred language, such as the name of a city or town. The extra local-language gloss respects local customs and keeps the user informed, but it can also risk [information overload](https://en.wikipedia.org/wiki/Information_overload) and crowd out other useful labels.

Example:

```js
map.setLayoutProperty(
  "city-labels",
  "text-field",
  maplibregl.Diplomat.localizedNameWithGloss
);
```

### `maplibregl.Diplomat.getCountryName()`

Returns an expression that converts the given country code to a human-readable name in the user's preferred language.

This method is useful for stylesheets powered by OpenMapTiles, which only provides the ISO&nbsp;3166-1 alpha-3 code of the country on either side of a boundary, but not the full country name in any language.

Parameters:

- **`code`** (`string`): An expression that evaluates to an ISO&nbsp;3166-1 alpha-3 country code.

Example:

```js
map.setLayoutProperty(
  "boundary-edge-labels",
  "text-field",
  getCountryName(["get", "adm0_l"])
);
```

### `maplibregl.Diplomat.getLocales()`

Returns the languages that the user prefers.

Example:

```js
maplibregl.Diplomat.getLocales().includes("en");
```

### `maplibregl.Map.prototype.localizeLayers()`

Updates localizable variables at the top level of each layer's `text-field` expression based on the given locales.

Parameters:

- **`layers`** (`[object]`): The style layers to localize.
- **`locales`** (`[string]`): The locales to insert into each layer, as a comma-separated list of [IETF language tags](https://en.wikipedia.org/wiki/IETF_language_tag). Uses the `language` URL hash parameter or browser preferences by default.
- **`options`** (`object`):
  - **`unlocalizedNameProperty`** (`string`): The name of the property holding the unlocalized name. `name` by default.
  - **`localizedNamePropertyFormat`** (`string`): "The format of properties holding localized names, where `$1` is replaced by an IETF language tag. `name:$1` by default.

> [!NOTE]
> This method modifies the `layers` structure in place. If it comes from the return value of [`maplibregl.Map.prototype.getStyle()`](https://maplibre.org/maplibre-gl-js/docs/API/classes/Map/#getstyle), you must manually synchronize the layers with the style afterwards by calling [`maplibregl.Map.prototype.setStyle()`](https://maplibre.org/maplibre-gl-js/docs/API/classes/Map/#setstyle).

Example:

```js
const style = map.getStyle();
map.localizeLayers(style.layers, locales, {
  localizedNamePropertyFormat: "name_$1",
});
map.setStyle(style);
```

## Caveats

Diplomat only switches between languages that are present in the stylesheet’s data sources. It does not fetch translations from other sources or generate its own transliterations. By convention, [OpenStreetMap’s coverage in some regions](https://wiki.openstreetmap.org/wiki/Multilingual_names) is largely limited to locally spoken languages. If you need more comprehensive coverage in a given language, consider using a tileset that combines names from OpenStreetMap and Wikidata, such as the [OpenStreetMap U.S. Tileservice](https://tiles.openstreetmap.us/vector/openmaptiles/).

By default, MapLibre GL&nbsp;JS does not support bidirectional text. Arabic, Hebrew, and other right-to-left languages will be unreadable unless you [install the mapbox-gl-rtl-text plugin](https://maplibre.org/maplibre-gl-js/docs/examples/add-support-for-right-to-left-scripts/).

Diplomat only performs basic language fallbacks according to the [ICU locale fallback algorithm](https://unicode-org.github.io/icu/userguide/locale/#fallback). It makes no attempt to fallback to a related but distinct language code, for example from `sr-Cyrl` to `ru` or from `nb` to `no`. Instead, the user can [set their preferred languages](https://www.w3.org/International/questions/qa-lang-priorities) in their browser or operating system settings.

For historical reasons, [OpenStreetMap’s coverage in many reasons](https://wiki.openstreetmap.org/wiki/Multilingual_names) encodes multiple local names separated by human-readable punctuation. Diplomat makes no attempt to guess which punctuation is part of a name and which punctuation delimits two names.

## Acknowledgments

This plugin was spun out of the [OpenStreetMap Americana](https://github.com/osm-americana/openstreetmap-americana/) project. It was originally inspired by [Mapbox GL Language](https://github.com/mapbox/mapbox-gl-language/).
