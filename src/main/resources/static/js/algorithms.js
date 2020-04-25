class AlgorithmProxy {

    static setDijkstra() {
        if (runner.active) return;
        let a = new Dijkstra(bgraph);
        runner.algorithm = a;
        document.getElementById("btnGroupDrop1").innerText = a.name();
        document.getElementById("algoInfoAlgorithmName").innerHTML = a.name();
        document.getElementById("algoInfoAlgorithmDescription").innerHTML = a.description();
    }

    static setPrim() {
        if (runner.active) return;
        let a = new Prim(bgraph);
        runner.algorithm = a;
        document.getElementById("btnGroupDrop1").innerText = a.name();
        document.getElementById("algoInfoAlgorithmName").innerHTML = a.name();
        document.getElementById("algoInfoAlgorithmDescription").innerHTML = a.description();
    }

    static onRunClick() {
        if (runner.active) return;

        if (!runner.algorithm) {
            this.error('You must select an <b>algorithm</b> to run.');
            return;
        }

        runner.algorithm.graph = bgraph;

        if (bgraph instanceof DirectedGraph)
            painter.directedGraph = true;
        if (bgraph instanceof UndirectedGraph)
            painter.directedGraph = false;

        let state = {
            directed: document.getElementById("directed_graph_mode").check,
            weighted: document.getElementById("weighted_graph_mode").checked
        };
        if (runner.onStart(state)) {
            let controls = document.getElementById("algorithmRunnerControlsArea");
            controls.setAttribute("style", "");
            let running = document.getElementById("runnerStarterBtn");
            running.setAttribute("class", "btn btn-primary");
        }
    }

    static dispatchEvt(evt) {
        runner.dispatch(evt);
    }

    static onChangeMode() {
        runner.automatic = document.getElementById("runner_mode_automatic").checked;
    }

    static onPlayClick() {
        if (runner.automatic === false) return;
        runner.play();
    }

    static onPauseClick() {
        if (runner.automatic === false) return;
        runner.pause();
    }

    static onNextStepClick() {
        if (runner.automatic === true) return;
        runner.next();
    }

    static onStopClick() {
        runner.stop();
        let controls = document.getElementById("algorithmRunnerControlsArea");
        controls.setAttribute("style", "display: none;");
        let running = document.getElementById("runnerStarterBtn");
        running.setAttribute("class", "btn btn-outline-primary");
    }

    static isRunnerActive() {
        return runner.active;
    }

    static info(msg, callback, size) {
        this.showAlert('<p class="text-info">' + msg + '</p>', callback, size);
    }

    static error(msg, callback, size) {
        this.showAlert('<p class="text-danger">' + msg + '</p>', callback, size);
    }

    static showAlert(msg, callback, size) {
        if (!size)
            size = 'small';
        if (!callback)
            callback = function () {
            };
        bootbox.alert({
            message: msg,
            onEscape: true,
            backdrop: false,
            callback: callback,
            size: size,
            buttons: {
                ok: {
                    label: '<i class="fas fa-check-circle"></i> Ok',
                    className: 'btn-primary'
                }
            }
        });
    }
}

class AlgorithmRunner {

    constructor() {
        this._automatic = false;
        this._active = false;
        this._algorithm = undefined;
        this._interval = 800;
        this._runningID = 0;
    }

    get automatic() {
        return this._automatic;
    }

    set automatic(val) {
        this._automatic = val;
    }

    get algorithm() {
        return this._algorithm;
    }

    set algorithm(algo) {
        this._algorithm = algo;
    }

    get active() {
        return this._active;
    }

    stop() {
        if (this.automatic === true)
            this.pause();
        this._active = false;
        painter.restoreAll();
    }

    play() {
        if (this.algorithm.state === 0) {
            AlgorithmProxy.error('The algorithm is <b>not ready</b>.');
            return;
        }
        let me = this;
        this._runningID = setInterval(function () {
            if (me.automatic === false) {
                me.pause();
                return;
            }
            if (me.algorithm.hasNext()) {
                me.algorithm.next();
            } else {
                me.pause();
                me._algorithm.onEnd();
            }
        }, this._interval);
    }

