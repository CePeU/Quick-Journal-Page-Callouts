// This file stores the module ID, default callout definitions, and the settings UI.
// It is the configuration layer for the rest of the module.
import { applyToggleStyles, updateTogglePreview } from "./toggle-styles.js";

export const MODULE_ID = "quick-journal-page-callouts";

// These names are used as keys in Foundry's game.settings storage.
const SETTING_CALLOUT_TYPES = "calloutTypes";
const SETTING_CALLOUT_TYPES_MENU = "calloutTypesMenu";

// Default callout types shown in the menu.
// Each object describes one block style, such as Note, Tip, Warning, or Quote.
export const DEFAULT_CALLOUT_TYPES = [
  {
    "id": "note",
    "label": "Note",
    "summary": "Note",
    "icon": "fa-solid fa-circle-info",
    "className": "md-callout-note",
    "open": true,
    "toggleStyle": "icon",
    "toggleSize": 100,
    "toggleColor": ""
  },
  {
    "id": "abstract",
    "label": "Abstract",
    "summary": "Abstract",
    "icon": "fa-solid fa-bars-staggered",
    "className": "md-callout-abstract",
    "open": true,
    "toggleStyle": "icon",
    "toggleSize": 100,
    "toggleColor": ""
  },
  {
    "id": "info",
    "label": "Info",
    "summary": "Info",
    "icon": "fa-solid fa-circle-info",
    "className": "md-callout-info",
    "open": true,
    "toggleStyle": "icon",
    "toggleSize": 100,
    "toggleColor": ""
  },
  {
    "id": "todo",
    "label": "Todo",
    "summary": "Todo",
    "icon": "fa-solid fa-list-check",
    "className": "md-callout-todo",
    "open": true,
    "toggleStyle": "icon",
    "toggleSize": 100,
    "toggleColor": ""
  },
  {
    "id": "tip",
    "label": "Tip",
    "summary": "Tip",
    "icon": "fa-solid fa-lightbulb",
    "className": "md-callout-tip",
    "open": true,
    "toggleStyle": "icon",
    "toggleSize": 100,
    "toggleColor": ""
  },
  {
    "id": "success",
    "label": "Success",
    "summary": "Success",
    "icon": "fa-solid fa-circle-check",
    "className": "md-callout-success",
    "open": true,
    "toggleStyle": "icon",
    "toggleSize": 100,
    "toggleColor": ""
  },
  {
    "id": "question",
    "label": "Question",
    "summary": "Question",
    "icon": "fa-solid fa-circle-question",
    "className": "md-callout-question",
    "open": true,
    "toggleStyle": "icon",
    "toggleSize": 100,
    "toggleColor": ""
  },
  {
    "id": "warning",
    "label": "Warning",
    "summary": "Warning",
    "icon": "fa-solid fa-triangle-exclamation",
    "className": "md-callout-warning",
    "open": true,
    "toggleStyle": "icon",
    "toggleSize": 100,
    "toggleColor": ""
  },
  {
    "id": "failure",
    "label": "Failure",
    "summary": "Failure",
    "icon": "fa-solid fa-circle-xmark",
    "className": "md-callout-failure",
    "open": true,
    "toggleStyle": "icon",
    "toggleSize": 100,
    "toggleColor": ""
  },
  {
    "id": "danger",
    "label": "Danger",
    "summary": "Danger",
    "icon": "fa-solid fa-skull-crossbones",
    "className": "md-callout-danger",
    "open": true,
    "toggleStyle": "icon",
    "toggleSize": 100,
    "toggleColor": ""
  },
  {
    "id": "bug",
    "label": "Bug",
    "summary": "Bug",
    "icon": "fa-solid fa-bug",
    "className": "md-callout-bug",
    "open": true,
    "toggleStyle": "icon",
    "toggleSize": 100,
    "toggleColor": ""
  },
  {
    "id": "example",
    "label": "Example",
    "summary": "Example",
    "icon": "fa-solid fa-flask",
    "className": "md-callout-example",
    "open": true,
    "toggleStyle": "icon",
    "toggleSize": 100,
    "toggleColor": ""
  },
  {
    "id": "quote",
    "label": "Quote",
    "summary": "Quote",
    "icon": "fa-solid fa-quote-left",
    "className": "md-callout-quote",
    "open": true,
    "toggleStyle": "icon",
    "toggleSize": 100,
    "toggleColor": ""
  }
];

