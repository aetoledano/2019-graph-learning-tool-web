var
    //sigma stuff
    nodecount = -1,
    edgecount = -1,
    nodeRadius = 10,
    arrowSize = 2,

    nodeColor = '#74b9ff',
    nodeSelectedColor = '#0984e3',

    edgeColor = '#b2bec3',
    edgeHoverColor = '#636e72',

    dragListener,

    s, dom, cam, config, localIsDragging = false, forceAtlasActive = false,

    //if set to true prevent window.onBeforeUnload dialog
    imNotLeaving = false,

    //algorithms stuff
    bgraph;

//CONTROL VARIABLES
//operations stack
var ops = [];

//INITIALIZATION FUNCTIONS

//function to create a new sigma instance

function newSigmaInstance(g, c, adjustCamera, usedRandomGenerator) {
    if (!usedRandomGenerator)
        newBGraph(g, undefined);
    //console.log(bgraph);

    if (s) {
        s.graph.clear();
    }
    //MAIN COMPONENT INSTANCE
    if (!dom) {
        dom = document.getElementById('graph-container')
        dom.addEventListener('contextmenu', function (e) {
            e.preventDefault();
        });
    }

    //SIGMA OPTIONS
    if (!config) {
        config = {
            container: 'graph-container',
            settings: {
                autoRescale: false,
                defaultNodeColor: nodeColor,
                minNodeSize: nodeRadius,

                enableEdgeHovering: true,
                edgeHoverColor: edgeHoverColor,
                defaultEdgeHoverColor: edgeHoverColor,
                edgeLabelSize: 'proportional'
            },
            renderers: [{
                container: dom,
                type: 'canvas'
            }]
        };
    }
    if (g) {
        config.graph = g;
        nodecount = g.nodes.length;
        edgecount = g.edges.length;
    }

    //MAIN SIGMA INSTANCE
    if (!s) {
        s = new sigma(config);
        attachSigmaEvents(s);
    } else {
        if (g) {
            s.graph.read(g);

            s.refresh();
        }
    }

    //MAIN CAMERA INSTANCE
    if (!cam) {
        cam = s.camera;
    }
    //INITIALIZE CAMERA
    if (c) {
        cam.goTo({x: c.x, y: c.y, angle: c.angle, ratio: c.ratio});
        s.refresh();
    } else {
        if (adjustCamera === true)
            cam.goTo({x: 0, y: 0, angle: 0, ratio: 1});
    }
}

//function to generate a new background graph
//receives as argument a user generated graph
//or an indication to use the sigma graph instance
//if none then a clean instance of the selected
// type of graph is returned

function newBGraph(usergraph, useSigmaGraph) {
    directedGraph = document.getElementById("directed_graph_mode").checked;
    isWeightedGraph = document.getElementById("weighted_graph_mode").checked;

    let t;
    if (directedGraph) {
        t = new DirectedGraph();
    } else {
        t = new UndirectedGraph();
    }

    if (usergraph && !useSigmaGraph) {
        g = usergraph;
        for (let i = 0, len = g.nodes.length; i < len; i++) {
            t.addNode(g.nodes[i].id);
        }
        for (let i = 0, len = g.edges.length; i < len; i++) {
            t.addEdge(g.edges[i].source, g.edges[i].target, isWeightedGraph ? Number(g.edges[i].label) : 0);
        }
    }

    if (useSigmaGraph === true) {
        nodes = s.graph.nodes();
        for (let i = 0, len = nodes.length; i < len; i++) {
            t.addNode(nodes[i].id);
        }
        edges = s.graph.edges();
        for (let i = 0, len = edges.length; i < len; i++) {
            val = bgraph.getEdgeVal(edges[i].source, edges[i].target);
            t.addEdge(edges[i].source, edges[i].target, val ? val : 0);
        }
    }

    bgraph = t;
}

//END INITIALIZATION FUNCTIONS

//EVTs backing functions
function newNode(e) {
    p = cam.cameraPosition(e.x, e.y);

    nid = (id = 'n' + (++nodecount));

    s.graph.addNode({
        id: nid,
        x: p.x,
        y: p.y,
        dX: 0,
        dY: 0,
        size: nodeRadius,
        label: 'Node ' + nodecount
    });
    bgraph.addNode(nid);
    //console.log(bgraph);

    s.refresh();
}

