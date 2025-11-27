import assert from "node:assert/strict";
import { afterEach, beforeEach, describe, it } from "node:test";
import {
  countryNamesByCode,
  getLanguageFromURL,
  getLocales,
  getLocalizedNameExpression,
  listValuesExpression,
  localizeLayers,
  localizedName,
  localizedNameWithLocalGloss,
  updateVariable,
} from "./index.js";
import { expression } from "@maplibre/maplibre-gl-style-spec";

function localizedTextField(textField, locales) {
  let layers = [
    {
      layout: {
        "text-field": textField,
      },
    },
  ];
  localizeLayers(layers, locales);
  return layers[0].layout["text-field"];
}

function expressionContext(properties) {
  return {
    properties: () => properties,
  };
}

describe("getLanguageFromURL", function () {
  it("accepts an unset language", function () {
    assert.strictEqual(
      getLanguageFromURL(new URL("http://localhost:1776/#map=1/2/3")),
      null
    );
  });
  it("accepts an empty language", function () {
    assert.strictEqual(
      getLanguageFromURL(new URL("http://localhost:1776/#map=1/2/3&language=")),
      null
    );
  });
  it("accepts an ISO 639 code", function () {
    assert.strictEqual(
      getLanguageFromURL(
        new URL("http://localhost:1776/#map=1/2/3&language=tlh")
      ),
      "tlh"
    );
  });
  it("accepts arbitrary text", function () {
    assert.strictEqual(
      getLanguageFromURL(
        new URL("http://localhost:1776/#map=1/2/3&language=the King's English")
      ),
      "the King's English"
    );
  });
});

describe("getLocales", function () {
  beforeEach(function () {
    global.window = {};
    // Instead of reassigning navigator, define properties on it
    Object.defineProperty(global, "navigator", {
      value: {
        languages: [],
        language: "",
      },
      writable: true,
      configurable: true,
    });
  });
  afterEach(function () {
    delete global.window;
    delete global.navigator;
  });

  it("gets locales from preferences", function () {
    window.location = new URL("http://localhost:1776/#map=1/2/3");
    // Update the navigator properties instead of reassigning
    Object.defineProperty(global.navigator, "languages", {
      value: ["tlh-UN", "ase"],
      writable: true,
      configurable: true,
    });
    Object.defineProperty(global.navigator, "language", {
      value: "tlh",
      writable: true,
      configurable: true,
    });
    assert.deepEqual(getLocales(), ["tlh-UN", "tlh", "ase"]);
  });
  it("gets locales from the URL", function () {
    window.location = new URL(
      "http://localhost:1776/#map=1/2/3&language=tlh-UN,ase"
    );
    assert.deepEqual(getLocales(), ["tlh-UN", "tlh", "ase"]);
    window.location = new URL(
      "http://localhost:1776/#map=1/2/3&language=en-t-zh,zh-u-nu-hant,en-u-sd-usnc,es-fonipa,fr-x-gallo"
    );
    assert.deepEqual(getLocales(), [
      "en-t-zh",
      "en",
      "zh-u-nu-hant",
      "zh",
      "en-u-sd-usnc",
      "es-fonipa",
      "es",
      "fr-x-gallo",
      "fr",
    ]);
  });
});

describe("getLocalizedNameExpression", function () {
  it("coalesces names in each locale", function () {
    assert.deepEqual(getLocalizedNameExpression(["en-US", "en", "fr"], false), [
      "coalesce",
      ["get", "name:en-US"],
      ["get", "name:en"],
      ["get", "name:fr"],
      ["get", "name"],
    ]);
  });
  it("includes legacy fields", function () {
    assert.deepEqual(
      getLocalizedNameExpression(["en-US", "en", "de"], {
        includesLegacyFields: true,
      }),
      [
        "coalesce",
        ["get", "name:en-US"],
        ["get", "name:en"],
        ["get", "name_en"],
        ["get", "name:de"],
        ["get", "name_de"],
        ["get", "name"],
      ],
    );
  });
  it("uses the provided property formats", function () {
    assert.deepEqual(
      getLocalizedNameExpression(["en-US", "en", "de"], {
        unlocalizedNameProperty: "moniker",
        localizedNamePropertyFormat: "moniker($1)",
      }),
      [
        "coalesce",
        ["get", "moniker(en-US)"],
        ["get", "moniker(en)"],
        ["get", "moniker(de)"],
        ["get", "moniker"],
      ],
    );
  });
});