// Register all settings that the module needs in Foundry's settings database.
export function registerSettings() {
  // This stores the actual array of callout type objects.
  game.settings.register(MODULE_ID, SETTING_CALLOUT_TYPES, {
    name: "QJPCA.settings.calloutTypes.name",
    hint: "QJPCA.settings.calloutTypes.hint",
    scope: "world",
    config: false,
    type: Array,
    default: clone(DEFAULT_CALLOUT_TYPES),
    onChange: value => applyToggleStyles(normalizeCalloutTypes(value))
  });

  // This creates a button/menu entry in the Foundry settings UI.
  game.settings.registerMenu(MODULE_ID, SETTING_CALLOUT_TYPES_MENU, {
    name: "QJPCA.settings.calloutTypesMenu.name",
    label: "QJPCA.settings.calloutTypesMenu.label",
    hint: "QJPCA.settings.calloutTypesMenu.hint",
    icon: "fas fa-list",
    type: CalloutTypesConfig,
    restricted: true
  });
}

// Read the saved callout types from settings and normalize them.
export function getCalloutTypes() {
  return normalizeCalloutTypes(game.settings.get(MODULE_ID, SETTING_CALLOUT_TYPES));
}

// Return the CSS classes used for a callout.
// This creates classes like: md-callout, md-callout-note, and any custom class.
export function getCalloutClassList(type) {
  const classes = new Set(["md-callout", `md-callout-${type.id}`]);
  for (const className of String(type.className || `md-callout-${type.id}`).split(/\s+/)) {
    if (className) classes.add(className);
  }
  return Array.from(classes).join(" ");
}

// This is the configuration form that appears when the user clicks "Configure Callouts".
// It is a Foundry FormApplication, which means it renders an HTML form and manages user input.
export class CalloutTypesConfig extends FormApplication {
  static get defaultOptions() {
    // Merge Foundry's default form settings with our custom ones.
    return foundry.utils.mergeObject(super.defaultOptions, {
      id: `${MODULE_ID}-callout-types`,
      title: "QJPCA.settings.calloutTypes.name",
      width: 1060,
      closeOnSubmit: false,
      submitOnChange: false,
      resizable: true
    });
  }

  // The data passed to the HTML template.
  getData() {
    const types = getCalloutTypes();
    return {
      types,
      json: JSON.stringify(types, null, 2)
    };
  }

  // Build the form HTML and return it as a jQuery object.
  async _renderInner(data) {
    return $(renderConfigForm(data));
  }

  // Attach all button/input listeners to the form.
  activateListeners(html) {
    super.activateListeners(html);

    // Add one new row to the table.
    html.on("click", "[data-qjpc-action='add']", event => {
      event.preventDefault();
      event.stopPropagation();
      const tbody = html[0].querySelector("[data-callout-types]");
      tbody.insertAdjacentHTML("beforeend", renderTypeRow(createNewType(html[0])));
      refreshJSONPreview(html[0]);
    });

    // Remove the current row.
    html.on("click", "[data-qjpc-action='remove']", event => {
      event.preventDefault();
      event.stopPropagation();
      event.currentTarget.closest("[data-callout-row]")?.remove();
      refreshJSONPreview(html[0]);
    });

    // Reset the form back to the default list of callout types.
    html.on("click", "[data-qjpc-action='reset']", event => {
      event.preventDefault();
      event.stopPropagation();
      const tbody = html[0].querySelector("[data-callout-types]");
      tbody.innerHTML = DEFAULT_CALLOUT_TYPES.map(renderTypeRow).join("");
      refreshJSONPreview(html[0]);
    });

    // Save the current form data to the settings store.
    html.on("click", "[data-qjpc-action='save']", async event => {
      event.preventDefault();
      event.stopPropagation();
      await this.saveCalloutTypes(html[0]);
    });

    // Whenever the user edits any input in a row, update the preview JSON.
    html.on("input change", "[data-callout-row] input, [data-callout-row] select", () => {
      refreshJSONPreview(html[0]);
    });
    refreshJSONPreview(html[0]);
  }

