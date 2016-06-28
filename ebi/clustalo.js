var clustalo = (function () {
    function clustalo() {
    }
    clustalo.runCallback = function (value) {
        console.log(value);
    };
    clustalo.RequestError = function (value) {
        console.log('Request Error');
        console.log(value);
    };
    clustalo.urlRun = 'http://www.ebi.ac.uk/Tools/services/rest/clustalo/run/';
    return clustalo;
}());
var ClustalORequest = (function () {
    function ClustalORequest() {
        var _this = this;
        this.entries = [];
        this.checkCount = 0;
        this.checkCountDown = 0; // count down in seconds;
        this.sendRequest = function () {
            var f = new FormUrlEncoded();
            f.append('email', 'info@demo.com');
            f.append('stype', 'protein');
            f.append('sequence', _this.entries
                .map(function (value) { return '>' + value.key + '\n' + ProteinUtil.AminoAcidFilter(value.sequence) + '\n'; })
                .join(''));
            _this.status = 'Submitting ClustalO Aligment Request...';
            //var handler = new ClustalOHandler();
            CORS.post(ClustalORequest.urlRun, f.data, FormUrlEncoded.config)
                .success(_this.requestSuccess)
                .error(_this.requestError);
        };
        this.requestSuccess = function (value) {
            console.log('ClustalO Request Callback:', value);
            _this.id = value;
            _this.checkCountDown = ClustalORequest.statusCheckInterval;
            _this.interval = CORS.interval(_this.checkCountDownTick, 1000);
        };
        this.requestError = function (value) {
            console.log('ClustalO Request Error:', value);
        };
        this.checkCountDownTick = function () {
            if (_this.checkCountDown > 0) {
                _this.checkCountDown -= 1;
            }
            else {
                if (_this.interval) {
                    CORS.interval.cancel(_this.interval);
                    _this.interval = undefined;
                }
                _this.checkCount += 1;
                CORS.get(ClustalORequest.urlStatus.replace('{jobId}', _this.id) + '?' + _this.checkCount.toString())
                    .success(_this.checkCallback)
                    .error(_this.checkError);
            }
        };
        this.checkCallback = function (value) {
            console.log('ClustalO Status Callback:', value);
            if (value == 'FINISHED') {
                //CORS.get(ClustalORequest.urlTypes.replace('{jobId}', this.id))
                //    .success(this.resultTypeCallback)
                //    .error(this.resultTypeError);
                // other types: out sequence aln-clustal phylotree pim
                CORS.get(ClustalORequest.urlResult.replace('{jobId}', _this.id).replace('{resultType}', 'aln-clustal'))
                    .success(_this.resultCallback)
                    .error(_this.resultError);
            }
            else {
                _this.checkCountDown = ClustalORequest.statusCheckInterval;
                _this.interval = CORS.interval(_this.checkCountDownTick, 1000);
            }
        };
        this.checkError = function (value) {
            console.log('ClustalO Status Check Error:', value);
        };
        this.resultTypeCallback = function (value) {
            console.log('ClustalO Result Type Callback:', value);
        };
        this.resultTypeError = function (value) {
            console.log('ClustalO Result Type Error:', value);
        };
        this.resultCallback = function (value) {
            //console.log('ClustalO Result Callback:', value);
            /*
            ClustalO Result Callback: CLUSTAL O(1.2.1) multiple sequence alignment
            
            
            eco:b1380          MKLAVYSTKQYDKKYLQQVNESFG--FELEFFDFLLTEKTAKTANGCEAVCIFVNDDGSR
            xbo:XBJ1_2373      MKLVVYSKKQYDRKHFEMLNQRLGLDYHIEFFDFSLSPQTAKNAIGADAICIFVNDDAGR
                               ***.***.****:*::: :*: :*  :.:***** *: :***.* *.:*:*******..*
            
            eco:b1380          PVLEELKKHGVKYIALRCAGFNNVDLDAAKELGLKVVRVPAYDPEAVAEHAIGMMMTLNR
            xbo:XBJ1_2373      EVLEELAAMNIKILALRCAGFNNVDLDAAKELGIQVVRVPAYSPESVAEHAVGLMLCLNR
                                *****    :* :*******************::*******.**:*****:*:*: ***
            
            eco:b1380          RIHRAYQRTRDANFSLEGLTGFTMYGKTAGVIGTGKIGVAMLRILKGFGMRLLAFDPYPS
            xbo:XBJ1_2373      RIHRAYQRTRDANFSLEGLTGFNMYKRTAGIIGTGKIGLATLRILKGFGMRLLAHDPYPN
                               **********************.** :***:*******:* *************.****.
            
            eco:b1380          AAALELGVEYVDLPTLFSESDVISLHCPLTPENYHLLNEAAFEQMKNGVMIVNTSRGALI
            xbo:XBJ1_2373      KEVLELGVKYVDLDTLYAESDVISLHCPMTPENHHLLDETAFNKMKDGVMIINTSRGALI
                                 .*****:**** **::**********:****:***:*:**::**:****:********
            
            eco:b1380          DSQAAIEALKNQKIGSLGMDVYENERDLFFEDKSNDVIQDDVFRRLSACHNVLFTGHQAF
            xbo:XBJ1_2373      DSIAAINALKQQKIGALGMDVYENERDLFFEDKSNDVIQDDIFRRLSSCHNVLFTGHQAF
                               ** ***:***:****:*************************:*****:************
            
            eco:b1380          LTAEALTSISQTTLQNLSNLEKGETCPNELV
            xbo:XBJ1_2373      LTEEALTSISETTLQNIQQLTSGKSCPNLVG
                               ** *******:*****:.:* .*::*** :
            
            id\s+SEQ
            id\s+SEQ
            
            */
            //work out the spacing length:
            var lines = value.split(/[\r\n]/g);
            var spacing = 0;
            lines.some(function (line) { return _this.entries.some(function (entry) {
                if (line.indexOf(entry.key) == 0) {
                    spacing = entry.key.length + /\s+/g.Match(line.substr(entry.key.length)).groups[0].length;
                    return true;
                }
                else {
                    return false;
                }
            }); });
            var alignment = {};
            var lineIndex = 0;
            var entryCount = _this.entries.length + 2;
            //this.score = '';
            _this.entries.forEach(function (entry) {
                alignment[entry.key] = '';
            });
            alignment['$score'] = '';
            lines.forEach(function (line) {
                if (((lineIndex - 3) % entryCount) < (entryCount - 1)) {
                    _this.entries.some(function (entry) {
                        if (line.indexOf(entry.key) == 0) {
                            alignment[entry.key] = alignment[entry.key] + line.substr(spacing);
                            return true;
                        }
                        else {
                            return false;
                        }
                    });
                }
                if (((lineIndex - 3) % entryCount) == (entryCount - 2)) {
                    //this.score += line.substr(spacing);
                    alignment['$score'] = alignment['$score'] + line.substr(spacing);
                }
                lineIndex += 1;
            });
            _this.alignment = alignment;
            //console.log(this.alignment);
            if (_this.taskCallback)
                _this.taskCallback(_this.input, _this.alignment);
        };
        this.resultError = function (value) {
            console.log('ClustalO Result Error:', value);
        };
        this.alignment = {};
    }
    ClustalORequest.urlRun = 'http://www.ebi.ac.uk/Tools/services/rest/clustalo/run/';
    ClustalORequest.urlStatus = 'http://www.ebi.ac.uk/Tools/services/rest/clustalo/status/{jobId}';
    ClustalORequest.urlResult = 'http://www.ebi.ac.uk/Tools/services/rest/clustalo/result/{jobId}/{resultType}';
    ClustalORequest.urlTypes = 'http://www.ebi.ac.uk/Tools/services/rest/clustalo/resulttypes/{jobId}';
    ClustalORequest.statusCheckInterval = 5;
    return ClustalORequest;
}());
var MultipleTaskRunner = (function () {
    function MultipleTaskRunner() {
        var _this = this;
        this.concurrentLimit = 5;
        this.concurrentNumber = 0;
        this.tasks = [];
        this.cancelled = false;
        this.begin = function () {
            _this.total = _this.tasks.length;
            _this.finished = 0;
            _this.runMore();
        };
        this.finishOne = function () {
            _this.finished += 1;
            _this.concurrentNumber -= 1;
            _this.runMore();
        };
        this.runMore = function () {
            if (_this.cancelled)
                return;
            if (_this.concurrentNumber < _this.concurrentLimit && _this.tasks.length > 0) {
                var batch = _this.tasks.splice(0, Math.min(_this.concurrentLimit - _this.concurrentNumber, _this.tasks.length));
                _this.concurrentNumber += batch.length;
                batch.forEach(function (task) {
                    _this.method(task);
                });
            }
            if (_this.finished == _this.total) {
                if (_this.onComplete)
                    _this.onComplete();
            }
        };
        this.cancel = function () {
            _this.cancelled = true;
        };
    }
    return MultipleTaskRunner;
}());
var ProteinClustal = (function () {
    function ProteinClustal(proteins, project) {
        var _this = this;
        this.numberOfConcurrent = 10;
        this.start = function () {
            _this.runner = new MultipleTaskRunner();
            _this.runner.concurrentLimit = _this.numberOfConcurrent;
            _this.runner.tasks = _this.proteins.collect(function (pro) { return pro.models.collect(function (model) {
                var chain = _this.project.chains[model.ID];
                if (!chain)
                    return [];
                if (!chain.surface)
                    return [];
                var crd = new ClustalRequestData();
                crd.protein = pro;
                crd.model = model;
                crd.surface = _this.project.chains[model.ID];
                return [crd];
            }); });
            _this.runner.method = _this.runClustal;
            _this.runner.onComplete = _this.onComplete;
            _this.runner.begin();
        };
        this.runClustal = function (value) {
            var req = new ClustalORequest();
            var host = new ClustalORequestEntry();
            host.key = 'host';
            host.sequence = value.protein.sequence;
            var stru = new ClustalORequestEntry();
            stru.key = 'stru';
            stru.sequence = ProteinUtil.AminoAcidFilter(_this.project.chains[value.model.ID].surface); /// need find the protein sequence from project;
            req.entries.push(host);
            req.entries.push(stru);
            req.input = value;
            req.taskCallback = _this.taskCallback;
            req.sendRequest();
            console.log('model request sent', value.model.ID);
        };
        this.stop = function () {
            _this.runner.cancel();
        };
        this.taskCallback = function (input, alignment) {
            //console.log('model alignment obtained', input.model.ID);
            input.model.hostAlign = alignment['host'];
            input.model.modelAlign = alignment['stru'];
            input.model.scoreAlign = alignment['$score'];
            SurfaceAnalyzer.Analyze(input.model, input.surface.surface, input.protein.sequence);
            //console.log('input.mode:', input.model);
            _this.runner.finishOne();
        };
        this.proteins = proteins;
        this.project = project;
    }
    return ProteinClustal;
}());
var ClustalRequestData = (function () {
    function ClustalRequestData() {
    }
    return ClustalRequestData;
}());
var ClustalORequestEntry = (function () {
    function ClustalORequestEntry() {
    }
    return ClustalORequestEntry;
}());
var EBIParser = (function () {
    function EBIParser() {
    }
    EBIParser.parseEBI = function (value) {
        var ebi = new EBIEntry();
        return ebi;
    };
    return EBIParser;
}());
var EBIEntry = (function () {
    function EBIEntry() {
    }
    return EBIEntry;
}());
var SurfaceAnalyzer = (function () {
    function SurfaceAnalyzer() {
    }
    SurfaceAnalyzer.Analyze = function (model, surface, sequence) {
        var matchRate = 0;
        var match = 0;
        var unmatch = 0;
        var surfaceCount = 0;
        var coreCount = 0;
        var unknownCount = 0;
        var surfaceHydro = 0;
        var coreHydro = 0;
        var unknownHydro = 0;
        var surfaceCharge = 0;
        var coreCharge = 0;
        var unknownCharge = 0;
        var stb = [];
        var ptnSurface = /(\w)(\d+)([\+\-])/ig; //this should not be static, as static pattern will be shared by different threads.
        var host = model.hostAlign;
        var stru = model.modelAlign;
        var score = model.scoreAlign;
        var length = score.length;
        // ----MMMMM--- from = 4, to = 12 - 3 = 9;
        var mFrom = /^\-+/g.exec(stru);
        var tokenFrom = 0;
        if (mFrom)
            tokenFrom = mFrom[0].length;
        var mTo = /\-+$/g.exec(stru);
        var tokenTo = 0;
        if (mTo)
            tokenTo = length - mTo[0].length;
        var struCount = 0;
        var pro = 0;
        var cys = 0;
        var ali = 0;
        var turn = 0;
        //do not count the ones outside of the matching region;
        for (var i = tokenFrom; i < tokenTo; i++) {
            var Comparison = score.charAt(i);
            var Target = host.charAt(i);
            var Source = stru.charAt(i);
            switch (Comparison) {
                case '*':
                    matchRate += 1;
                    break;
                case ':':
                    matchRate += 0.667;
                    break;
                case '.':
                    matchRate += 0.333;
                    break;
            }
            var isSurface = 0;
            var hasSource;
            if (Source != '-') {
                hasSource = true;
                struCount += 1;
                isSurface = (ptnSurface.exec(surface)[3] == '+') ? 1 : -1;
            }
            if (Target != '-') {
                if (hasSource) {
                    match += 1;
                }
                else {
                    unmatch += 1;
                }
                switch (isSurface) {
                    case 1:
                        surfaceCount += 1;
                        surfaceHydro += ProteinUtil.GetResidueHydrophobicity(Target);
                        surfaceCharge += ProteinUtil.IsCharge(Target);
                        break;
                    case -1:
                        coreCount += 1;
                        coreHydro += ProteinUtil.GetResidueHydrophobicity(Target);
                        coreCharge += ProteinUtil.IsCharge(Target);
                        break;
                    default:
                        unknownCount += 1;
                        unknownHydro += ProteinUtil.GetResidueHydrophobicity(Target);
                        unknownCharge += ProteinUtil.IsCharge(Target);
                        break;
                }
                if (Target == 'P')
                    pro += 1;
                if (Target == 'C')
                    cys += 1;
                if (ProteinUtil.ptnTurnForming.IsMatch(Target))
                    turn += 1;
                ali += ProteinUtil.GetAliphaticIndex(Target);
            }
        }
        model.surfaceCount = surfaceCount;
        model.coreCount = coreCount;
        model.unknownCount = unknownCount;
        model.tokenCount = surfaceCount + coreCount + unknownCount;
        model.matchCount = match;
        model.matchRate = matchRate / model.tokenCount;
        model.unmatchCount = unmatch;
        model.surfaceAverage = surfaceHydro / surfaceCount;
        model.coreAverage = coreHydro / coreCount;
        model.contrast = model.coreAverage - model.surfaceAverage;
        model.surfaceCharge = surfaceCharge;
        model.coreCharge = coreCharge;
        model.unknownCharge = unknownCharge;
        model.percentageOfSurfaceCharge = surfaceCharge / surfaceCount;
        model.percentageOfCoreCharge = coreCharge / coreCount;
        model.percentageOfUnknownCharge = unknownCharge / unknownCount;
        //real index for truncation;
        model.truncatedNCount = ProteinUtil.AminoAcidFilter(host.substr(0, tokenFrom)).length;
        model.truncatedCCount = ProteinUtil.AminoAcidFilter(host.substr(tokenTo)).length;
        model.tokenNumberOfCharge = surfaceCharge + coreCharge + unknownCharge;
        model.tokenPercentageOfCharge = model.tokenNumberOfCharge / model.tokenCount;
        model.tokenNumberOfProline = pro;
        model.tokenPercentageOfProline = pro / model.tokenCount * 100;
        model.tokenNumberOfCysteine = cys;
        model.tokenPercentageOfCysteine = cys / model.tokenCount * 100;
        model.tokenTurnFormingRate = turn / model.tokenCount * 100;
        model.tokenAliphaticIndex = ali / model.tokenCount * 100;
        model.tokenMaxContigousHydrophobic = ProteinUtil.CalculateMaxContigousHydrophobic(sequence.substr(tokenFrom, model.tokenCount));
    };
    return SurfaceAnalyzer;
}());
//# sourceMappingURL=clustalo.js.map