describe("updateVariable", function () {
  it("replaces the value at the correct index", function () {
    let expr = [
      "let",
      "one",
      "won",
      "two",
      "too",
      "three",
      "tree",
      ["get", "fore"],
    ];
    updateVariable(expr, "one", 1);
    updateVariable(expr, "two", 2);
    updateVariable(expr, "three", 3);
    assert.deepEqual(expr, [
      "let",
      "one",
      1,
      "two",
      2,
      "three",
      3,
      ["get", "fore"],
    ]);
  });
  it("avoids updating non-let expressions", function () {
    let expr = ["get", "fore"];
    updateVariable(expr, "fore", 4);
    assert.deepEqual(expr, ["get", "fore"]);
  });
});

describe("localizeLayers", function () {
  it("updates localized name", function () {
    let layers = [
      {
        layout: {
          "text-field": "Null Island",
        },
      },
      {
        layout: {
          "text-field": [...localizedName],
        },
      },
    ];
    localizeLayers(layers, ["en"]);
    assert.strictEqual(layers[0].layout["text-field"], "Null Island");
    assert(
      layers[1].layout["text-field"][2].some((expr) => expr.includes("name:en"))
    );
  });
  it("uses legacy name fields in transportation name layers", function () {
    let layers = [
      {
        "source-layer": "transportation_name",
        layout: {
          "text-field": [...localizedName],
        },
      },
    ];
    localizeLayers(layers, ["en"]);
    assert(
      layers[0].layout["text-field"][2].some((expr) => expr.includes("name_en"))
    );
  });
  it("updates collator", function () {
    let layers = [
      {
        layout: {
          "text-field": [
            "let",
            "diplomat__localizedCollator",
            "",
            ["var", "diplomat__localizedCollator"],
          ],
        },
      },
    ];
    localizeLayers(layers, ["tlh"]);
    assert.deepEqual(layers[0].layout["text-field"][2][0], "collator");
    assert.ok(!layers[0].layout["text-field"][2][1]["case-sensitive"]);
    assert.ok(layers[0].layout["text-field"][2][1]["diacritic-sensitive"]);
    assert.strictEqual(layers[0].layout["text-field"][2][1].locale, "tlh");
  });
  it("updates diacritic-insensitive collator in English", function () {
    let layers = [
      {
        layout: {
          "text-field": [
            "let",
            "diplomat__diacriticInsensitiveCollator",
            "",
            ["var", "diplomat__diacriticInsensitiveCollator"],
          ],
        },
      },
    ];
    localizeLayers(layers, ["en-US"]);
    assert.strictEqual(layers[0].layout["text-field"][2][0], "collator");
    assert.ok(!layers[0].layout["text-field"][2][1]["case-sensitive"]);
    assert.ok(!layers[0].layout["text-field"][2][1]["diacritic-sensitive"]);
    assert.strictEqual(layers[0].layout["text-field"][2][1].locale, "en-US");
  });
  it("updates diacritic-insensitive collator in a language other than English", function () {
    let layers = [
      {
        layout: {
          "text-field": [
            "let",
            "diplomat__diacriticInsensitiveCollator",
            "",
            ["var", "diplomat__diacriticInsensitiveCollator"],
          ],
        },
      },
    ];
    localizeLayers(layers, ["enm"]);
    assert.ok(layers[0].layout["text-field"][2][1]["diacritic-sensitive"]);
  });
  it("updates country names in English", function () {
    localizeLayers([], ["en-US"]);
    assert(Object.keys(countryNamesByCode).length >= 200);
    assert.strictEqual(countryNamesByCode.MEX, "MEXICO");
  });
  it("updates country names in a language other than English", function () {
    localizeLayers([], ["eo"]);
    assert(Object.keys(countryNamesByCode).length >= 200);
    assert.strictEqual(countryNamesByCode.USA, "USONO");
  });
  it("widens spaces", function () {
    localizeLayers([], ["en-US"]);
    assert.strictEqual(countryNamesByCode.USA, "UNITED  STATES");
  });
  it("returns undefined for a nonexistent country", function () {
    localizeLayers([], ["en-US"]);
    assert.equal(countryNamesByCode.UNO, undefined);
  });
});

