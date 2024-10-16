// scripts.js

// Initialize Data Structures
let nodes = [];
let links = [];

// Define Categories with Directions
const categories = {
    "Genre": { direction: "top" },
    "Species": { direction: "bottom" },
    "Genos": { direction: "left" },
    "Telos": { direction: "right" }
};

// Initialize SVG and D3 Simulation
const svg = d3.select("#graph");
const width = parseInt(svg.style("width"));
const height = parseInt(svg.style("height"));

const simulation = d3.forceSimulation(nodes)
    .force("link", d3.forceLink(links).id(d => d.id).distance(100))
    .force("charge", d3.forceManyBody().strength(-300))
    .force("center", d3.forceCenter(width / 2, height / 2))
    .force("collision", d3.forceCollide().radius(d => getNodeRadius(d) + 20));

// Add Zoom Behavior
const zoom = d3.zoom()
    .scaleExtent([0.5, 2])
    .on("zoom", (event) => {
        g.attr("transform", event.transform);
    });

svg.call(zoom);

// Group for Graph Elements
const g = svg.append("g");

// Define Arrowheads for Links
svg.append('defs').append('marker')
    .attr('id', 'arrowhead')
    .attr('viewBox', '-0 -5 10 10')
    .attr('refX', 25)
    .attr('refY', 0)
    .attr('orient', 'auto')
    .attr('markerWidth', 6)
    .attr('markerHeight', 6)
    .attr('xoverflow', 'visible')
    .append('svg:path')
    .attr('d', 'M 0,-5 L 10 ,0 L 0,5')
    .attr('fill', '#999')
    .style('stroke','none');

// Tooltip
const tooltip = d3.select(".tooltip");

// DOM Elements
const setTopicBtn = document.getElementById("set-topic");
const topicInput = document.getElementById("topic-input");
const categoriesDiv = document.getElementById("categories");
const categoryForm = document.getElementById("category-form");

// Event Listener to Set Central Topic
setTopicBtn.addEventListener("click", () => {
    const topic = topicInput.value.trim();
    if (topic === "") {
        alert("Please enter a topic.");
        return;
    }
    // Set Central Node
    setCentralNode(topic, "The main concept or topic of the graph.");
    // Show Category Forms
    categoriesDiv.classList.remove("hidden");
    // Disable Topic Input
    topicInput.disabled = true;
    setTopicBtn.disabled = true;
});

// Event Listener to Add Category Nodes
categoryForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const category = document.getElementById("category-select").value;
    const nodeName = document.getElementById("node-name").value.trim();
    const nodeDescription = document.getElementById("node-description").value.trim();

    if (category === "" || nodeName === "" || nodeDescription === "") {
        alert("Please fill in all fields.");
        return;
    }

    // Add Node and Link
    addCategoryNode(nodeName, category, nodeDescription);

    // Reset Form
    categoryForm.reset();
});

// Function to Set Central Node
function setCentralNode(name, description) {
    // Check if Central Node already exists
    let existingCentralNode = nodes.find(n => n.id === name);
    if (existingCentralNode) {
        alert("Central node already exists.");
        return;
    }

    // Create Central Node
    const centralNode = {
        id: name,
        group: "Central Node",
        description: description,
        fx: width / 2, // Fix position to center
        fy: height / 2
    };
    nodes.push(centralNode);

    // Update Graph
    updateGraph();
}

// Function to Add Category Nodes
function addCategoryNode(name, category, description) {
    // Ensure Central Node Exists
    let centralNode = nodes.find(n => n.group === "Central Node");
    if (!centralNode) {
        alert("Please set the central topic first.");
        return;
    }

    // Check if Node with the same name already exists
    if (nodes.find(n => n.id === name)) {
        alert("A node with this name already exists.");
        return;
    }

    // Create New Node
    const newNode = {
        id: name,
        group: category,
        description: description
    };
    nodes.push(newNode);

    // Create Link from Central Node
    const newLink = {
        source: centralNode.id,
        target: newNode.id,
        direction: categories[category].direction
    };
    links.push(newLink);

    // Update Graph
    updateGraph();
}

// Function to Get Node Radius Based on Group
function getNodeRadius(d) {
    if (d.group === "Central Node") return 30;
    if (d.group && categories[d.group]) return 20;
    return 10;
}

// Function to Update Graph Visualization
function updateGraph() {
    // Bind Links
    const link = g.selectAll(".link")
        .data(links, d => `${d.source}-${d.target}`);

    // Enter Links
    link.enter()
        .append("line")
        .attr("class", "link")
        .attr('marker-end','url(#arrowhead)')
        .attr("stroke", "#999")
        .attr("stroke-width", 2);

    // Remove Exiting Links
    link.exit().remove();

    // Bind Nodes
    const node = g.selectAll(".node")
        .data(nodes, d => d.id);

    // Enter Nodes
    const nodeEnter = node.enter()
        .append("g")
        .attr("class", "node")
        .call(d3.drag()
            .on("start", dragstarted)
            .on("drag", dragged)
            .on("end", dragended))
        .on("mouseover", (event, d) => {
            tooltip.transition()
                .duration(200)
                .style("opacity", .9);
            tooltip.html(`<strong>${d.id}</strong><br>${d.description}`)
                .style("left", (event.pageX + 10) + "px")
                .style("top", (event.pageY - 28) + "px");
        })
        .on("mouseout", () => {
            tooltip.transition()
                .duration(500)
                .style("opacity", 0);
        });

    nodeEnter.append("circle")
        .attr("r", d => getNodeRadius(d))
        .attr("fill", d => d.group === "Central Node" ? "#ff9800" : "#4fc3f7");

    nodeEnter.append("text")
        .attr("dy", -10)
        .attr("text-anchor", "middle")
        .text(d => d.id);

    // Remove Exiting Nodes
    node.exit().remove();

    // Merge Nodes
    const allNodes = nodeEnter.merge(node);

    // Update Simulation Nodes and Links
    simulation.nodes(nodes);
    simulation.force("link").links(links);
    simulation.alpha(1).restart();
}

// Simulation Tick
simulation.on("tick", () => {
    // Update Link Positions
    g.selectAll(".link")
        .attr("x1", d => d.source.x)
        .attr("y1", d => d.source.y)
        .attr("x2", d => d.target.x)
        .attr("y2", d => d.target.y);

    // Update Node Positions
    g.selectAll(".node")
        .attr("transform", d => `translate(${d.x},${d.y})`);
});

// Drag Functions
function dragstarted(event, d) {
    if (!event.active) simulation.alphaTarget(0.3).restart();
    d.fx = d.x;
    d.fy = d.y;
}

function dragged(event, d) {
    d.fx = event.x;
    d.fy = event.y;
}

function dragended(event, d) {
    if (!event.active) simulation.alphaTarget(0);
    d.fx = null;
    d.fy = null;
}
