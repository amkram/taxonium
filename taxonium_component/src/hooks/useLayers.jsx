import {
  LineLayer,
  ScatterplotLayer,
  PolygonLayer,
  TextLayer,
} from "@deck.gl/layers";

import { useMemo, useCallback } from "react";
import useTreenomeLayers from "./useTreenomeLayers";

const getKeyStuff = (getNodeColorField, colorByField, dataset, toRGB, selectedDetails) => {
  const counts = {};
  const output = [];

  if (colorByField === "meta_uncertainty") {
    output.push({ value: "Possible placements (selected node)", count: 1, color: [0, 255, 0] });
    output.push({ value: "Ambiguous node", count: dataset.nodes.filter((x) => x.meta_uncertainty.length).length, color: [95, 158, 245]});
  } else {
    for (const node of dataset.nodes) {
      const value = getNodeColorField(node, dataset);
      if (value in counts) {
        counts[value]++;
      } else {
        counts[value] = 1;
      }
    }
    const keys = Object.keys(counts);
    for (const key of keys) {
      output.push({ value: key, count: counts[key], color: toRGB(key) });
    }
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
}) => {
  const lineColor = [150, 150, 150];
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
    return getKeyStuff(getNodeColorField, colorByField, detailed_data, toRGB, selectedDetails);
  }, [detailed_data, getNodeColorField, colorByField, toRGB, selectedDetails]);

  const findLCA = useCallback((nodes) => {
    if (nodes.length === 0) {
      return null;
    }
    const findPathToRoot = (node) => {
      const pathToRoot = [];
      let current = node;
  
      while (current.parent_id != current.node_id) {
        pathToRoot.push(current);
        current = data.data.nodeLookup[current.parent_id];
      }
      pathToRoot.push(current)
  
      return pathToRoot;
    };
  
    const paths = {};
    for (const node of nodes) {
      paths[node.node_id] = findPathToRoot(node);
    }
  
    let lca = null;
    for (const node of nodes) {
      const pathToRoot = paths[node.node_id];
  
      for (const pathNode of pathToRoot) {
        if (Object.values(paths).every((k) => k.includes(pathNode))) {
          lca = pathNode;
          break;
        }
      }
      if (lca) {
        break;
      }
    }
  
    return lca;
  }, [data.data]);
  
  const getNodePathsToLCA = useCallback((nodeNames) => {
    if (!data.data.nodeLookup) {
      return {};
    }
    const nodes = data.data.nodes.filter((x) => nodeNames.includes(x.name));
    const lca = findLCA(nodes);
  
    if (!lca) {
      return {};
    }
  
    const pathsToLCA = {};
  
    for (const node of nodes) {
      let pathToLCA = [];
      let current = node;

      while (current !== lca) {
        pathToLCA.push(current.node_id);
        current = data.data.nodeLookup[current.parent_id];;
      }
      pathToLCA.push(current.node_id);
      pathsToLCA[node.node_id] = pathToLCA
    }
    return [pathsToLCA, lca];
  }, [data.data, findLCA]);

  const uncertaintyDict = useMemo(() => {
    
    if (!(selectedDetails && selectedDetails.nodeDetails && selectedDetails.nodeDetails.meta_uncertainty)) {
      return {};
    }
    
    const d = {};
    const nodeNames = selectedDetails.nodeDetails.meta_uncertainty.length ? [selectedDetails.nodeDetails.name, ...selectedDetails.nodeDetails.meta_uncertainty.split(',').map((x) => x.split(':')[0])] : [];
    const probs = selectedDetails.nodeDetails.meta_uncertainty.split(',').map((x) => parseFloat(x.split(':')[1]));
    probs.unshift(1 - probs.reduce((a,b) => a + b));
    const [paths, lca] = getNodePathsToLCA(nodeNames);
    let i = 0;
    for (const path of Object.values(paths)) {
      for (const node_id of path) {
        const node = data.data.nodeLookup[node_id];
        if(nodeNames.includes(node.name)) {
          d[node_id] = parseFloat(probs[i]);
        } else {
          d[node_id] = null;
        }
      }
      i++;
    }
    d['lca'] = lca;
    return d;
    
  }, [selectedDetails.nodeDetails, data.data, getNodePathsToLCA]);


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
    [-1000, -1000],
    [1000, -1000],
    [10000, 10000],
    [-1000, 10000],
    [-1000, -1000],
  ];
  const inner_bounds = [
    [viewState.min_x, viewState.min_y < -1000 ? -1000 : viewState.min_y],
    [viewState.max_x, viewState.min_y < -1000 ? -1000 : viewState.min_y],
    [viewState.max_x, viewState.max_y > 10000 ? 10000 : viewState.max_y],
    [viewState.min_x, viewState.max_y > 10000 ? 10000 : viewState.max_y],
  ];

  const bound_contour = [[outer_bounds, inner_bounds]];

  const scatter_layer_common_props = {
    getPosition: (d) => [getX(d), d.y],
    getFillColor: (d) => colorByField === "meta_uncertainty" && d.meta_uncertainty.length ? [95, 158, 245] : toRGB(getNodeColorField(d, detailed_data)),
    // radius in pixels
    getRadius: 3,
    getLineColor: [100, 100, 100],
    opacity: 0.6,
    stroked: data.data.nodes && data.data.nodes.length < 3000,
    lineWidthUnits: "pixels",
    lineWidthScale: 1,
    pickable: true,
    radiusUnits: "pixels",
    onHover: (info) => setHoverInfo(info),
    modelMatrix: modelMatrix,
    updateTriggers: {
      getFillColor: [detailed_data, getNodeColorField, selectedDetails, toRGB],
      getPosition: [xType],
    },
  };


  const line_layer_horiz_common_props = {
    getSourcePosition: (d) => [getX(d), d.y],
    getTargetPosition: (d) => [d.parent_x, d.y],
    getColor: lineColor,
    pickable: true,
    widthUnits: "pixels",
    getWidth: (d) => (d === (hoverInfo && hoverInfo.object))
        ? 3 : selectedDetails.nodeDetails && selectedDetails.nodeDetails.node_id === d.node_id
          ? 3.5 : 1,
    onHover: (info) => setHoverInfo(info),
    modelMatrix: modelMatrix,
    updateTriggers: {
      getSourcePosition: [detailed_data, xType],
      getTargetPosition: [detailed_data, xType],
      getWidth: [hoverInfo, selectedDetails.nodeDetails],
    },
  };

  const line_layer_vert_common_props = {
    getSourcePosition: (d) => [d.parent_x, d.y],
    getTargetPosition: (d) => [d.parent_x, d.parent_y],
    onHover: (info) => setHoverInfo(info),
    getColor: (d) => lineColor,
    pickable: true,
    widthUnits: "pixels",
    getWidth: (d) => {
      return (d === (hoverInfo && hoverInfo.object))
        ? 2 : selectedDetails.nodeDetails && selectedDetails.nodeDetails.node_id === d.node_id
          ? 2.5 : 1;
    },
    modelMatrix: modelMatrix,
    updateTriggers: {
      getSourcePosition: [detailed_data, xType],
      getTargetPosition: [detailed_data, xType],
      getWidth: [hoverInfo, selectedDetails.nodeDetails],
    },
  };

  const uncertainty_line_layer_vert_common_props = {
    getSourcePosition: (d) => [d.parent_x, d.y],
    getTargetPosition: (d) => [d.parent_x, d.parent_y],
    onHover: (info) => setHoverInfo(info),
    getColor: (d) => (colorByField === "meta_uncertainty" && selectedDetails.nodeDetails && selectedDetails.nodeDetails.meta_uncertainty
    && (d.node_id in uncertaintyDict && !(d === uncertaintyDict.lca)))
    ? [0, 255, 0, 255] : [0, 0, 0, 0],
    pickable: true,
    widthUnits: "pixels",
    getWidth: (d) => {
      if (colorByField === "meta_uncertainty" && selectedDetails.nodeDetails && selectedDetails.nodeDetails.meta_uncertainty
        && d.node_id in uncertaintyDict) {
         return 5;
      }
      return 0;
    },
    modelMatrix: modelMatrix,
    updateTriggers: {
      getSourcePosition: [detailed_data, xType],
      getTargetPosition: [detailed_data, xType],
      getWidth: [hoverInfo, selectedDetails.nodeDetails, uncertaintyDict, colorByField],
      getColor: [selectedDetails.nodeDetails, uncertaintyDict, colorByField]
    },
  };

  const uncertainty_line_layer_horiz_common_props = {
    getSourcePosition: (d) => [getX(d), d.y],
    getTargetPosition: (d) => [d.parent_x, d.y],
    getColor: (d) => (colorByField === "meta_uncertainty" && selectedDetails.nodeDetails && selectedDetails.nodeDetails.meta_uncertainty
      && (d.node_id in uncertaintyDict && !(d === uncertaintyDict.lca)))
      ? [0, 255, 0, 255] : [0, 0, 0, 0],
    pickable: true,
    widthUnits: "pixels",
    getWidth: (d) => {
      if (colorByField === "meta_uncertainty" && selectedDetails.nodeDetails && selectedDetails.nodeDetails.meta_uncertainty
        && d.node_id in uncertaintyDict) {
        return 6;
      }
      return 6;
    },
    onHover: (info) => setHoverInfo(info),
    modelMatrix: modelMatrix,
    updateTriggers: {
      getSourcePosition: [detailed_data, xType],
      getTargetPosition: [detailed_data, xType],
      getWidth: [hoverInfo, selectedDetails.nodeDetails, uncertaintyDict, colorByField],
      getColor: [selectedDetails.nodeDetails, uncertaintyDict, colorByField]
    },
  };


  if (detailed_data.nodes) {
    const main_scatter_layer = new ScatterplotLayer({
      ...scatter_layer_common_props,
      id: "main-scatter",
      data: detailed_scatter_data,
    });

    const fillin_scatter_layer = new ScatterplotLayer({
      ...scatter_layer_common_props,
      id: "fillin-scatter",
      data: minimap_scatter_data,
      getFillColor: (d) => toRGB(getNodeColorField(d, base_data)),
    });

    const main_line_layer = new LineLayer({
      ...line_layer_horiz_common_props,
      id: "main-line-horiz",
      data: detailed_data.nodes,
    });

    const main_line_layer2 = new LineLayer({
      ...line_layer_vert_common_props,
      id: "main-line-vert",
      data: detailed_data.nodes,
    });

    const unc_line_layer_horiz = new LineLayer({
      ...uncertainty_line_layer_horiz_common_props,
      id: "main-unc-line-horiz",
      data: detailed_data.nodes,
    });
    const unc_line_layer_vert = new LineLayer({
      ...uncertainty_line_layer_vert_common_props,
      id: "main-unc-line-vert",
      data: detailed_data.nodes,
    });

    const fillin_line_layer = new LineLayer({
      ...line_layer_horiz_common_props,
      id: "fillin-line-horiz",
      data: base_data.nodes,
    });

    const fillin_line_layer2 = new LineLayer({
      ...line_layer_vert_common_props,
      id: "fillin-line-vert",
      data: base_data.nodes,
    });

    const selectedLayer = new ScatterplotLayer({
      data: selectedDetails.nodeDetails ? [selectedDetails.nodeDetails] : [],
      visible: true,
      opacity: 1,
      getRadius: 6,
      radiusUnits: "pixels",

      id: "main-selected",
      filled: false,
      stroked: true,
      modelMatrix,

      getLineColor: [255, 0, 0],
      getPosition: (d) => {
        return [d[xType], d.y];
      },
      lineWidthUnits: "pixels",
      lineWidthScale: 2,
    });

    const hoveredLayer = new ScatterplotLayer({
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
    });

    const clade_label_layer = new TextLayer({
      id: "main-clade-node",
      getPixelOffset: [-5, -6],
      data: clade_data,
      getPosition: (d) => [getX(d), d.y],
      getText: (d) => d.clades[clade_accessor],

      getColor: [100, 100, 100],
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
    });

    layers.push(
      main_line_layer,
      main_line_layer2,
      fillin_line_layer,
      fillin_line_layer2,
      main_scatter_layer,
      fillin_scatter_layer,
      clade_label_layer,
      selectedLayer,
      hoveredLayer,
      unc_line_layer_horiz,
      unc_line_layer_vert
    );
  }

  const proportionalToNodesOnScreen = config.num_tips / 2 ** viewState.zoom;

  // If leaves are fewer than max_text_number, add a text layer
  if (
    data.data.nodes &&
    proportionalToNodesOnScreen <
    0.8 * 10 ** settings.thresholdForDisplayingText
  ) {
    const node_label_layer = new TextLayer({
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

      getColor: [180, 180, 180],
      getAngle: 0,

      billboard: true,
      getTextAnchor: "start",
      getAlignmentBaseline: "center",
      getSize: data.data.nodes.length < 200 ? 12 : 9.5,
      modelMatrix: modelMatrix,
      getPixelOffset: [10, 0],
    });

    layers.push(node_label_layer);
  }

  const minimap_scatter = new ScatterplotLayer({
    id: "minimap-scatter",
    data: minimap_scatter_data,
    getPolygonOffset: ({ layerIndex }) => [0, -4000],
    getPosition: (d) => [getX(d), d.y],
    getFillColor: (d) => toRGB(getNodeColorField(d, base_data)),
    getRadius: 2,
    getLineColor: [100, 100, 100],

    opacity: 0.6,
    radiusUnits: "pixels",
    onHover: (info) => setHoverInfo(info),
    updateTriggers: {
      getFillColor: [base_data, getNodeColorField, selectedDetails],
      getPosition: [minimap_scatter_data, xType],
    },
  });

  const minimap_line_horiz = new LineLayer({
    id: "minimap-line-horiz",
    getPolygonOffset: ({ layerIndex }) => [0, -4000],
    data: base_data.nodes,
    getSourcePosition: (d) => [getX(d), d.y],
    getTargetPosition: (d) => [d.parent_x, d.y],
    getColor: lineColor,

    updateTriggers: {
      getSourcePosition: [base_data, xType],
      getTargetPosition: [base_data, xType],
    },
  });

  const minimap_line_vert = new LineLayer({
    id: "minimap-line-vert",
    getPolygonOffset: ({ layerIndex }) => [0, -4000],
    data: base_data.nodes,
    getSourcePosition: (d) => [d.parent_x, d.y],
    getTargetPosition: (d) => [d.parent_x, d.parent_y],
    getColor: lineColor,

    updateTriggers: {
      getSourcePosition: [base_data, xType],
      getTargetPosition: [base_data, xType],
    },
  });

  const minimap_polygon_background = new PolygonLayer({
    id: "minimap-bound-background",
    data: [outer_bounds],
    getPolygon: (d) => d,
    pickable: true,
    stroked: true,
    opacity: 0.3,
    filled: true,
    getPolygonOffset: ({ layerIndex }) => [0, -2000],

    getFillColor: (d) => [255, 255, 255],
  });

  const minimap_bound_polygon = new PolygonLayer({
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
  });

  const { searchSpec, searchResults, searchesEnabled } = search;

  const search_layers = searchSpec.map((spec, i) => {
    const data = searchResults[spec.key]
      ? searchResults[spec.key].result.data
      : [];

    const lineColor = search.getLineColor(i);

    return new ScatterplotLayer({
      data: data,
      id: "main-search-scatter-" + spec.key,
      getPosition: (d) => [d[xType], d.y],
      getLineColor: lineColor,
      getRadius: 5 + 2 * i,
      radiusUnits: "pixels",
      lineWidthUnits: "pixels",
      stroked: true,
      visible: searchesEnabled[spec.key],
      wireframe: true,
      getLineWidth: 1,
      filled: true,
      getFillColor: [255, 0, 0, 0],
      modelMatrix: modelMatrix,
      updateTriggers: {
        getPosition: [xType],
      },
    });
  });

  const search_mini_layers = searchSpec.map((spec, i) => {
    const data = searchResults[spec.key]
      ? searchResults[spec.key].overview
      : [];
    const lineColor = search.getLineColor(i);

    return new ScatterplotLayer({
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
    });
  });


  const uncertaintyCircleData = useMemo(() => {
    if (!(data.data && data.data.nodeLookup)) {
      return [];
    }
    const circleData = [];
    let node;
    for (const key of Object.keys(uncertaintyDict)) {
      node = data.data.nodeLookup[key];
      if (!node) {
        continue;
      }
      console.log("lookup", node)
      if (uncertaintyDict[node.node_id]) {
        console.log("in the")
        const normProb = uncertaintyDict[node.node_id];
        circleData.push({
          ...node,
          r: Math.max(6, normProb*20),
        })
      }
    }
    return circleData;
  }, [data.data, getX, selectedDetails, uncertaintyDict])

  const extra_circled_nodes = uncertaintyCircleData;
  // circle specified nodes separately from search (e.g. for uncertainty metadata)
  const numSearches = searchSpec.length;
  const extra_circled_nodes_layer = new ScatterplotLayer({
    data: colorByField === "meta_uncertainty" ? extra_circled_nodes : [],
    id: "main-extra-scatter",
    getPosition: (d) => [getX(d), d.y],
    getLineColor: [0,0,0],
    getRadius: (d) => {
      return d.r;
    },
    radiusUnits: "pixels",
    lineWidthUnits: "pixels",
    stroked: true,
    getLineWidth: 1,
    filled: true,
    opacity: .1,
    modelMatrix,
    lineWidthScale: 2,
    getFillColor: [0, 255, 0],
    updateTriggers: {
      getPosition: [xType],
      getLineColor: numSearches,
      getRadius: uncertaintyDict
    }
  });

  layers.push(...search_layers, search_mini_layers, extra_circled_nodes_layer);

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

  return { layers, layerFilter, keyStuff };
};

export default useLayers;