describe("localizedName", function () {
  let evaluatedExpression = (locales, properties) =>
    expression
      .createExpression(localizedTextField([...localizedName], ["en"]))
      .value.expression.evaluate(expressionContext(properties));

  it("is empty by default", function () {
    assert.strictEqual(
      expression.createExpression(localizedName).value.expression.evaluate(
        expressionContext({
          name: "Null Island",
        })
      ),
      ""
    );
  });
  it("localizes to preferred language", function () {
    assert.strictEqual(
      evaluatedExpression(["en"], {
        "name:en": "Null Island",
        name: "Insula Nullius",
      }),
      "Null Island"
    );
  });
});

describe("localizedNameWithLocalGloss", function () {
  let evaluatedExpression = (locales, properties) =>
    expression
      .createExpression(
        localizedTextField([...localizedNameWithLocalGloss], locales)
      )
      .value.expression.evaluate(expressionContext(properties));

  let evaluatedLabelAndGloss = (locales, properties) => {
    let evaluated = evaluatedExpression(locales, properties);
    if (typeof evaluated === "string") {
      return [evaluated];
    }
    return [evaluated.sections[0].text, evaluated.sections[3]?.text];
  };

  let expectGloss = (
    locale,
    localized,
    local,
    expectedLabel,
    expectedGloss
  ) => {
    let properties = {
      name: local,
    };
    properties[`name:${locale}`] = localized;
    assert.deepEqual(evaluatedLabelAndGloss([locale], properties), [
      expectedLabel,
      expectedGloss,
    ]);
  };

  it("puts an unlocalized name by itself", function () {
    let evaluated = evaluatedExpression(["en"], {
      name: "Null Island",
    });

    assert.equal(evaluated.sections.length, 1);
    assert.strictEqual(evaluated.sections[0].text, "Null Island");
  });
  it("spreads multiple unlocalized names across multiple lines", function () {
    let evaluated = evaluatedExpression(["en"], {
      name: "Null Island;Insula Nullius",
    });

    assert.equal(evaluated.sections.length, 1);
    assert.strictEqual(
      evaluated.sections[0].text,
      "Null Island\nInsula Nullius"
    );
  });
  it("glosses an anglicized name with the local name", function () {
    let evaluated = evaluatedExpression(["en"], {
      "name:en": "Null Island",
      name: "Insula Nullius",
    });

    assert.equal(evaluated.sections.length, 5);
    assert.strictEqual(evaluated.sections[0].text, "Null Island");
    assert.strictEqual(evaluated.sections[1].text, "\n");
    assert.strictEqual(evaluated.sections[2].text, "(\u2068");
    assert.strictEqual(evaluated.sections[3].text, "Insula Nullius");
    assert.strictEqual(evaluated.sections[4].text, "\u2069)");

    assert(evaluated.sections[3].scale < 1);
  });
  it("deduplicates matching anglicized and local names", function () {
    expectGloss("en", "Null Island", "Null Island", "Null Island");
    expectGloss("en", "Null Island", "NULL Island", "Null Island");
    expectGloss("en", "Montreal", "Montréal", "Montréal");
    expectGloss("en", "Quebec City", "Québec", "Québec City");
    expectGloss("en", "Da Nang", "Đà Nẵng", "Đà Nẵng");
    expectGloss("en", "Nūll Island", "Ñüłl Íşlåńđ", "Ñüłl Íşlåńđ");
    expectGloss("en", "New York City", "New York", "New York City");
    expectGloss("en", "Washington, D.C.", "Washington", "Washington, D.C.");
    expectGloss(
      "en",
      "Santiago de Querétaro",
      "Querétaro",
      "Santiago de Querétaro"
    );

    // Suboptimal but expected cases

    expectGloss("en", "Córdobaaa", "Córdoba", "Córdobaaa", "Córdoba");
    expectGloss(
      "en",
      "Derry",
      "Derry/Londonderry",
      "Derry",
      "Derry/Londonderry"
    );
  });
  it("glosses non-English localized name with lookalike local name", function () {
    expectGloss(
      "es",
      "Los Ángeles",
      "Los Angeles",
      "Los Ángeles",
      "Los Angeles"
    );
    expectGloss("es", "Montreal", "Montréal", "Montreal", "Montréal");
    expectGloss("es", "Quebec", "Québec", "Quebec", "Québec");
    expectGloss("pl", "Ryga", "Rīga", "Ryga", "Rīga");
    expectGloss("pl", "Jurmała", "Jūrmala", "Jurmała", "Jūrmala");
  });
  it("glosses multiple local names", function () {
    expectGloss(
      "en",
      "Null Island",
      "Terra Nullius;空虛島",
      "Null Island",
      "Terra Nullius • 空虛島"
    );
  });
  it("deduplicates anglicized name and one of the local names", function () {
    expectGloss(
      "en",
      "Null Island",
      "Null Island;Terra Nullius;空虛島",
      "Null Island",
      "Terra Nullius • 空虛島"
    );
    expectGloss(
      "en",
      "Null Island",
      "Terra Nullius;Null Island;空虛島",
      "Null Island",
      "Terra Nullius • 空虛島"
    );
    expectGloss(
      "en",
      "Null Island",
      "Terra Nullius;空虛島;Null Island",
      "Null Island",
      "Terra Nullius • 空虛島"
    );
    expectGloss(
      "en",
      "Null Island",
      "Null Island;Null Island;Null Island",
      "Null Island",
      ""
    );
  });
});

