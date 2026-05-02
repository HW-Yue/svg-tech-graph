#!/usr/bin/env node
import fs from "node:fs";
import process from "node:process";
import ELK from "elkjs/lib/elk.bundled.js";

const DEFAULT_NODE_WIDTH = 180;
const DEFAULT_NODE_HEIGHT = 76;

function readInput() {
  const inputPath = process.argv[2];
  const raw = inputPath ? fs.readFileSync(inputPath, "utf8") : fs.readFileSync(0, "utf8");
  return JSON.parse(raw);
}

function routingConfig(data) {
  const routing = data.routing || {};
  const spacing = routing.spacing || {};
  const direction = String(routing.direction || "RIGHT").toUpperCase();
  return {
    direction,
    edgeRouting: String(routing.edgeRouting || "ORTHOGONAL").toUpperCase(),
    nodeNode: Number(spacing.nodeNode ?? 80),
    edgeNode: Number(spacing.edgeNode ?? 40),
    edgeEdge: Number(spacing.edgeEdge ?? 24),
    layer: Number(spacing.layer ?? 120),
    marginX: Number(routing.marginX ?? 48),
    marginY: Number(routing.marginY ?? 108),
  };
}

function nodeSize(node) {
  return {
    width: Number(node.width ?? DEFAULT_NODE_WIDTH),
    height: Number(node.height ?? DEFAULT_NODE_HEIGHT),
  };
}

function cloneJson(value) {
  return JSON.parse(JSON.stringify(value));
}

function numberOrDefault(value, fallback) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function edgeId(edge, index) {
  return String(edge.id || `${edge.source || "from"}__${edge.target || "to"}__${index}`);
}

function buildElkGraph(data, config) {
  const nodes = Array.isArray(data.nodes) ? data.nodes : [];
  const arrows = Array.isArray(data.arrows) ? data.arrows : [];
  return {
    id: "root",
    layoutOptions: {
      "elk.algorithm": "layered",
      "elk.direction": config.direction,
      "elk.edgeRouting": config.edgeRouting,
      "elk.layered.spacing.nodeNodeBetweenLayers": String(config.layer),
      "elk.spacing.nodeNode": String(config.nodeNode),
      "elk.spacing.edgeNode": String(config.edgeNode),
      "elk.spacing.edgeEdge": String(config.edgeEdge),
      "elk.layered.nodePlacement.strategy": "NETWORK_SIMPLEX",
      "elk.layered.crossingMinimization.strategy": "LAYER_SWEEP",
      "elk.layered.mergeEdges": "false",
      "elk.padding": `[top=${config.marginY},left=${config.marginX},bottom=${config.marginY},right=${config.marginX}]`,
    },
    children: nodes.map((node, index) => {
      const size = nodeSize(node);
      return {
        id: String(node.id ?? `node-${index}`),
        width: size.width,
        height: size.height,
      };
    }),
    edges: arrows
      .filter((arrow) => arrow.source && arrow.target)
      .map((arrow, index) => ({
        id: edgeId(arrow, index),
        sources: [String(arrow.source)],
        targets: [String(arrow.target)],
      })),
  };
}

function pointsFromSection(section) {
  const points = [];
  if (section.startPoint) {
    points.push([section.startPoint.x, section.startPoint.y]);
  }
  for (const bend of section.bendPoints || []) {
    points.push([bend.x, bend.y]);
  }
  if (section.endPoint) {
    points.push([section.endPoint.x, section.endPoint.y]);
  }
  return simplifyPoints(points);
}

function simplifyPoints(points) {
  const simplified = [];
  for (const [x, y] of points) {
    const point = [Number(x.toFixed(2)), Number(y.toFixed(2))];
    const previous = simplified[simplified.length - 1];
    if (previous && previous[0] === point[0] && previous[1] === point[1]) {
      continue;
    }
    simplified.push(point);
  }

  const collapsed = [];
  for (const point of simplified) {
    if (collapsed.length < 2) {
      collapsed.push(point);
      continue;
    }
    const a = collapsed[collapsed.length - 2];
    const b = collapsed[collapsed.length - 1];
    const c = point;
    if ((a[0] === b[0] && b[0] === c[0]) || (a[1] === b[1] && b[1] === c[1])) {
      collapsed[collapsed.length - 1] = c;
    } else {
      collapsed.push(c);
    }
  }
  return collapsed;
}

function portFromPoint(node, point) {
  if (!node || !point) {
    return undefined;
  }
  const left = Number(node.x);
  const top = Number(node.y);
  const right = left + Number(node.width);
  const bottom = top + Number(node.height);
  const [x, y] = point;
  const distances = [
    ["left", Math.abs(x - left)],
    ["right", Math.abs(x - right)],
    ["top", Math.abs(y - top)],
    ["bottom", Math.abs(y - bottom)],
  ];
  distances.sort((a, b) => a[1] - b[1]);
  return distances[0][0];
}

function applyLayout(data, layout) {
  const result = cloneJson(data);
  const layoutNodes = new Map((layout.children || []).map((node) => [node.id, node]));
  const nodeMap = new Map();

  result.nodes = (result.nodes || []).map((node, index) => {
    const id = String(node.id ?? `node-${index}`);
    const laidOut = layoutNodes.get(id);
    if (!laidOut) {
      return node;
    }
    const next = {
      ...node,
      id,
      x: Number(laidOut.x.toFixed(2)),
      y: Number(laidOut.y.toFixed(2)),
      width: numberOrDefault(node.width, laidOut.width),
      height: numberOrDefault(node.height, laidOut.height),
    };
    nodeMap.set(id, next);
    return next;
  });

  const edgeMap = new Map((layout.edges || []).map((edge) => [edge.id, edge]));
  result.arrows = (result.arrows || []).map((arrow, index) => {
    if (!arrow.source || !arrow.target || arrow.route_points || arrow.routed_points) {
      return arrow;
    }
    const laidOut = edgeMap.get(edgeId(arrow, index));
    const section = laidOut?.sections?.[0];
    const routedPoints = section ? pointsFromSection(section) : [];
    if (routedPoints.length < 2) {
      return arrow;
    }
    const sourceNode = nodeMap.get(String(arrow.source));
    const targetNode = nodeMap.get(String(arrow.target));
    return {
      ...arrow,
      source_port: arrow.source_port || portFromPoint(sourceNode, routedPoints[0]),
      target_port: arrow.target_port || portFromPoint(targetNode, routedPoints[routedPoints.length - 1]),
      routed_points: routedPoints,
    };
  });

  result.width = Math.max(Number(result.width || 0), Math.ceil((layout.width || 0) + 24));
  result.height = Math.max(Number(result.height || 0), Math.ceil((layout.height || 0) + 24));
  return result;
}

async function main() {
  const data = readInput();
  const config = routingConfig(data);
  const elk = new ELK();
  const layout = await elk.layout(buildElkGraph(data, config));
  process.stdout.write(`${JSON.stringify(applyLayout(data, layout), null, 2)}\n`);
}

main().catch((error) => {
  console.error(error?.stack || error);
  process.exit(1);
});
