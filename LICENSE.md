# TreeListy License Overview

TreeListy uses a multi-license structure to balance open-source ecosystem growth with sustainable development.

## License Map

| Component | License | Location |
|-----------|---------|----------|
| **TreeListy UI** (`treeplexity.html`) | MPL-2.0 | This file |
| **MCP Bridge** (`packages/treelisty-mcp-bridge/`) | Apache-2.0 | `packages/treelisty-mcp-bridge/LICENSE` |
| **Patterns & Templates** (`patterns/`, `welcome-to-treelisty.json`) | CC-BY 4.0 | See below |
| **Cloud Services** (Firebase sync, team features) | Proprietary | N/A (server-side) |
| **Documentation** (`docs/`) | CC-BY 4.0 | See below |

---

## Mozilla Public License 2.0 (MPL-2.0)

**Applies to:** `treeplexity.html`

The main TreeListy application is licensed under MPL-2.0. This means:

- **You may:** Use, modify, and distribute TreeListy
- **You must:** Share modifications to MPL-licensed files under MPL-2.0
- **You may:** Combine with proprietary code (file-level copyleft, not project-level)
- **You must:** Preserve copyright notices and license headers

Full license text: https://www.mozilla.org/en-US/MPL/2.0/

### MPL-2.0 Header (for treeplexity.html)

```
<!--
  TreeListy - Hierarchical Project Decomposition Tool
  Copyright (c) 2024-2025 Prairie2Cloud LLC

  This Source Code Form is subject to the terms of the Mozilla Public
  License, v. 2.0. If a copy of the MPL was not distributed with this
  file, You can obtain one at https://mozilla.org/MPL/2.0/.

  See TRADEMARKS.md for trademark usage guidelines.
-->
```

---

## Apache License 2.0

**Applies to:** `packages/treelisty-mcp-bridge/`

The MCP Bridge is licensed under Apache-2.0 for maximum ecosystem compatibility:

- **You may:** Use, modify, distribute, and sublicense
- **You may:** Use in proprietary projects without sharing source
- **You must:** Include license and copyright notice
- **You must:** State significant changes made

Full license text: https://www.apache.org/licenses/LICENSE-2.0

---

## Creative Commons Attribution 4.0 (CC-BY 4.0)

**Applies to:** Patterns, templates, and documentation

- **You may:** Share, adapt, and use commercially
- **You must:** Give appropriate credit
- **You must:** Indicate if changes were made

Full license text: https://creativecommons.org/licenses/by/4.0/

---

## Proprietary Components

The following are **not** open source:

1. **Cloud Sync Services** - Firebase-based team sync, session management
2. **Premium Features** - Features requiring server-side validation
3. **TreeListy Branding** - See `TRADEMARKS.md`

These components are provided as a service and are not licensed for self-hosting or redistribution.

---

## Contributor License Agreement

By contributing to TreeListy, you agree that:

1. Your contributions are licensed under the same license as the component you're modifying
2. You have the right to make such contributions
3. Prairie2Cloud LLC may relicense contributions as needed for the project

---

## Third-Party Components

TreeListy includes the following third-party libraries:

| Library | License | Use |
|---------|---------|-----|
| GoJS | Northwoods Software License | Canvas view (evaluation/licensed) |
| Frappe Gantt | MIT | Gantt view |
| Firebase | Apache-2.0 | Cloud sync |
| Three.js | MIT | 3D view |

See the respective library documentation for full license terms.

---

## Questions?

For licensing questions, contact: license@prairie2cloud.com

For trademark usage, see: `TRADEMARKS.md`
