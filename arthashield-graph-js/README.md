# ArthaShield Graph (`arthashield-graph-js`)

An embeddable, framework-free **intelligence-graph modeler** — ArthaShield's answer to
[`bpmn-js`](https://bpmn.io/). Where bpmn-js models processes, this models the
*relationships* between financial entities and turns the graph's structure into
**Challenge → Intelligence → Action**.

It is both a tool and a positioning statement: *ArthaShield connects the dots that
existing financial systems keep separate.*

> Status: **prototype**. The graph editor is real and works. The intelligence engine is a
> transparent, rule-based stand-in for the reasoning ArthaShield productionises — not a
> live model.

## Try it

Open `index.html` in a browser (or serve the folder). Pick a scenario from **Examples**,
drag nodes to move them, drag the canvas to pan, scroll to zoom, and click a node then
**→ Connect** to link it to another. The intelligence panel updates live.

### Example scenarios

| Scenario | What it shows |
|---|---|
| Transaction anomaly | Behaviour that breaks a customer's historical pattern |
| Fraud ring | Several customers routed through one shared counterparty (**risk**) |
| KYC onboarding risk | A new customer linked to a high-risk counterparty |
| Credit exposure | One customer holding several products (**concentration**) |
| Complaint root cause | Multiple complaints tracing to a single merchant |

## Embed it

```html
<link rel="stylesheet" href="lib/arthashield-graph.css"/>
<div id="canvas" style="height:560px"></div>
<script src="lib/arthashield-graph.js"></script>
<script>
  const modeler = new ArthaShieldGraph({
    container: '#canvas',
    onChange: (graph) => {
      const { metrics, insights } = ArthaShieldIntelligence.analyze(graph);
      // render insights however you like
    }
  });
  modeler.loadGraph({
    nodes: [ { id: 'c', type: 'Customer' }, { id: 't', type: 'Transaction' } ],
    edges: [ { from: 'c', to: 't' } ]
  });
</script>
```

## API

| Method | Purpose |
|---|---|
| `new ArthaShieldGraph({ container, onChange, onSelect })` | Mount the modeler. |
| `loadGraph({ nodes, edges })` | Replace the graph. Nodes: `{ id?, type, label?, x?, y? }`. Edges: `{ from, to, dashed? }`. |
| `getGraph()` | Return the current graph as plain JSON. |
| `addNode(type, x?, y?)` | Add an entity of a known type. |
| `deleteSelected()` | Remove the selected node (and its links) or edge. |
| `autoLayout()` | Tidy nodes into ranked rows. |
| `fit()` / `zoomIn()` / `zoomOut()` | Frame the graph / zoom the canvas. |
| `ArthaShieldGraph.ENTITY_TYPES` | The entity vocabulary and colours. |
| `ArthaShieldIntelligence.analyze(graph)` | Pure function → `{ metrics, insights }`. |

## Entity vocabulary

`Customer · Account · Loan · Transaction · Merchant · Counterparty · Complaint ·
Risk Signal · Regulation · AI Recommendation · Workflow`

## Swapping in a real model

`ArthaShieldIntelligence.analyze` is a **pure function** of the graph. To move from the
rule-based prototype to a live model, replace its body with a call to your service (for
example a Claude API endpoint) that receives the same graph JSON and returns the same
`{ metrics, insights }` shape. The UI needs no changes.

## Files

```
arthashield-graph-js/
├── index.html                 # full-bleed app (bpmn.io-style editor)
├── examples.js                # curated financial scenarios
├── lib/
│   ├── arthashield-graph.js    # the modeler (pan/zoom/connect) + intelligence engine
│   └── arthashield-graph.css   # canvas, nodes, context pad (light/dark)
└── README.md
```
