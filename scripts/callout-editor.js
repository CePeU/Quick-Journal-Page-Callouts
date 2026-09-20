import { MODULE_ID, getCalloutClassList } from "./settings.js";

// This file is responsible for the actual callout editing behavior.
// It teaches the ProseMirror editor how to understand a custom details/summary block
// and how to handle keyboard, click, and selection behavior so it behaves like a callout.

// A small utility to get access to the ProseMirror implementation used by Foundry.
const getProseMirror = () => globalThis.foundry?.prosemirror ?? globalThis.ProseMirror;
const wrappedDisclosureViews = new WeakSet();

// The summary title in a callout is represented by a node named "summary" or "summary_block".
const isSummary = node => ["summary", "summary_block"].includes(node?.type.name);

// Check whether a ProseMirror node is a callout block.
// A callout is a details node that either has a custom data attribute or the md-callout class.
function isCallout(node) {
  if (node?.type.name !== "details") return false;
  const preserved = node.attrs._preserve ?? {};
  return Boolean(preserved["data-callout-type"])
    || `${node.attrs.classes ?? ""} ${preserved.class ?? ""}`.split(/\s+/).includes("md-callout");
}

// This runs whenever Foundry creates a ProseMirror editor.
// It makes sure the editor understands the details/summary structure and then installs
// our custom key handling plugin.
export function initializeCalloutEditor(uuid, plugins, options) {
  const state = options?.state;
  if (!state || !plugins) return;
  preserveCalloutDOMAttributes();

  // If the editor schema does not already know about details/summary, add them.
  if (!state.schema.nodes.details || !state.schema.nodes.summary) {
    const schema = createDisclosureSchema(state.schema);
    // Rebuild from JSON so existing blocks, marks, and attributes survive intact.
    const doc = schema.nodeFromJSON(state.doc.toJSON());
    options.state = state.constructor.create({ doc });
    const pm = getProseMirror();
    const Menu = pm?.plugins?.ProseMirrorMenu ?? pm?.ProseMirrorMenu;
    if (plugins.menu && Menu) plugins.menu = Menu.build(schema);
  }

  // Build our custom plugin that intercepts keyboard and click behavior.
  const plugin = createCalloutPlugin();
  if (!plugin) return;

  // Foundry constructs the final state from this collection AFTER the hook.
  // Mutate it in place, putting our handlers ahead of the default keyboard commands.
  if (Array.isArray(plugins)) plugins.unshift(plugin);
  else {
    const entries = Object.entries(plugins).filter(([key]) => key !== MODULE_ID);
    for (const key of Object.keys(plugins)) delete plugins[key];
    plugins[MODULE_ID] = plugin;
    Object.assign(plugins, Object.fromEntries(entries));
  }
}

// Foundry 14's native NodeView does not render the callout attributes itself.
// Ignore our own attribute synchronization so ProseMirror does not rebuild that
// view and immediately discard those attributes again. Other mutations still
// go through the original view's handler (including actual content edits).
function preserveCalloutDOMAttributes() {
  const nodeViews = getProseMirror()?.nodeViews;
  const original = nodeViews?.details;
  if (!original || wrappedDisclosureViews.has(original)) return;
  const wrapped = (node, view, getPos, ...args) => {
    const nodeView = original(node, view, getPos, ...args);
    if (!isCallout(node)) return nodeView;
    const ignoreMutation = nodeView.ignoreMutation?.bind(nodeView);
    nodeView.ignoreMutation = mutation => {
      if (mutation.type === "attributes" && mutation.target === nodeView.dom) {
        const pos = getPos();
        const current = typeof pos === "number" ? view.state.doc.nodeAt(pos) : null;
        if (isCallout(current)) {
          const expected = {
            class: current.attrs.classes || current.attrs._preserve?.class || "",
            "data-callout-type": current.attrs._preserve?.["data-callout-type"] ?? null,
            open: isOpen(current) ? "" : null
          };
          if (Object.hasOwn(expected, mutation.attributeName)
            && nodeView.dom.getAttribute(mutation.attributeName) === expected[mutation.attributeName]) return true;
        }
      }
      return ignoreMutation?.(mutation) ?? false;
    };
    return nodeView;
  };
  wrappedDisclosureViews.add(wrapped);
  nodeViews.details = wrapped;
}

