var ProteinUtil = (function () {
    function ProteinUtil() {
    }
    ProteinUtil.parseTriplet = function (code) {
        var triplet = code.toUpperCase();
        switch (triplet) {
            case 'PHE': return 'F';
            case 'LEU': return 'L';
            case 'SER': return 'S';
            case 'TYR': return 'Y';
            case 'CYS': return 'C';
            case 'TRP': return 'W';
            case 'PRO': return 'P';
            case 'HIS': return 'H';
            case 'GLN': return 'Q';
            case 'ARG': return 'R';
            case 'ILE': return 'I';
            case 'MET': return 'M';
            case 'THR': return 'T';
            case 'ASN': return 'N';
            case 'LYS': return 'K';
            case 'VAL': return 'V';
            case 'ALA': return 'A';
            case 'ASP': return 'D';
            case 'GLU': return 'E';
            case 'GLY': return 'G';
        }
    };
    ProteinUtil.AnalyzeFASTA = function (value) {
        var mc = ProteinUtil.ptnFASTA.Matches(value);
        var title;
        var body;
        var end;
        var sequences = [];
        for (var i = 0; i < mc.length; i++) {
            title = mc[i].groups[0];
            if (i < mc.length - 1) {
                end = mc[i + 1].index;
                body = value.substring(mc[i].lastIndex, end);
            }
            else {
                end = value.length;
                body = value.substring(mc[i].lastIndex, end);
            }
            var protein = new Solubility.ProteinSequence();
            if (ProteinUtil.ptnUniProtTitle.IsMatch(title)) {
                var m = ProteinUtil.ptnUniProtTitle.Match(title);
                protein.ID = m.groups[2];
                protein.link = 'http://www.uniprot.org/uniprot/' + protein.ID;
                var mx = ProteinUtil.ptnUniProtKey.Matches(m.groups[3]);
                var key;
                var sec;
                var secEnd;
                for (var j = 0; j < mx.length; j++) {
                    key = mx[j].groups[0];
                    if (j < mx.length - 1) {
                        secEnd = mx[j + 1].index;
                        sec = m.groups[3].substring(mx[j].lastIndex, secEnd);
                    }
                    else {
                        secEnd = m.groups[3].length;
                        sec = m.groups[3].substring(mx[j].lastIndex, secEnd);
                    }
                    //console.log('key:' + key + ':' + sec);
                    if (key == ' OS=') {
                        protein.source = sec;
                    }
                }
            }
            else {
                protein.ID = title.substr(1);
            }
            protein.sequence = ProteinUtil.AminoAcidFilter(body);
            sequences.push(protein);
        }
        return sequences;
    };
    ProteinUtil.AminoAcidFilter = function (value) {
        var mc = ProteinUtil.AminoAcidPattern.Matches(value);
        var code = [];
        for (var j = 0; j < mc.length; j++) {
            code.push(mc[j].groups[0].toUpperCase());
        }
        return code.join('');
    };
    ProteinUtil.GetResidueHydrophobicity = function (code) {
        switch (code) {
            //Case "ala", "a"
            //    Return 1.8#
            case 'A': return 1.8;
            //Case "arg", "r"
            //    Return -4.5#
            case 'R': return -4.5;
            //Case "asn", "n"
            //    Return -3.5#
            case 'N': return -3.5;
            //Case "asp", "d"
            //    Return -3.5#
            case 'D': return -3.5;
            //Case "cys", "c"
            //    Return 2.5#
            case 'C': return 2.5;
            //Case "glu", "e"
            //    Return -3.5#
            case 'E': return -3.5;
            //Case "gln", "q"
            //    Return -3.5#
            case 'Q': return -3.5;
            //Case "gly", "g"
            //    Return -0.4#
            case 'G': return -0.4;
            //Case "his", "h"
            //    Return -3.2#
            case 'H': return -3.2;
            //Case "ile", "i"
            //    Return 4.5#
            case 'I': return 4.5;
            //Case "leu", "l"
            //    Return 3.8#
            case 'L': return 3.8;
            //Case "lys", "k"
            //    Return -3.9#
            case 'K': return -3.9;
            //Case "met", "m"
            //    Return 1.9#
            case 'M': return 1.9;
            //Case "phe", "f"
            //    Return 2.8#
            case 'F': return 2.8;
            //Case "pro", "p"
            //    Return -1.6#
            case 'P': return 1.6;
            //Case "ser", "s"
            //    Return -0.8#
            case 'S': return -0.8;
            //Case "thr", "t"
            //    Return -0.7#
            case 'T': return -0.7;
            //Case "trp", "w"
            //    Return -0.9#
            case 'W': return -0.9;
            //Case "tyr", "y"
            //    Return -1.3#
            case 'Y': return -1.3;
            //Case "val", "v"
            //    Return 4.2#
            case 'V': return 4.2;
            //Case Else
            //    Return 0.0#
            default: return 0;
        }
    };
    ProteinUtil.GetHydrophobicityColor = function (residue) {
        var blue = ColorUtil.HSLfromRGB(0, 0, 255);
        var red = ColorUtil.HSLfromRGB(255, 0, 0);
        return ColorUtil.HSL2RGB(ColorUtil.interpolate(red, blue, -5, 5, ProteinUtil.GetResidueHydrophobicity(residue)));
    };
    ProteinUtil.IsCharge = function (code) {
        switch (code) {
            case 'R': return 1;
            case 'K': return 1;
            case 'D': return 1;
            case 'E': return 1;
            default: return 0;
        }
    };
    ProteinUtil.GetAliphaticIndex = function (code) {
        switch (code) {
            case 'A':
                return 1.0;
            case 'V':
                return 2.9;
            case 'L':
                return 3.9;
            case 'I':
                return 3.9;
            default:
                return 0;
        }
    };
    ProteinUtil.CalculateMaxContigousHydrophobic = function (sequence) {
        return ProteinUtil.ptnHydrophobic.Matches(sequence)
            .map(function (mHydro) { return mHydro.length; })
            .reduce(function (accumulated, value) { return accumulated > value ? accumulated : value; }, 0);
    };
    ProteinUtil.CalculateProteinParameters = function (protein) {
        var count = 0;
        var hydro = 0;
        var charge = 0;
        var pro = 0;
        var cys = 0;
        var ali = 0;
        var turn = 0;
        for (var i = 0; i < protein.sequence.length; i++) {
            count += 1;
            var chr = protein.sequence.charAt(i);
            hydro += ProteinUtil.GetResidueHydrophobicity(chr);
            charge += ProteinUtil.IsCharge(chr);
            if (chr == 'P')
                pro += 1;
            if (chr == 'C')
                cys += 1;
            if (ProteinUtil.ptnTurnForming.IsMatch(chr))
                turn += 1;
            ali += ProteinUtil.GetAliphaticIndex(chr);
        }
        protein.hydrophobicityAverage = hydro / count;
        protein.numberOfCharge = charge;
        protein.percentageOfCharge = charge / count * 100;
        protein.aliphaticIndex = ali / count * 100;
        protein.numberOfProline = pro;
        protein.percentageOfProline = pro / count * 100;
        protein.numberOfCysteine = cys;
        protein.percentageOfCysteine = cys / count * 100;
        protein.turnFormingRate = turn / count * 100;
        protein.maxContigousHydrophobic = ProteinUtil.CalculateMaxContigousHydrophobic(protein.sequence);
        protein.created = PHPDate.now();
        return protein;
    };
    ProteinUtil.AminoAcidPattern = /[acdefghiklmnpqrstvwy]+/ig;
    ProteinUtil.ptnFASTA = />[^\n]+/g;
    ProteinUtil.ptnUniProtTitle = />(\w+)\|(\w+)\|([^\n]+)/g;
    ProteinUtil.ptnUniProtKey = /\s[\w]{2}=/g;
    ProteinUtil.ptnTurnForming = /[NDGSP]/ig;
    ProteinUtil.ptnHydrophobic = /[AFILVW]+/ig;
    return ProteinUtil;
}());
var FASTA = (function () {
    function FASTA() {
    }
    return FASTA;
}());
var Solubility;
(function (Solubility) {
    var ProteinProject = (function () {
        function ProteinProject() {
            var _this = this;
            this.proteins = [];
            this.chains = {};
            this.buildChains = function () {
                _this.proteins.collectUnique(function (pro) { return pro.models.map(function (model) { return model.ID; }); }).forEach(function (id) {
                    var key = id.toUpperCase();
                    if (!_this.chains[key]) {
                        _this.chains[key] = new StructureChain();
                        _this.chains[key].ID = key;
                    }
                });
            };
            this.getMissingChains = function () {
                var missing = [];
                for (var id in _this.chains) {
                    if (!_this.chains[id].surface)
                        missing.push(id);
                }
                return missing;
            };
            this['@@Schema'] = 'Solubility';
            this['@@Table'] = 'ProteinProject';
        }
        return ProteinProject;
    }());
    Solubility.ProteinProject = ProteinProject;
    var StructureChain = (function () {
        function StructureChain() {
            this['@@Schema'] = 'Solubility';
            this['@@Table'] = 'StructureChain';
        }
        return StructureChain;
    }());
    Solubility.StructureChain = StructureChain;
    var ProteinSequence = (function () {
        function ProteinSequence() {
            this.models = [];
            this['@@Schema'] = 'Solubility';
            this['@@Table'] = 'ProteinSequence';
        }
        Object.defineProperty(ProteinSequence.prototype, "model", {
            //get the first model of the models array;
            get: function () {
                if (!this.models)
                    return undefined;
                if (!this.models[0])
                    return undefined;
                return this.models[0];
            },
            enumerable: true,
            configurable: true
        });
        return ProteinSequence;
    }());
    Solubility.ProteinSequence = ProteinSequence;
    var StructureModel = (function () {
        function StructureModel() {
            this.hitHsps = [];
            this['@@Schema'] = 'Solubility';
            this['@@Table'] = 'StructureModel';
        }
        return StructureModel;
    }());
    Solubility.StructureModel = StructureModel;
    var HitHsp = (function () {
        function HitHsp() {
            this['@@Schema'] = 'Solubility';
            this['@@Table'] = 'HitHsp';
        }
        return HitHsp;
    }());
    Solubility.HitHsp = HitHsp;
    var ProjectCache = (function () {
        function ProjectCache() {
            this.proteins = [];
            this['@@Schema'] = 'Solubility';
            this['@@Table'] = 'ProjectCache';
        }
        return ProjectCache;
    }());
    Solubility.ProjectCache = ProjectCache;
})(Solubility || (Solubility = {}));
var ConditionNodeOptions = (function () {
    function ConditionNodeOptions() {
        this.methods = ['And', 'Or'];
        this.modes = ['value', 'tree'];
        this.operators = ['@', '!'];
    }
    return ConditionNodeOptions;
}());
var FieldCondition = (function () {
    function FieldCondition(name, conditions) {
        this.name = name;
        this.conditions = conditions;
    }
    FieldCondition.numberConditions = ['=', '>', '<', '>=', '<=', '!='];
    FieldCondition.stringConditions = ['Equals', 'Contains', 'BeginWith', 'EndWith', 'RegularExpressionMatch'];
    return FieldCondition;
}());
var ConditionNode = (function () {
    function ConditionNode(options, parent) {
        var _this = this;
        this.items = [];
        this.initialize = function () {
            _this.method = _this.options.methods[0];
            _this.mode = _this.options.modes[0];
            _this.operator = _this.options.operators[0];
        };
        this.switchMethod = function () {
            if (!_this.method) {
                _this.method = _this.options.methods[0];
            }
            else {
                var index = _this.options.methods.indexOf(_this.method);
                index += 1;
                if (index >= _this.options.methods.length)
                    index = 0;
                _this.method = _this.options.methods[index];
            }
        };
        this.addEntry = function () {
            _this.items.add(new ConditionNode(_this.options, _this));
        };
        this.switchNot = function () {
            if (!_this.operator) {
                _this.operator = _this.options.operators[0];
            }
            else {
                var index = _this.options.operators.indexOf(_this.operator);
                index += 1;
                if (index >= _this.options.operators.length)
                    index = 0;
                _this.operator = _this.options.operators[index];
            }
        };
        this.switchMode = function () {
            if (!_this.mode) {
                _this.mode = _this.options.modes[0];
            }
            else {
                var index = _this.options.modes.indexOf(_this.mode);
                index += 1;
                if (index >= _this.options.modes.length)
                    index = 0;
                _this.mode = _this.options.modes[index];
            }
            if (_this.onModeChanged)
                _this.onModeChanged();
        };
        this.remove = function () {
            if (_this.parent)
                _this.parent.items.remove(_this);
        };
        this.options = options;
        this.parent = parent;
        this.initialize();
    }
    return ConditionNode;
}());
var ConditionNodeModel = (function () {
    function ConditionNodeModel(data, item) {
        var _this = this;
        this.modeChanged = function () {
            _this.item.refresh();
        };
        this.data = data;
        this.item = item;
        this.data.onModeChanged = this.modeChanged;
    }
    return ConditionNodeModel;
}());
//# sourceMappingURL=proteinutil.js.map