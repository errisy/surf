var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var PDB = (function () {
    function PDB() {
    }
    PDB.includePDBModelFilter = function (app) {
        app.app.filter('pdbmodel', function () {
            return function (input) {
                if (!input)
                    return '';
                if (!(typeof input == 'string'))
                    return input.toString();
                var index = input.indexOf('_');
                if (index < 0)
                    return 'http://www.rcsb.org/pdb/explore/explore.do?structureId=' + input;
                return 'http://www.rcsb.org/pdb/explore/explore.do?structureId=' + input.substr(0, index);
            };
        });
    };
    PDB.prototype.searchPDB = function (proteins, parallelCallLimit, messageHandler, useCallCount) {
        this.cancelSearch();
        this.searcher = new PDBSearcher(proteins, parallelCallLimit, messageHandler, useCallCount);
    };
    PDB.prototype.cancelSearch = function () {
        if (this.searcher) {
            this.searcher.isCancelled = true;
            this.searcher = null;
        }
    };
    PDB.downloadPDB = function (id, callback) {
        var url = PDB.urlFile.replace('{0}', id);
        CORS.get(url).success(callback);
    };
    PDB.analyzeProteinCallback = function (protein, value) {
        var xml = jQuery(jQuery.parseXML(value));
        var hits = xml.find('Hit');
        var min = Math.min(hits.length, 20);
        protein.models = [];
        for (var i = 0; i < min; i++) {
            var jHit = jQuery(hits[i]);
            var mDef = PDB.ptnDef.Match(jHit.children('Hit_def')[0].innerHTML);
            var pdbID = mDef.groups[1];
            var hitLength = Number(jHit.children('Hit_len')[0].innerHTML);
            var chains = mDef.groups[3].split(',').filter(function (chr) { return chr.length > 0; });
            var hitHsps = [];
            jHit.find('Hsp').each(function (hspIndex, hspElem) {
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
            protein.models.addRange(chains.map(function (chain) {
                var model = new Solubility.StructureModel();
                model.created = PHPDate.now();
                model.ID = pdbID + '_' + chain;
                model.hitLength = hitLength;
                model.hitHsps = hitHsps;
                return model;
            }));
        }
    };
    PDB.blastUrl = 'http://www.rcsb.org/pdb/rest/getBlastPDB1?sequence={0}&eCutOff=10.0&matrix=BLOSUM62&outputFormat=XML';
    PDB.urlFile = 'http://files.rcsb.org/download/{0}.pdb';
    PDB.ptnDef = /^(\w+)\:(\d+)\:([\w,]+)/ig;
    return PDB;
}());
var PDBSearcher = (function () {
    function PDBSearcher(proteins, parallelCallLimit, messageHandler, useCallCount) {
        var _this = this;
        this.total = 0;
        this.completed = 0;
        this.parallelCallLimit = 5;
        this.parallelCallNumber = 0;
        this.count = 0;
        this.require = function () {
            if (_this.isCancelled)
                return;
            if (_this.parallelCallNumber < _this.parallelCallLimit && _this.proteins.length > 0) {
                var ids = _this.proteins.splice(0, Math.min(_this.parallelCallLimit - _this.parallelCallNumber, _this.proteins.length));
                _this.count += 1;
                _this.parallelCallNumber += ids.length;
                var that = _this;
                ids.forEach(function (protein) {
                    var url = PDB.blastUrl.replace('{0}', protein.sequence);
                    CORS.get(_this.useCallCount ? url + '&CallCountRefresher=' + _this.count.toString() : url)
                        .success(that.downloadCallback(protein))
                        .error(that.downloadError(protein));
                });
            }
        };
        this.downloadCallback = function (protein) {
            var that = _this;
            return function (value) {
                that.parallelCallNumber -= 1;
                that.require();
                that.completed += 1;
                PDB.analyzeProteinCallback(protein, value);
            };
        };
        this.downloadError = function (protein) {
            var that = _this;
            return function (value) {
                that.parallelCallNumber -= 1;
                that.proteins.push(protein); //add the id back to list because of error;
                console.log('Download Failure: ' + protein.ID + '. It will be tried again later.');
                that.require();
            };
        };
        this.proteins = proteins;
        this.useCallCount = useCallCount;
        this.parallelCallLimit = parallelCallLimit;
        this.messageHandler = messageHandler;
        this.total = proteins.length;
        this.require();
    }
    return PDBSearcher;
}());
var SequenceDirective = (function (_super) {
    __extends(SequenceDirective, _super);
    function SequenceDirective() {
        _super.call(this);
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
        this.link = function (scope, element, attr) {
            var blue = ColorUtil.HSLfromRGB(0, 0, 255);
            var red = ColorUtil.HSLfromRGB(255, 0, 0);
            scope.$watch('chain', function (nChain, oChain) {
                //console.log('chain changed:', nChain, typeof nChain);
                scope.residues = [];
                if (typeof nChain == 'object') {
                    if (nChain['@@Table'] == 'ProteinSequence') {
                        //console.log('ProteinSequence:', nChain);
                        var sequence = nChain;
                        for (var i = 0; i < sequence.sequence.length; i++) {
                            var aa = sequence.sequence.charAt(i);
                            var hydro = ProteinUtil.GetResidueHydrophobicity(aa);
                            var index = (i + 1).toString();
                            var color = ColorUtil.HSL2RGB(ColorUtil.interpolate(red, blue, -5, 5, hydro)).toColorString();
                            var top;
                            var bar;
                            var bottom;
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
                    if (nChain['value'])
                        if (/(\w)(\d+)([\+\-])/ig.IsMatch(nChain['value'])) {
                            console.log('Solubility.ChainData:', nChain);
                            var chainData = nChain;
                            /(\w)(\d+)([\+\-])/ig.Matches(chainData.value).forEach(function (m) {
                                var aa = m.groups[1];
                                var hydro = ProteinUtil.GetResidueHydrophobicity(aa);
                                var index = m.groups[2];
                                var surface = m.groups[3];
                                var color = ColorUtil.HSL2RGB(ColorUtil.interpolate(red, blue, -5, 5, hydro)).toColorString();
                                var top;
                                var bar;
                                var bottom;
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
        };
        //console.log('sequence directive');
    }
    return SequenceDirective;
}(ngstd.AngularDirective));
var AlignmentDirective = (function (_super) {
    __extends(AlignmentDirective, _super);
    function AlignmentDirective() {
        _super.call(this);
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
        this.link = function (scope, element, attr) {
            //convert IAlignment to groups and residues;
            scope.$watch('alignment', function (nValue, oValue) {
                scope.groups = [];
                if (!nValue)
                    return;
                var score = nValue.alignment.$score;
                var surface = nValue.alignment.$surface;
                var model = nValue.alignment.$model;
                scope.title = nValue.title;
                var align = {};
                var blue = ColorUtil.HSLfromRGB(0, 0, 255);
                var red = ColorUtil.HSLfromRGB(255, 0, 0);
                var indices = {};
                for (var key in nValue.alignment) {
                    if (key != '$score' && key != '$surface') {
                        align[key] = nValue.alignment[key];
                        indices[key] = 0;
                    }
                }
                var ptnSurface = /(\w)(\d+)([\+\-])/g;
                //console.log(surface);
                var groups = [];
                for (var i = 0; i < score.length; i++) {
                    var group = {};
                    group.residues = [];
                    group.index = i;
                    group.score = score.charAt(i);
                    var surfaceColor = 'white';
                    var modelIndex = undefined;
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
                    for (var key in align) {
                        var residue = {};
                        var aa = align[key].charAt(i);
                        if (aa != '-')
                            indices[key] += 1;
                        var hydro = ProteinUtil.GetResidueHydrophobicity(aa);
                        var index = (i + 1).toString();
                        var color = ColorUtil.HSL2RGB(ColorUtil.interpolate(red, blue, -5, 5, hydro)).toColorString();
                        var top;
                        var bar;
                        var bottom;
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
    return AlignmentDirective;
}(ngstd.AngularDirective));
//# sourceMappingURL=pdb.js.map