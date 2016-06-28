module Solubility {

    export class Chain {
        constructor() {
            this['@@Schema'] = 'Solubility';
            this['@@Table'] = 'Chain';
        }
        public structureID: string;
        public chainName: string;
        public residues: { [id: number]: Residue } = {};
    }
    export class Residue {
        constructor() {
            this['@@Schema'] = 'Solubility';
            this['@@Table'] = 'Residue';
        }
        public index: number;
        public name: string; 
        public atoms: Atom[] = [];
        public IsSurface: boolean;
        public PseudoBetaDepth: number;

        public AtomByName = (type: string) => {
            var result: Atom;
            var atoms = this.atoms.some((atom) => {
                return (atom.type == type) ? ((result = atom), true) : false;
            });
            return result;
        }
        public AverageDepth = (...types: string[]): number => {
            var sum: number = 0.0;
            var count: number = 0;
            types.forEach((type) => {
                var at = this.AtomByName(type);
                if (at) {
                    sum += at.Depth;
                    count += 1;
                }
            });
            if (count > 0) {
                return sum / count;
            }
            else {
                return 0.0;
            }
        }
        public MaxDepth = (...types: string[]): number => {
            var max: number = 0;
            types.forEach((type) => {
                var at = this.AtomByName(type);
                if (at && max < at.Depth) max = at.Depth;
            });
            return max;
        }
        get IsSurfaceByAtom(): boolean {
            switch (this.name) {
                case 'A':
                    //N, CA, CB, C, O
                    return this.AverageDepth("CB") >= 0.165;
                case 'R':
                    //N, CA, CB, CG, CD, NE, CZ, NH1, NH2, C, O
                    return this.MaxDepth("NE", "NH1", "NH2") >= 0.165;
                case 'N':
                    //N, CA, CB, CG, OD1, ND2, C, O
                    return this.MaxDepth("OD1", "ND2") >= 0.165;
                case 'D':
                    //N, CA, CB, CG, OD1, OD2, C, O
                    return this.MaxDepth("OD1", "OD2") >= 0.165;
                case 'C':
                    //N, CA, CB, SG, C, O
                    return this.AverageDepth("CB", "SG") >= 0.165;
                case 'E':
                    //N, CA, CB, CG, CD, OE1, OE2, C, O
                    return this.MaxDepth("OE1", "OE2") >= 0.165;
                case 'Q':
                    //N, CA, CB, CG, CD, OE1, NE2, C, O
                    return this.MaxDepth("OE1", "NE2") >= 0.165;
                case 'G':
                    //N, CA, C, O
                    return this.PseudoBetaDepth >= 0.165;
                case 'H':
                    //N, CA, ND1, CG, CB, NE2, CD2, CE1, C, O
                    //N, CA, NE2, CD2, ND1, CG, CE1, CB, C, O
                    //N, CA, ND1, NE2, CE1, CD2, CG, CB, C, O
                    return this.MaxDepth("ND1", "NE2") >= 0.165;
                case 'I':
                    //N, CA, CB, CG2, CG1, CD, C, O
                    return this.AverageDepth("CB", "CG1", "CG2", "CD1") >= 0.165;
                case 'L':
                    //N, CA, CB, CG, CD1, CD2, C, O
                    return this.AverageDepth("CB", "CG", "CD1", "CD2") >= 0.165;
                case 'K':
                    //N, CA, CB, CG, CD, CE, NZ, C, O
                    return this.MaxDepth("NZ") >= 0.165;
                case 'M':
                    //N, CA, CB, CG, SD, CE, C, O
                    return this.AverageDepth("CB", "CG", "SD", "CE") >= 0.165;
                case 'F':
                    //N, CA, CB, CG, CD1, CD2, CE1, CE2, CZ, C, O
                    return this.AverageDepth("CB", "CG", "CD1", "CD2", "CE1", "CE2", "CZ") >= 0.165;
                case 'P':
                    //N, CA, CD, CB, CG, C, O
                    return this.AverageDepth("CB", "CG", "CD") >= 0.165;
                case 'S':
                    //N, CA, CB, OG, C, O
                    return this.MaxDepth("OG") >= 0.165;
                case 'T':
                    //N, CA, CB, OG1, CG2, C, O
                    return this.MaxDepth("OG1") >= 0.165;
                case 'W':
                    //N, CA, CB, CG, CD2, CD1, NE1, CE2, CE3, CZ2, CZ3, CH2, C, O
                    return this.AverageDepth("CD1", "NE1", "CE3", "CZ2", "CZ3", "CH2") >= 0.165;
                case 'Y':
                    //N, CA, CB, CG, CD1, CD2, CE1, CE2, CZ, OH, C, O
                    return (this.MaxDepth("OH") >= 0.165) || (this.AverageDepth("CD1", "CD2", "CE1", "CE2") >= 0.165);
                case 'V':
                    //N, CA, CB, CG1, CG2, C, O
                    return this.AverageDepth("CB", "CG1", "CG2") >= 0.165;
                default:
                    return false;
            }
        }
    }
    export class Atom {
        constructor() {
            this['@@Schema'] = 'Solubility';
            this['@@Table'] = 'Atom';
        }
        public name: string;
        public type: string;
        public Depth: number;
    }
}