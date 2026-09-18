![GitHub Downloads (specific asset, latest release)](https://img.shields.io/github/downloads/CePeU/Quick-Journal-Page-Callouts/latest/quick-journal-page-callouts.zip)
![GitHub Downloads (specific asset, latest release)](https://img.shields.io/github/downloads/CePeU/Quick-Journal-Page-Callouts/1.0.3/quick-journal-page-callouts.zip)

# Quick Journal Page Callouts

## What it does

This Foundry moduel adds a callouts menu to Foundry VTT's ProseMirror editor which are based on the details tag which now renders correct with Foundry VTT v14.

In addition you can configure the available types, names, classes, icons, and the default open state in the module settings.

### Full documentation can be found here
https://cepeu.github.io/Quick-Journal-Page-Callouts

## How to use (short)

- Choose a callout at an empty selection to insert two empty body paragraphs, with the cursor in the first. New callouts open for immediate typing, including presets configured to start collapsed.

- Type and press Enter to add paragraphs inside the callout. Enter on its **final empty paragraph** creates a new paragraph after the callout and moves the cursor there. This works after either mouse or arrow-key navigation.

- Select text and choose a callout to wrap the selection in `<details>` with the configured name in `<summary>`. Formatting and unselected surrounding text are preserved. The cursor moves to the end of the wrapped text so you can press Enter and continue writing.

- Click the title to edit it. Enter in the title opens the callout and moves to its first body paragraph.

- Click the disclosure icon or arrow before the title to open or close the callout. Clicking a body line or the blank space around it leaves the callout open for editing. In the journal's reading view, the normal summary click behavior applies.