// Insert a new callout into the current editor selection.
// This is the function used by the dropdown menu when the user picks a callout type.
export function insertCallout(type, state, dispatch, view) {
  if (!state?.schema.nodes.details || !state.schema.nodes.summary) return false;
  const { schema, selection } = state;
  const paragraph = schema.nodes.paragraph?.createAndFill();
  if (!paragraph) return false;

  let callout;
  try {
    // The title of the callout is always a summary node.
    const summary = schema.nodes.summary.createChecked(null, schema.text(type.summary || type.label));
    const body = [];

    // If some text is selected, wrap that selection inside the new callout.
    if (!selection.empty) {
      // Retain marks and exact partial text; fill cut list/table ancestors so
      // the formerly open selection slice is valid as a standalone body.
      selection.content().content.forEach(node => body.push(closeSelectedNode(node)));
    }

    // For an empty selection, create two empty paragraphs so the user has a place to type.
    if (!body.length) body.push(paragraph, paragraph);

    // The cursor will be in the body, so keep it visible for continued editing.
    const attrs = calloutAttributes(type, schema.nodes.details, true);
    callout = schema.nodes.details.createChecked(attrs, [summary, ...body]);
    callout.check();
  } catch (error) {
    console.warn(`${MODULE_ID} | Cannot wrap this selection in a callout`, error);
    return false;
  }

  // Apply the new element to the document transaction.
  const tr = state.tr.replaceSelectionWith(callout, false);
  let calloutPos;
  tr.doc.descendants((node, pos) => {
    if (node === callout) calloutPos = pos;
  });

  // Do not dispatch if the schema's fitter could not retain the wrapper.
  if (calloutPos === undefined) return false;

  // Put the caret in the body area of the new callout.
  if (selection.empty) setSelectionNear(tr, calloutPos + 2 + callout.firstChild.nodeSize);
  else setSelectionNear(tr, calloutPos + callout.nodeSize - 1, -1);

  const send = dispatch ?? (view ? transaction => view.dispatch(transaction) : null);
  if (send) {
    send(tr.scrollIntoView());
    view?.focus();
  }
  return true;
}

// A selected node may contain nested content that must be closed into a valid block shape.
// This helper makes sure child nodes keep their structure when moved into the callout body.
function closeSelectedNode(node) {
  if (node.isLeaf) return node;
  const children = [];
  node.forEach(child => children.push(closeSelectedNode(child)));
  const closed = node.type.createAndFill(node.attrs, children, node.marks);
  if (!closed) throw new Error(`Cannot close selected ${node.type.name}`);
  return closed;
}

// Build the attributes that describe a callout node.
// These are used to preserve the custom HTML and CSS classes across serialization.
function calloutAttributes(type, nodeType, open) {
  const classes = getCalloutClassList(type);
  const attrs = { _preserve: { "data-callout-type": type.id } };

  // Foundry V13 stores classes on the node's attrs.classes; V14 uses a different pattern.
  if (nodeType.spec.attrs?.classes) attrs.classes = classes;
  else attrs._preserve.class = classes;

  // V13 preserves the HTML attribute; V14 has a dedicated open attribute.
  if (nodeType.spec.attrs?.open) attrs.open = open;
  else if (open) attrs._preserve.open = "";
  return attrs;
}

// Return whether the details node is currently open.
function isOpen(node) {
  return node.type.spec.attrs?.open ? Boolean(node.attrs.open) : Object.hasOwn(node.attrs._preserve ?? {}, "open");
}

// Change the open/closed state of a callout.
function setOpen(tr, pos, open) {
  const node = tr.doc.nodeAt(pos);
  const attrs = { ...node.attrs, _preserve: { ...node.attrs._preserve } };
  if (node.type.spec.attrs?.open) attrs.open = open;
  else if (open) attrs._preserve.open = "";
  else delete attrs._preserve.open;
  tr.setNodeMarkup(pos, null, attrs);
}

