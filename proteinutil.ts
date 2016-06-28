class ProteinUtil {
    static AminoAcidPattern: RegExp = /[acdefghiklmnpqrstvwy]+/ig;
    static ptnFASTA = />[^\n]+/g;
    static ptnUniProtTitle = />(\w+)\|(\w+)\|([^\n]+)/g;
    static ptnUniProtKey = /\s[\w]{2}=/g;
    static parseTriplet(code: string) {
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
    }
    static AnalyzeFASTA(value: string): Solubility.ProteinSequence[] {
        var mc = ProteinUtil.ptnFASTA.Matches(value);
        var title: string;
        var body: string;
        var end: number;
        var sequences: Solubility.ProteinSequence[] = [];
        for (var i: number = 0; i < mc.length; i++) {
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
                var key: string;
                var sec: string;
                var secEnd: number;
                for (var j: number = 0; j < mx.length; j++) {
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
    }
    static AminoAcidFilter(value: string): string {
        var mc = ProteinUtil.AminoAcidPattern.Matches(value);
        var code: string[] = [];
        for (var j: number = 0; j < mc.length; j++) {
            code.push(mc[j].groups[0].toUpperCase());
        }
        return code.join('');
    }
    static GetResidueHydrophobicity(code: string): number {
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
    }
    static GetHydrophobicityColor(residue: string): RGBColor {
        var blue = ColorUtil.HSLfromRGB(0, 0, 255);
        var red = ColorUtil.HSLfromRGB(255, 0, 0);
        return ColorUtil.HSL2RGB(ColorUtil.interpolate(red, blue, -5, 5, ProteinUtil.GetResidueHydrophobicity(residue)));
    }
    static IsCharge(code: string): number {
        switch (code) {
            case 'R': return 1;
            case 'K': return 1;
            case 'D': return 1;
            case 'E': return 1;
            default: return 0;
        }
    }
    static GetAliphaticIndex(code: string): number {
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
    }
    static ptnTurnForming = /[NDGSP]/ig;
    static ptnHydrophobic = /[AFILVW]+/ig;
    static CalculateMaxContigousHydrophobic(sequence: string): number {
        return ProteinUtil.ptnHydrophobic.Matches(sequence)
            .map((mHydro) => mHydro.length)
            .reduce((accumulated, value) => accumulated > value ? accumulated : value, 0);
    }
    static CalculateProteinParameters(protein: Solubility.ProteinSequence): Solubility.ProteinSequence {
        var count: number = 0;
        var hydro: number = 0;
        var charge: number = 0;
        var pro: number = 0;
        var cys: number = 0;
        var ali: number = 0;
        var turn: number = 0;
        for (var i: number = 0; i < protein.sequence.length; i++) {
            count += 1;
            var chr = protein.sequence.charAt(i);
            hydro += ProteinUtil.GetResidueHydrophobicity(chr);
            charge += ProteinUtil.IsCharge(chr);
            if (chr == 'P') pro += 1;
            if (chr == 'C') cys += 1;
            if (ProteinUtil.ptnTurnForming.IsMatch(chr)) turn += 1;
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
    }
}

class FASTA {
    public ID: string;
    public sequence: string;
}
module Solubility {
    export class ProteinProject {
        constructor() {
            this['@@Schema'] = 'Solubility';
            this['@@Table'] = 'ProteinProject';
        }
        public name: string;
        public proteins: ProteinSequence[] = [];
        public chains: { [id: string]: StructureChain } = {};
        public buildChains = () => {
            this.proteins.collectUnique((pro) => pro.models.map((model) => model.ID)).forEach((id) => {
                var key = id.toUpperCase();
                if (!this.chains[key]) {
                    this.chains[key] = new StructureChain();
                    this.chains[key].ID = key;
                }
            });
        }
        public getMissingChains = () => {
            var missing: string[] = [];
            for (var id in this.chains) {
                if (!this.chains[id].surface) missing.push(id);
            }
            return missing;
        }
    }
    export class StructureChain {
        constructor() {
            this['@@Schema'] = 'Solubility';
            this['@@Table'] = 'StructureChain';
        }
        public ID: string;
        public surface: string;
    }
    export class ProteinSequence {
        constructor() {
            this['@@Schema'] = 'Solubility';
            this['@@Table'] = 'ProteinSequence';
        }
        public ID: string;
        public selected: boolean;
        public link: string;
        public sequence: string;
        public source: string;
        public description: string;
        public note: string;
        public created: number;//Time created
        //general parameters that do not rely on alignment;
        public hydrophobicityAverage: number;
        public numberOfCharge: number;
        public percentageOfCharge: number;
        public numberOfProline: number;
        public percentageOfProline: number;
        public numberOfCysteine: number;
        public aliphaticIndex: number;
        public percentageOfCysteine: number;
        public maxContigousHydrophobic: number;
        public turnFormingRate: number;


        public models: Solubility.StructureModel[] = [];

        //get the first model of the models array;
        get model(): Solubility.StructureModel {
            if (!this.models) return undefined;
            if (!this.models[0]) return undefined;
            return this.models[0];
        }
        //properties that based on cutOff
        public cutOff: number;
        public token: number;
        
        public chain: string;
        public matchPercentage: number;

        public surfaceAverage: number;
        public coreAverage: number;
        public contrast: number;

        public tokenHydrophobicityAverage: number;

        public tokenNumberOfCharge: number;
        public tokenPercentageOfCharge: number;

        public tokenNumberOfSurfaceCharge: number; 
        public tokenPercentageOfSurfaceCharge: number;

        public tokenNumberOfProline: number;
        public tokenPercentageOfProline: number;

        public tokenNumberOfCysteine: number;
        public tokenPercentageOfCysteine: number;

        public tokenMaxContigousHydrophobic: number;

        public tokenTurnFormingRate: number;

        public tokenChain: string;

        public tokenAliphaticIndex: number;
        
    }
    export class StructureModel {
        constructor() {
            this['@@Schema'] = 'Solubility';
            this['@@Table'] = 'StructureModel';
        }
        public hitHsps: Solubility.HitHsp[] = [];
        public ID: string;
        public source: string;
        public description: string;
        public hitLength: number;
        public created: number;
        public surfaceAverage: number;
        public coreAverage: number;
        public unknownAverage: number;
        public contrast: number;

        public surfaceCharge: number;
        public coreCharge: number;
        public unknownCharge: number;

        public percentageOfSurfaceCharge: number;
        public percentageOfCoreCharge: number;
        public percentageOfUnknownCharge: number;

        public surfaceCount: number;
        public coreCount: number;
        public unknownCount: number;
        public tokenCount: number;
        public truncatedNCount: number;
        public truncatedCCount: number;
        public matchCount: number;//lengh of (surface + core)
        public matchRate: number;
        public unmatchCount: number; //length of unknown

        public tokenAverage: number;

        public tokenNumberOfCharge: number;
        public tokenPercentageOfCharge: number;

        public tokenNumberOfProline: number;
        public tokenPercentageOfProline: number;

        public tokenNumberOfCysteine: number;
        public tokenPercentageOfCysteine: number;

        public tokenMaxContigousHydrophobic: number;

        public tokenTurnFormingRate: number;

        public tokenAliphaticIndex: number;

        public hostAlign: string;
        public modelAlign: string;
        public scoreAlign: string;
    }
    export class HitHsp {
        constructor() {
            this['@@Schema'] = 'Solubility';
            this['@@Table'] = 'HitHsp';
        }
        public bitScore: number;
        public score: number;
        public eValue: number;
        public hitQueryFrom: number;
        public hitQueryTo: number;
        public hitFrom: number;
        public hitTo: number;
        public hitIdentity: number;
        public hitPositive: number;
        public hitAlignLength: number;
    }
    export class ProjectCache{
        constructor() {
            this['@@Schema'] = 'Solubility';
            this['@@Table'] = 'ProjectCache';
        }
        public name: string;
        public proteins: ProteinSequence[] = [];
        public tag: string;
    }
}

class ConditionNodeOptions {
    public methods: string[] = ['And', 'Or'];
    public modes: string[] = ['value', 'tree'];
    public operators: string[] = ['@', '!'];
    public fields: FieldCondition[];
}

class FieldCondition {
    constructor(name?: string, conditions?: string[]) {
        this.name = name;
        this.conditions = conditions;
    }
    public name: string;
    public conditions: string[];
    static numberConditions = ['=', '>', '<', '>=', '<=', '!='];
    static stringConditions = ['Equals', 'Contains', 'BeginWith', 'EndWith', 'RegularExpressionMatch'];
}

class ConditionNode {
    public options: ConditionNodeOptions;
    public parent: ConditionNode;
    public method: string;
    public mode: string;
    public operator: string;
    public items: ConditionNode[] = [];
    public field: FieldCondition;
    public condition: string;
    public value: string;
    constructor(options: ConditionNodeOptions, parent?: ConditionNode) {
        this.options = options;
        this.parent = parent;
        this.initialize();
    }
    public initialize = () => {
        this.method = this.options.methods[0];
        this.mode = this.options.modes[0];
        this.operator = this.options.operators[0];
    }
    public switchMethod = () => {
        if (!this.method) {
            this.method = this.options.methods[0];
        }
        else {
            var index = this.options.methods.indexOf(this.method);
            index += 1;
            if (index >= this.options.methods.length) index = 0;
            this.method = this.options.methods[index];
        }
    }
    public addEntry = () => {
        this.items.add(new ConditionNode(this.options, this));
    }
    public switchNot = () => {
        if (!this.operator) {
            this.operator = this.options.operators[0];
        }
        else {
            var index = this.options.operators.indexOf(this.operator);
            index += 1;
            if (index >= this.options.operators.length) index = 0;
            this.operator = this.options.operators[index];
        }
    }
    public switchMode = () => {
        if (!this.mode) {
            this.mode = this.options.modes[0];
        }
        else {
            var index = this.options.modes.indexOf(this.mode);
            index += 1;
            if (index >= this.options.modes.length) index = 0;
            this.mode = this.options.modes[index];
        }
        if (this.onModeChanged) this.onModeChanged();
    }
    public remove = () => {
        if (this.parent) this.parent.items.remove(this);
    }
    public onModeChanged: () => void;
}

class ConditionNodeModel {
    public data: ConditionNode;
    public item: ngstd.TreeItemBase;
    constructor(data: ConditionNode, item: ngstd.TreeItemBase) {
        this.data = data;
        this.item = item;
        this.data.onModeChanged = this.modeChanged;
    }
    public modeChanged = () => {
        this.item.refresh();
    }
}