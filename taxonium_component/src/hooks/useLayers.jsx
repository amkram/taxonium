import {
  LineLayer,
  ScatterplotLayer,
  PolygonLayer,
  TextLayer,
  SolidPolygonLayer,
} from "@deck.gl/layers";

import { useMemo, useCallback } from "react";
import useTreenomeLayers from "./useTreenomeLayers";
import getSVGfunction from "../utils/deckglToSvg";

const getKeyStuff = (getNodeColorField, colorByField, dataset, toRGB) => {
  const counts = {};
  for (const node of dataset.nodes) {
    const value = getNodeColorField(node, dataset);
    if (value in counts) {
      counts[value]++;
    } else {
      counts[value] = 1;
    }
  }
  const keys = Object.keys(counts);
  const output = [];
  for (const key of keys) {
    output.push({ value: key, count: counts[key], color: toRGB(key) });
  }
  return output;
};

const useLayers = ({
  data,
  search,
  viewState,
  colorHook,
  setHoverInfo,
  hoverInfo,
  colorBy,
  xType,
  modelMatrix,
  selectedDetails,
  xzoom,
  settings,
  isCurrentlyOutsideBounds,
  config,
  treenomeState,
  treenomeReferenceInfo,
  setTreenomeReferenceInfo,
  hoveredKey,
  view,
}) => {
  const lineColor = settings.lineColor;
  const getNodeColorField = colorBy.getNodeColorField;
  const colorByField = colorBy.colorByField;

  const { toRGB } = colorHook;

  const layers = [];

  // Treenome Browser layers
  const treenomeLayers = useTreenomeLayers(
    treenomeState,
    data,
    viewState,
    colorHook,
    setHoverInfo,
    settings,
    treenomeReferenceInfo,
    setTreenomeReferenceInfo,
    selectedDetails,
    isCurrentlyOutsideBounds
  );
  layers.push(...treenomeLayers);

  const getX = useCallback((node) => node[xType], [xType]);

  const detailed_data = useMemo(() => {
    if (data.data && data.data.nodes) {
      data.data.nodes.forEach((node) => {
        node.parent_x = getX(data.data.nodeLookup[node.parent_id]);
        node.parent_y = data.data.nodeLookup[node.parent_id].y;
      });
      return data.data;
    } else {
      return { nodes: [], nodeLookup: {} };
    }
  }, [data.data, getX]);

  const keyStuff = useMemo(() => {
    return getKeyStuff(getNodeColorField, colorByField, detailed_data, toRGB);
  }, [detailed_data, getNodeColorField, colorByField, toRGB]);

  const clade_accessor = "pango";

  const clade_data = useMemo(() => {
    const initial_data = detailed_data.nodes.filter(
      (n) => n.clades && n.clades[clade_accessor]
    );

    const rev_sorted_by_num_tips = initial_data.sort(
      (a, b) => b.num_tips - a.num_tips
    );

    // pick top settings.minTipsForCladeText
    const top_nodes = rev_sorted_by_num_tips.slice(0, settings.maxCladeTexts);
    return top_nodes;
  }, [detailed_data.nodes, settings.maxCladeTexts, clade_accessor]);

  const base_data = useMemo(() => {
    if (data.base_data && data.base_data.nodes) {
      data.base_data.nodes.forEach((node) => {
        node.parent_x = getX(data.base_data.nodeLookup[node.parent_id]);
        node.parent_y = data.base_data.nodeLookup[node.parent_id].y;
      });
      return {
        nodes: data.base_data.nodes,
        nodeLookup: data.base_data.nodeLookup,
      };
    } else {
      return { nodes: [], nodeLookup: {} };
    }
  }, [data.base_data, getX]);

  const detailed_scatter_data = useMemo(() => {
    return detailed_data.nodes.filter(
      (node) =>
        node.is_tip ||
        (node.is_tip === undefined && node.num_tips === 1) ||
        settings.displayPointsForInternalNodes
    );
  }, [detailed_data, settings.displayPointsForInternalNodes]);

  const minimap_scatter_data = useMemo(() => {
    return base_data
      ? base_data.nodes.filter(
          (node) =>
            node.is_tip ||
            (node.is_tip === undefined && node.num_tips === 1) ||
            settings.displayPointsForInternalNodes
        )
      : [];
  }, [base_data, settings.displayPointsForInternalNodes]);

  const outer_bounds = [
    [-100000, -100000],
    [100000, -100000],
    [1000000, 1000000],
    [-100000, 1000000],
    [-100000, -100000],
  ];
  const inner_bounds = [
    [viewState.min_x, viewState.min_y < -1000 ? -1000 : viewState.min_y],
    [viewState.max_x, viewState.min_y < -1000 ? -1000 : viewState.min_y],
    [viewState.max_x, viewState.max_y > 10000 ? 10000 : viewState.max_y],
    [viewState.min_x, viewState.max_y > 10000 ? 10000 : viewState.max_y],
  ];

  const bound_contour = [[outer_bounds, inner_bounds]];

  // Add a function to check if a node is part of the selected lineage or its sub-lineages
  const isNodeInSelectedLineage = useCallback((node, selectedLineage, dataSource = detailed_data) => {
    if (!selectedLineage || !node) return true; // If no lineage selected, show all nodes
    
    // Use the same accessor function (getNodeColorField) that is used for coloring
    const nodeLineage = getNodeColorField(node, dataSource);
    if (!nodeLineage) return false; // Node has no lineage information
    
    // Exact match - node is exactly the selected lineage
    if (nodeLineage === selectedLineage) return true;
    
    // Check if node is in a sub-lineage of the selected lineage
    // e.g., if AY is selected, we want to highlight AY.4, AY.4.2, etc.
    if (nodeLineage.startsWith(selectedLineage + '.')) {
      return true;
    }
    
    return false;
  }, [getNodeColorField, detailed_data]);

  // Update the scatter layer common props to apply lineage filtering logic
  const scatter_layer_common_props = {
    getPosition: (d) => [getX(d), d.y],
    getFillColor: (d) => {
      // Cache node color for better performance
      const nodeLineage = getNodeColorField(d, detailed_data);
      
      // If a category is selected (hoveredKey exists)
      if (hoveredKey) {
        // Instead of exact match, use the isNodeInSelectedLineage function
        if (isNodeInSelectedLineage(d, hoveredKey, detailed_data)) {
          // Make selected category nodes more vibrant
          const baseColor = toRGB(nodeLineage);
          return baseColor.map(c => Math.min(255, c + 40));
        } else {
          // Gray out nodes that don't belong to the selected category
          return [180, 180, 180]; // Light gray color
        }
      }
      
      // No category selected, show normal colors
      return toRGB(nodeLineage);
    },
    getRadius: (d) => {
      // Only calculate node category when hoveredKey is present
      if (hoveredKey) {
        // Use isNodeInSelectedLineage instead of direct equality
        if (isNodeInSelectedLineage(d, hoveredKey, detailed_data)) {
          return settings.nodeSize * 1.5; // Make highlighted nodes 1.5x bigger
        }
      }
      return settings.nodeSize;
    },
    getLineColor: (d) => {
      // Only calculate when hoveredKey is present to improve performance
      if (hoveredKey) {
        // Use isNodeInSelectedLineage instead of direct equality
        if (isNodeInSelectedLineage(d, hoveredKey, detailed_data)) {
          return [0, 0, 0]; // Black outline for highlighted nodes
        }
        // Lighter gray outline for non-matching nodes when a category is selected
        return [160, 160, 160];
      }
      return [100, 100, 100];
    },
    getLineWidth: (d) => {
      // Only calculate when hoveredKey is present
      if (hoveredKey) {
        // Use isNodeInSelectedLineage instead of direct equality
        if (isNodeInSelectedLineage(d, hoveredKey, detailed_data)) {
          return 2;
        }
      }
      return 1;
    },
    lineWidthScale: 1,
    opacity: settings.opacity,
    stroked: data.data.nodes && data.data.nodes.length < 3000,
    lineWidthUnits: "pixels",
    pickable: true,
    radiusUnits: "pixels",
    onHover: (info) => setHoverInfo(info),
    modelMatrix: modelMatrix,
    updateTriggers: {
      getFillColor: [detailed_data, getNodeColorField, colorHook, hoveredKey, view?.currentFilteredLineage],
      getRadius: [settings.nodeSize, hoveredKey, view?.currentFilteredLineage],
      getLineColor: [hoveredKey, view?.currentFilteredLineage],
      getLineWidth: [hoveredKey, view?.currentFilteredLineage],
      getPosition: [xType],
    },
  };

  // Also update line layer common props to use the same highlighting logic
  const line_layer_horiz_common_props = {
    getSourcePosition: (d) => [getX(d), d.y],
    getTargetPosition: (d) => [d.parent_x, d.y],
    getColor: (d) => {
      if (hoveredKey) {
        // For fillin lines, we need to pass base_data instead of detailed_data
        const dataSource = d.isBaseData ? base_data : detailed_data;
        // Use isNodeInSelectedLineage instead of direct equality
        if (isNodeInSelectedLineage(d, hoveredKey, dataSource)) {
          return [100, 100, 100]; // Normal color for selected category
        }
        return [200, 200, 200]; // Light gray for non-matching nodes
      }
      return lineColor;
    },
    pickable: true,
    widthUnits: "pixels",
    getWidth: (d) =>
      d === (hoverInfo && hoverInfo.object)
        ? 3
        : selectedDetails.nodeDetails &&
          selectedDetails.nodeDetails.node_id === d.node_id
        ? 3.5
        : 1,

    onHover: (info) => setHoverInfo(info),

    modelMatrix: modelMatrix,
    updateTriggers: {
      getSourcePosition: [detailed_data, xType],
      getTargetPosition: [detailed_data, xType],
      getWidth: [hoverInfo, selectedDetails.nodeDetails],
      getColor: [hoveredKey, lineColor, view?.currentFilteredLineage],
    },
  };

  const line_layer_vert_common_props = {
    getSourcePosition: (d) => [d.parent_x, d.y],
    getTargetPosition: (d) => [d.parent_x, d.parent_y],
    onHover: (info) => setHoverInfo(info),
    getColor: (d) => {
      if (hoveredKey) {
        // For fillin lines, we need to pass base_data instead of detailed_data
        const dataSource = d.isBaseData ? base_data : detailed_data;
        // Use isNodeInSelectedLineage instead of direct equality
        if (isNodeInSelectedLineage(d, hoveredKey, dataSource)) {
          return [100, 100, 100]; // Normal color for selected category
        }
        return [200, 200, 200]; // Light gray for non-matching nodes
      }
      return lineColor;
    },
    pickable: true,
    getWidth: (d) =>
      d === (hoverInfo && hoverInfo.object)
        ? 2
        : selectedDetails.nodeDetails &&
          selectedDetails.nodeDetails.node_id === d.node_id
        ? 2.5
        : 1,
    modelMatrix: modelMatrix,
    updateTriggers: {
      getSourcePosition: [detailed_data, xType],
      getTargetPosition: [detailed_data, xType],
      getWidth: [hoverInfo, selectedDetails.nodeDetails],
      getColor: [hoveredKey, lineColor, view?.currentFilteredLineage],
    },
  };

  // Create a deep copy of the base_data nodes and add isBaseData property
  const base_data_nodes_with_flag = useMemo(() => {
    if (!base_data || !base_data.nodes) return [];
    return base_data.nodes.map(node => ({
      ...node,
      isBaseData: true
    }));
  }, [base_data]);

  if (detailed_data.nodes) {
    const main_scatter_layer = {
      layerType: "ScatterplotLayer",
      ...scatter_layer_common_props,
      id: "main-scatter",
      data: detailed_scatter_data,
    };

    const pretty_stroke_background_layer = settings.prettyStroke.enabled
      ? {
          ...main_scatter_layer,
          getFillColor: settings.prettyStroke.color,
          getLineWidth: 0,
          getRadius: main_scatter_layer.getRadius + settings.prettyStroke.width,
        }
      : null;

    const fillin_scatter_layer = {
      layerType: "ScatterplotLayer",
      ...scatter_layer_common_props,
      id: "fillin-scatter",
      data: minimap_scatter_data.map(node => ({ ...node, isBaseData: true })),
      getFillColor: (d) => {
        const nodeLineage = getNodeColorField(d, base_data);
        
        // If a category is selected (hoveredKey exists)
        if (hoveredKey) {
          // Instead of exact match, use the isNodeInSelectedLineage function
          if (isNodeInSelectedLineage(d, hoveredKey, base_data)) {
            // Make selected category nodes more vibrant
            const baseColor = toRGB(nodeLineage);
            return baseColor.map(c => Math.min(255, c + 40));
          } else {
            // Gray out nodes that don't belong to the selected category
            return [180, 180, 180]; // Light gray color
          }
        }
        
        // No category selected, show normal colors
        return toRGB(nodeLineage);
      },
    };

    const main_line_layer = {
      layerType: "LineLayer",
      ...line_layer_horiz_common_props,
      id: "main-line-horiz",
      data: detailed_data.nodes,
    };

    const main_line_layer2 = {
      layerType: "LineLayer",
      ...line_layer_vert_common_props,
      id: "main-line-vert",
      data: detailed_data.nodes,
    };

    const fillin_line_layer = {
      layerType: "LineLayer",
      ...line_layer_horiz_common_props,
      id: "fillin-line-horiz",
      data: base_data_nodes_with_flag,
    };

    const fillin_line_layer2 = {
      layerType: "LineLayer",
      ...line_layer_vert_common_props,
      id: "fillin-line-vert",
      data: base_data_nodes_with_flag,
    };

    const selectedLayer = {
      layerType: "ScatterplotLayer",
      data: selectedDetails.nodeDetails ? [selectedDetails.nodeDetails] : [],
      visible: true,
      opacity: 1,
      getRadius: 6,
      radiusUnits: "pixels",

      id: "main-selected",
      filled: false,
      stroked: true,
      modelMatrix,

      getLineColor: [0, 0, 0],
      getPosition: (d) => {
        return [d[xType], d.y];
      },
      lineWidthUnits: "pixels",
      lineWidthScale: 2,
    };

    const hoveredLayer = {
      layerType: "ScatterplotLayer",
      data: hoverInfo && hoverInfo.object ? [hoverInfo.object] : [],
      visible: true,
      opacity: 0.3,
      getRadius: 4,
      radiusUnits: "pixels",

      id: "main-hovered",
      filled: false,
      stroked: true,
      modelMatrix,

      getLineColor: [0, 0, 0],
      getPosition: (d) => {
        return [d[xType], d.y];
      },
      lineWidthUnits: "pixels",
      lineWidthScale: 2,
    };

    const clade_label_layer = {
      layerType: "TextLayer",
      id: "main-clade-node",
      getPixelOffset: [-5, -6],
      data: clade_data,
      getPosition: (d) => [getX(d), d.y],
      getText: (d) => d.clades[clade_accessor],

      getColor: settings.cladeLabelColor,
      getAngle: 0,
      fontFamily: "Roboto, sans-serif",
      fontWeight: 700,

      billboard: true,
      getTextAnchor: "end",
      getAlignmentBaseline: "center",
      getSize: 11,
      modelMatrix: modelMatrix,
      updateTriggers: {
        getPosition: [getX],
      },
    };

    layers.push(
      main_line_layer,
      main_line_layer2,
      fillin_line_layer,
      fillin_line_layer2,
      pretty_stroke_background_layer,
      main_scatter_layer,
      fillin_scatter_layer,
      clade_label_layer,
      selectedLayer,
      hoveredLayer
    );
  }

  const proportionalToNodesOnScreen = config.num_tips / 2 ** viewState.zoom;

  // If leaves are fewer than max_text_number, add a text layer
  if (
    data.data.nodes &&
    proportionalToNodesOnScreen <
      0.8 * 10 ** settings.thresholdForDisplayingText
  ) {
    const node_label_layer = {
      layerType: "TextLayer",
      id: "main-text-node",
      fontFamily: "Roboto, sans-serif",
      fontWeight: 100,
      data: data.data.nodes.filter((node) =>
        settings.displayTextForInternalNodes
          ? true
          : node.is_tip || (node.is_tip === undefined && node.num_tips === 1)
      ),
      getPosition: (d) => [getX(d), d.y],
      getText: (d) => d[config.name_accessor],

      getColor: settings.terminalNodeLabelColor,
      getAngle: 0,

      billboard: true,
      getTextAnchor: "start",
      getAlignmentBaseline: "center",
      getSize: data.data.nodes.length < 200 ? 12 : 9.5,
      modelMatrix: modelMatrix,
      getPixelOffset: [10, 0],
    };

    layers.push(node_label_layer);
  }

  const minimap_scatter = {
    layerType: "ScatterplotLayer",
    id: "minimap-scatter",
    data: minimap_scatter_data.map(node => ({ ...node, isBaseData: true })),
    getPolygonOffset: ({ layerIndex }) => [0, -4000],
    getPosition: (d) => [getX(d), d.y],
    getFillColor: (d) => {
      const nodeLineage = getNodeColorField(d, base_data);
      
      // Add highlighting for selected lineage in minimap view
      if (hoveredKey) {
        if (isNodeInSelectedLineage(d, hoveredKey, base_data)) {
          const baseColor = toRGB(nodeLineage);
          return baseColor.map(c => Math.min(255, c + 40));
        } else {
          return [180, 180, 180]; // Gray color for non-matching
        }
      }
      
      return toRGB(nodeLineage);
    },
    // radius in pixels
    getRadius: (d) => {
      if (hoveredKey && isNodeInSelectedLineage(d, hoveredKey, base_data)) {
        return 3; // Slightly larger radius for matching nodes
      }
      return 2;
    },
    getLineColor: [100, 100, 100],

    opacity: 0.6,
    radiusUnits: "pixels",
    onHover: (info) => setHoverInfo(info),
    updateTriggers: {
      getFillColor: [base_data, getNodeColorField, hoveredKey],
      getRadius: [hoveredKey],
      getPosition: [minimap_scatter_data, xType],
    },
  };

  const minimap_line_horiz = {
    layerType: "LineLayer",
    id: "minimap-line-horiz",
    getPolygonOffset: ({ layerIndex }) => [0, -4000],
    data: base_data_nodes_with_flag,
    getSourcePosition: (d) => [getX(d), d.y],
    getTargetPosition: (d) => [d.parent_x, d.y],
    getColor: (d) => {
      if (hoveredKey) {
        if (isNodeInSelectedLineage(d, hoveredKey, base_data)) {
          return [100, 100, 100];
        }
        return [220, 220, 220];
      }
      return lineColor;
    },
    updateTriggers: {
      getSourcePosition: [base_data, xType],
      getTargetPosition: [base_data, xType],
      getColor: [hoveredKey],
    },
  };

  const minimap_line_vert = {
    layerType: "LineLayer",
    id: "minimap-line-vert",
    getPolygonOffset: ({ layerIndex }) => [0, -4000],
    data: base_data_nodes_with_flag,
    getSourcePosition: (d) => [d.parent_x, d.y],
    getTargetPosition: (d) => [d.parent_x, d.parent_y],
    getColor: (d) => {
      if (hoveredKey) {
        if (isNodeInSelectedLineage(d, hoveredKey, base_data)) {
          return [100, 100, 100];
        }
        return [220, 220, 220];
      }
      return lineColor;
    },
    updateTriggers: {
      getSourcePosition: [base_data, xType],
      getTargetPosition: [base_data, xType],
      getColor: [hoveredKey],
    },
  };

  const minimap_polygon_background = {
    layerType: "PolygonLayer",
    id: "minimap-bound-background",
    data: [outer_bounds],
    getPolygon: (d) => d,
    pickable: true,
    stroked: true,
    opacity: 0.3,
    filled: true,
    getPolygonOffset: ({ layerIndex }) => [0, -2000],

    getFillColor: (d) => [255, 255, 255],
  };

  const minimap_bound_polygon = {
    layerType: "PolygonLayer",
    id: "minimap-bound-line",
    data: bound_contour,
    getPolygon: (d) => d,
    pickable: true,
    stroked: true,
    opacity: 0.3,
    filled: true,
    wireframe: true,
    getFillColor: (d) => [240, 240, 240],
    getLineColor: [80, 80, 80],
    getLineWidth: 1,
    lineWidthUnits: "pixels",
    getPolygonOffset: ({ layerIndex }) => [0, -6000],
  };

  const { searchSpec, searchResults, searchesEnabled } = search;

  const search_layers = searchSpec.map((spec, i) => {
    const data = searchResults[spec.key]
      ? searchResults[spec.key].result.data
      : [];

    const lineColor = search.getLineColor(i);

    return {
      layerType: "ScatterplotLayer",

      data: data,
      id: "main-search-scatter-" + spec.key,
      getPosition: (d) => [d[xType], d.y],
      getLineColor: settings.displaySearchesAsPoints ? [0, 0, 0] : lineColor,
      getRadius: settings.displaySearchesAsPoints
        ? settings.searchPointSize
        : 5 + 2 * i,
      radiusUnits: "pixels",
      lineWidthUnits: "pixels",
      stroked: true,
      visible: searchesEnabled[spec.key],
      wireframe: true,
      getLineWidth: 1,
      filled: true,
      getFillColor: settings.displaySearchesAsPoints
        ? lineColor
        : [255, 0, 0, 0],
      modelMatrix: modelMatrix,
      updateTriggers: {
        getPosition: [xType],
      },
    };
  });

  const search_mini_layers = searchSpec.map((spec, i) => {
    const data = searchResults[spec.key]
      ? searchResults[spec.key].overview
      : [];
    const lineColor = search.getLineColor(i);

    return {
      layerType: "ScatterplotLayer",
      data: data,
      getPolygonOffset: ({ layerIndex }) => [0, -9000],
      id: "mini-search-scatter-" + spec.key,
      visible: searchesEnabled[spec.key],
      getPosition: (d) => [d[xType], d.y],
      getLineColor: lineColor,
      getRadius: 5 + 2 * i,
      radiusUnits: "pixels",
      lineWidthUnits: "pixels",
      stroked: true,

      wireframe: true,
      getLineWidth: 1,
      filled: false,
      getFillColor: [255, 0, 0, 0],
      updateTriggers: { getPosition: [xType] },
    };
  });
  layers.push(...search_layers, ...search_mini_layers);

  layers.push(minimap_polygon_background);
  layers.push(minimap_line_horiz, minimap_line_vert, minimap_scatter);
  layers.push(minimap_bound_polygon);

  const layerFilter = useCallback(
    ({ layer, viewport, renderPass }) => {
      const first_bit =
        (layer.id.startsWith("main") && viewport.id === "main") ||
        (layer.id.startsWith("mini") && viewport.id === "minimap") ||
        (layer.id.startsWith("fillin") &&
          viewport.id === "main" &&
          isCurrentlyOutsideBounds) ||
        (layer.id.startsWith("browser-loaded") &&
          viewport.id === "browser-main") ||
        (layer.id.startsWith("browser-fillin") &&
          viewport.id === "browser-main" &&
          isCurrentlyOutsideBounds);

      return first_bit;
    },
    [isCurrentlyOutsideBounds]
  );

  const processedLayers = layers
    .filter((x) => x !== null)
    .map((layer) => {
      if (layer.layerType === "ScatterplotLayer") {
        return new ScatterplotLayer(layer);
      }
      if (layer.layerType === "LineLayer") {
        return new LineLayer(layer);
      }
      if (layer.layerType === "PolygonLayer") {
        return new PolygonLayer(layer);
      }
      if (layer.layerType === "TextLayer") {
        return new TextLayer(layer);
      }
      if (layer.layerType === "SolidPolygonLayer") {
        return new SolidPolygonLayer(layer);
      }
      console.log("could not map layer spec for ", layer);
    });

  const { triggerSVGdownload } = getSVGfunction(
    layers.filter((x) => x !== null),
    viewState
  );

  return { layers: processedLayers, layerFilter, keyStuff, triggerSVGdownload };
};

export default useLayers;
