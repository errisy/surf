

//1. is an amino residue truely buried?
//2. is 

class PDBParser {

    static parsePDB(value: string): Structure {
        var lines = value.split('\n');
        
        var ptnHeader = /^ATOM/ig;

        var titles = lines.filter((line) => /^TITLE/ig.IsMatch(line)).map((line) =>line.replace(/^TITLE\s{5}/ig, '').replace(/^TITLE\s{4}\d{1}\s/ig, '').replace(/^TITLE\s{3}\d{2}\s/ig, ''));
        var sources = lines.filter((line) => /^SOURCE/ig.IsMatch(line)).map((line) =>line.replace(/^SOURCE\s{4}/ig, '').replace(/^SOURCE\s{3}\d{1}\s/ig, '').replace(/^SOURCE\s{2}\d{2}\s/ig, ''));

        var title = titles.join('');

        var groups = /ORGANISM_SCIENTIFIC\: ([^;]+)/ig.exec(sources.join(''));

        var source: string;
        if (groups) if (groups[1]) source = groups[1];

        //var ptnAtom = /ATOM  \s*(\d+)\s*(\w+)\s*(\w+)\s*(\w+)\s*(\d+)\s+(\-?[\d\.]+)\s+(\-?[\d\.]+)\s+(\-?[\d\.]+)\s+(\-?[\d\.]+)\s+(\-?[\d\.]+)\s+(\w+)/ig;
        var atoms = lines.filter((line) => ptnHeader.IsMatch(line));

        var protein = new Structure();

        protein.title = title;
        protein.source = source;

        protein.pdbID = /\s+(\w+)\s*$/ig.Match(lines[0]).groups[1];

        atoms.forEach((a) => {
            a = a.toUpperCase();
            var type = a.substr(12, 4).replace(/\s+/ig, '');
            var name: string;
            if (a.length >= 77) {
                name = a.substr(77, 1);
            }
            else {
                name = at.type.substr(0, 1);
            }
            if (name == 'H') return; //stop here, no hydrogens!

            var at = new Atom();

            //at.AtomName = a.Substring(12, 4).Replace(" ", "")
            at.type = type;
            at.name = name;


            //If Not Integer.TryParse(a.Substring(6, 5).Replace(" ", ""), at.ID) Then Stop
            at.ID = Number(a.substr(6, 5).replace(' ', ''));


            //at.Alternative = a.Substring(16, 1)
            at.alternative = a.substr(16, 1);

            //at.AminoAcid = AminoAcids.ParseTripletName(a.Substring(17, 3))
            at.aminoAcid = ProteinUtil.parseTriplet(a.substr(17, 3));

            //at.ChainName = a.Substring(21, 1)
            at.chainName = a.substr(21, 1);

            //If Not Integer.TryParse(a.Substring(22, 4).Replace(" ", ""), at.ResidueIndex) Then Stop
            at.residueIndex = Number(a.substr(22, 4).replace(' ', ''));

            //at.Insertion = a.Substring(26, 1)
            at.insertion = a.substr(26, 1);

            //If Not Double.TryParse(a.Substring(30, 8).Replace(" ", ""), posX) Then Stop
            at.position.x = Number(a.substr(30, 8).replace(' ', '')) / 10.0;

            //If Not Double.TryParse(a.Substring(38, 8).Replace(" ", ""), posY) Then Stop
            at.position.y = Number(a.substr(38, 8).replace(' ', '')) / 10.0;

            //If Not Double.TryParse(a.Substring(46, 8).Replace(" ", ""), posZ) Then Stop
            at.position.z = Number(a.substr(46, 8).replace(' ', '')) / 10.0;

            //at.Position = New Media3D.Point3D(posX / 10.0#, posY / 10.0#, posZ / 10.0#)
            //If a.Length >= 77 Then
            //at.Name = a.Substring(77, 1)
            //Else
            //at.Name = at.AtomName.Substring(0, 1)
            //End If

            //don't load 
 
            if (at.name != 'H')protein.allocate(at);
        });
        return protein;
    }
}
class Structure {
    public pdbID: string;
    public chainDict: { [id: string]: Chain } = {};
    public title: string;
    public source: string;
    public allocate = (atom: Atom) => {
        var chain = this.chainDict[atom.chainName];
        if (!chain) {
            chain = new Chain();
            chain.parent = this;
            chain.chainID = atom.chainName;
            chain.fullID = this.pdbID + '_' + chain.chainID;
            this.chainDict[atom.chainName] = chain;
        }
        chain.allocate(atom);
    }
  
}
class Chain {
    public parent: Structure;
    public chainID: string;
    public fullID: string;
    public residueDict: { [id: number]: Residue } = {};
    public atoms: Atom[] = [];
    public allocate = (atom: Atom) => {
        var residue = this.residueDict[atom.residueIndex];
        if (!residue) {
            residue = new Residue();
            residue.index = atom.residueIndex;
            residue.name = atom.aminoAcid;
            this.residueDict[atom.residueIndex] = residue;
        }
        this.atoms.push(atom);
        residue.atoms.push(atom);
    }
    get center(): Vector3D {
        var count = this.atoms.length;
        if (count <= 0) return new Vector3D();
        var x: number = 0; 
        var y: number = 0;
        var z: number = 0;
        this.atoms.forEach((atom) => {
            x += atom.position.x;
            y += atom.position.y;
            z += atom.position.z;
        });
        return new Vector3D(x / count, y / count, z / count);
    }
    get data(): Solubility.ChainData {
        var data = new Solubility.ChainData();
        data.name = this.fullID;
        var residues: ResidueStatus[] = [];
        for (var key in this.residueDict) {
            var rs = this.residueDict[key];
            residues.push({
                name: rs.name,
                index: rs.index,
                isSurface: rs.IsSurface
            });
        }
        residues.sort((a, b) => {
            return (a.index > b.index)?1:-1;
        });
        data.value = residues.map((rs) => rs.name + rs.index + (rs.isSurface ? '+' : '-')).join('');
        data.title = this.parent.title;
        data.source = this.parent.source;
        return data;
    }
}
class ResidueStatus {
    public name: string;
    public index: number;
    public isSurface: boolean;
}
class Residue {
    public index: number;
    public atoms: Atom[] = [];
    public name: string;

