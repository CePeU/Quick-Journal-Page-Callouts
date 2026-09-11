![GitHub Downloads (specific asset, latest release)](https://img.shields.io/github/downloads/CePeU/Quick-Journal-Page-Callouts/latest/quick-journal-page-callouts.zip)

# Quick Journal Page Callouts

A module that adds callouts which are based on the details tag to Foundry VTT v14.

Adds a **Callouts** menu to Foundry VTT's ProseMirror editor. Configure the available types, names, classes, icons, and default open state in the module settings.

- Select text and choose a callout to wrap the selection in `<details>` with the configured name in `<summary>`. Formatting and unselected surrounding text are preserved. The cursor moves to the end of the wrapped text so you can press Enter and continue writing.
- Choose a callout at an empty selection to insert two empty body paragraphs, with the cursor in the first. New callouts open for immediate typing, including presets configured to start collapsed.
- Type and press Enter to add paragraphs inside the callout. Enter on its **final empty paragraph** creates a new paragraph after the callout and moves the cursor there. This works after either mouse or arrow-key navigation.
- Click the title to edit it. Enter in the title opens the callout and moves to its first body paragraph.
- Click the disclosure icon or arrow before the title to open or close the callout. Clicking a body line or the blank space around it leaves the callout open for editing. In the journal's reading view, the normal summary click behavior applies.

## Toggle appearance

Open **Configure Callouts** in the module settings. Each callout type has a **Toggle** column with:

- **Style:** use the existing **Icon** field for the toggle, or choose **Standard arrow**.
- **Size:** 50–200% of the title's font size; the default is 100%.
- **Color:** inherit the title's color, or uncheck **Use text color** and choose a color.
- A clickable preview that updates while you edit the fields.

Click **Save** to apply the appearance to existing and new callouts, in both the editor and the journal's reading view. These are shared world settings. The icon also continues to appear in the Callouts menu. Unknown icon names fall back to the standard arrow.

Toggle styling uses CSS and Foundry's Font Awesome fonts. It does not add icon text or extra elements to the saved journal content.
