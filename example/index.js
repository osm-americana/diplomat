addEventListener("load", () => {
  window.map = new maplibregl.Map({
    container: "map",
    hash: "map",
    style: {
      version: 8,
      glyphs: "https://font.americanamap.org/{fontstack}/{range}.pbf",
      sources: {
        openmaptiles: {
          type: "vector",
          url: "https://tiles.openstreetmap.us/vector/openmaptiles.json",
        },
      },
      layers: [
        {
          type: "symbol",
          id: "road-labels",
          source: "openmaptiles",
          "source-layer": "transportation_name",
          layout: {
            "symbol-placement": "line",
            "text-field": maplibregl.Diplomat.localizedNameInline,
            "text-font": ["Americana"],
          },
        },
        {
          type: "symbol",
          id: "place-labels",
          source: "openmaptiles",
          "source-layer": "place",
          layout: {
            "text-field": ["get", "name"],
            "text-font": ["Americana-Bold"],
          },
        },
      ],
    },
  });

  map.addControl(new maplibregl.NavigationControl(), "top-left");
  map.addControl(new maplibregl.FullscreenControl(), "top-left");

  maplibregl.setRTLTextPlugin(
    "https://unpkg.com/@mapbox/mapbox-gl-rtl-text@0.2.3/mapbox-gl-rtl-text.min.js",
    true
  );

  map.once("styledata", (event) => {
    map.setLayoutProperty(
      "place-labels",
      "text-field",
      maplibregl.Diplomat.localizedNameWithGloss
    );
    let locales = maplibregl.Diplomat.getLocales();
    let style = map.getStyle();
    map.localizeLayers(style.layers, locales);
    map.setStyle(style);
  });

  addEventListener("hashchange", (event) => {
    let oldLanguage = maplibregl.Diplomat.getLanguageFromURL(
      new URL(event.oldURL)
    );
    let newLanguage = maplibregl.Diplomat.getLanguageFromURL(
      new URL(event.newURL)
    );
    if (oldLanguage !== newLanguage) {
      let locales = maplibregl.Diplomat.getLocales();
      console.log(`Changed to ${locales}`);
      let style = map.getStyle();
      map.localizeLayers(style.layers, locales);
      map.setStyle(style);
    }
  });
});