    public GetBounds3d() {
        var bounds  = new Bounds3D();
        this.atoms.forEach((atom) => bounds.Includes(atom.position));
        return bounds;
    }
    public PseudoBetaDepth: number;
    public GetPseudoBetaCarbonPosition = (): Vector3D => {
        var CA = this.AtomByName('CA');
        var C = this.AtomByName('C');
        var CB = this.AtomByName('N');
        if (CA && C && CB) {
            var disA = CA.position.subtract(C.position);
            var disB = CB.position.subtract(C.position);
            var disC = disA.divideBy(disA.length).add(disB.divideBy(disB.length));
            disC.divide(disC.length);
            var BaseZ = disA.orthogonalWith(disB);
            return Vector3D.sum(
                disC.multiplyBy(Residue.CCBondLength * Residue.WidthProjection / disC.length),
                BaseZ.multiplyBy(Residue.CCBondLength * Residue.HeightProjection),
                CA.position);
        }
        else {
            return null;
        }
    }
    public AtomByName = (type: string) => {
        var result: Atom;
        var atoms = this.atoms.some((atom) => {
            return (atom.type == type) ? ((result = atom), true) : false;
        });
        return result;
    }
    get center(): Vector3D {
        var count = this.atoms.length;
        if (count <= 0) return new Vector3D();
        var x: number = 0;
        var y: number = 0;
        var z: number = 0;
        this.atoms.forEach((atom) => {
            x += atom.position.x;
            y += atom.position.y;
            z += atom.position.z;
        });
        return new Vector3D(x / count, y / count, z / count);
    }
    public Depth: number;
    public SearchDepth = () => {
        if (this.name == 'G') {
            this.Depth = this.PseudoBetaDepth;
        }
        else {
            this.Depth = 0;
            this.atoms.forEach((at) => {
                switch (at.type) {
                    case 'C': break;
                    case 'O': break;
                    case 'N': break;
                    case 'CA': break;
                    default:
                        if (this.Depth < at.Depth) this.Depth = at.Depth;
                }
            });
        }
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
    public IsSurface: boolean;
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

    static CCBondLength = 0.153
    static CHBondLength = 0.109;
    static OHBondLength = 0.096;
    static NHBondLength = 0.1;
    static SHBondLength = 0.1348;

    static HeightProjection = 0.816496580927726; //sqrt(6)/3
    static WidthProjection = 0.57735026918962573; //sqrt(3)/3
    static CenterProjection = 0.33333333333333331;
    static TopZProjection = 0.94280904158206336;
    static BottomZProject = 0.47140452079103168;
    static LeftYProjection = 0.816496580927726;
    static TriangleHeightProjection = 0.8660254037844386;
    static TriangleHalfProjection = 0.5;


    //for display

    public BuildBonds(): IBond []
    {
        var Bonds: IBond[] = [];
        var AddBond = (AtomNameA: string, AtomNameB: string, bondNumber?:number ) => {
            var A = this.AtomByName(AtomNameA);
            var B = this.AtomByName(AtomNameB);
            if (A != null && B != null) {
                //A.EngagedInBond = true;
                //B.EngagedInBond = true;
                Bonds.push({
                    Position1: A.position,
                    Position2: B.position,
                    BondNumber: bondNumber
                });
                return true;
            } 
        }
        switch (this.name) {
            case 'A':
                //N, CA, CB, C, O
                AddBond("N", "CA");
                AddBond("CA", "C");
                AddBond("C", "O", 2);
                AddBond("CA", "CB");
                break;
            case 'R':
                //N, CA, CB, CG, CD, NE, CZ, NH1, NH2, C, O
                AddBond("N", "CA");
                AddBond("CA", "C");
                AddBond("C", "O", 2);
                AddBond("CA", "CB");
                AddBond("CB", "CG");
                AddBond("CG", "CD");
                AddBond("CD", "NE");
                AddBond("NE", "CZ");
                AddBond("CZ", "NH1");
                AddBond("CZ", "NH2");
                break;
            case 'N':
                //N, CA, CB, CG, OD1, ND2, C, O
                AddBond("N", "CA");
                AddBond("CA", "C");
                AddBond("C", "O", 2);
                AddBond("CA", "CB");
                AddBond("CB", "CG");
                AddBond("CG", "OD1");
                AddBond("CG", "ND2");
                break;
            case 'D':
                //N, CA, CB, CG, OD1, OD2, C, O
                AddBond("N", "CA");
                AddBond("CA", "C");
                AddBond("C", "O", 2);
                AddBond("CA", "CB");
                AddBond("CB", "CG");
                AddBond("CG", "OD1");
                AddBond("CG", "OD2");
                break;
            case 'C':
                //N, CA, CB, SG, C, O
                AddBond("N", "CA");
                AddBond("CA", "C");
                AddBond("C", "O", 2);
                AddBond("CA", "CB");
                AddBond("CB", "SG");
                break;
            case 'E':
                //N, CA, CB, CG, CD, OE1, OE2, C, O
                AddBond("N", "CA");
                AddBond("CA", "C");
                AddBond("C", "O", 2);
                AddBond("CA", "CB");
                AddBond("CB", "CG");
                AddBond("CG", "CD");
                AddBond("CD", "OE1");
                AddBond("CD", "OE2");
                break;
            case 'Q':
                //N, CA, CB, CG, CD, OE1, NE2, C, O
                AddBond("N", "CA");
                AddBond("CA", "C");
                AddBond("C", "O", 2);
                AddBond("CA", "CB");
                AddBond("CB", "CG");
                AddBond("CG", "CD");
                AddBond("CD", "OE1");
                AddBond("CD", "NE2");
                break;
            case 'G':
                //N, CA, C, O
                AddBond("N", "CA");
                AddBond("CA", "C");
                AddBond("C", "O", 2);
                break;
            case 'H':
                //N, CA, ND1, CG, CB, NE2, CD2, CE1, C, O
                //N, CA, NE2, CD2, ND1, CG, CE1, CB, C, O
                //N, CA, ND1, NE2, CE1, CD2, CG, CB, C, O
                AddBond("N", "CA");
                AddBond("CA", "C");
                AddBond("C", "O", 2);
                AddBond("CA", "CB");
                AddBond("CB", "CG");
                AddBond("CG", "ND1");
                AddBond("CG", "CD2");
                AddBond("ND1", "CE1");
                AddBond("CD2", "NE2");
                AddBond("NE2", "CE1");
                break;
            case 'I':
                //N, CA, CB, CG2, CG1, CD, C, O
                AddBond("N", "CA");
                AddBond("CA", "C");
                AddBond("C", "O", 2);
                AddBond("CA", "CB");
                AddBond("CB", "CG1");
                AddBond("CB", "CG2");
                AddBond("CG1", "CD1");
                break;
            case 'L':
                //N, CA, CB, CG, CD1, CD2, C, O
                AddBond("N", "CA");
                AddBond("CA", "C");
                AddBond("C", "O", 2);
                AddBond("CA", "CB");
                AddBond("CB", "CG");
                AddBond("CG", "CD1");
                AddBond("CG", "CD2");
                break;
            case 'K':
                //N, CA, CB, CG, CD, CE, NZ, C, O
                AddBond("N", "CA");
                AddBond("CA", "C");
                AddBond("C", "O", 2);
                AddBond("CA", "CB");
                AddBond("CB", "CG");
                AddBond("CG", "CD");
                AddBond("CD", "CE");
                AddBond("CE", "NZ");
                break;
            case 'M':
                //N, CA, CB, CG, SD, CE, C, O
                AddBond("N", "CA");
                AddBond("CA", "C");
                AddBond("C", "O", 2);
                AddBond("CA", "CB");
                AddBond("CB", "CG");
                AddBond("CG", "SD");
                AddBond("SD", "CE");
                break;
            case 'F':
                //N, CA, CB, CG, CD1, CD2, CE1, CE2, CZ, C, O
                AddBond("N", "CA");
                AddBond("CA", "C");
                AddBond("C", "O", 2);
                AddBond("CA", "CB");
                AddBond("CB", "CG");
                AddBond("CG", "CD1");
                AddBond("CG", "CD2");
                AddBond("CD1", "CE1");
                AddBond("CD2", "CE2");
                AddBond("CE1", "CZ");
                AddBond("CE2", "CZ");
                break;
            case 'P':
                //N, CA, CD, CB, CG, C, O
                AddBond("N", "CA");
                AddBond("CA", "C");
                AddBond("C", "O", 2);
                AddBond("CA", "CB");
                AddBond("CB", "CG");
                AddBond("CG", "CD");
                break;
            case 'S':
                //N, CA, CB, OG, C, O
                AddBond("N", "CA");
                AddBond("CA", "C");
                AddBond("C", "O", 2);
                AddBond("CA", "CB");
                AddBond("CB", "OG");
                break;
            case 'T':
                //N, CA, CB, OG1, CG2, C, O
                AddBond("N", "CA");
                AddBond("CA", "C");
                AddBond("C", "O", 2);
                AddBond("CA", "CB");
                AddBond("CB", "OG1");
                AddBond("CB", "CG2");
                break;
            case 'W':
                //N, CA, CB, CG, CD2, CD1, NE1, CE2, CE3, CZ2, CZ3, CH2, C, O
                AddBond("N", "CA");
                AddBond("CA", "C");
                AddBond("C", "O", 2);
                AddBond("CA", "CB");
                AddBond("CB", "CG");
                AddBond("CG", "CD1");
                AddBond("CG", "CD2");
                AddBond("CD1", "NE1");
                AddBond("CD2", "CE2");
                AddBond("CD2", "CE3");
                AddBond("NE1", "CE2");
                AddBond("CE2", "CZ2");
                AddBond("CE3", "CZ3");
                AddBond("CZ2", "CH2");
                AddBond("CZ3", "CH2");
                break;
            case 'Y':
                //N, CA, CB, CG, CD1, CD2, CE1, CE2, CZ, OH, C, O
                AddBond("N", "CA");
                AddBond("CA", "C");
                AddBond("C", "O", 2);
                AddBond("CA", "CB");
                AddBond("CB", "CG");

                AddBond("CG", "CD1");
                AddBond("CG", "CD2");

                AddBond("CD1", "CE1");
                AddBond("CD2", "CE2");

                AddBond("CE1", "CZ");
                AddBond("CE2", "CZ");

                AddBond("CZ", "OH");
                break;
            case 'V':
                //N, CA, CB, CG1, CG2, C, O
                AddBond("N", "CA");
                AddBond("CA", "C");
                AddBond("C", "O", 2);
                AddBond("CA", "CB");
                AddBond("CB", "CG1");
                AddBond("CB", "CG2");
                break;
            default:
                break;

            }
        return Bonds;
    }
}
interface IBond {
    BondNumber: number;
    Position1: Vector3D;
    Position2: Vector3D;
}
class Atom {
    ID: number;
    name: string;
    type: string;
    alternative: string;
    aminoAcid: string;
    chainName: string;
    residueIndex: number;
    insertion: string;
    position: Vector3D = new Vector3D(); 
    public Depth: number;
    get GetRadiusLiMinimumSet():number {
        return SurfaceSearch.RadiusLiMinimumSet(this.name, this.type);
    }
}

function LogCallback(value: boolean) {
}
 
class SurfaceSearchEntry {
    public residue: Residue; 
    public chain: Chain;
}

class SurfaceSearchOptions {
    constructor(hydrophilicFactor?: number, hydrophobicFactor?: number, testRadius?: number, defaultRadius?:number) {
      if(typeof hydrophilicFactor == 'number' && !isNaN( hydrophilicFactor))  this.centerAtomFactor = hydrophilicFactor;
      if (typeof hydrophobicFactor == 'number' && !isNaN(hydrophobicFactor)) this.subtractAtomFactor = hydrophobicFactor;
      if (typeof testRadius == 'number' && !isNaN(testRadius)) this.testRadius = testRadius;
      if (typeof defaultRadius == 'number' && !isNaN(defaultRadius)) this.defaultRadius = defaultRadius;
    }
    public centerAtomFactor: number = 1.2;
    public subtractAtomFactor: number = 1.2;
    public testRadius: number = 0.168;
    public defaultRadius: number = 0.13;
}

class SurfaceSearch {
    // N-H*O hydrogen bond can be as short as 1.717+1.002 (2.719) or 1.104+1.489 (2.593)

