# Settings

## Create new Callouts

You can add new callout types by clicking the **+ Add** button.

New callouts have several fields to be filled:
![[Screenshots\Settings_02.png]]

**Type:** This defines the note and should be a unique name and not repeated   
**Label:** This is the name which is used in the Foundry Prose Mirror menu   
**Summary:** This is what the callout will show as the callout name   
**Class:** This is the html class of the callout which is used to style it    
**Icon:** This is the icon which is used in the menu. You can use a Font Awesom icon name   
**Open:** This will set the default how this callout will start off. Either closed or opened.    


## Toggle appearance of callout

Each callout type has a **Toggle** column with:

**Style:** Use the existing **Icon** field for the toggle, or choose **Standard arrow**.    
**Size:** 50–200% of the title's font size; the default is 100%.    
**Color:** inherit the title's color. You need to uncheck **Use text color** to be able to choose a color for the icon in the color picker.    


Below you find a clickable preview that updates while you edit the fields.   

Click **Save** to apply the appearance to existing and new callouts, in both the editor and the journal's reading view. These are shared world settings. The icon also continues to appear in the Callouts menu. Unknown icon names fall back to the standard arrow.

Toggle styling uses CSS and Foundry's Font Awesome fonts. It does not add icon text or extra elements to the saved journal content.

## Bulk import of callouts

![[Screenshots\Settings_03.png]]

Callout definitions are saved as an array of objects. You can paste a JSON array of your choosing to create callouts. Just overwrite the JSON in Generated Array and save.    

The default callouts are:

```code
[
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
    "id": "tip",
    "label": "Tip",
    "summary": "Tip",
    "icon": "fa-solid fa-lightbulb",
    "className": "md-callout-tip",
    "open": true,
    "toggleStyle": "icon",
    "toggleSize": 100,
    "toggleColor": "#ff0000"
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
]
```
## CSS styling

The css has Obsidian style callouts for the following types definded allready:

```code
  --md-callout-note: #448aff;
  --md-callout-abstract: #00b8d4;
  --md-callout-info: #448aff;
  --md-callout-todo: #448aff;
  --md-callout-tip: #00bfa5;
  --md-callout-success: #00c853;
  --md-callout-question: #f2c037;
  --md-callout-warning: #ff9800;
  --md-callout-failure: #ff5252;
  --md-callout-danger: #ff1744;
  --md-callout-bug: #f50057;
  --md-callout-example: #7c4dff;
  --md-callout-quote: #9e9e9e;
```

So if you use the following classes:
- md-callout-note
- md-callout-abstract
- md-callout-info
- md-callout-todo
- md-callout-tip
- md-callout-success
- md-callout-question
- md-callout-warning
- md-callout-failure
- md-callout-danger
- md-callout-bug
- md-callout-example
- md-callout-quote

Then the callouts will be styled allready. Else you need to pimp the css yourself.
To target the callout use the class you defined and the following classes:
- .md-callout 
- .md-callout-title

## Full callout JSON
You can find the file in the doc directory.

```code
[
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
]
```