function onClickNode(node) {
    src = ops.pop();
    if (src === undefined) {
        ops.push(node);
        node.color = nodeSelectedColor;

        s.refresh();
    } else {
        src.color = nodeColor;

        if (bgraph.isEdge(src.id, node.id))
            showError("Can't add edge, it already exists.", function () {
                s.refresh();
            });
        else if (document.getElementById("weighted_graph_mode").checked)
            bootbox.prompt({
                size: "small",
                backdrop: false,
                animate: true,
                value: 'Number',
                inputType: 'number',
                min: 1,
                title: "Please enter edge value",
                callback: function (result) {
                    if (result) {
                        s.graph.addEdge({
                            id: (id = 'e' + (++edgecount)),
                            source: src.id,
                            target: node.id,
                            type: getArrowType(),
                            size: arrowSize,
                            color: edgeColor,
                            label: result + ""
                        });
                        bgraph.addEdge(src.id, node.id, result);
                        //console.log(bgraph);
                    }
                    s.refresh();
                }
            }); else {
            s.graph.addEdge({
                id: (id = 'e' + (++edgecount)),
                source: src.id,
                target: node.id,
                type: getArrowType(),
                size: arrowSize,
                color: edgeColor,
                label: ""
            });
            bgraph.addEdge(src.id, node.id, 1);
            s.refresh();
        }
    }

}

function onRightClickNode(node) {
    s.graph.dropNode(node.id);

    bgraph.rmNode(node.id);
    s.refresh();
}

function onRightClickEdge(edge) {
    s.graph.dropEdge(edge.id);

    bgraph.rmEdge(edge.source, edge.target);
    //console.log(bgraph);

    s.refresh();
}

function onDoubleCLickEdge(edge) {
    if (document.getElementById("weighted_graph_mode").checked) {
        bootbox.prompt({
            size: "small",
            backdrop: false,
            animate: true,
            value: 'Number',
            inputType: 'number',
            min: 1,
            title: "Please enter edge value",
            callback: function (result) {
                if (result) {
                    edge.label = result + "";
                    bgraph.setEdgeVal(edge.source, edge.target, result);
                    //console.log(bgraph);
                }
                s.refresh();
            }
        });
    } else {
        bgraph.setEdgeVal(edge.source, edge.target, 1);
    }
}

//GRAPH TOOLS FUNCTIONALITIEs
function updateEdgesLabels() {

    if (AlgorithmProxy.isRunnerActive()) return;

    isWeightedGraph = document.getElementById("weighted_graph_mode").checked;
    edges = s.graph.edges();
    n = edges.length;
    for (i = 0; i < n; i++) {
        edges[i].label = isWeightedGraph ? bgraph.getEdgeVal(edges[i].source, edges[i].target) + "" : "";
    }
    s.refresh();
}

function updateEdgesKind() {

    if (AlgorithmProxy.isRunnerActive()) return;

    arrowType = getArrowType();
    edges = s.graph.edges();
    n = edges.length;
    for (i = 0; i < n; i++) {
        edges[i].type = arrowType;
    }
    s.refresh();
}

function updateGraphType() {

    if (AlgorithmProxy.isRunnerActive()) return;

    directedGraph = document.getElementById("directed_graph_mode").checked;

    updateEdgesKind();

    newBGraph(undefined, true);

    //console.log(bgraph);
}

// Generate a random graph
function generateRandomGraph(n) {

    if (AlgorithmProxy.isRunnerActive()) return;

    if (!n)
        n = 10;
    else if (n > 30) n = 30;

    $('#generator_nodes_amt').val(n);

    if (document.getElementById("directed_graph_mode").checked) {
        bgraph = new DirectedGraph();
    } else {
        bgraph = new UndirectedGraph();
    }

    var i,
        g = {
            nodes: [],
            edges: []
        };

    nodecount = n;
    for (i = 0; i < nodecount; i++) {
        let nid = 'n' + i;
        g.nodes.push({
            id: nid,
            x: Math.random() * 400,
            y: Math.random() * 300,
            size: nodeRadius,
            label: 'Node ' + i
        });
        bgraph.addNode(nid);
    }

    edgecount = 0;
    arrowType = getArrowType();
    isWeightedGraph = document.getElementById("weighted_graph_mode").checked;
    //to do generate random value and display it if isweightedgraph
    for (i = 0; i < nodecount; i++) {
        if (Math.random() > 0.5)
            for (j = 0; j < nodecount; j++) {
                if (Math.random() > 0.5 && i !== j) {
                    let src = 'n' + i;
                    let dst = 'n' + j;
                    if (!bgraph.isEdge(src, dst)) {
                        let value = (Math.floor(Math.random() * 100) + 1);
                        g.edges.push({
                            id: 'e' + edgecount++,
                            source: src,
                            target: dst,
                            type: arrowType,
                            size: arrowSize,
                            color: edgeColor,
                            label: isWeightedGraph ? value + "" : ""
                        });
                        bgraph.addEdge(src, dst, value);
                    }
                }
            }
    }

    newSigmaInstance(g, undefined, false, true);
}

