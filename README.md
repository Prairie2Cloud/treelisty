# 🌳 Treeplexity

**Universal Project Decomposition Tool**

*From Complexity to Clarity*

---

## What is Treeplexity?

Treeplexity is a universal tool for breaking down any complex project, problem, or process into manageable parts. Structure your work into phases, track dependencies between components, and analyze your entire plan at a glance.

**Use it for:**
- 💻 Software projects
- 🎉 Event planning
- 🔬 Research projects
- 🎯 Personal goals
- 📈 Business strategy
- 🏗️ Construction projects
- 📚 Curriculum design
- ...and literally anything else that benefits from structured thinking!

---

## Key Features

### 🎯 Hierarchical Decomposition
Break complex projects into:
- **Phases** → Major stages (e.g., Planning → Build → Launch)
- **Items** → Components within each phase
- **SubItems** → Detailed tasks and subtasks

### 🔗 Dependency Management
- Visual dependency tracking
- Circular dependency detection
- Critical path calculation
- Topological sorting

### 📊 Analysis & Insights
- Cost aggregation and rollups
- Anomaly detection
- Phase breakdowns
- Export to Excel with professional formatting

### 🤖 AI-Powered
- Natural language project creation
- Intelligent item suggestions
- Automated analysis
- Context-aware recommendations

### 💾 Data Portability
- JSON import/export
- Excel export with multiple sheets
- Git-friendly format
- Template-driven approach

---

## Getting Started

### Quick Start

1. **Open the tool**
   ```
   Open treeplexity.html in your browser
   ```

2. **Create your first item**
   - Right-click any phase
   - Select "Add Item"
   - Fill in details

3. **Add dependencies**
   - Click "Set Dependencies" on any item
   - Choose what this item depends on

4. **Analyze**
   - View cost breakdowns
   - See critical path
   - Export to Excel

### Using Templates (Coming Soon)

Templates provide starting points for different domains:
- Software Development → Story points, sprints, technical dependencies
- Event Planning → Budget, logistics, timeline
- Research Project → Months, experiments, publications

---

## File Structure

```
treeplexity/
├── treeplexity.html       # Main application
├── templates/             # Domain-specific templates
├── examples/              # Example projects
├── docs/                  # Documentation
└── assets/                # Images and icons
```

---

## Core Concepts

### The Three-Phase Pattern

Most projects follow a **Beginning → Middle → End** pattern:

| Domain | Phase 0 | Phase 1 | Phase 2 |
|--------|---------|---------|---------|
| **Software** | Discovery | Development | Launch |
| **Events** | Planning | Execution | Follow-up |
| **Research** | Preparation | Experiments | Publication |
| **Personal** | Foundation | Achievement | Mastery |

You can customize phase names to match your domain.

### Flexible Metrics

The "Cost" field can represent any numeric value:
- 💰 Money (dollars, euros)
- ⏱️ Time (hours, days, weeks)
- 📊 Effort (story points, person-days)
- 🎯 Priority (1-10 scale)
- ⚠️ Risk (0-100%)
- 🔢 Difficulty (easy/medium/hard)

### Dependencies Create Structure

By defining what depends on what, Treeplexity can:
- Calculate the critical path (longest chain)
- Identify bottlenecks
- Detect circular dependencies
- Optimize parallel execution

---

## Comparison to CAPEX Master

Treeplexity is a fork of [CAPEX Master](../capex/) - a tool originally built for capital expenditure planning.

**What's Different:**
- ✅ Generic branding (not P2C/CAPEX specific)
- ✅ Universal terminology (projects, not just CAPEX)
- ✅ Tree emoji 🌳 (not cloud ☁️)
- ✅ Indigo/purple color scheme (not green)
- ✅ "From Complexity to Clarity" tagline
- ✅ Removed "CONFIDENTIAL" markings

**What's the Same:**
- ✅ All core functionality preserved
- ✅ Tree visualization with pan/zoom
- ✅ Dependency management
- ✅ AI integration
- ✅ Excel/JSON export

**Why Fork?**
CAPEX Master remains focused on infrastructure project planning for P2C.
Treeplexity explores the universal potential of the same underlying framework.

---

## Roadmap

### Phase 1: Basic Fork ✅ COMPLETE
- [x] Copy and rebrand
- [x] Update colors and logo
- [x] Remove domain-specific terminology
- [x] Test all features work

### Phase 2: Core Features (Week 2-3)
- [ ] Editable phase names in UI
- [ ] Configurable metric types
- [ ] Project settings panel
- [ ] Template selector on startup

### Phase 3: Templates (Week 4-5)
- [ ] Software Development template
- [ ] Event Planning template
- [ ] Research Project template
- [ ] Personal Goals template
- [ ] Business Strategy template

### Phase 4: Polish (Week 6)
- [ ] User documentation
- [ ] Tutorial system
- [ ] Template creation guide
- [ ] Mobile responsiveness improvements

---

## Philosophy

### Structure is Universal

Every complex problem can be:
1. Broken into parts (hierarchy)
2. Related to other parts (dependencies)
3. Measured (metrics)
4. Analyzed (mathematics)
5. Shared (data)

Treeplexity provides these five capabilities for **any** domain.

### Templates Capture Expertise

Each template represents domain expertise:
- What phases make sense?
- What components are typical?
- What dependencies exist?
- What metrics matter?

Templates are **knowledge crystallized into data**.

### One Tool, Infinite Applications

Instead of learning 10 different tools for 10 different domains, learn Treeplexity once and apply it everywhere.

**Same structure. Different data. Universal power.**

---

## Technical Details

### Technologies
- Pure HTML/CSS/JavaScript (no dependencies)
- Single-file application (portable)
- JSON data format (git-friendly)
- AI integration via Claude API

### Browser Support
- ✅ Chrome/Edge (recommended)
- ✅ Firefox
- ✅ Safari
- ⚠️ Mobile (functional but not optimized yet)

### Data Format
Projects are stored as JSON with this structure:
```json
{
  "id": "root",
  "name": "Project Name",
  "type": "root",
  "phases": [
    {
      "id": "p0",
      "name": "Phase Name",
      "phaseNumber": 0,
      "items": [...]
    }
  ]
}
```

---

## Contributing

Want to contribute a template for your domain?

1. Create a template JSON file
2. Add example items with realistic values
3. Document what "cost" means in your domain
4. Share with the community!

See [TEMPLATES_GUIDE.md](../capex/mcp-server/TEMPLATES_GUIDE.md) for details.

---

## Documentation

**In this folder:**
- [REBRANDING_COMPLETE.md](REBRANDING_COMPLETE.md) - Complete list of changes from CAPEX Master

**In parent project:**
- [Quick Start Guide](../capex/mcp-server/TREEPLEXITY_QUICK_START.md)
- [Full Fork Plan](../capex/mcp-server/TREEPLEXITY_FORK_PLAN.md)
- [Generic Power Discovery](../capex/mcp-server/GENERIC_POWER.md)
- [Universal Vision](../capex/mcp-server/THE_UNIVERSAL_VISION.md)
- [Templates Guide](../capex/mcp-server/TEMPLATES_GUIDE.md)

---

## License

Forked from CAPEX Master by Prairie2Cloud.

Treeplexity maintains the same license and acknowledgments.

---

## Questions?

- 📖 Read the [documentation](../capex/mcp-server/)
- 💡 See [examples](./examples/) (coming soon)
- 🎨 Browse [templates](./templates/) (coming soon)

---

**Treeplexity: One tool for everything** 🌳✨

*Structure your thinking. Master complexity. Achieve clarity.*