// Create the ProseMirror plugin that handles keyboard and click events for callouts.
function createCalloutPlugin() {
  const pm = getProseMirror();
  const Plugin = pm?.state?.Plugin ?? pm?.Plugin;
  if (!Plugin) return null;

  return new Plugin({
    // ProseMirror flushes pending DOM/caret changes before handleKeyDown.
    // A raw DOM keydown handler can act on the old position after a mouse click.
    props: {
      handleKeyDown: (view, event) => handleCalloutBackspace(view, event) || handleCalloutEnter(view, event)
    },
    view(view) {
      // Capture is necessary: Foundry's details NodeView handles title clicks
      // before a bubbling editor event handler would see them.
      const onClick = event => handleCalloutClick(view, event);
      view.dom.addEventListener("click", onClick, true);
      syncCalloutDOM(view);
      return {
        update(nextView, previousState) {
          if (nextView.state.doc !== previousState.doc) syncCalloutDOM(nextView);
        },
        destroy() { view.dom.removeEventListener("click", onClick, true); }
      };
    }
  });
}

// Backspace at the start of the title removes its entire callout, even when it
// still has content. Letting the default command remove just the summary leaves
// a details wrapper with the browser's fallback title and disclosure marker.
function handleCalloutBackspace(view, event) {
  if (event.key !== "Backspace" || event.shiftKey || event.ctrlKey || event.metaKey || event.altKey
    || event.isComposing || view.composing) return false;

  const { $from, empty } = view.state.selection;
  if (!empty || !$from.parent.isTextblock) return false;

  // Only remove the nearest details block, never an enclosing callout.
  const detailsDepth = findAncestorDepth($from, node => node.type.name === "details");
  if (detailsDepth < 0 || !isCallout($from.node(detailsDepth))) return false;

  const summaryDepth = findAncestorDepth($from, isSummary);
  if (summaryDepth !== detailsDepth + 1 || $from.index(detailsDepth) !== 0
    || $from.pos !== $from.start(summaryDepth) + $from.depth - summaryDepth) return false;

  const before = $from.before(detailsDepth);
  const tr = view.state.tr.delete(before, $from.after(detailsDepth));
  // Prefer the preceding text. ProseMirror fills a required empty parent (such
  // as the document) so the caret still has a valid place after the deletion.
  setSelectionNear(tr, tr.mapping.map(before, -1), -1);
  view.dispatch(tr.scrollIntoView());
  event.preventDefault();
  return true;
}

// Handle the Enter key while the caret is inside a callout.
// This decides whether Enter adds space before the callout, moves into the body,
// exits the callout, or splits the content without breaking the wrapper.
function handleCalloutEnter(view, event) {
  if (event.key !== "Enter" || event.shiftKey || event.ctrlKey || event.metaKey || event.altKey
    || event.isComposing || view.composing) return false;

  const { state } = view;
  const { $from, $to, empty } = state.selection;
  const detailsDepth = findAncestorDepth($from, node => node.type.name === "details");
  if (detailsDepth < 0 || !isCallout($from.node(detailsDepth))) return false;

  const summaryDepth = findAncestorDepth($from, isSummary);
  let handled = false;

  // At the very start of the title, add space before the whole callout.
  // Account for summary_block titles whose first textblock is nested inside them.
  if (summaryDepth > detailsDepth && $to.pos < $from.after(summaryDepth)) {
    const atStart = empty && $from.parent.isTextblock && $from.index(detailsDepth) === 0
      && $from.pos === $from.start(summaryDepth) + $from.depth - summaryDepth;
    handled = atStart ? insertParagraphBeforeCallout(view, $from, detailsDepth)
      : moveToBody(view, $from, detailsDepth);
  }
  // If the cursor is in the body, let the user split or exit the callout naturally.
  else if ($from.depth === detailsDepth + 1 && $from.parent.isTextblock && !isSummary($from.parent)) {
    if (empty && !$from.parent.content.size && !$from.parent.type.spec.code
      && $from.index(detailsDepth) === $from.node(detailsDepth).childCount - 1) {
      handled = exitCallout(view, $from, detailsDepth);
    } else if ($from.sameParent($to) && !$from.parent.type.spec.code) {
      // Avoid baseKeymap's liftEmptyBlock, which would lift a middle empty line
      // out of the details or split the wrapper into two separate callouts.
      const splitBlock = getProseMirror()?.commands?.splitBlock;
      if (splitBlock) handled = splitBlock(state, tr => view.dispatch(tr));
    }
  }

  if (handled) event.preventDefault();
  return handled;
}

