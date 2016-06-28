class PDB {
    static blastUrl = 'http://www.rcsb.org/pdb/rest/getBlastPDB1?sequence={0}&eCutOff=10.0&matrix=BLOSUM62&outputFormat=XML';

    static includePDBModelFilter(app: ngstd.AngularModule) {
        app.app.filter('pdbmodel', () => {
            return (input: string) => {
                if (!input) return '';
                if (!(typeof input == 'string')) return input.toString();
                var index = input.indexOf('_');
                if (index < 0) return 'http://www.rcsb.org/pdb/explore/explore.do?structureId=' + input;
                return 'http://www.rcsb.org/pdb/explore/explore.do?structureId=' + input.substr(0, index);
            };
        });
    }

    public searcher: PDBSearcher;
    public searchPDB(proteins: Solubility.ProteinSequence[], parallelCallLimit: number, messageHandler?:(value:string)=>void, useCallCount?: boolean) {
        this.cancelSearch();
        this.searcher = new PDBSearcher(proteins, parallelCallLimit, messageHandler, useCallCount);
    }
    public cancelSearch() {
        if (this.searcher) {
            this.searcher.isCancelled = true;
            this.searcher = null;
        }
    }
    static urlFile = 'http://files.rcsb.org/download/{0}.pdb';
    static downloadPDB(id: string, callback: ng.IHttpPromiseCallback<string>) {
        var url = PDB.urlFile.replace('{0}', id);
        CORS.get(url).success(callback);
    }
    static analyzeProteinCallback(protein: Solubility.ProteinSequence, value: string) {

        var xml = jQuery(jQuery.parseXML(value));
        var hits = xml.find('Hit');
        var min = Math.min(hits.length, 20); 
        protein.models = [];
        for (var i: number = 0; i < min; i++) {
            var jHit = jQuery(hits[i]);
            var mDef = PDB.ptnDef.Match(jHit.children('Hit_def')[0].innerHTML)
            var pdbID = mDef.groups[1];
            var hitLength = Number(jHit.children('Hit_len')[0].innerHTML);

            var chains = mDef.groups[3].split(',').filter((chr) => chr.length > 0);
            var hitHsps:Solubility.HitHsp[] = [];

            jHit.find('Hsp').each((hspIndex: number, hspElem: Element) => {
                var jHitHsp = jQuery(hspElem);
                var hsp = new Solubility.HitHsp();
                hsp.bitScore = Number(jHitHsp.children('Hsp_bit-score')[0].innerHTML);
                hsp.score = Number(jHitHsp.children('Hsp_score')[0].innerHTML);
                hsp.eValue = Number(jHitHsp.children('Hsp_evalue')[0].innerHTML);

                hsp.hitQueryFrom = Number(jHitHsp.children('Hsp_query-from')[0].innerHTML);
                hsp.hitQueryTo = Number(jHitHsp.children('Hsp_query-to')[0].innerHTML);
                hsp.hitFrom = Number(jHitHsp.children('Hsp_hit-from')[0].innerHTML);
                hsp.hitTo = Number(jHitHsp.children('Hsp_hit-to')[0].innerHTML);
                hsp.hitIdentity = Number(jHitHsp.children('Hsp_identity')[0].innerHTML);
                hsp.hitPositive = Number(jHitHsp.children('Hsp_positive')[0].innerHTML);
                hsp.hitAlignLength = Number(jHitHsp.children('Hsp_align-len')[0].innerHTML);
                hitHsps.push(hsp);
            });
            protein.models.addRange(chains.map((chain) => {
                var model = new Solubility.StructureModel();
                model.created = PHPDate.now();
                model.ID = pdbID + '_' + chain;
                model.hitLength = hitLength;
                model.hitHsps = hitHsps;
                return model;
            }));
        }
    }
    static ptnDef = /^(\w+)\:(\d+)\:([\w,]+)/ig;
}

