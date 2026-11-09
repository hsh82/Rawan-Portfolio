# Local staging authoring

Start npm run dev:content or npm run preview:content and open /dev/content/. Both serve source-backed local authoring; normal npm run preview serves read-only dist. No build or deployment contains write APIs.

Career resources each expose the complete entries.json array in one source editor, like Site and Contact. Add, edit or remove array entries directly and use Save Changes to save the full file. Studio has no record picker, Add/Delete buttons, import modes or separate record state.

Empty collections open with a hidden bilingual schema-valid template inside the JSON buffer. It is not written to disk until Save. Existing files open with all their records unchanged. Full-file saves preserve revision checks, schema and duplicate-ID validation, unknown fields, relationship checks and atomic writes. Reload on a 409 conflict.

Valid pasted JSON accepts surrounding whitespace/BOM, complete Markdown JSON fences, trailing commas outside strings and literal newlines inside text. Format / Repair JSON lists syntax cleanup before applying it. Semantic values, IDs, publication status, structure and references are never inferred. Incorrect array/object shapes and invalid localized fields show exact field paths. Required scaffold fields are checked against the application schemas; extra authored fields survive saves.

Every source edit is parsed after a 400 ms debounce and validated before a temporary snapshot is rendered through the same Astro HomeSurface as the public homepage. The last valid preview remains visible with an outdated warning while JSON is invalid. Newer edits supersede older requests. Preview never saves canonical files. Sessions expire after ten minutes and are bounded in memory. The sandbox disables scripts, forms and nested frames. Scroll animations are made visible by preview-only CSS. Script-dependent public interactions are intentionally inactive in this read-only view.

Preview language and viewport are independent of the editor language. Desktop uses a 1280px layout; mobile uses 390px. Expand preview uses a viewport-filling overlay with an obvious exit button and Escape support; changing viewport/expansion preserves the snapshot.

AI Assistant is in the top toolbar and opens a keyboard-accessible dialog. Copy its prompt into your chosen AI assistant. It includes the current resource structure and the section-by-section interview, bilingual draft, placement and approval protocol. It cannot save data, call an external AI service or fabricate claims. More Actions groups validation, JSON repair and Git changes. Blog/project documents retain the bilingual MDX editor, separate Save Draft and Publish actions and existing Unpublish/Delete semantics.

Run npm run test:studio for API/normalization regressions and npm run test:studio-ui for real Chrome tests of both authoring commands. Also run content validation, link checks, Astro checks, build and npm test. CHROME_BIN overrides the browser executable for UI tests; npm installation never downloads a browser.

For an existing project, Homepage preview shows its unsaved card metadata and localized title/summary through the real homepage. Publication state is preserved, so a draft remains absent from public selection until explicitly published. The MDX visual renderer accepts safe static blocks; executable expressions, imports and active HTML are reported as unsupported and remain in Source.

Duplicate JSON field names are ambiguous and rejected; choose the intended value explicitly. Preview renders the edited full-file array without persistence.