describe("listValuesExpression", function () {
  let evaluatedExpression = (valueList, separator, valueToOmit) =>
    expression
      .createExpression(
        localizedTextField(
          [...listValuesExpression(valueList, separator, valueToOmit)],
          ["en"]
        )
      )
      .value.expression.evaluate(expressionContext({}));

  it("lists an empty list", function () {
    assert.strictEqual(evaluatedExpression("", ", "), "");
  });

  it("lists a single value", function () {
    assert.strictEqual(evaluatedExpression("ABC", ", "), "ABC");
  });

  it("lists empty values", function () {
    assert.strictEqual(evaluatedExpression(";", ", "), ", ");
  });

  it("lists multiple values", function () {
    assert.strictEqual(evaluatedExpression("ABC;DEF", ", "), "ABC, DEF");
    assert.strictEqual(
      evaluatedExpression("ABC;DEF;GHI", ", "),
      "ABC, DEF, GHI"
    );
    assert.strictEqual(evaluatedExpression(";ABC;DEF", ", "), ", ABC, DEF");
    assert.strictEqual(evaluatedExpression("ABC;DEF;", ", "), "ABC, DEF, ");
  });

  it("ignores a space after a semicolon", function () {
    assert.strictEqual(evaluatedExpression("ABC; DEF", ", "), "ABC, DEF");
  });

  it("ignores an escaped semicolon", function () {
    assert.strictEqual(evaluatedExpression("ABC;;DEF", ", "), "ABC;DEF");
    assert.strictEqual(
      evaluatedExpression("ABC;;DEF;GHI", ", "),
      "ABC;DEF, GHI"
    );
    assert.strictEqual(
      evaluatedExpression("ABC;DEF;;GHI", ", "),
      "ABC, DEF;GHI"
    );
    assert.strictEqual(
      evaluatedExpression("ABC;;DEF;;GHI", ", "),
      "ABC;DEF;GHI"
    );
    assert.strictEqual(evaluatedExpression("ABC;;;DEF", ", "), "ABC;, DEF");
    assert.strictEqual(evaluatedExpression("ABC;;;;DEF", ", "), "ABC;;DEF");
  });

  it("accepts an expression as the separator", function () {
    assert.strictEqual(
      evaluatedExpression("ABC;DEF", ["concat", ", "]),
      "ABC, DEF"
    );
  });

  it("lists a maximum number of values", function () {
    // https://www.openstreetmap.org/node/9816809799
    assert.strictEqual(
      evaluatedExpression(
        "马岔河村;菜园村;刘灿东村;后于口村;王石楼村;李岔河村;岔河新村;富康新村;前鱼口村",
        "、"
      ),
      "马岔河村、菜园村、刘灿东村;后于口村;王石楼村;李岔河村;岔河新村;富康新村;前鱼口村"
    );
    assert.strictEqual(
      evaluatedExpression(
        "one;two;three;four;five;six;seven;eight;nine;ten",
        ", "
      ),
      "one, two, three;four;five;six;seven;eight;nine;ten"
    );
  });

  it("omits a specified value", function () {
    assert.strictEqual(
      evaluatedExpression("ABC;DEF;GHI", ", ", ""),
      "ABC, DEF, GHI"
    );
    assert.strictEqual(
      evaluatedExpression("ABC;DEF;GHI", ", ", "ABC"),
      "DEF, GHI"
    );
    assert.strictEqual(
      evaluatedExpression("ABC;DEF;GHI", ", ", "DEF"),
      "ABC, GHI"
    );
    assert.strictEqual(
      evaluatedExpression("ABC;DEF;GHI", ", ", "GHI"),
      "ABC, DEF"
    );
  });
});