    static RadiusLiMinimumSet(name: string, type: string) {
        switch (name) {
            case 'C':
                switch (type) {
                    case 'C':
                        return 0.176;
                    default:
                        return 0.192;
                }
            case 'S':
                return 0.192;
            case 'N':
                return 0.166;
            case "O":
                return 0.151;
            default:
                console.log('error in radius');
                throw 'error in radius';
        }
    }
    static AtomFactor(name: 'C' | 'S' | 'O' | 'N', type: string) {
        const HydrophobicFactor: number = 1.6;
        switch (name) {
            case 'C':
                return HydrophobicFactor;
            case 'S':
                return HydrophobicFactor;
            case 'N':
                return 1;
            case "O":
                return 1;
        }
    }
    static Search(entry: SurfaceSearchEntry, options: SurfaceSearchOptions): PolyhedronBuilder2[] {
        var PolyhedronBuilers: PolyhedronBuilder2[] = [];
        var rs = entry.residue;
        var pc = entry.chain;
        var reach: number = (SurfaceSearch.RadiusLiMinimumSet('S', 'CG') + 0.33) * 2.0;
        var rsBounds = rs.GetBounds3d();
        rsBounds.Expand(-reach, reach, -reach, reach, -reach, reach);
        var includeList = entry.chain.atoms.filter((atom) => (atom.name == 'C' || atom.type == 'N' || atom.type == 'O') && rsBounds.Contains(atom.position));
        
        if (rs.name == 'G') {
            rs.PseudoBetaDepth = 0.00;
            var atp = rs.GetPseudoBetaCarbonPosition();

            if (atp) {
                for (var WaterRadius = 0.01; WaterRadius <= 0.332; WaterRadius += 0.005) {
                    var SpecificList: Atom[] = [];

                    var RadiusPseudoG = SurfaceSearch.RadiusLiMinimumSet('C', 'CG') + WaterRadius;
                    var ph = new PolyhedronBuilder2(atp, RadiusPseudoG, WaterRadius, options); // the builder will create a box at the unit of RadiusAtom * Factor + WaterRadius
                    var AtomReach = RadiusPseudoG * options.centerAtomFactor + WaterRadius + WaterRadius; // the atom can approach AtomRadius * Factor + Diameter of Water
                    var NoRoom: boolean = false;
                    includeList.some((pat) => {
                        var TotalReach = pat.GetRadiusLiMinimumSet * options.subtractAtomFactor + AtomReach;
                        if (pat.position.subtract(atp).lengthSquared <= TotalReach * TotalReach) SpecificList.push(pat);
                        NoRoom = (pat.position.equals(atp));
                        return NoRoom;
                    });
                    //console.log('NoRoom: ' + NoRoom);
                    if (NoRoom) {
                        //rs.PseudoBetaDepth = WaterRadius - 0.005;
                        //console.log(rs.name + rs.index + '-%B' + ' is empty has no room');
                        break;
                    }
                    else {
                        //console.log(rs.name + rs.index + '-' + '%B' + ' test with : ' + SpecificList.length);
                        SpecificList.forEach((pat) => {
                            ph.TrySubtract(pat.position, pat.GetRadiusLiMinimumSet);
                        });
                        if (ph.IsEmpty()) {
                            //rs.PseudoBetaDepth = WaterRadius - 0.005;
                            //console.log(rs.name + rs.index + '-%B' + ' is empty at ' + rs.PseudoBetaDepth.toString());
                            break;
                        }
                        else {
                            rs.PseudoBetaDepth = WaterRadius;
                            PolyhedronBuilers.push(ph);
                        }
                    }
                }
            }
            if (rs.PseudoBetaDepth < 0.0) rs.PseudoBetaDepth = 0.33;
        }
        else {
            rs.atoms.forEach((at) => {
                var phLast: PolyhedronBuilder2;
                switch (at.type) {
                    case 'C': break;
                    case 'O': break;
                    case 'N': break;
                    case 'CA': break;
                        //ignore the backbone atoms
                    default:
                        at.Depth = 0.00;
                        for (var WaterRadius = 0.01; WaterRadius <= 0.33; WaterRadius += 0.005) {
                            var SpecificList: Atom[] = [];
                            var atp = at.position;
                            var CenterAtomRadius = at.GetRadiusLiMinimumSet; // this is the radius of the atom
                            var ph = new PolyhedronBuilder2(atp, CenterAtomRadius, WaterRadius, options); // the builder will create a box at the unit of RadiusAtom * Factor + WaterRadius
                            var AtomReach = CenterAtomRadius * options.centerAtomFactor + WaterRadius + WaterRadius; // the atom can approach AtomRadius * Factor + Diameter of Water
                            includeList.forEach((pat) => {
                                var TotalReach = pat.GetRadiusLiMinimumSet * options.subtractAtomFactor + AtomReach;
                                if (pat !== at && pat.position.subtract(atp).lengthSquared < TotalReach * TotalReach) SpecificList.push(pat);
                            });
                            SpecificList.forEach((pat) => {
                                ph.TrySubtract(pat.position, pat.GetRadiusLiMinimumSet)
                            });
                            
                            if (ph.IsEmpty()) {
                                //at.Depth = WaterRadius - 0.005;
                                break;
                            }
                            else {
                                at.Depth = WaterRadius;
                                phLast = ph;
                            }
                        }
                        //if (at.Depth < 0.0) at.Depth = 0.33;
                        break;
                }
                if (phLast)PolyhedronBuilers.push(phLast);
            });
        }
        rs.SearchDepth();
        rs.IsSurface = rs.IsSurfaceByAtom;
        //console.log(rs.name + rs.index + ' depth: ' + rs.Depth);
        return PolyhedronBuilers;
    }