// The transaction maps the caret along with the callout, keeping it at the title's start.
function insertParagraphBeforeCallout(view, $from, detailsDepth) {
  const paragraph = view.state.schema.nodes.paragraph?.createAndFill();
  const before = $from.before(detailsDepth);
  if (!paragraph || !canInsertNodeAt(view.state.doc.resolve(before), paragraph.type)) return false;

  view.dispatch(view.state.tr.insert(before, paragraph).scrollIntoView());
  return true;
}

// Move the caret from the summary title into the callout body.
function moveToBody(view, $from, detailsDepth) {
  const details = $from.node(detailsDepth);
  const bodyPos = $from.start(detailsDepth) + details.firstChild.nodeSize;
  const tr = view.state.tr;

  // If the callout does not yet have a paragraph body, create one.
  if (details.childCount === 1 || !details.child(1).isTextblock) {
    // Give a title followed by an image/list/table a predictable first typing line.
    const paragraph = view.state.schema.nodes.paragraph?.createAndFill();
    if (!paragraph || !canInsertNodeAt(tr.doc.resolve(bodyPos), paragraph.type)) return false;
    tr.insert(bodyPos, paragraph);
  }

  setOpen(tr, $from.before(detailsDepth), true);
  setSelectionNear(tr, bodyPos + 1);
  view.dispatch(tr.scrollIntoView());
  return true;
}

// Exit the callout by inserting a new paragraph after the details block.
function exitCallout(view, $from, detailsDepth) {
  const paragraph = view.state.schema.nodes.paragraph?.createAndFill();
  const after = $from.after(detailsDepth);
  if (!paragraph || !canInsertNodeAt(view.state.doc.resolve(after), paragraph.type)) return false;

  const tr = view.state.tr.insert(after, paragraph);
  // Keep at least one body paragraph so an empty callout can be edited again.
  if ($from.node(detailsDepth).childCount > 2) tr.delete($from.before(), $from.after());

  setSelectionNear(tr, tr.mapping.map(after, -1) + 1);
  view.dispatch(tr.scrollIntoView());
  return true;
}

// Handle mouse clicks on a callout.
// This decides whether a click should open/close the callout or move the caret into the body.
function handleCalloutClick(view, event) {
  if (!view.editable || event.button !== 0) return;

  const target = event.target.nodeType === 1 ? event.target : event.target.parentElement;
  const details = target?.closest("details");
  if (!details || !view.dom.contains(details)) return;

  const pos = view.posAtDOM(details, 0) - 1;
  const node = view.state.doc.nodeAt(pos);
  if (!isCallout(node)) return;

  // Blank space beside/between paragraphs can target DETAILS itself. Foundry's
  // NodeView toggles on those clicks, although the user is positioning the caret.
  // Resolve the nearby body line explicitly: the browser may focus SUMMARY
  // instead when the hit target is the details container rather than a paragraph.
  if (target === details) {
    event.stopPropagation();
    placeCaretInBody(view, event, details, pos, node);
    return;
  }

  const summary = target.closest("summary");
  if (summary?.parentElement !== details) return;
  event.preventDefault();
  event.stopPropagation();

  // Text keeps the browser's caret/drag/double-click selection. Only the native
  // marker area before the text (after it in RTL) changes the disclosure state.
  const range = summary.ownerDocument.createRange();
  range.selectNodeContents(summary);
  const textRect = Array.from(range.getClientRects()).find(rect => rect.width > 0);
  const style = summary.ownerDocument.defaultView.getComputedStyle(summary);
  const bounds = summary.getBoundingClientRect();
  const rtl = style.direction === "rtl";
  const edge = textRect ? (rtl ? textRect.right : textRect.left) : (rtl ? bounds.right : bounds.left);
  const onMarker = rtl ? event.clientX > edge : event.clientX < edge;
  if (!onMarker && event.detail !== 0) return;

  const tr = view.state.tr;
  setOpen(tr, pos, !isOpen(node));
  setSelectionNear(tr, pos + 2);
  view.dispatch(tr.scrollIntoView());
  view.focus();
}

