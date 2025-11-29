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
          id: "waterway-labels",
          source: "openmaptiles",
          "source-layer": "water_name",
          filter: ["==", ["geometry-type"], "LineString"],
          layout: {
            "symbol-placement": "line",
            "text-field": ["get", "name"],
            "text-font": ["Americana-Italic"],
          },
        },
        {
          type: "symbol",
          id: "waterbody-labels",
          source: "openmaptiles",
          "source-layer": "water_name",
          filter: ["!=", ["geometry-type"], "LineString"],
          layout: {
            "text-field": ["get", "name"],
            "text-font": ["Americana-Italic"],
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
        {
          type: "symbol",
          id: "boundary-edge-labels",
          source: "openmaptiles",
          "source-layer": "boundary",
          layout: {
            "symbol-placement": "line",
            "text-field": maplibregl.Diplomat.getLocalizedCountryNameExpression(
              ["get", "adm0_l"],
            ),
            "text-font": ["Americana"],
            "text-size": 10,
          },
        },
      ],
    },
  });

  map.addControl(new maplibregl.NavigationControl(), "top-left");
  map.addControl(new maplibregl.FullscreenControl(), "top-left");

  maplibregl.setRTLTextPlugin(
    "https://unpkg.com/@mapbox/mapbox-gl-rtl-text@0.2.3/mapbox-gl-rtl-text.min.js",
    true,
  );

  map.once("styledata", (event) => {
    map.setLayoutProperty(
      "place-labels",
      "text-field",
      maplibregl.Diplomat.localizedNameWithLocalGloss,
    );
    map.localizeStyle(maplibregl.Diplomat.getLocales(), {
      uppercaseCountryNames: true,
    });
  });

  addEventListener("hashchange", (event) => {
    let oldLanguage = maplibregl.Diplomat.getLanguageFromURL(
      new URL(event.oldURL),
    );
    let newLanguage = maplibregl.Diplomat.getLanguageFromURL(
      new URL(event.newURL),
    );
    if (oldLanguage !== newLanguage) {
      map.localizeStyle(maplibregl.Diplomat.getLocales(), {
        uppercaseCountryNames: true,
      });
    }
  });
});