    static Test(entry: SurfaceSearchEntry, options: SurfaceSearchOptions): boolean {
        var rs = entry.residue;
        var pc = entry.chain;
        var reach: number = (SurfaceSearch.RadiusLiMinimumSet('S', 'CG') + 0.33) * 2.0;
        var rsBounds = rs.GetBounds3d();
        rsBounds.Expand(-reach, reach, -reach, reach, -reach, reach);
        var includeList = entry.chain.atoms.filter((atom) => (atom.name == 'C' || atom.type == 'N' || atom.type == 'O') && rsBounds.Contains(atom.position));

        if (rs.name == 'G') {
            //rs.PseudoBetaDepth = 0.00;
            var atp = rs.GetPseudoBetaCarbonPosition();
            if (atp) {
                var WaterRadius = options.testRadius;
                var SpecificList: Atom[] = [];

                var RadiusPseudoG = SurfaceSearch.RadiusLiMinimumSet('C', 'CG') + WaterRadius;
                var ph = new PolyhedronBuilder2(atp, RadiusPseudoG, WaterRadius, options); // the builder will create a box at the unit of RadiusAtom * Factor + WaterRadius
                var AtomReach = RadiusPseudoG * options.centerAtomFactor + WaterRadius + WaterRadius; // the atom can approach AtomRadius * Factor + Diameter of Water
                var NoRoom: boolean = false;
                includeList.some((pat) => {
                    var TotalReach = pat.GetRadiusLiMinimumSet * options.subtractAtomFactor + AtomReach;
                    if (pat.position.subtract(atp).lengthSquared <= TotalReach * TotalReach) SpecificList.push(pat);
                    NoRoom = (pat.position.equals(atp));
                    return false;
                });
                //console.log('NoRoom: ' + NoRoom);
                if (NoRoom) {
                    rs.IsSurface = false;
                    return false;
                }
                else {
                    //console.log(rs.name + rs.index + '-' + '%B' + ' test with : ' + SpecificList.length);
                    SpecificList.forEach((pat) => {
                        ph.TrySubtract(pat.position, pat.GetRadiusLiMinimumSet);
                    });
                    if (ph.IsEmpty()) {
                        rs.IsSurface = false;
                        return false;
                    }
                    else {
                        //rs.PseudoBetaDepth = WaterRadius;
                        rs.IsSurface = true;
                        return true;
                    }
                }
            }
        }
        else {
            rs.atoms.forEach((at) => {
                switch (at.type) {
                    case 'C': break;
                    case 'O': break;
                    case 'N': break;
                    case 'CA': break;
                    //ignore the backbone atoms
                    default:
                        at.Depth = options.defaultRadius;
                        var WaterRadius = options.testRadius;
                        var SpecificList: Atom[] = [];
                        var atp = at.position;
                        var CenterAtomRadius = at.GetRadiusLiMinimumSet; // this is the radius of the atom
                        var ph = new PolyhedronBuilder2(atp, CenterAtomRadius, WaterRadius, options); // the builder will create a box at the unit of RadiusAtom * Factor + WaterRadius
                        var AtomReach = CenterAtomRadius * options.centerAtomFactor + WaterRadius + WaterRadius; // the atom can approach AtomRadius * Factor + Diameter of Water
                        includeList.forEach((pat) => {
                            var TotalReach = pat.GetRadiusLiMinimumSet * options.subtractAtomFactor + AtomReach;
                            if (pat !== at && pat.position.subtract(atp).lengthSquared < TotalReach * TotalReach) SpecificList.push(pat);
                        });
                        SpecificList.forEach((pat) => {
                            ph.TrySubtract(pat.position, pat.GetRadiusLiMinimumSet)
                        });

                        if (ph.IsEmpty()) {
                            break;
                        }
                        else {
                            at.Depth = WaterRadius;
                        }
                        break;
                }
            });
            rs.IsSurface = rs.IsSurfaceByAtom;
            return rs.IsSurface;
        }
    }
}

class dichotomize {
    static divide(from: number, to: number, level: number, action: (value: number) => boolean, false2true?:boolean ): number {
        var rFrom = action(from);
        var rTo = action(to);
        if (rFrom && rTo) {
            return false2true ? from : to;
        }
        if ((!rFrom) && (!rTo)) {
            return false2true ? to : from;
        }
        if (rFrom && !rTo) {
            return dichotomize.subDivideLeft(from, (from+to)/2,to,  level - 1, action);
        }
        if (rTo && !rFrom) {
            return dichotomize.subDivideRight(from, (from + to) / 2, to, level - 1, action);
        }
    }
    static subDivideLeft(from: number, middle: number, to: number, level: number, action: (value: number) => boolean): number {
        if (level < 0) return middle;
        if (action(middle)) {
            return dichotomize.subDivideLeft(middle, (middle + to) / 2, to, level - 1, action);
        }
        else {
            return dichotomize.subDivideLeft(from, (from + middle) / 2, middle, level - 1, action);
        }
    }
    static subDivideRight(from: number, middle: number, to: number, level: number, action: (value: number) => boolean): number {
        if (level < 0) return middle;
        if (action(middle)) {
            return dichotomize.subDivideRight(from, (from + middle) / 2, middle, level - 1, action);
        }
        else {
            return dichotomize.subDivideRight(middle, (middle + to) / 2, to, level - 1, action);
        }
    }

}