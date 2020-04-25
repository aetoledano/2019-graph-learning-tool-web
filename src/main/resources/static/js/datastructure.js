//abstract graph
class Graph {

    // nodes;// the nodes of the graph
    //
    // nodesCount;
    //
    // adj;// the adjacency matrix will be an array of arrays

    constructor(old) {
        if (old) {
            this.nodes = old.nodes;
            this.nodesCount = Object.keys(nodes).length;
            this.adj = old.adj;
        } else {
            this.nodesCount = 0;
            this.nodes = [];
            this.adj = [];
        }
    }

    isEmpty() {
        return this.nodesCount === 0;
    }

    isNode(node) {
        return this.nodes[node] !== undefined;
    }

    getEdgeVal(src, dst) {
        if (this.adj[src]) return this.adj[src][dst];
        return undefined;
    }

    setEdgeVal(src, dst, val) {
        this.adj[src][dst] = val;
    }

    getAdj(node) {
        return this.adj[node];
    }

    addNode(node) {
        this.nodes[node] = true;
        this.nodesCount++;
    }

    rmNode(node) {
        this.nodesCount--;
        this.nodes[node] = undefined;
        this.adj[node] = undefined;
        for (let key in this.adj)
            if (this.adj[key] && this.adj.hasOwnProperty(key))
                this.adj[key][node] = undefined;
    }

    addEdge() {
        throw new Error('No implementation!');
    }

    rmEdge() {
        throw new Error('No implementation!');
    }

    isEdge() {
        throw new Error('No implementation!');
    }
}

class DirectedGraph extends Graph {

    constructor(old) {
        super(old);
    }

    addEdge(src, dst, value) {
        if (!this.adj[src]) this.adj[src] = [];
        this.adj[src][dst] = value;
    }

    rmEdge(src, dst) {
        this.adj[src][dst] = undefined;
    }

    isEdge(src, dst) {
        return this.getEdgeVal(src, dst) !== undefined;
    }
}

class UndirectedGraph extends Graph {

    constructor(old) {
        super(old);
    }

    addEdge(src, dst, value) {
        if (!this.adj[src]) this.adj[src] = [];
        this.adj[src][dst] = value;
        if (!this.adj[dst]) this.adj[dst] = [];
        this.adj[dst][src] = value;
    }

    rmEdge(src, dst) {
        this.adj[src][dst] = undefined;
        this.adj[dst][src] = undefined;
    }

    isEdge(src, dst) {
        return this.getEdgeVal(src, dst) !== undefined || this.getEdgeVal(dst, src) !== undefined;
    }
}

class Pair {
    // Dummy Pair class with valueOf overridden
    // so javascript > < = operators can compare them as numbers
    // so they can be arranged by value(dst)

    // v;
    // dst;
    // from;

    constructor(v, dst, from) {
        this.v = v;
        this.dst = dst;
        this.from = from;
    }

    valueOf() {
        return this.dst;
    }

}

function make(vertex, distance, from) {
    return new Pair(vertex, distance, from);
}

class PriorityQueue {
    // PriorityQueue implemented on top of a heap data structure.
    // One of the most popular applications of a heap: as an efficient priority queue.
    // In this case a min heap is used.
    //
    // MIT Introduction to algorithms, page 162.

    constructor() {
        //private variables
        var a = [];
        var heapSize = 0;

        //private member functions
        function heapify(i) {
            let l = left_child(i);
            let r = right_child(i);
            let max = i;

            if (l <= heapSize && a[l] < a[max]) max = l;

            if (r <= heapSize && a[r] < a[max]) max = r;

            if (max !== i) {
                swap(i, max);
                heapify(max);
            }
        }

        function swap(i, j) {
            let tmp = a[i];
            a[i] = a[j];
            a[j] = tmp;
        }

        function parent(i) {
            return Math.floor(i / 2);
        }

        function left_child(i) {
            return 2 * i;
        }

        function right_child(i) {
            return 2 * i + 1;
        }

        //privileged member functions (accesible from the outside like public members)
        this.push = function (e) {
            heapSize++;
            let i = heapSize;
            a[i] = e;
            while (i > 1 && a[i] < a[parent(i)]) {
                swap(i, parent(i));
                i = parent(i);
            }
        };

        this.pop = function () {
            let x = this.top();
            a[1] = a[heapSize];
            heapSize--;
            heapify(1);
            return x;
        };

        this.top = function () {
            return a[1];
        };

        this.isEmpty = function () {
            return heapSize === 0;
        };

        this.print = function () {
            let str = "";
            for (let i = 1; i <= heapSize; i++)
                str += a[i] + " ";
            console.log(str);
        };
    }
}