// When clicking empty space inside the details block, move the caret to the nearest body paragraph.
function placeCaretInBody(view, event, details, pos, node) {
  // A drag between body paragraphs can produce a click on their common container.
  // Preserve that text selection instead of replacing it with a caret.
  if (view.dom.ownerDocument.getSelection()?.isCollapsed === false) return;

  let closest;
  for (const child of details.children) {
    if (child.tagName === "SUMMARY") continue;
    const rect = child.getBoundingClientRect();
    if (!rect.width || !rect.height) continue;
    const distance = Math.max(rect.top - event.clientY, event.clientY - rect.bottom, 0);
    if (!closest || distance < closest.distance) closest = { rect, distance };
  }
  if (!closest) return;

  const { rect } = closest;
  const hit = view.posAtCoords({
    left: Math.max(rect.left + 1, Math.min(event.clientX, rect.right - 1)),
    top: Math.max(rect.top + 1, Math.min(event.clientY, rect.bottom - 1))
  });
  const bodyStart = pos + 1 + (isSummary(node.firstChild) ? node.firstChild.nodeSize : 0);
  if (!hit || hit.pos < bodyStart || hit.pos >= pos + node.nodeSize - 1) return;

  event.preventDefault();
  const tr = view.state.tr;
  setSelectionNear(tr, hit.pos);
  view.dispatch(tr);
  view.focus();
}

// Keep the browser DOM and ProseMirror node attributes in sync.
// This prevents the callout from looking closed or losing its custom classes after edits.
function syncCalloutDOM(view) {
  view.state.doc.descendants((node, pos) => {
    if (!isCallout(node)) return;
    const dom = view.nodeDOM(pos);
    if (dom?.tagName !== "DETAILS") return;

    // Foundry 14's NodeView neither refreshes open nor copies preserved classes.
    if (dom.open !== isOpen(node)) dom.open = isOpen(node);
    const classes = node.attrs.classes || node.attrs._preserve?.class || "";
    if (dom.getAttribute("class") !== classes) dom.setAttribute("class", classes);
    const type = node.attrs._preserve?.["data-callout-type"];
    if (type && dom.getAttribute("data-callout-type") !== type) dom.setAttribute("data-callout-type", type);
  });
}

// Walk up the parent chain from the current selection and return the matching depth.
function findAncestorDepth($pos, predicate) {
  for (let depth = $pos.depth; depth > 0; depth--) {
    if (predicate($pos.node(depth))) return depth;
  }
  return -1;
}

// Check whether a node can be inserted at a given position.
function canInsertNodeAt($pos, type) {
  return $pos.parent.canReplaceWith($pos.index(), $pos.index(), type);
}

// Place the caret near a position using ProseMirror's text selection logic.
function setSelectionNear(tr, pos, bias = 1) {
  const pm = getProseMirror();
  const TextSelection = pm?.state?.TextSelection ?? pm?.TextSelection;
  tr.setSelection(TextSelection.near(tr.doc.resolve(pos), bias));
}

// Extend the editor schema with HTML-compatible details/summary nodes.
// This lets Foundry read and write a callout block as if it were a native HTML details element.
function createDisclosureSchema(schema) {
  let nodes = schema.spec.nodes;

  if (!schema.nodes.summary) nodes = nodes.addToEnd("summary", {
    content: "inline*",
    defining: true,
    parseDOM: [{ tag: "summary" }],
    toDOM: () => ["summary", 0]
  });

  if (!schema.nodes.details) nodes = nodes.addToEnd("details", {
    content: "summary block*",
    group: "block",
    isolating: true,
    attrs: { open: { default: false }, _preserve: { default: {} } },
    parseDOM: [{
      tag: "details",
      getAttrs: element => ({
        open: element.hasAttribute("open"),
        _preserve: Object.fromEntries(["class", "data-callout-type"]
          .filter(name => element.hasAttribute(name)).map(name => [name, element.getAttribute(name)]))
      })
    }],
    toDOM: node => ["details", { ...node.attrs._preserve, ...(node.attrs.open ? { open: "" } : {}) }, 0]
  });

  return new schema.constructor({ nodes, marks: schema.spec.marks });
}