function runForceAtlas2() {

    if (AlgorithmProxy.isRunnerActive()) return;

    if (!forceAtlasActive) {
        s.startForceAtlas2({slowDown: 10});
        s.refresh();
    } else
        s.stopForceAtlas2();
    forceAtlasActive = !forceAtlasActive;
}

function nodeDegreeToSize() {

    if (AlgorithmProxy.isRunnerActive()) return;

    sigma.plugins.relativeSize(s, 5);
}

function startNoverlapLayout() {
    if (AlgorithmProxy.isRunnerActive()) return;

    // Configure the noverlap layout:
    var noverlapListener = s.configNoverlap({
        nodeMargin: 0.1,
        scaleNodes: 1.05,
        gridSize: 75,
        easing: 'quadraticInOut', // animation transition function
        duration: 10000   // animation duration. Long here for the purposes of this example only
    });
    // Bind the events:
    noverlapListener.bind('start stop interpolate', function (e) {
        //console.log(e.type);
        if (e.type === 'start') {
            console.time('noverlap');
        }
        if (e.type === 'interpolate') {
            console.timeEnd('noverlap');
        }
    });
    // Start the layout:
    s.startNoverlap();
}

//BUSINESS FUNCTIONS
function save_wrapper(uuid) {
    if (AlgorithmProxy.isRunnerActive()) return;

    if (uuid && uuid !== 'null') {
        pname = $('#hiddenProjectName').val().trim();
        save(uuid, pname);
    } else {
        if (s.graph.nodes().length > 0)
            $('#project_name_modal').modal('show');
        else {
            msg = 'The graph is empty, <b>nothing</b> to be saved.';
            showError(msg, null);
        }
    }
}

function save(uuid, pname) {
    //set the uri if this is not a new project
    url = "/project";
    if (uuid) url += '/' + uuid;

    var div = document.getElementById("saveFormDiv");

    var form = document.createElement('form');
    form.setAttribute('action', url);
    form.setAttribute('method', 'POST');

    var _name = document.createElement('input');
    _name.setAttribute('type', 'hidden');
    _name.setAttribute('name', 'name');
    _name.setAttribute('value', pname);

    var _graph = document.createElement('input');
    _graph.setAttribute('type', 'hidden');
    _graph.setAttribute('name', 'graph');
    _graph.setAttribute('value', JSON.stringify({
            nodes: s.graph.nodes(),
            edges: s.graph.edges()
        })
    );

    var _cam = document.createElement('input');
    _cam.setAttribute('type', 'hidden');
    _cam.setAttribute('name', 'cam');
    _cam.setAttribute('value', JSON.stringify({
            x: cam.x,
            y: cam.y,
            angle: cam.angle,
            ratio: cam.ratio
        })
    );

    var _state = document.createElement('input');
    _state.setAttribute('type', 'hidden');
    _state.setAttribute('name', 'state');
    _state.setAttribute('value', JSON.stringify({
            curved_arrows_mode: document.getElementById("curved_arrows_mode").checked,
            directed_graph_mode: document.getElementById("directed_graph_mode").checked,
            weighted_graph_mode: document.getElementById("weighted_graph_mode").checked
        })
    );

    form.appendChild(_name);
    form.appendChild(_graph);
    form.appendChild(_cam);
    form.appendChild(_state);

    div.appendChild(form);

    imNotLeaving = true;
    form.submit();
}

function snapshot_(pname) {
    if (!pname || pname == 'null') pname = 'untitled.png';

    data = s.renderers[0].snapshot({format: 'png', background: 'white', filename: pname, labels: true});

    download(data, pname, "image/png")
}

