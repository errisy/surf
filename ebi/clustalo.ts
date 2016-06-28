class clustalo {
    static urlRun = 'http://www.ebi.ac.uk/Tools/services/rest/clustalo/run/';
    static runCallback(value: string) {
        console.log(value);
        
    }
    static RequestError(value: string) {
        console.log('Request Error');
        console.log(value);
    }
}


class ClustalORequest {
    static urlRun = 'http://www.ebi.ac.uk/Tools/services/rest/clustalo/run/';
    static urlStatus = 'http://www.ebi.ac.uk/Tools/services/rest/clustalo/status/{jobId}';
    static urlResult = 'http://www.ebi.ac.uk/Tools/services/rest/clustalo/result/{jobId}/{resultType}';
    static urlTypes = 'http://www.ebi.ac.uk/Tools/services/rest/clustalo/resulttypes/{jobId}';
    static statusCheckInterval: number = 5;
    public entries: ClustalORequestEntry[] = [];
    public checkCount: number = 0;
    public id: string;
    public submitTime: Date;
    public lastCheckTime: Date;
    public status: string;
    public checkCountDown: number = 0;// count down in seconds;
    public interval: ng.IPromise<any>;
    public input: ClustalRequestData;
    public taskCallback: (reference: ClustalRequestData, alignment: {[id: string]: string }) => void;
    public sendRequest = ()=> {
        var f = new FormUrlEncoded();
        f.append('email', 'info@demo.com');
        f.append('stype', 'protein');
        f.append('sequence',
            this.entries
                .map((value: ClustalORequestEntry) => '>' + value.key + '\n' + ProteinUtil.AminoAcidFilter(value.sequence) + '\n')
                .join(''));
        this.status = 'Submitting ClustalO Aligment Request...';
        //var handler = new ClustalOHandler();
        CORS.post(ClustalORequest.urlRun, f.data, FormUrlEncoded.config)
            .success(this.requestSuccess)
            .error(this.requestError);
    }
    public requestSuccess = (value: string) => {
        console.log('ClustalO Request Callback:', value);
        this.id = value;
        this.checkCountDown = ClustalORequest.statusCheckInterval;
        this.interval = CORS.interval(this.checkCountDownTick, 1000);
    }
    public requestError = (value: string) => {
        console.log('ClustalO Request Error:', value);
    }
    public checkCountDownTick = () => {
        if (this.checkCountDown > 0) {
            this.checkCountDown -= 1;
        }
        else {
            if (this.interval) {
                CORS.interval.cancel(this.interval);
                this.interval = undefined;
            }
            this.checkCount += 1;
            CORS.get(ClustalORequest.urlStatus.replace('{jobId}', this.id) + '?' + this.checkCount.toString())
                .success(this.checkCallback)
                .error(this.checkError);
        }
    }
    public checkCallback = (value: string) => {
        console.log('ClustalO Status Callback:', value);
        if (value == 'FINISHED') {
            //CORS.get(ClustalORequest.urlTypes.replace('{jobId}', this.id))
            //    .success(this.resultTypeCallback)
            //    .error(this.resultTypeError);
            // other types: out sequence aln-clustal phylotree pim
            CORS.get(ClustalORequest.urlResult.replace('{jobId}', this.id).replace('{resultType}', 'aln-clustal'))
                .success(this.resultCallback)
                .error(this.resultError);
        }
        else {
            this.checkCountDown = ClustalORequest.statusCheckInterval;
            this.interval = CORS.interval(this.checkCountDownTick, 1000);
        }
    }
    public checkError = (value: string) => {
        console.log('ClustalO Status Check Error:',value);
    }
    public resultTypeCallback = (value: string) => {
        console.log('ClustalO Result Type Callback:', value);
    }
    public resultTypeError = (value: string) => {
        console.log('ClustalO Result Type Error:', value);
    }
    public resultCallback = (value: string) => {
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
        var spacing: number = 0;
        lines.some((line) => this.entries.some((entry) => {
            if (line.indexOf(entry.key) == 0) {
                spacing = entry.key.length + /\s+/g.Match(line.substr(entry.key.length)).groups[0].length;
                return true;
            }
            else {
                return false;
            }
        }));
        var alignment: { [id: string]: string } = {};
        var lineIndex: number = 0;
        var entryCount: number = this.entries.length + 2;
        //this.score = '';
        this.entries.forEach((entry) => {
            alignment[entry.key] = '';
        });
        alignment['$score'] = '';
        lines.forEach((line) => {
            if (((lineIndex - 3) % entryCount) < (entryCount - 1)) {
                this.entries.some((entry) => {
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
        this.alignment = alignment;
        //console.log(this.alignment);
        if (this.taskCallback) this.taskCallback(this.input, this.alignment);
    }
    public resultError = (value: string) => {
        console.log('ClustalO Result Error:', value);
    }
    public alignment: { [id: string]: string } = {};
    //public score: string;
}

class MultipleTaskRunner<T> {
    public concurrentLimit: number = 5;
    private concurrentNumber: number = 0;
    public tasks: T[] = [];
    public cancelled: boolean = false;
    public total: number;
    public finished: number;
    public begin = () => {
        this.total = this.tasks.length;
        this.finished = 0;
        this.runMore();
    }
    public finishOne = () => {
        this.finished += 1
        this.concurrentNumber -= 1;
        this.runMore();
    }
    public onComplete: () => void;
    private runMore = () => {
        if (this.cancelled) return;
        if (this.concurrentNumber < this.concurrentLimit && this.tasks.length > 0) {
            var batch = this.tasks.splice(0, Math.min(this.concurrentLimit - this.concurrentNumber, this.tasks.length));
            this.concurrentNumber += batch.length;
            batch.forEach((task) => {
                this.method(task);
            });
        }
        if (this.finished == this.total) {
            if (this.onComplete) this.onComplete();
        }
    }
    public cancel = () => {
        this.cancelled = true;
    }
    public method: (task: T) => void;
}
class ProteinClustal {
    constructor(proteins: Solubility.ProteinSequence[], project: Solubility.ProteinProject) {
        this.proteins = proteins;
        this.project = project;
    }
    public project: Solubility.ProteinProject;
    public numberOfConcurrent: number = 10;
    public proteins: Solubility.ProteinSequence[];
    public runner: MultipleTaskRunner<ClustalRequestData>;
    public start = () => {
        this.runner = new MultipleTaskRunner<ClustalRequestData>();
        this.runner.concurrentLimit = this.numberOfConcurrent;
        this.runner.tasks = this.proteins.collect((pro) => pro.models.collect((model) => {
            var chain = this.project.chains[model.ID];
            if (!chain) return [];
            if (!chain.surface) return [];
            var crd = new ClustalRequestData();
            crd.protein = pro;
            crd.model = model;
            crd.surface = this.project.chains[model.ID];
            return [crd];
        }));
        this.runner.method = this.runClustal;
        this.runner.onComplete = this.onComplete;
        this.runner.begin();
    }
    public runClustal = (value: ClustalRequestData) => {
        var req = new ClustalORequest();
        var host = new ClustalORequestEntry();
        host.key = 'host';
        host.sequence = value.protein.sequence;
        var stru = new ClustalORequestEntry();
        stru.key = 'stru';
        stru.sequence = ProteinUtil.AminoAcidFilter(this.project.chains[value.model.ID].surface);/// need find the protein sequence from project;
        req.entries.push(host);
        req.entries.push(stru);
        req.input = value;
        req.taskCallback = this.taskCallback;
        req.sendRequest();
        console.log('model request sent', value.model.ID);
    }
    public stop = () => {
        this.runner.cancel();
    }
    public taskCallback = (input: ClustalRequestData, alignment: { [id: string]: string }) => {
        //console.log('model alignment obtained', input.model.ID);
        input.model.hostAlign = alignment['host'];
        input.model.modelAlign = alignment['stru']
        input.model.scoreAlign = alignment['$score'];
        SurfaceAnalyzer.Analyze(input.model, input.surface.surface, input.protein.sequence);
        //console.log('input.mode:', input.model);
        this.runner.finishOne();
    }
    public onComplete: () => void;
}
class ClustalRequestData {
    public protein: Solubility.ProteinSequence;
    public model: Solubility.StructureModel;
    public surface: Solubility.StructureChain;
}
class ClustalORequestEntry {
    key: string;
    sequence: string;
    protein: Solubility.ProteinSequence; //reference to the protein;
    model: Solubility.StructureModel;
}
class EBIParser {
    static parseEBI(value: string): EBIEntry {
        var ebi = new EBIEntry();
        return ebi;
    }
}
class EBIEntry {
    public ID: string;
    public definition: string;
    public source: string;
    public proteinSequence: string;
}

class SurfaceAnalyzer {
      
    public static Analyze(model: Solubility.StructureModel, surface: string, sequence: string) {
        
        var matchRate: number = 0;
        var match: number = 0;
        var unmatch: number = 0;
        var surfaceCount: number = 0;
        var coreCount: number = 0;
        var unknownCount: number = 0;

        var surfaceHydro: number = 0;
        var coreHydro: number = 0;
        var unknownHydro: number = 0;

        var surfaceCharge: number = 0;
        var coreCharge: number = 0;
        var unknownCharge: number = 0;


        var stb: string[] = [];

        var ptnSurface = /(\w)(\d+)([\+\-])/ig; //this should not be static, as static pattern will be shared by different threads.
        var host: string = model.hostAlign;
        var stru: string = model.modelAlign;
        var score: string = model.scoreAlign;
        var length: number = score.length;

        // ----MMMMM--- from = 4, to = 12 - 3 = 9;
        var mFrom = /^\-+/g.exec(stru);
        var tokenFrom: number = 0;
        if (mFrom) tokenFrom = mFrom[0].length;
        var mTo = /\-+$/g.exec(stru);
        var tokenTo: number = 0; 
        if(mTo) tokenTo = length - mTo[0].length;

        var struCount: number = 0;
        var pro: number = 0;
        var cys: number = 0;
        var ali: number = 0;
        var turn: number = 0;

        //do not count the ones outside of the matching region;
        for (let i: number = tokenFrom; i < tokenTo; i++) {
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
            var isSurface: number = 0;
            var hasSource: boolean;
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
                if (Target == 'P') pro += 1;
                if (Target == 'C') cys += 1;
                if (ProteinUtil.ptnTurnForming.IsMatch(Target)) turn += 1;
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
        model.tokenPercentageOfProline = pro / model.tokenCount*100;

        model.tokenNumberOfCysteine = cys;
        model.tokenPercentageOfCysteine = cys / model.tokenCount*100;

        model.tokenTurnFormingRate = turn / model.tokenCount*100;

        model.tokenAliphaticIndex = ali / model.tokenCount * 100;

        model.tokenMaxContigousHydrophobic = ProteinUtil.CalculateMaxContigousHydrophobic(sequence.substr(tokenFrom, model.tokenCount));
    }
}