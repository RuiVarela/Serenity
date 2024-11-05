import { randomElement } from "./Common";

enum Connection {
    Top = "t",
    Bottom = "b",
    Left = "l",
    Right = "r",
}

enum RuleResult {
    Connects,
    Failes,
    NoConnectors
};

function inverseConnection(connection: Connection): Connection {
    switch (connection) {
        case Connection.Top: return Connection.Bottom;
        case Connection.Bottom: return Connection.Top;
        case Connection.Left: return Connection.Right;
        case Connection.Right: return Connection.Left;
    }
}

interface Cell {
    x: number
    y: number
    atom: string
    candidates: string[]
    debug: string
}

export class QuantumField {
    atoms: string[];
    rows: number;
    columns: number;
    grid: Cell[];
    ended: boolean;
    
    constructor(columns: number, rows: number, atoms: string[]) {
        this.columns = columns;
        this.rows = rows;
        this.atoms = atoms;
        this.grid = [];
        this.ended = false;

        if (columns <= 1 || rows <= 1)
            return;
        
        this.reset();
    }

    reset() {
        this.grid = [];
        this.ended = false;

        for (let y = 0; y != this.rows; ++y) {
            for (let x = 0; x != this.columns; ++x) {
                this.grid.push({ 
                    x: x, y: y,
                    atom: "",
                    candidates: this.atoms.slice(), 
                    debug: ""
                });
            }
        }

    }

    private index(x: number, y: number) {
        if (x < 0 || x >= this.columns) throw new Error(`invalid x: ${x}`);
        if (y < 0 || y >= this.rows) throw new Error(`invalid y: ${y}`);
        return y * this.columns + x;
    }

    private cell(x: number, y: number) {
        return this.grid[this.index(x, y)];
    }

    private neighbors(x: number, y: number) {
        const cells = new Array<Cell>();

        if (x > 0) cells.push(this.cell(x - 1, y));
        if (x < this.columns - 1) cells.push(this.cell(x + 1, y));

        if (y > 0) cells.push(this.cell(x, y - 1));
        if (y < this.rows - 1) cells.push(this.cell(x, y + 1));

        return cells;
    }

    
    //
    // returns the connection between two cells
    // if the result is Right, then the cell a is to the right of cell b
    // if the result is Left, then the cell a is to the left of cell b
    // if the result is Top, then the cell a is above cell b
    // if the result is Bottom, then the cell a is below cell b
    //
    private adjacency(a: Cell, b: Cell): Connection | undefined {
        const dx = a.x - b.x;
        const dy = a.y - b.y;

        if (dx == 0 && dy == 1)         return Connection.Bottom;
        else if (dx == 0 && dy == -1)   return Connection.Top;
        else if (dx == 1 && dy == 0)    return Connection.Right;
        else if (dx == -1 && dy == 0)   return Connection.Left;

        return undefined
    }


    private matchesRules(a: string, b: string, c: Connection): RuleResult {
        let output: RuleResult;

        let ab: string = c;
        let ba: string = inverseConnection(c);

        if (b.indexOf(ab) != -1 && a.indexOf(ba) != -1) {
            output = RuleResult.Connects;
        } else if (b.indexOf(ab) == -1 && a.indexOf(ba) == -1) {
            output = RuleResult.NoConnectors;
        } else {
            output = RuleResult.Failes;
        }

        //console.log(`matchesRules ${a} ${b} | ${ab} ${ba} -> ${output}`);
        return output
    }

    private canConnectToSometing(cell: Cell): boolean {
        let conectors = 0;

        const neighbors = this.neighbors(cell.x, cell.y).filter(cell => cell.atom != "");
        for (const current of neighbors) {
            const a = cell
            const b = current
            const adjacency = this.adjacency(a, b);

            if (adjacency === undefined) throw Error("this cannot be undefined");

            if (b.atom.indexOf(adjacency.toString()) != -1) {
                conectors += 1;
            }
        }

        return conectors > 0;
    }

    private recomputeGrid() {
        for (let y = 0; y != this.rows; ++y) {
            for (let x = 0; x != this.columns; ++x) {
                const cell = this.cell(x, y);

                // do nothing if already collapsed
                if (cell.atom != "") continue;

                // do nothing if the cell has no neighbors
                const neighbors = this.neighbors(x, y).filter(cell => cell.atom != "");
                if (neighbors.length == 0) continue;


                this.recomputeCell(cell, neighbors);
            }
        }
    }

    private recomputeCell(cell: Cell, neighbors: Cell[]) {
        //console.log(`Recomputing cell ${cell.x},${cell.y} | ${neighbors.length} neighbors`);

        cell.debug = "";

        //
        // check which candidates are no longer valid
        //
        {
            const invalid: string[] = [];
            for (const current of neighbors) {
                const a = cell
                const b = current
                const adjacency = this.adjacency(a, b);

                if (adjacency === undefined) throw Error("this cannot be undefined");

                for (const candidate of cell.candidates) 
                    if (this.matchesRules(candidate, b.atom, adjacency) == RuleResult.Failes) 
                        invalid.push(candidate)
            }

            cell.candidates = cell.candidates.filter(current => invalid.indexOf(current) == -1);
        }

        ///
        /// debug
        ///
        cell.debug += `${cell.candidates.length}`;
        //cell.debug += `${cell.candidates.length}`;
        //cell.debug += `${cell.x},${cell.y}`;
    }
    
    put(x: number, y: number, name: string) {
        //console.log(`Placing atom ${name} at ${x},${y}`);

        const index = this.index(x, y);
        this.grid[index].atom = name;
        this.grid[index].candidates = [];
        this.grid[index].debug = "";

        this.recomputeGrid();
    }

    canCollapse(): boolean {
        return !this.ended;
    }

    collapse() {
        let candidates = this.grid
            .filter(cell => cell.atom === "" && cell.candidates.length > 0)
            .filter(cell => this.canConnectToSometing(cell));

        // collapse min
        let min = Number.MAX_VALUE;
        candidates.forEach(cell => {    
            if (cell.candidates.length < min) 
                min = cell.candidates.length;
        });
        candidates = candidates.filter(cell => cell.candidates.length == min);

        if (candidates.length == 0) {
            this.ended = true;
            return;
        }

        let cell = randomElement(candidates);
        let content = randomElement(cell.candidates);
        if (content === undefined) {
            
            console.log(JSON.stringify(cell));
        }
        this.put(cell.x, cell.y, content);  
    }

    get(x: number, y: number): string {
        return this.cell(x, y).atom;
    }   

    debug(x: number, y: number): string {
        return this.cell(x, y).debug;
    } 
}