function export_(pname) {
    if (!pname || pname == 'null') pname = 'untitled.svg';
    ext = ".svg";
    if (!pname.endsWith(ext)) {
        pname += ext;
    }

    params = {
        labels: true,
        classes: true,
        data: true,
        filename: pname
    };

    download(s.toSVG(params), pname, "image/svg");
}

function loadExternalFile(form, type) {
    if (AlgorithmProxy.isRunnerActive()) return;

    var formData = new FormData(form);
    fetch('/project/externalfile', {
        method: 'POST',
        body: formData
    }).then(response => {
        return response.blob();
    }).then(blobdata => {
        refresh_sigma = function () {
            sigma.plugins.relativeSize(s, nodeRadius - 2);
            s.refresh();
        };
        try {
            if (type === "json")
                sigma.parsers.json(window.URL.createObjectURL(blobdata), s, refresh_sigma);
            if (type === "gexf")
                sigma.parsers.gexf(window.URL.createObjectURL(blobdata), s, refresh_sigma);
        } catch (e) {
            //console.log(e);
            showError("The file does not appear to be valid.", undefined);
        }
    }).catch(error => {
        console.error('Error:', error)
    });
}

function clean_workspace() {
    if (AlgorithmProxy.isRunnerActive()) return;

    newBGraph(undefined, undefined);
    //console.log(bgraph);
    s.graph.clear();
    s.refresh();
}

//END BUSINESS FUNCTIONS

//EVTS MANAGEMENT
function attachSigmaEvents(s) {

    //bind click on canvas
    s.bind('clickStage', function (e) {
        if (AlgorithmProxy.isRunnerActive()) {
            AlgorithmProxy.dispatchEvt(e);
            return;
        }
        if (e.data.captor.isDragging === false)
            newNode(e.data.captor);
    });
    s.bind('clickNode', function (e) {
        if (localIsDragging === true) {
            localIsDragging = false;
            return;
        }
        if (AlgorithmProxy.isRunnerActive()) {
            AlgorithmProxy.dispatchEvt(e);
            return;
        }
        onClickNode(e.data.node);
    });
    s.bind('rightClickNode', function (e) {
        if (AlgorithmProxy.isRunnerActive()) {
            AlgorithmProxy.dispatchEvt(e);
            return;
        }
        onRightClickNode(e.data.node);
    });
    s.bind('rightClickEdge', function (e) {
        if (AlgorithmProxy.isRunnerActive()) {
            AlgorithmProxy.dispatchEvt(e);
            return;
        }
        onRightClickEdge(e.data.edge);
    });
    s.bind('doubleClickEdge', function (e) {
        if (AlgorithmProxy.isRunnerActive()) {
            AlgorithmProxy.dispatchEvt(e);
            return;
        }
        onDoubleCLickEdge(e.data.edge);
    });

    //DRAG NODE EVTS
    // Initialize the dragNodes plugin:
    dragListener = sigma.plugins.dragNodes(s, s.renderers[0]);

    dragListener.bind('startdrag', function (e) {
        //console.log("startdrag");
    });
    dragListener.bind('drag', function (e) {
        localIsDragging = true;
        if (AlgorithmProxy.isRunnerActive()) {
            AlgorithmProxy.dispatchEvt(e);
            return;
        }
        //console.log("drag");
    });
    dragListener.bind('drop', function (e) {
        //console.log("drop");
    });
    dragListener.bind('dragend', function (e) {
        //console.log("stopdrag");
    });
    //END

    s.bind('overNode outNode doubleClickNode', function (e) {
        ////console.log(e.type, e.data.node.label, e.data.captor);
    });
    s.bind('overEdge outEdge clickEdge doubleClickEdge', function (e) {
        ////console.log(e.type, e.data.edge, e.data.captor);
    });
    s.bind('doubleClickStage rightClickStage', function (e) {
        ////console.log(e.type, e.data.captor);
    });
}

//prevent the user from leaving the page
window.onbeforeunload = function () {
    if (imNotLeaving)
        imNotLeaving = false;
    else
        return "";
};
//END EVTS MANAGEMENT

//UTILS
function getArrowType() {

    if (AlgorithmProxy.isRunnerActive()) return;

    curvedArrow = document.getElementById("curved_arrows_mode").checked;
    directedGraph = document.getElementById("directed_graph_mode").checked;

    if (curvedArrow && directedGraph) return 'curvedArrow';
    if (curvedArrow && !directedGraph) return 'curve';
    if (!curvedArrow && directedGraph) return 'arrow';
    if (!curvedArrow && !directedGraph) return 'line';
}