  // Convert the form's rows into a clean array of saved callout types.
  async saveCalloutTypes(root) {
    if (!root) return;

    const types = normalizeCalloutTypes(readRows(root));

    if (!types.length) {
      ui.notifications.warn(game.i18n.localize("QJPCA.ui.notification.warnOne"));
      return;
    }

    try {
      await game.settings.set(MODULE_ID, SETTING_CALLOUT_TYPES, types);
      ui.notifications.info(game.i18n.localize("QJPCA.ui.notifications.info.One"));
      await this.close();
    } catch (error) {
      console.warn(`${MODULE_ID} | Failed to save callout types`, error);
      ui.notifications.error(game.i18n.localize("QJPCA.ui.notifications.error.One"));
    }
  }

  // This is called automatically by Foundry when the form is submitted.
  async _updateObject(event, formData) {
    event?.preventDefault?.();
    await this.saveCalloutTypes(this.element?.[0]);
  }
}

// Creates the HTML for the whole settings form.
function renderConfigForm(data) {
  return `
    <form class="qjpc-callout-settings" autocomplete="off">
      <p>${game.i18n.localize("QJPCA.table.description")}</p>
      <table>
        <thead>
          <tr>
            <th>${game.i18n.localize("QJPCA.table.type")}</th>
            <th>${game.i18n.localize("QJPCA.table.label")}Label</th>
            <th>${game.i18n.localize("QJCA.table.summary")}Summary</th>
            <th>${game.i18n.localize("QJCA.table.class")}Class</th>
            <th>${game.i18n.localize("QJCA.table.icon")}Icon</th>
            <th>${game.i18n.localize("QJCA.table.open")}Open</th>
            <th>${game.i18n.localize("QJCA.table.toggle")}Toggle</th>
            <th></th>
          </tr>
        </thead>
        <tbody data-callout-types>
          ${data.types.map(renderTypeRow).join("")}
        </tbody>
      </table>

      <div class="form-group stacked">
        <label>${game.i18n.localize("QJCA.textarea.label")}</label>
        <textarea data-callout-json rows="10" readonly>${escapeHTML(data.json)}</textarea>
      </div>

      <footer class="form-footer">
        <button type="button" data-qjpc-action="add">
          <i class="fas fa-plus"></i> Add
        </button>
        <button type="button" data-qjpc-action="reset">
          <i class="fas fa-undo"></i> Defaults
        </button>
        <button type="button" data-qjpc-action="save">
          <i class="fas fa-save"></i> Save
        </button>
      </footer>
    </form>
  `;
}

// Build one row in the form for a single callout type.
function renderTypeRow(type) {
  // If open is false, leave the checkbox unchecked.
  const checked = type.open === false ? "" : " checked";

  return `
    <tr data-callout-row>
      <td><input type="text" name="id" value="${escapeAttribute(type.id)}"></td>
      <td><input type="text" name="label" value="${escapeAttribute(type.label)}"></td>
      <td><input type="text" name="summary" value="${escapeAttribute(type.summary)}"></td>
      <td><input type="text" name="className" value="${escapeAttribute(type.className)}"></td>
      <td><input type="text" name="icon" value="${escapeAttribute(type.icon)}"></td>
      <td><input type="checkbox" name="open"${checked}></td>
      <td>
        <div class="qjpc-toggle-controls">
          <label>Style
            <select name="toggleStyle">
              <option value="icon"${type.toggleStyle !== "arrow" ? " selected" : ""}>Configured icon</option>
              <option value="arrow"${type.toggleStyle === "arrow" ? " selected" : ""}>Standard arrow</option>
            </select>
          </label>
          <label>Size <input type="number" name="toggleSize" min="50" max="200" step="10" value="${type.toggleSize ?? 100}"> %</label>
          <label>Color <input type="color" name="toggleColor" value="${escapeAttribute(type.toggleColor || "#808080")}"${type.toggleColor ? "" : " disabled"}></label>
          <label><input type="checkbox" name="toggleInheritColor"${type.toggleColor ? "" : " checked"}> ${game.i18n.localize("QJCA.text.callout.color")}</label>
          <details class="qjpc-toggle-preview"><summary>${escapeHTML(type.summary || type.label)}</summary><p>${game.i18n.localize("QJCA.text.callout.text")}</p></details>
        </div>
      </td>
      <td>
        <button type="button" data-qjpc-action="remove" title="Remove">
          <i class="fas fa-trash"></i>
        </button>
      </td>
    </tr>
  `;
}