class PDBSearcher {
    public proteins: Solubility.ProteinSequence[];
    public onRetrieved: (retrieved: string) => void;
    public useCallCount: boolean;
    public total: number = 0;
    public completed: number = 0;
    public isCancelled: boolean;
    public messageHandler: (value: string) => void;
    constructor(proteins: Solubility.ProteinSequence[], parallelCallLimit: number, messageHandler?: (value: string) => void, useCallCount?: boolean) {
        this.proteins = proteins;
        this.useCallCount = useCallCount;
        this.parallelCallLimit = parallelCallLimit;
        this.messageHandler = messageHandler;
        this.total = proteins.length;
        this.require();
    }
    public parallelCallLimit: number = 5;
    public parallelCallNumber: number = 0;
    public count: number = 0;
    public require = () => {
        if (this.isCancelled) return;
        if (this.parallelCallNumber < this.parallelCallLimit && this.proteins.length > 0) {
            var ids = this.proteins.splice(0, Math.min(this.parallelCallLimit - this.parallelCallNumber, this.proteins.length));
            this.count += 1;
            this.parallelCallNumber += ids.length;
            var that = this;
            ids.forEach((protein: Solubility.ProteinSequence) => {
                var url = PDB.blastUrl.replace('{0}', protein.sequence);
                CORS.get(this.useCallCount ? url + '&CallCountRefresher=' + this.count.toString() : url)
                    .success(that.downloadCallback(protein))
                    .error(that.downloadError(protein));
            });
        }
    }
    public downloadCallback = (protein: Solubility.ProteinSequence) => {
        var that = this;
        return (value: string) => {
            that.parallelCallNumber -= 1;
            that.require();
            that.completed += 1;
            PDB.analyzeProteinCallback(protein, value);
        };
    }
    public downloadError = (protein: Solubility.ProteinSequence) => {
        var that = this;
        return (value: string) => {
            that.parallelCallNumber -= 1;
            that.proteins.push(protein);//add the id back to list because of error;
            console.log('Download Failure: ' + protein.ID + '. It will be tried again later.');
            that.require();
        };
    }
}

interface ISequenceScope extends ng.IScope {
    chain: Solubility.ChainData | Solubility.ProteinSequence;
    residues: IResidue[];
}
interface ISequenceDirectiveScope extends ng.IScope {
    chain: string;
}

interface IResidue {
    name: string;
    index: string;
    top: number;
    bar: number;
    bottom: number;
    surface: string;
    color: string;
}