function showError(msg, callback) {
    if (!callback)
        callback = function () {
        };
    bootbox.alert({
        message: '<p class="text-danger">' + msg + '</p>',
        onEscape: true,
        backdrop: false,
        callback: callback,
        buttons: {
            ok: {
                label: '<i class="fas fa-check-circle"></i> Ok',
                className: 'btn-primary'
            }
        }
    });
}

function setGraphOptions(value) {
    document.getElementById("curved_arrows_mode").checked = value;
    document.getElementById("directed_graph_mode").check = value;
    document.getElementById("weighted_graph_mode").checked = value;
}

//END UTILS

//PAINTER
//this class will be used by the algorithm runner
//so every algorithm has clean access to the drawing system
//but leveraging the details to this painter

class Painter {

    constructor() {
        this.highlightedNodeColor = "#e17055";
        this.highlightedEdgeColor = "#fdcb6e";
        this.paintedNodeColor = "#d63031";
        this.paintedEdgeColor = "#ff7675";

        this.lastHighlightedNodeId = undefined;
        this.lastHighlightedEdge = undefined;
        this.directedGraph = false;
    }

    paint(whatever, color) {
        whatever.color = color;
        s.refresh();
    }

    //nodes
    highlightNode(nid) {
        if (this.lastHighlightedNode) {
            this.restoreNode(this.lastHighlightedNodeId);
        }
        this.lastHighlightedNodeId = nid;
        this.paint(s.graph.nodes(nid), this.highlightedNodeColor);
    };

    paintNode(nid) {
        this.paint(s.graph.nodes(nid), this.paintedNodeColor);
    };

    restoreNode(nid) {
        this.paint(s.graph.nodes(nid), nodeColor);
        this.lastHighlightedNodeId = undefined;
    };

    //edges

    highlightEdge(eid, src, dst) {
        if (this.lastHighlightedEdge) {
            this.restoreEdge(this.lastHighlightedEdge.id);
        }
        this.paint(this.lastHighlightedEdge = this.getEdge(eid, src, dst), this.highlightedEdgeColor);
    };

    paintEdge(eid, src, dst) {
        if (this.lastHighlightedEdge) {
            this.restoreEdge(this.lastHighlightedEdge.id);
        }
        this.paint(this.getEdge(eid, src, dst), this.paintedEdgeColor);
    };

    restoreEdge(eid, src, dst) {
        this.paint(this.getEdge(eid, src, dst), edgeColor);
        this.lastHighlightedEdge = undefined;
    };


    findEdgeId(src, dst) {
        let edges = s.graph.edges();
        if (directedGraph) {
            for (let i = 0, len = edges.length; i < len; i++)
                if (edges[i].source === src && edges[i].target === dst)
                    return edges[i].id;
        } else {
            for (let i = 0, len = edges.length; i < len; i++)
                if (edges[i].source === src && edges[i].target === dst)
                    return edges[i].id;

            for (let i = 0, len = edges.length; i < len; i++)
                if (edges[i].source === dst && edges[i].target === src)
                    return edges[i].id;
        }
    }

    getEdge(eid, src, dst) {
        if (!eid) {
            let edges = s.graph.edges();
            if (directedGraph) {
                for (let i = 0, len = edges.length; i < len; i++)
                    if (edges[i].source === src && edges[i].target === dst)
                        return edges[i];
            } else {
                for (let i = 0, len = edges.length; i < len; i++)
                    if (edges[i].source === src && edges[i].target === dst)
                        return edges[i];

                for (let i = 0, len = edges.length; i < len; i++)
                    if (edges[i].source === dst && edges[i].target === src)
                        return edges[i];
            }
        } else {
            return s.graph.edges(eid);
        }
    }

    //all of them
    restoreAll() {
        let nodes = s.graph.nodes();
        for (let i = 0, len = nodes.length; i < len; i++) {
            nodes[i].color = nodeColor;
        }
        let edges = s.graph.edges();
        for (let i = 0, len = edges.length; i < len; i++) {
            edges[i].color = edgeColor;
        }
        s.refresh();
    };

}

var painter = new Painter();