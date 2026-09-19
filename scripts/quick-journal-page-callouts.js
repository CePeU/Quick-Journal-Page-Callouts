import { MODULE_ID, getCalloutTypes, registerSettings } from "./settings.js";
import { initializeCalloutEditor, insertCallout } from "./callout-editor.js";
import { applyToggleStyles } from "./toggle-styles.js";

Hooks.once("ready", () => applyToggleStyles(getCalloutTypes()));

// This file is the module entry point.
// Foundry runs the code inside Hooks.once("init") as soon as the module starts up.
// The purpose is to register settings and hook into Foundry's editor system.
Hooks.once("init", () => {
  // Create the custom settings and configuration menu for callout types.
  registerSettings();

  // Run our initialization whenever a ProseMirror editor is created.
  // This adds support for details/summary callout nodes in the editor.
  Hooks.on("createProseMirrorEditor", initializeCalloutEditor);

  // Add our custom dropdown to the editor menu so the user can choose a callout type.
  Hooks.on("getProseMirrorMenuDropDowns", addCalloutDropDown);
});

// This function builds one dropdown section named "Callouts" inside the editor toolbar.
// It reads all configured callout types from settings and creates a menu item for each one.
function addCalloutDropDown(menu, dropDowns) {
  // The editor menu may not expose the details node if the ProseMirror schema is missing.
  const detailsNode = menu?.schema?.nodes?.details;
  if (!detailsNode) return;

  // Map every configured callout type to a menu entry.
  const entries = getCalloutTypes().map(type => ({
    action: `${MODULE_ID}-insert-${type.id}`,
    // Foundry's dropdown rows render title as HTML and ignore the entry's icon property.
    title: `<i class="${escapeAttribute(type.icon)} fa-fw" aria-hidden="true"></i> ${escapeAttribute(type.label)}`,
    // Insertion commands must not declare a node: Foundry uses it to mark
    // entries as selected whenever the cursor is inside that node type.
    //But in our case that is not necessary and it would apply to any callout type because
    //all of them are of type details tag.
    //node: detailsNode,


    // This command is executed when the user clicks a menu item.
    // It creates a new callout block in the editor.
    cmd: (state, dispatch, view) => {
      const editorView = view ?? menu.view ?? menu.editorView ?? menu.options?.view;
      return insertCallout(type, state ?? editorView?.state, dispatch, editorView);
    }
  }));

  // No callout types = nothing to add.
  if (!entries.length) return;

  // Add the dropdown group to Foundry's menu structure.
  dropDowns.quickJournalCallouts = {
    title: "Callouts",
    cssClass: "quick-journal-callouts",
    icon: '<i class="fa-regular fa-comment-dots"></i>',
    entries
  };


  // Small helper to escape strings before placing them into HTML attributes.
  // Without this, values like quotes or angle brackets could break the generated HTML.
  function escapeAttribute(value) {
    return String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;");
  }
}