    pause() {
        clearInterval(this._runningID);
    }

    next() {
        if (this.algorithm.state === 0) {
            AlgorithmProxy.error('The algorithm is <b>not ready</b>.');
            return;
        }
        if (this._algorithm.hasNext())
            this._algorithm.next();
        else
            this._algorithm.onEnd();
    }

    onStart(state) {
        this._active = this._algorithm.onBegin(state);
        return this._active;
    }

    dispatch(evt) {
        this._algorithm.dispatch(evt);
    }

}

class Algorithm {

    constructor(graph) {
        this.graph = graph;
        this.state = 0;   //1 - pre, 1 - during, 2 - post
        this.steps = [];
        this.step = 0;
    }

    onBegin() {
        throw new Error('No implementation!');
    }

    onEnd() {
        throw new Error('No implementation!');
    }

    dispatch() {
        throw new Error('No implementation!');
    }

    buildSteps() {
        throw new Error('No implementation!');
    }

    name() {
        throw new Error('No implementation!');
    }

    description() {
        throw new Error('No implementation!');
    }

    //
    next() {
        this.steps[this.step]();
        this.step++;
    }

    hasNext() {
        return this.step < this.steps.length;
    }
}

class Dijkstra extends Algorithm {
    constructor(graph) {
        super(graph);
        this.distances = [];
        this.initialNode = undefined;
    }

    onBegin(state) {
        if (this.graph.isEmpty()) {
            AlgorithmProxy.error('Graph is <b>empty</b>.');
            return false;
        }
        if (state.weighted === false) {
            AlgorithmProxy.error('Graph must be <b>weighted</b>.');
            return false;
        }

        AlgorithmProxy.info('Select an initial <b>node</b>.');
        return true;
    }

    onEnd() {
        //restart state of the algorithm
        this.state = 0;

        let table = document.createElement('table');
        table.setAttribute("class", "table table-bordered table-striped");
        //table.setAttribute("style","table-layout: fixed; white-space: nowrap;");
        this.generateResultsTableHead(table);
        this.generateResultsTableData(table);
        console.log(table);

        let div = document.createElement('div');
        div.setAttribute("class", "container");
        let title = document.createElement("div");
        title.innerHTML = `<p class="text-left">
                                The algorithm has <b>finished</b>.
                            </p>
                            <p class="badge badge-primary text-wrap" style="display: table; margin-right: auto; margin-left: auto;">
                                == Algorithm's output: all distances from  ` + this.initialNode + ` ==
                            </p>`;
        title.setAttribute("class", "text-info");
        div.appendChild(title);
        div.appendChild(table);

        //show final msg
        //AlgorithmProxy.info('The algorithm has <b>finished</b>.');

        AlgorithmProxy.info(div.outerHTML, undefined, 'xl');

    }

    generateResultsTableHead(table) {
        let data = this.distances;

        let thead = table.createTHead();
        let row = thead.insertRow();
        for (let key in data) {
            let th = document.createElement("th");
            let text = document.createTextNode(key);
            th.appendChild(text);
            row.appendChild(th);
        }
    }

    generateResultsTableData(table) {
        let data = this.distances;

        let row = table.insertRow();
        for (let key in data) {
            let cell = row.insertCell();
            let text = document.createTextNode(data[key]);
            cell.appendChild(text);
        }

    }

    dispatch(evt) {
        if (this.state === 0 && evt !== undefined && evt.type && evt.type === "clickNode") {
            this.state = 1;
            painter.highlightNode(evt.data.node.id);
            this.buildSteps(evt.data.node.id);
            AlgorithmProxy.info('Runner is now <b>ready</b>.');
        }
    }

