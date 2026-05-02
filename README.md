# SVG Tech Graph

`svg-tech-graph` turns natural language descriptions into polished SVG technical diagrams, then exports them as high-resolution PNG via `rsvg-convert`.

This edition keeps a single built-in visual system. The goal is a narrower, warmer, and more consistent output surface instead of a multi-style matrix.

![Default Visual System](assets/samples/sample-default-visual-system.png)

## What It Supports

- Architecture diagrams
- Data flow diagrams
- Flowcharts
- Sequence diagrams
- Agent and memory diagrams
- Comparison matrices
- Timelines
- Mind maps
- UML class / use case / state machine diagrams
- ER diagrams
- Network topology diagrams

## Install

```bash
npx skills add HW-Yue/svg-tech-graph
```

Update:

```bash
npx skills add HW-Yue/svg-tech-graph --force -g -y
```

## Visual Style

Only one visual system is available:

- **Default visual system**
- Warm cream canvas: `#f8f6f3`
- Quiet neutrals and restrained accent colors
- Left-aligned title system
- Documentation-first, presentation-friendly output

Reference file:

```text
references/default-visual-system.md
```

## Example Prompts

```text
Draw a system architecture diagram using the built-in default visual system.
```

```text
Generate a Mem0 memory architecture diagram with separate read and write paths.
```

```text
Visualize an agent tool-calling loop with planner, tools, memory, and response stages.
```

## Helper Scripts

### Validate an SVG

```bash
./scripts/validate-svg.sh ./output/diagram.svg
```

### Export an existing SVG to PNG

```bash
./scripts/generate-diagram.sh -t architecture -o ./output/arch.svg
```

### Generate from structured JSON

```bash
python3 ./scripts/generate-from-template.py architecture ./output/arch.svg '{
  "title": "System Architecture",
  "containers": [],
  "nodes": [],
  "arrows": []
}'
```

### Auto-route with ELK

```bash
npm install
node ./scripts/route-diagram.mjs ./fixtures/mq-routing.json > /tmp/mq-routed.json
python3 ./scripts/generate-from-template.py architecture ./output/mq.svg "$(cat /tmp/mq-routed.json)"
```

Or set this in the input JSON and let `generate-from-template.py` invoke the router automatically:

```json
{
  "auto_layout": true,
  "routing": {
    "engine": "elk",
    "direction": "RIGHT",
    "edgeRouting": "ORTHOGONAL"
  }
}
```

### Run regression test

```bash
./scripts/test-default-visual-system.sh
```

The regression script validates the single built-in visual system fixture set.

## Project Layout

```text
svg-tech-graph/
├── SKILL.md
├── README.md
├── README.zh.md
├── references/
│   ├── icons.md
│   ├── default-visual-system.md
│   └── svg-layout-best-practices.md
├── fixtures/
│   ├── system-architecture-default.json
│   └── mq-routing.json
├── scripts/
│   ├── README.md
│   ├── generate-diagram.sh
│   ├── generate-from-template.py
│   ├── route-diagram.mjs
│   ├── test-default-visual-system.sh
│   └── validate-svg.sh
├── templates/
└── assets/
    └── samples/
        └── sample-default-visual-system.png
```

## Notes

- `generate-from-template.py` always uses the built-in default visual system.
- `route-diagram.mjs` uses ELK to add node positions and routed orthogonal edge points for node-edge diagrams.
- `generate-diagram.sh` no longer depends on style selection; any legacy `-s/--style` input is ignored for compatibility.
- The multi-style reference matrix has been removed.