class SequenceDirective extends ngstd.AngularDirective<ISequenceDirectiveScope>{
    constructor() {
        super();
        
        this.restrict = ngstd.DirectiveRestrict.A;
        this.scope.chain = ngstd.BindingRestrict.OptionalBoth;
        this.template = '<div style="margin:0px;padding:0px;display:inline-block;flex:0 1 auto;border:none;">'
            + '            <div ng-repeat="residue in residues track by $index" style="width:24px;height:62px;display:inline-block;padding:0px;margin:0px;">'
            + '                <div style="background-color:white;width:24px;height:{{residue.top}}px;bottom:0px;position:relative;border:none;">'
            + '                </div>'
            + '                <div style="background-color:{{residue.color}};width:24px;height:{{residue.bar}}px;bottom:0px;position:relative;">'
            + '                </div>'
            + '                <div style="background-color:white;width:24px;height:{{residue.bottom}}px;bottom:0px;position:relative;">'
            + '                </div>'
            + '                <div style="background-color:{{residue.surface}};width:24px;height:20px;bottom:0px;position:relative;font-weight:bold;text-align:center;">'
            + '                    {{residue.name}}'
            + '                </div>'
            + '                <div style="background-color:{{($index % 2)==1&&\'Gainsboro\'||\'white\'}};width:24px;height:20px;bottom:0px;position:relative;text-align:center;">'
            + '                    {{residue.index}}'
            + '                </div>'
            + '            </div>'
            + '        </div>';
        this.link = (scope: ISequenceScope, element: ng.IAugmentedJQuery, attr: ng.IAttributes) => {
            var blue = ColorUtil.HSLfromRGB(0, 0, 255);
            var red = ColorUtil.HSLfromRGB(255, 0, 0);
            scope.$watch('chain', (nChain: Solubility.ChainData | Solubility.ProteinSequence, oChain: Solubility.ChainData | Solubility.ProteinSequence) => {
                //console.log('chain changed:', nChain, typeof nChain);
                scope.residues = [];
                if (typeof nChain == 'object') {
                    if (nChain['@@Table'] == 'ProteinSequence') {
                        //console.log('ProteinSequence:', nChain);
                        var sequence: Solubility.ProteinSequence = <any>nChain;
                        for (var i = 0; i < sequence.sequence.length; i++) {
                            var aa = sequence.sequence.charAt(i);
                            var hydro = ProteinUtil.GetResidueHydrophobicity(aa);
                            var index = (i+1).toString();
                            var color = ColorUtil.HSL2RGB(ColorUtil.interpolate(red, blue, -5, 5, hydro)).toColorString();
                            var top: number;
                            var bar: number;
                            var bottom: number;
                            if (hydro > 0) {
                                top = 25;
                                bar = 5 * hydro;
                                bottom = 25 - bar;
                            }
                            else {
                                bottom = 25;
                                bar = -5 * hydro;
                                top = 25 - bar;
                            }
                            scope.residues.push({
                                name: aa,
                                index: index,
                                top: top,
                                bar: bar,
                                color: color,
                                bottom: bottom,
                                surface: 'white'
                            });
                        }
                    }
                    if (nChain['value']) if (/(\w)(\d+)([\+\-])/ig.IsMatch(nChain['value'])) {
                        console.log('Solubility.ChainData:', nChain);
                        var chainData: Solubility.ChainData = <any>nChain;
                        /(\w)(\d+)([\+\-])/ig.Matches(chainData.value).forEach((m) => {
                            var aa = m.groups[1];
                            var hydro = ProteinUtil.GetResidueHydrophobicity(aa);
                            var index = m.groups[2];
                            var surface = m.groups[3];
                            var color = ColorUtil.HSL2RGB(ColorUtil.interpolate(red, blue, -5, 5, hydro)).toColorString();
                            var top: number;
                            var bar: number;
                            var bottom: number;
                            if (hydro > 0) {
                                top = 25;
                                bar = 5 * hydro;
                                bottom = 25 - bar;
                            }
                            else {
                                bottom = 25;
                                bar = -5 * hydro;
                                top = 25 - bar;
                            }
                            scope.residues.push({
                                name: aa,
                                index: index,
                                top: top,
                                bar: bar,
                                color: color,
                                bottom: bottom,
                                surface: (surface == '+') ? 'cyan' : 'yellow'
                            });
                        });
                    }
                }
            });
        }
        //console.log('sequence directive');
    }
}
interface IAlignmentGroup {
    residues: IResidue[];
    score: string;
    index: number;
}
interface IAlignmentData {
    title: string;
    alignment: {
        [id: string]: string,
        $score: string,
        $surface: string,
        $model: string
    };//$score for score; $surface are the data for notifying which are surface and core
}
interface IAlignmentScope extends ng.IScope {
    alignment: IAlignmentData;
    groups: IAlignmentGroup[];
    title: string;
}
interface IAlignmentDirectiveScope extends ng.IScope {
    alignment: string;
    chains: string;
}
class AlignmentDirective extends ngstd.AngularDirective<IAlignmentDirectiveScope>{
    constructor() {
        super();
        this.restrict = ngstd.DirectiveRestrict.A;
        this.scope.chains = ngstd.BindingRestrict.OptionalBoth;
        this.scope.alignment = ngstd.BindingRestrict.OptionalBoth;
        this.template = '<div style="margin:0px;padding:0px;display:inline-block;flex:0 1 auto;border:none;">'
            + '            <div ng-repeat="group in groups track by $index" style="width:24px;height:62px;display:inline-block;padding:0px;margin:0px;">'
            + '<div ng-repeat="residue in group.residues">'
            + '                <div style="background-color:white;width:24px;height:{{residue.top}}px;bottom:0px;position:relative;border:none;">'
            + '                </div>'
            + '                <div style="background-color:{{residue.color}};width:24px;height:{{residue.bar}}px;bottom:0px;position:relative;">'
            + '                </div>'
            + '                <div style="background-color:white;width:24px;height:{{residue.bottom}}px;bottom:0px;position:relative;">'
            + '                </div>'
            + '                <div style="background-color:{{residue.surface}};width:24px;height:20px;bottom:0px;position:relative;font-weight:bold;text-align:center;">'
            + '                    {{residue.name}}'
            + '                </div>'
            + '                <div style="background-color:{{(group.index % 2)==1&&\'Gainsboro\'||\'white\'}};white-space:pre;width:24px;height:20px;bottom:0px;position:relative;text-align:center;">{{residue.index}}</div>'
            + '</div>'
            + '<div style="background-color:yellow;border-bottom:1px solid black;white-space:pre;width:24px;height:20px;bottom:0px;position:relative;text-align:center;font-weight:bold;display:inline-block;padding:0px;margin:0px;">{{group.score}}</div>'
            + '            </div>'
            + '        </div>';
        this.link = (scope: IAlignmentScope, element: ng.IAugmentedJQuery, attr: ng.IAttributes) => {
            //convert IAlignment to groups and residues;
            scope.$watch('alignment', (nValue: IAlignmentData, oValue: IAlignmentData) => {

                scope.groups = [];
                if (!nValue) return;

                var score: string = nValue.alignment.$score;
                var surface: string = nValue.alignment.$surface;
                var model: string = nValue.alignment.$model;
                scope.title = nValue.title;
                var align: { [id: string]: string } = {};

                var blue = ColorUtil.HSLfromRGB(0, 0, 255);
                var red = ColorUtil.HSLfromRGB(255, 0, 0);

                var indices: { [id: string]: number } = <any>{};

                for (let key in nValue.alignment) {
                    if (key != '$score' && key != '$surface') {
                        align[key] = nValue.alignment[key];
                        indices[key] = 0;
                    }
                }
                var ptnSurface = /(\w)(\d+)([\+\-])/g;
                //console.log(surface);

                var groups = [];

                for (let i: number = 0; i < score.length; i++) {
                    var group: IAlignmentGroup = <any>{};
                    group.residues = [];
                    group.index = i;
                    group.score = score.charAt(i);
                    var surfaceColor: string = 'white';
                    var modelIndex: string = undefined;
                    if (model && surface) {
                        if (model.charAt(i) != '-') {
                            var surfaceArr = ptnSurface.exec(surface);
                            if (surfaceArr) {
                                switch (surfaceArr[3]) {
                                    case '+':
                                        surfaceColor = 'cyan';
                                        break;
                                    case '-':
                                        surfaceColor = 'yellow';
                                        break;
                                    case ' ':
                                        surfaceColor = 'grey';
                                        break;
                                }
                                modelIndex = surfaceArr[2];
                            }
                        }
                    }
                    for (let key in align) {
                        var residue: IResidue = <any>{};
                        var aa = align[key].charAt(i);
                        if (aa != '-') indices[key] += 1;
                        var hydro = ProteinUtil.GetResidueHydrophobicity(aa);
                        var index = (i + 1).toString();
                        var color = ColorUtil.HSL2RGB(ColorUtil.interpolate(red, blue, -5, 5, hydro)).toColorString();
                        var top: number;
                        var bar: number;
                        var bottom: number;
                        if (hydro > 0) {
                            top = 25;
                            bar = 5 * hydro;
                            bottom = 25 - bar;
                        }
                        else {
                            bottom = 25;
                            bar = -5 * hydro;
                            top = 25 - bar;
                        }
                        var _index = ' ';
                        //(key == '$model') ? (surface ? (modelIndex ? modelIndex : ' ') : indices[key].toString()): indices[key].toString()
                        if (key == '$model') {
                            if (surface) {
                                if (modelIndex) {
                                    _index = modelIndex;
                                }
                            }
                            else {
                                _index = indices[key].toString();
                            }
                        }
                        else {
                            _index = indices[key].toString();
                        }
                        //console.log('key:', key, _index, modelIndex);
                        group.residues.push({
                            name: aa,
                            index: _index,
                            top: top,
                            bar: bar,
                            color: color,
                            bottom: bottom,
                            surface: surfaceColor
                        });
                    }


                    groups.push(group);
                }
                scope.groups = groups;
            });
        };
    }
}