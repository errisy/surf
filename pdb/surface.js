//1. is an amino residue truely buried?
//2. is 
var PDBParser = (function () {
    function PDBParser() {
    }
    PDBParser.parsePDB = function (value) {
        var lines = value.split('\n');
        var ptnHeader = /^ATOM/ig;
        var titles = lines.filter(function (line) { return /^TITLE/ig.IsMatch(line); }).map(function (line) { return line.replace(/^TITLE\s{5}/ig, '').replace(/^TITLE\s{4}\d{1}\s/ig, '').replace(/^TITLE\s{3}\d{2}\s/ig, ''); });
        var sources = lines.filter(function (line) { return /^SOURCE/ig.IsMatch(line); }).map(function (line) { return line.replace(/^SOURCE\s{4}/ig, '').replace(/^SOURCE\s{3}\d{1}\s/ig, '').replace(/^SOURCE\s{2}\d{2}\s/ig, ''); });
        var title = titles.join('');
        var groups = /ORGANISM_SCIENTIFIC\: ([^;]+)/ig.exec(sources.join(''));
        var source;
        if (groups)
            if (groups[1])
                source = groups[1];
        //var ptnAtom = /ATOM  \s*(\d+)\s*(\w+)\s*(\w+)\s*(\w+)\s*(\d+)\s+(\-?[\d\.]+)\s+(\-?[\d\.]+)\s+(\-?[\d\.]+)\s+(\-?[\d\.]+)\s+(\-?[\d\.]+)\s+(\w+)/ig;
        var atoms = lines.filter(function (line) { return ptnHeader.IsMatch(line); });
        var protein = new Structure();
        protein.title = title;
        protein.source = source;
        protein.pdbID = /\s+(\w+)\s*$/ig.Match(lines[0]).groups[1];
        atoms.forEach(function (a) {
            a = a.toUpperCase();
            var type = a.substr(12, 4).replace(/\s+/ig, '');
            var name;
            if (a.length >= 77) {
                name = a.substr(77, 1);
            }
            else {
                name = at.type.substr(0, 1);
            }
            if (name == 'H')
                return; //stop here, no hydrogens!
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
            if (at.name != 'H')
                protein.allocate(at);
        });
        return protein;
    };
    return PDBParser;
}());
var Structure = (function () {
    function Structure() {
        var _this = this;
        this.chainDict = {};
        this.allocate = function (atom) {
            var chain = _this.chainDict[atom.chainName];
            if (!chain) {
                chain = new Chain();
                chain.parent = _this;
                chain.chainID = atom.chainName;
                chain.fullID = _this.pdbID + '_' + chain.chainID;
                _this.chainDict[atom.chainName] = chain;
            }
            chain.allocate(atom);
        };
    }
    return Structure;
}());
var Chain = (function () {
    function Chain() {
        var _this = this;
        this.residueDict = {};
        this.atoms = [];
        this.allocate = function (atom) {
            var residue = _this.residueDict[atom.residueIndex];
            if (!residue) {
                residue = new Residue();
                residue.index = atom.residueIndex;
                residue.name = atom.aminoAcid;
                _this.residueDict[atom.residueIndex] = residue;
            }
            _this.atoms.push(atom);
            residue.atoms.push(atom);
        };
    }
    Object.defineProperty(Chain.prototype, "center", {
        get: function () {
            var count = this.atoms.length;
            if (count <= 0)
                return new Vector3D();
            var x = 0;
            var y = 0;
            var z = 0;
            this.atoms.forEach(function (atom) {
                x += atom.position.x;
                y += atom.position.y;
                z += atom.position.z;
            });
            return new Vector3D(x / count, y / count, z / count);
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Chain.prototype, "data", {
        get: function () {
            var data = new Solubility.ChainData();
            data.name = this.fullID;
            var residues = [];
            for (var key in this.residueDict) {
                var rs = this.residueDict[key];
                residues.push({
                    name: rs.name,
                    index: rs.index,
                    isSurface: rs.IsSurface
                });
            }
            residues.sort(function (a, b) {
                return (a.index > b.index) ? 1 : -1;
            });
            data.value = residues.map(function (rs) { return rs.name + rs.index + (rs.isSurface ? '+' : '-'); }).join('');
            data.title = this.parent.title;
            data.source = this.parent.source;
            return data;
        },
        enumerable: true,
        configurable: true
    });
    return Chain;
}());
var ResidueStatus = (function () {
    function ResidueStatus() {
    }
    return ResidueStatus;
}());
var Residue = (function () {
    function Residue() {
        var _this = this;
        this.atoms = [];
        this.GetPseudoBetaCarbonPosition = function () {
            var CA = _this.AtomByName('CA');
            var C = _this.AtomByName('C');
            var CB = _this.AtomByName('N');
            if (CA && C && CB) {
                var disA = CA.position.subtract(C.position);
                var disB = CB.position.subtract(C.position);
                var disC = disA.divideBy(disA.length).add(disB.divideBy(disB.length));
                disC.divide(disC.length);
                var BaseZ = disA.orthogonalWith(disB);
                return Vector3D.sum(disC.multiplyBy(Residue.CCBondLength * Residue.WidthProjection / disC.length), BaseZ.multiplyBy(Residue.CCBondLength * Residue.HeightProjection), CA.position);
            }
            else {
                return null;
            }
        };
        this.AtomByName = function (type) {
            var result;
            var atoms = _this.atoms.some(function (atom) {
                return (atom.type == type) ? ((result = atom), true) : false;
            });
            return result;
        };
        this.SearchDepth = function () {
            if (_this.name == 'G') {
                _this.Depth = _this.PseudoBetaDepth;
            }
            else {
                _this.Depth = 0;
                _this.atoms.forEach(function (at) {
                    switch (at.type) {
                        case 'C': break;
                        case 'O': break;
                        case 'N': break;
                        case 'CA': break;
                        default:
                            if (_this.Depth < at.Depth)
                                _this.Depth = at.Depth;
                    }
                });
            }
        };
        this.AverageDepth = function () {
            var types = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                types[_i - 0] = arguments[_i];
            }
            var sum = 0.0;
            var count = 0;
            types.forEach(function (type) {
                var at = _this.AtomByName(type);
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
        };
        this.MaxDepth = function () {
            var types = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                types[_i - 0] = arguments[_i];
            }
            var max = 0;
            types.forEach(function (type) {
                var at = _this.AtomByName(type);
                if (at && max < at.Depth)
                    max = at.Depth;
            });
            return max;
        };
    }
    Residue.prototype.GetBounds3d = function () {
        var bounds = new Bounds3D();
        this.atoms.forEach(function (atom) { return bounds.Includes(atom.position); });
        return bounds;
    };
    Object.defineProperty(Residue.prototype, "center", {
        get: function () {
            var count = this.atoms.length;
            if (count <= 0)
                return new Vector3D();
            var x = 0;
            var y = 0;
            var z = 0;
            this.atoms.forEach(function (atom) {
                x += atom.position.x;
                y += atom.position.y;
                z += atom.position.z;
            });
            return new Vector3D(x / count, y / count, z / count);
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Residue.prototype, "IsSurfaceByAtom", {
        get: function () {
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
        },
        enumerable: true,
        configurable: true
    });
    //for display
    Residue.prototype.BuildBonds = function () {
        var _this = this;
        var Bonds = [];
        var AddBond = function (AtomNameA, AtomNameB, bondNumber) {
            var A = _this.AtomByName(AtomNameA);
            var B = _this.AtomByName(AtomNameB);
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
        };
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
    };
    Residue.CCBondLength = 0.153;
    Residue.CHBondLength = 0.109;
    Residue.OHBondLength = 0.096;
    Residue.NHBondLength = 0.1;
    Residue.SHBondLength = 0.1348;
    Residue.HeightProjection = 0.816496580927726; //sqrt(6)/3
    Residue.WidthProjection = 0.57735026918962573; //sqrt(3)/3
    Residue.CenterProjection = 0.33333333333333331;
    Residue.TopZProjection = 0.94280904158206336;
    Residue.BottomZProject = 0.47140452079103168;
    Residue.LeftYProjection = 0.816496580927726;
    Residue.TriangleHeightProjection = 0.8660254037844386;
    Residue.TriangleHalfProjection = 0.5;
    return Residue;
}());
var Atom = (function () {
    function Atom() {
        this.position = new Vector3D();
    }
    Object.defineProperty(Atom.prototype, "GetRadiusLiMinimumSet", {
        get: function () {
            return SurfaceSearch.RadiusLiMinimumSet(this.name, this.type);
        },
        enumerable: true,
        configurable: true
    });
    return Atom;
}());
function LogCallback(value) {
}
var SurfaceSearchEntry = (function () {
    function SurfaceSearchEntry() {
    }
    return SurfaceSearchEntry;
}());
var SurfaceSearchOptions = (function () {
    function SurfaceSearchOptions(hydrophilicFactor, hydrophobicFactor, testRadius, defaultRadius) {
        this.centerAtomFactor = 1.2;
        this.subtractAtomFactor = 1.2;
        this.testRadius = 0.20;
        this.defaultRadius = 0.13;
        if (typeof hydrophilicFactor == 'number' && !isNaN(hydrophilicFactor))
            this.centerAtomFactor = hydrophilicFactor;
        if (typeof hydrophobicFactor == 'number' && !isNaN(hydrophobicFactor))
            this.subtractAtomFactor = hydrophobicFactor;
        if (typeof testRadius == 'number' && !isNaN(testRadius))
            this.testRadius = testRadius;
        if (typeof defaultRadius == 'number' && !isNaN(defaultRadius))
            this.defaultRadius = defaultRadius;
    }
    return SurfaceSearchOptions;
}());
var SurfaceSearch = (function () {
    function SurfaceSearch() {
    }
    // N-H*O hydrogen bond can be as short as 1.717+1.002 (2.719) or 1.104+1.489 (2.593)
    SurfaceSearch.RadiusLiMinimumSet = function (name, type) {
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
    };
    SurfaceSearch.Search = function (entry, options) {
        var PolyhedronBuilers = [];
        var rs = entry.residue;
        var pc = entry.chain;
        var reach = (SurfaceSearch.RadiusLiMinimumSet('S', 'CG') + 0.33) * 2.0;
        var rsBounds = rs.GetBounds3d();
        rsBounds.Expand(-reach, reach, -reach, reach, -reach, reach);
        var includeList = entry.chain.atoms.filter(function (atom) { return (atom.name == 'C' || atom.type == 'N' || atom.type == 'O') && rsBounds.Contains(atom.position); });
        if (rs.name == 'G') {
            rs.PseudoBetaDepth = 0.00;
            var atp = rs.GetPseudoBetaCarbonPosition();
            if (atp) {
                for (var WaterRadius = 0.01; WaterRadius <= 0.332; WaterRadius += 0.005) {
                    var SpecificList = [];
                    var RadiusPseudoG = SurfaceSearch.RadiusLiMinimumSet('C', 'CG') + WaterRadius;
                    var ph = new PolyhedronBuilder2(atp, RadiusPseudoG, WaterRadius, options); // the builder will create a box at the unit of RadiusAtom * Factor + WaterRadius
                    var AtomReach = RadiusPseudoG * options.centerAtomFactor + WaterRadius + WaterRadius; // the atom can approach AtomRadius * Factor + Diameter of Water
                    var NoRoom = false;
                    includeList.some(function (pat) {
                        var TotalReach = pat.GetRadiusLiMinimumSet * options.subtractAtomFactor + AtomReach;
                        if (pat.position.subtract(atp).lengthSquared <= TotalReach * TotalReach)
                            SpecificList.push(pat);
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
                        SpecificList.forEach(function (pat) {
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
            if (rs.PseudoBetaDepth < 0.0)
                rs.PseudoBetaDepth = 0.33;
        }
        else {
            rs.atoms.forEach(function (at) {
                var phLast;
                switch (at.type) {
                    case 'C': break;
                    case 'O': break;
                    case 'N': break;
                    case 'CA': break;
                    //ignore the backbone atoms
                    default:
                        at.Depth = 0.00;
                        for (var WaterRadius = 0.01; WaterRadius <= 0.33; WaterRadius += 0.005) {
                            var SpecificList = [];
                            var atp = at.position;
                            var CenterAtomRadius = at.GetRadiusLiMinimumSet; // this is the radius of the atom
                            var ph = new PolyhedronBuilder2(atp, CenterAtomRadius, WaterRadius, options); // the builder will create a box at the unit of RadiusAtom * Factor + WaterRadius
                            var AtomReach = CenterAtomRadius * options.centerAtomFactor + WaterRadius + WaterRadius; // the atom can approach AtomRadius * Factor + Diameter of Water
                            includeList.forEach(function (pat) {
                                var TotalReach = pat.GetRadiusLiMinimumSet * options.subtractAtomFactor + AtomReach;
                                if (pat !== at && pat.position.subtract(atp).lengthSquared < TotalReach * TotalReach)
                                    SpecificList.push(pat);
                            });
                            SpecificList.forEach(function (pat) {
                                ph.TrySubtract(pat.position, pat.GetRadiusLiMinimumSet);
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
                if (phLast)
                    PolyhedronBuilers.push(phLast);
            });
        }
        rs.SearchDepth();
        rs.IsSurface = rs.IsSurfaceByAtom;
        //console.log(rs.name + rs.index + ' depth: ' + rs.Depth);
        return PolyhedronBuilers;
    };
    SurfaceSearch.Test = function (entry, options) {
        var rs = entry.residue;
        var pc = entry.chain;
        var reach = (SurfaceSearch.RadiusLiMinimumSet('S', 'CG') + 0.33) * 2.0;
        var rsBounds = rs.GetBounds3d();
        rsBounds.Expand(-reach, reach, -reach, reach, -reach, reach);
        var includeList = entry.chain.atoms.filter(function (atom) { return (atom.name == 'C' || atom.type == 'N' || atom.type == 'O') && rsBounds.Contains(atom.position); });
        if (rs.name == 'G') {
            //rs.PseudoBetaDepth = 0.00;
            var atp = rs.GetPseudoBetaCarbonPosition();
            if (atp) {
                var WaterRadius = options.testRadius;
                var SpecificList = [];
                var RadiusPseudoG = SurfaceSearch.RadiusLiMinimumSet('C', 'CG') + WaterRadius;
                var ph = new PolyhedronBuilder2(atp, RadiusPseudoG, WaterRadius, options); // the builder will create a box at the unit of RadiusAtom * Factor + WaterRadius
                var AtomReach = RadiusPseudoG * options.centerAtomFactor + WaterRadius + WaterRadius; // the atom can approach AtomRadius * Factor + Diameter of Water
                var NoRoom = false;
                includeList.some(function (pat) {
                    var TotalReach = pat.GetRadiusLiMinimumSet * options.subtractAtomFactor + AtomReach;
                    if (pat.position.subtract(atp).lengthSquared <= TotalReach * TotalReach)
                        SpecificList.push(pat);
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
                    SpecificList.forEach(function (pat) {
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
            rs.atoms.forEach(function (at) {
                switch (at.type) {
                    case 'C': break;
                    case 'O': break;
                    case 'N': break;
                    case 'CA': break;
                    //ignore the backbone atoms
                    default:
                        at.Depth = options.defaultRadius;
                        var WaterRadius = options.testRadius;
                        var SpecificList = [];
                        var atp = at.position;
                        var CenterAtomRadius = at.GetRadiusLiMinimumSet; // this is the radius of the atom
                        var ph = new PolyhedronBuilder2(atp, CenterAtomRadius, WaterRadius, options); // the builder will create a box at the unit of RadiusAtom * Factor + WaterRadius
                        var AtomReach = CenterAtomRadius * options.centerAtomFactor + WaterRadius + WaterRadius; // the atom can approach AtomRadius * Factor + Diameter of Water
                        includeList.forEach(function (pat) {
                            var TotalReach = pat.GetRadiusLiMinimumSet * options.subtractAtomFactor + AtomReach;
                            if (pat !== at && pat.position.subtract(atp).lengthSquared < TotalReach * TotalReach)
                                SpecificList.push(pat);
                        });
                        SpecificList.forEach(function (pat) {
                            ph.TrySubtract(pat.position, pat.GetRadiusLiMinimumSet);
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
    };
    return SurfaceSearch;
}());
var dichotomize = (function () {
    function dichotomize() {
    }
    dichotomize.divide = function (from, to, level, action, false2true) {
        var rFrom = action(from);
        var rTo = action(to);
        if (rFrom && rTo) {
            return false2true ? from : to;
        }
        if ((!rFrom) && (!rTo)) {
            return false2true ? to : from;
        }
        if (rFrom && !rTo) {
            return dichotomize.subDivideLeft(from, (from + to) / 2, to, level - 1, action);
        }
        if (rTo && !rFrom) {
            return dichotomize.subDivideRight(from, (from + to) / 2, to, level - 1, action);
        }
    };
    dichotomize.subDivideLeft = function (from, middle, to, level, action) {
        if (level < 0)
            return middle;
        if (action(middle)) {
            return dichotomize.subDivideLeft(middle, (middle + to) / 2, to, level - 1, action);
        }
        else {
            return dichotomize.subDivideLeft(from, (from + middle) / 2, middle, level - 1, action);
        }
    };
    dichotomize.subDivideRight = function (from, middle, to, level, action) {
        if (level < 0)
            return middle;
        if (action(middle)) {
            return dichotomize.subDivideRight(from, (from + middle) / 2, middle, level - 1, action);
        }
        else {
            return dichotomize.subDivideRight(middle, (middle + to) / 2, to, level - 1, action);
        }
    };
    return dichotomize;
}());
//# sourceMappingURL=surface.js.map