    buildSteps(node) {
        this.initialNode = node;
        const inf = Infinity;
        let d = this.distances;
        for (let nid in this.graph.nodes)
            if (this.graph.nodes[nid] === true)
                d[nid] = inf;

        d[node] = 0;

        let q = new PriorityQueue();

        q.push(make(node, 0, 0));

        while (!q.isEmpty()) {
            let c = q.pop();

            //paint edge
            if (c.from) {
                let eid = painter.findEdgeId(c.from, c.v);
                this.steps.push(function () {
                    painter.paintEdge(eid);
                });
            }
            //end

            //paint node
            let nid = c.v;
            this.steps.push(function () {
                painter.paintNode(nid);
            });
            //end

            let adj = this.graph.getAdj(c.v);
            for (let v in adj) {
                if (adj[v] !== undefined && d[v] > d[c.v] + adj[v]) {
                    d[v] = d[c.v] + adj[v];
                    q.push(make(v, adj[v], c.v));

                    //paint while updating distances
                    let eid = painter.findEdgeId(c.v, v);
                    this.steps.push(function () {
                        painter.highlightEdge(eid);
                    });
                    //end
                }
            }
        }
    }

    name() {
        return "Dijkstra";
    }

    description() {
        return `
        This algorithmm is used for calculating the minimal 
        distance from a node to the rest of them.
        `;
    }
}

class Prim extends Algorithm {
    constructor(graph) {
        super(graph);
    }

    onBegin(state) {
        if (this.graph.isEmpty()) {
            AlgorithmProxy.error('Graph is <b>empty</b>.');
            return false;
        }
        if (state.weighted === false) {
            AlgorithmProxy.error('Graph must be <b>weighted</b>.');
            return false;
        }

        AlgorithmProxy.info('Select an initial <b>node</b>.');
        return true;
    }

    onEnd() {
        //restart state of the algorithm
        this.state = 0;

        //show final msg
        AlgorithmProxy.info('The algorithm has <b>finished</b>.');
    }

    dispatch(evt) {
        if (this.state === 0 && evt !== undefined && evt.type && evt.type === "clickNode") {
            this.state = 1;
            painter.highlightNode(evt.data.node.id);
            this.buildSteps(evt.data.node.id);
            AlgorithmProxy.info('Runner is now <b>ready</b>.');
        }
    }

    buildSteps(node) {
        let q = new PriorityQueue();
        let visited = [];
        let current = undefined;
        q.push(make(node, 0, undefined));
        while (!q.isEmpty()) {
            if (visited[q.top().v] === true) {
                q.pop();
                continue;
            }
            visited[q.top().v] = true;
            current = q.pop();

            //paint edge
            if (current.from) {
                let src = current.from;
                let dst = current.v;
                let eid = painter.findEdgeId(src, dst);
                this.steps.push(function () {
                    //console.log("Painting edge: " + eid + " " + src + "-" + dst);
                    painter.paintEdge(eid);
                });
            }
            //end

            //paint node
            let nid = current.v;
            this.steps.push(function () {
                //console.log("Painting node: " + nid);
                painter.paintNode(nid);
            });
            //end

            let adj = this.graph.getAdj(current.v);
            for (let v in adj)
                if (!visited[v] && adj[v] !== undefined) {
                    q.push(make(v, adj[v], current.v));

                    //highlight edge
                    let src = current.v;
                    let eid = painter.findEdgeId(src, v);
                    this.steps.push(function () {
                        //console.log("Highlighting edge: " + eid + " " + src + "-" + v);
                        painter.highlightEdge(eid);
                    });
                    //end
                }
        }
        //console.log("ready to draw");
        //console.log(this.steps);
        //console.log("length -> " + this.steps.length);
        //console.log(this.graph);
    }

    name() {
        return "Prim";
    }

    description() {
        return `
        This algorithm is used for calculating the minimal 
        spanning tree (MST).
        The MST is a tree that connects all nodes with minimal weight. 
        `;
    }
}

//initialization code
const runner = new AlgorithmRunner();