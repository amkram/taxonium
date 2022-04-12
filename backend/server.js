var express = require("express");
var cors = require("cors");
var compression = require("compression");
var app = express();
var fs = require("fs");
var https = require("https");
var axios = require("axios");
var filtering = require("../taxonium_data_handling")

let options;
const { program } = require('commander');

program
  .option('--ssl', 'use ssl')
  .option('--database_dir <database_dir>', 'database directory')
  .option('--port <port>', 'port')
  .option('--config_json <config_json>', 'config json')

program.parse();

const command_options = program.opts();


app.use(cors());
app.use(compression());

app.get("/", function (req, res) {
  res.send("Hello World!");
});

app.get("/search", function (req, res) {
  const start_time = Date.now();
  console.log("/search");
  const json = req.query.json;
  const spec = JSON.parse(JSON.parse(json));
  console.log(spec);
  req.query.min_y =
    req.query.min_y !== undefined ? req.query.min_y : overallMinY();
  req.query.max_y =
    req.query.max_y !== undefined ? req.query.max_y : overallMaxY();

  const result = filtering.singleSearch({
    data,
    spec,
    min_y: req.query.min_y,
    max_y: req.query.max_y,
    y_positions,
    mutations,
    node_to_mut,
  });
  res.send(result);
  console.log(
    "Found " +
      result.data.length +
      " results in " +
      (Date.now() - start_time) +
      "ms"
  );
  console.log("Result type was " + result.type);
});

const path_for_config = command_options.config_json;

// check if path exists
let config;
if (path_for_config && fs.existsSync(path_for_config)) {
  config = JSON.parse(fs.readFileSync(path_for_config));
} else {
  config = { title: "", source: "" };
}
let initial_x = 0;
let initial_y = 0;
app.get("/config", function (req, res) {
  config.num_nodes = data.length;
  config.initial_x = initial_x;
  config.initial_y = initial_y;
  config.initial_zoom = -3;
  config.genes = genes;

  res.send(config);
});

app.get("/nodes/", function (req, res) {
  const start_time = Date.now();
  const min_x = req.query.min_x;
  const max_x = req.query.max_x;
  let min_y = req.query.min_y !== undefined ? req.query.min_y : overallMinY();
  let max_y = req.query.max_y !== undefined ? req.query.max_y : overallMaxY();
  if (min_y < overallMinY()) {
    min_y = overallMinY();
  }
  if (max_y > overallMaxY()) {
    max_y = overallMaxY();
  }
  let result;

  if (min_y === overallMinY() && max_y === overallMaxY()) {
    //disabled
    result = cached_starting_values;

    console.log("Using cached values");
  } else {
    result = filtering.getNodes(data, y_positions, min_y, max_y, min_x, max_x);

    result = filtering.addMutations(result, mutations, node_to_mut);
  }
  console.log("Ready to send after " + (Date.now() - start_time) + "ms.");
  if (result !== cached_starting_values) {
    // This will be sent as json
    res.send({ nodes: result });
    console.log(
      "Request took " +
        (Date.now() - start_time) +
        "ms, and output " +
        result.length +
        " nodes."
    );
  }
  if (result === cached_starting_values) {
    res.send(result);
    console.log(
      "Returning cached results took ",
      Date.now() - start_time + "ms."
    );
  }
});

if (command_options.ssl) {
  options = {
    key: fs.readFileSync("/etc/letsencrypt/live/api.taxonium.org/privkey.pem"),
    ca: fs.readFileSync("/etc/letsencrypt/live/api.taxonium.org/chain.pem"),
    cert: fs.readFileSync("/etc/letsencrypt/live/api.taxonium.org/fullchain.pem"),
    
  };
  https.createServer(options, app).listen(command_options.port);
  console.log("SSL on port " + command_options.port);
} else {
  app.listen(command_options.port, () => console.log(`App is listening on port ${command_options.port}`));
}

const zlib = require("zlib");

const node_to_mut_file = `${command_options.database_dir}/node_to_mut.json.gz`;
const file_contents = fs.readFileSync(node_to_mut_file);
const unzipped_file = zlib.gunzipSync(file_contents);
let node_to_mut = JSON.parse(unzipped_file);

const mutations_file = `${command_options.database_dir}/mutation_table.jsonl.gz`;
const mutations_file_contents = fs.readFileSync(mutations_file);
const unzipped_mutations_file = zlib.gunzipSync(mutations_file_contents);
const lines = unzipped_mutations_file.toString().split("\n");
let mutations = [{}]; //create with one element because of the way the data is structured
for (let i = 0; i < lines.length; i++) {
  if (lines[i] !== "") {
    mutations.push(JSON.parse(lines[i]));
  }
}
mutations.forEach((mutation) => {
  mutation.residue_pos = parseInt(mutation.residue_pos);
});