// Create a new starter entry when the user clicks Add.
function createNewType(form) {
  const count = form.querySelectorAll("[data-callout-row]").length + 1;
  const id = `custom-${count}`;

  return {
    id,
    label: `${game.i18n.localize("QJCA.newtpye.label")} ${count}`,
    summary: `${game.i18n.localize("QJCA.newtpye.summary")} ${count}`,
    icon: "fa-solid fa-square-caret-down",
    className: `md-callout-${id}`,
    open: true
  };
}

// Update the JSON preview to match the values currently in the form.
function refreshJSONPreview(form) {
  const types = normalizeCalloutTypes(readRows(form));
  const preview = form.querySelector("[data-callout-json]");
  if (preview) preview.value = JSON.stringify(types, null, 2);
  Array.from(form.querySelectorAll("[data-callout-row]")).forEach((row, index) => {
    row.querySelector("[name='toggleColor']").disabled = row.querySelector("[name='toggleInheritColor']").checked;
    updateTogglePreview(row.querySelector(".qjpc-toggle-preview"), types[index]);
  });
}

// Read every row in the form and turn it into plain objects.
function readRows(form) {
  return Array.from(form.querySelectorAll("[data-callout-row]")).map(row => ({
    id: row.querySelector("[name='id']")?.value,
    label: row.querySelector("[name='label']")?.value,
    summary: row.querySelector("[name='summary']")?.value,
    className: row.querySelector("[name='className']")?.value,
    icon: row.querySelector("[name='icon']")?.value,
    open: row.querySelector("[name='open']")?.checked,
    toggleStyle: row.querySelector("[name='toggleStyle']")?.value,
    toggleSize: row.querySelector("[name='toggleSize']")?.value,
    toggleColor: row.querySelector("[name='toggleInheritColor']")?.checked ? "" : row.querySelector("[name='toggleColor']")?.value
  }));
}

// Clean up the raw callout array from settings or the form.
// This ensures every callout has a valid id, label, and safe class/icon values.
function normalizeCalloutTypes(value) {
  const rawTypes = Array.isArray(value) ? value : DEFAULT_CALLOUT_TYPES;
  const ids = new Set();

  return rawTypes
    .map((type, index) => normalizeCalloutType(type, index, ids))
    .filter(type => type.id && type.label);
}

// Validate and normalize one single callout type.
function normalizeCalloutType(type, index, ids) {
  const source = typeof type === "object" && type ? type : {};
  const label = cleanText(source.label || source.name || source.id || `Callout ${index + 1}`);
  const baseId = slugify(source.id || label);
  let id = baseId || `callout-${index + 1}`;
  let suffix = 2;

  // If two types would use the same id, add a numeric suffix to keep them unique.
  while (ids.has(id)) {
    id = `${baseId}-${suffix}`;
    suffix += 1;
  }

  ids.add(id);

  return {
    id,
    label,
    summary: cleanText(source.summary || label),
    icon: sanitizeClassList(source.icon || "fa-solid fa-square-caret-down"),
    className: sanitizeClassList(source.className || source.class || `md-callout-${id}`),
    open: source.open !== false,
    toggleStyle: source.toggleStyle === "arrow" ? "arrow" : "icon",
    toggleSize: normalizeToggleSize(source.toggleSize),
    toggleColor: /^#[\da-f]{6}$/i.test(source.toggleColor ?? "") ? source.toggleColor.toLowerCase() : ""
  };
}

function normalizeToggleSize(value) {
  const size = Number(value);
  return Number.isFinite(size) && size > 0 ? Math.max(50, Math.min(200, size)) : 100;
}

// Turn a human-readable string into a safe identifier.
// Example: "My Callout!" -> "my-callout"
function slugify(value) {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

// Remove whitespace from both ends of a string.
function cleanText(value) {
  return String(value ?? "").trim();
}

// Turn a class list string into a safe, space-separated set of CSS class names.
function sanitizeClassList(value) {
  return String(value ?? "")
    .split(/\s+/)
    .map(part => part.replace(/[^a-zA-Z0-9_-]/g, "-"))
    .filter(Boolean)
    .join(" ");
}

// Deep-clone a setting value in a safe way.
function clone(value) {
  return foundry?.utils?.deepClone ? foundry.utils.deepClone(value) : JSON.parse(JSON.stringify(value));
}

// Escape HTML before inserting text into a textarea or HTML attribute.
function escapeHTML(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

// Escape text for HTML attribute values.
function escapeAttribute(value) {
  return escapeHTML(value).replaceAll('"', "&quot;");
}
