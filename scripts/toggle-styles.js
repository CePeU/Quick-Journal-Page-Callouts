// Style the real disclosure marker. No icon nodes are inserted into the editable
// summary, so titles, cursor positions, and saved journal HTML stay unchanged.
const STYLE_ID = "quick-journal-page-callouts-toggle-styles";

export function applyToggleStyles(types, doc = document) {
  if (!doc.body) return;
  let stylesheet = doc.getElementById(STYLE_ID);
  if (!stylesheet) {
    stylesheet = doc.createElement("style");
    stylesheet.id = STYLE_ID;
    doc.head.appendChild(stylesheet);
  }
  stylesheet.textContent = types.map(type => {
    const id = doc.defaultView.CSS.escape(type.id);
    const selector = `details[data-callout-type="${id}"] > summary, details.md-callout-${id} > summary`;
    const marker = selector.split(", ").map(selector => `${selector}::marker`).join(", ");
    return `${selector} { display: list-item; }\n${marker} { ${markerStyles(type, doc)} }`;
  }).join("\n");
}

export function updateTogglePreview(element, type) {
  const summary = element.querySelector("summary");
  summary.textContent = type.summary || type.label;
  summary.style.cssText = markerStyles(type, element.ownerDocument, true);
}

function markerStyles(type, doc, preview = false) {
  const icon = type.toggleStyle === "icon" ? readIconStyle(type.icon, doc) : null;
  const properties = {
    "content": icon?.content ?? "normal",
    "font-family": icon?.fontFamily ?? "inherit",
    "font-weight": icon?.fontWeight ?? "inherit",
    "font-style": "normal",
    "font-size": `${(type.toggleSize ?? 100) / 100}em`,
    "color": type.toggleColor || "inherit"
  };
  return Object.entries(properties).map(([key, value]) => `${preview ? "--qjpc-" : ""}${key}: ${value};`).join(" ");
}

function readIconStyle(classes, doc) {
  const probe = doc.createElement("i");
  probe.className = classes;
  probe.setAttribute("aria-hidden", "true");
  probe.style.cssText = "position: absolute; visibility: hidden; pointer-events: none;";
  doc.body.appendChild(probe);
  try {
    // Use Foundry's loaded Font Awesome definitions instead of maintaining a
    // separate icon-to-Unicode table. Unknown icon names retain the native arrow.
    const style = doc.defaultView.getComputedStyle(probe, "::before");
    // Newer Font Awesome versions add an accessibility suffix ( / "" ).
    // Extract the visual string before appending spacing for the marker.
    const content = style.content.match(/^"(?:[^"\\]|\\.)*"|^'(?:[^'\\]|\\.)*'/)?.[0];
    if (!content || ['""', "''"].includes(content)) return null;
    return { content: `${content} " "`, fontFamily: style.fontFamily, fontWeight: style.fontWeight };
  } finally {
    probe.remove();
  }
}