const genes = [...new Set(mutations.map((mutation) => mutation.gene))].filter(
  (x) => x !== undefined
);

console.log(genes);

const { parse } = require("@jsonlines/core");

// create a duplex stream which parse input as lines of json
const parseStream = parse();

const unzip = zlib.createGunzip();

// read from the file and pipe into the parseStream
fs.createReadStream(`${command_options.database_dir}/database.jsonl.gz`)
  .pipe(unzip)
  .pipe(parseStream);

const data = [];

let counter = 0;

let y_positions;
let cached_starting_values;
function overallMinY() {
  return data[0].y;
}

function overallMaxY() {
  return data[data.length - 1].y;
}

function overallMinX() {
  return data.reduce((min, node) => {
    if (node.x < min) {
      return node.x;
    } else {
      return min;
    }
  }, data[0].x);
}
function overallMaxX() {
  return data.reduce((max, node) => {
    if (node.x > max) {
      return node.x;
    } else {
      return max;
    }
  }, data[0].x);
}

function nthpercentilofX(n) {
  return data.map((node) => node.x).sort((a, b) => a - b)[
    Math.floor((n * data.length) / 100)
  ];
}
function whenReady() {
  const scale_x = 35;
  const scale_y = 9e7/data.length;
  data.forEach((node) => {
    node.x = node.x * scale_x;
    node.y = node.y * scale_y;
  });

  // round x and y to 5 dp
  data.forEach((node) => {
    node.x = Math.round(node.x * 100000) / 100000;
    node.y = Math.round(node.y * 100000) / 100000;
  });
  data.forEach((node) => {
    node.parent_x = data[node.parent_id].x;
    node.parent_y = data[node.parent_id].y;
  });
  y_positions = data.map((node) => node.y);
  // assert that y is sorted
  for (let i = 1; i < y_positions.length; i++) {
    if (y_positions[i] < y_positions[i - 1]) {
      console.log("y is not sorted");
      // throw an error
      throw new Error("y is not sorted");
    }
  }
  cached_starting_values = filtering.getNodes(
    data,
    y_positions,
    overallMinY(),
    overallMaxY(),
    null,
    null
  );

  cached_starting_values = filtering.addMutations(
    cached_starting_values,
    mutations,
    node_to_mut
  );

  initial_y = (overallMinY() + overallMaxY()) / 2;
  initial_x = 2000;

  cached_starting_values = JSON.stringify({ nodes: cached_starting_values });

  console.log("I AM READY");
}

// consume the parsed objects by listening to data event
parseStream.on("data", (value) => {
  data.push(value);
  counter++;
  if (counter % 100000 === 0) {
    console.log(counter);
  }
});

parseStream.on("end", whenReady);

function getParents(node) {
  console.log(node);
  if (node.parent_id === node.node_id) {
    return [];
  }
  return [node.parent_id].concat(getParents(data[node.parent_id]));
}

app.get("/parents/", function (req, res) {
  const query_id = req.query.id;
  res.send(getParents(data[query_id]));
});

app.get("/genotypes/", function (req, res) {
  const query_id = req.query.id;
});


// "Takes EPI_ISL_12345" input
function get_epi_isl_url(epi_isl) {
  if (epi_isl.length > 4) {
    return (
      "https://www.epicov.org/acknowledgement/" +
      epi_isl.slice(-4, -2) +
      "/" +
      epi_isl.slice(-2) +
      "/" +
      epi_isl +
      ".json"
    );
  }
}


app.get("/node_details/", async (req, res) =>{
  const start_time = Date.now();
  const query_id = req.query.id;
  const node = data[query_id];
  const node_mutations = node_to_mut[query_id].map((mutation) => {
    return mutations[mutation];
  });

  const detailed_node = { ...node, mutations: node_mutations };
  // If node name starts with EPI_ISL_, then get the URL
  if (detailed_node.name.startsWith("EPI_ISL_")) {
    const acknowledgements_url = get_epi_isl_url(detailed_node.name);
    // get the data from the URL
    const response = await axios.get(acknowledgements_url).catch((e) => {
      console.log(e);
    });
    try {
      const data = response.data;
      detailed_node.acknowledgements = data;
    }
    catch (e) {
      console.log(e);
    }


  }
  res.send(detailed_node);
  console.log(
    "Request took " + (Date.now() - start_time) + "ms, and output " + node
  );
});