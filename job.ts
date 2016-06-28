class JobController {
    static $inject = ['$http', '$scope', '$location', '$interval', '$timeout'];
    constructor($http: ng.IHttpService, $scope: ng.IScope, $location: ng.ILocationService, $interval: ng.IIntervalService, $timeout: ng.ITimeoutService) {
        CORS.http = $http;
        CORS.timeout = $timeout;
        RPC.http = $http;
        var url = $location.absUrl();
        var index = url.lastIndexOf('?');
        if (index + 1 < url.length) {
            this.jobID = url.substr(index + 1); 
        }
        else {
            this.jobID = 'Any';
        }
        //if (!JobTest){
        //    this.fetchJob();
        //}
    }
    public isChrome = !!window.chrome && !!window.chrome.webstore;
    public mode: number =0 ;
    public setMode = (value: number) => {
        this.mode = value;
    }
    public jobID: string;
    public status: string;
    public jobs: CalculationJob[] = [];
    public left: number = 0;
    public total: number = 0;
    public numberOfClient: number = 0;
    public structureID: string = '4NX8';
    public chainID: string = 'A';
    public addNew = () => {
        let job = new CalculationJob();
        job.structure = this.structureID;
        job.chain = this.chainID;
        this.jobs.push(job);
        job.start();
    }
    //public fetchJob = () => {
    //    this.status = 'Obtaining Calculation Task...';
    //    JobServiceClient.Manager.applyForJob(this.jobID, this.fetchJobCallback);
    //}
    public three: ngThree.ThreeObject;
    public on3DClicked(intersects: THREE.Intersection[]) {
        console.log(intersects);
    }
    public threeReady = (obj: ngThree.ThreeObject) => {
        if (JobTest) {
            this.three = obj;
            this.three.onObjectsClicked = this.on3DClicked;
            //1DMG file to caliberate:
            this.jobID = 'Testing Mode - Set JobTest to false to disable.';
            var task = new Solubility.Task();
            task.structureID = '1DMG_A';
            task.total = 1;
            task.left = 1;
            task.numberOfClients = 1;
            this.fetchJobCallback(task);
        }
    }
    public fetchJobCallback = (task: Solubility.Task) => {
        if (typeof task == 'string') {
            this.status = 'Error when Obtaining Calculation Task.';
            console.log(task);
        }
        else {
            //this.left = task.left;
            //this.total = task.total;
            //this.numberOfClient = task.numberOfClients;
            var job = new CalculationJob();
            var m = /^(\w+)_(\w+)/.Match(task.structureID);
            job.structure = m.groups[1];
            job.chain = m.groups[2];
            job.render = this.three;
            //job.onFinish = this.onFinish;
            job.onReport = this.onReport;
            job.lastReport = task.startTime;
            job.lastReportTime = moment().toDate();
            this.jobs.push(job);
            this.status = 'Calculation Task Obtained.';
            job.start();
            //start to run the job
        }
    }
    public onReport = (job: CalculationJob) => {
        var status = new Solubility.JobStatus();
        status.jobID = this.jobID;
        status.structureID = job.structure + '_' + job.chain;
        status.lastReportTime = job.lastReport;
        var that = this;
        //console.log('reporting:', job);
        var callback = (rStatus: Solubility.JobStatus) => {
            //console.log('status:', rStatus);
            if (typeof rStatus == 'string') {
                that.status = 'Error when updating status.';
                //console.log(rStatus);
            }
            else {
                job.lastReport = rStatus.lastReportTime;
                job.lastReportTime = moment().toDate();
                that.numberOfClient = rStatus.numberOfClients;
                that.left = rStatus.left;
                that.total = rStatus.total;
            }
        }
        JobServiceClient.Manager.reportStatus(this.jobID, status, callback);
    }
    public onFinish = (sjob: CalculationJob, chain: Solubility.ChainData) => {
        var that = this;
        var callback = (response: Solubility.JobFinishResponse) => {
            if (typeof response == 'string') {
                this.status = 'Error when Obtaining Calculation Task.';
                //console.log(response);
            }
            else {
                sjob.result = response.result;
                //console.log('recenved next job:', response);
                that.left = response.left;
                that.total = response.total;
                that.numberOfClient = response.numberOfClients;
                var newJob = new CalculationJob();
                var m = /^(\w+)_(\w+)/.Match(response.nextStructureID);
                newJob.structure = m.groups[1];
                newJob.chain = m.groups[2];
                newJob.render = that.three;
                newJob.onFinish = that.onFinish;
                newJob.onReport = that.onReport;
                newJob.lastReport = response.responseTime;
                newJob.lastReportTime = moment().toDate();
                that.jobs.push(newJob);
                if (that.jobs.length > 10) that.jobs.splice(0, 1);
                that.status = 'Calculation Task Obtained.';
                newJob.start();
                //start to run the job
            }
        }
        JobServiceClient.Manager.finishJob(this.jobID, chain, callback);
    }

    public chain: Solubility.ChainData; 
}
class CalculationJob {
    public structure: string;
    public chain: string;
    public progress: string;
    public create: Date;
    public time: string;
    public lastReport: number;
    public lastReportTime: Date;
    public result: string;
    public render: ngThree.ThreeObject;
    public options: SurfaceSearchOptions = new SurfaceSearchOptions(0.8, 1.2, 0.165, 0.1);
    public onReport: (job: CalculationJob) => void;
    public onFinish: (data: CalculationJob, chain: Solubility.ChainData) => void;
    public proteinChain: Chain;
    public surface: string = '';
    public start = () => {
        this.create = moment().toDate();
        this.progress = 'Downloading PDF file...';
        PDB.downloadPDB(this.structure, this.downloadCallback);
    }
    public downloadCallback = (value: string) => {
        //get id from header:
        
        this.progress = 'Analyzing PDB file...';
        var protein = PDBParser.parsePDB(value);
        this.progress = 'Protein Structure File Analyzed';
        var chn = protein.chainDict[this.chain];
        this.proteinChain = chn;
        this.progress = 'Analyzing Chain ' + chn.chainID + '...';
        
        for (var key in chn.residueDict) {
            var entry = new SurfaceSearchEntry();
            entry.residue = chn.residueDict[key];
            entry.chain = chn;
            this.entries.push(entry)
            entry.residue.atoms.forEach((atom) => {
                this.atoms.push(atom);
            });
        }
        //console.log(this.entries.length);
        this.total = this.entries.length; 

        //if (JobTest) LogServiceClient.Debug.clear(LogCallback);

        CORS.timeout(this.beginSearch, 0);  
        //this.beginSearch();
    }
    public beginSearch = () => {
        this.time = moment.duration(moment().diff(this.create)).asSeconds() + ' sec';
        if (this.entries.length > 0) {
            var entry = this.entries.shift();
            this.progress = 'Analyzing ' + (this.total - this.entries.length).toString() + ' of ' + this.total.toString() + '...';
            //var builders = SurfaceSearch.Search(entry, this.options);
            var isSurface = SurfaceSearch.Test(entry, this.options);

            //console.log(entry.residue.name + entry.residue.index + ' is ' + (isSurface?'surface':'core'));
            //pdb3d.presentResidueWithCuttingWaterball(this.render, entry, builders);
        }

        //if (moment.duration(moment().diff(this.lastReportTime)).asSeconds() > 30) {
        //    this.lastReportTime = moment().toDate();
        //    if (this.onReport) this.onReport(this);
        //}
        if (this.entries.length > 0 && !this.cancelled) {// && this.total - this.entries.length < 10
            //if (!JobTest)
            this.surface = this.proteinChain.data.value;
            CORS.timeout(this.beginSearch, 2);
        }
        else {
            this.progress = (this.total - this.entries.length) + ' of ' + this.total + ' Residues Analyzed'
            //var data = this.proteinChain.data;
            
            //console.log(data);
            var opt: pdb3dOptions = <any>{};
            opt.hideSurface = false;
            opt.highlightSurface = true;
            opt.radiusFactor = 0.5;
            //pdb3d.presentChainAtoms(this.render, this.proteinChain, opt);
            this.surface = this.proteinChain.data.value;
            this.proteinChain = null;//release data for memory;
            //if (this.onFinish) this.onFinish(this, data);
        }
    }
    public cancel = () => {
        this.cancelled = true;
    }
    public cancelled: boolean = false;
    public total: number = 0;
    public atoms: Atom[] = [];
    public entries: SurfaceSearchEntry[] = [];
}

interface Window {
    chrome: IChrome;
}
interface IChrome {
    webstore: boolean;
}

var JobTest: boolean = false;

var appJob = new ngstd.AngularModule('job', ['angucomplete-alt', 'ngMaterial']);

appJob.trustUrl(/^\s*(data|http|https):/);

appJob.includeCaptchaDirecive();
appJob.includeFileUploadDirective();
appJob.includeImageEditorDirective();
appJob.includeOpenFileDirective();
appJob.includeString2DateDirective();
appJob.includeNum2StrDirective();
appJob.includeBool2StrDirective();
appJob.includeContentDirective();
appJob.includeGalleryDirective();

AceEditor.EnableAceDirective(appJob);

//appSoluble.addDirective('content', ($compile, $http) => new viewmodel.ContentDirective($compile, $http));

//var gui = new dat.GUI();
appJob.includeTreeDirective();

appJob.addDirective('three', () => new ngThree.ThreeDirective());
appJob.addDirective('sequence', () => new SequenceDirective());

appJob.addDirective('cors', ($http: ng.IHttpService, $compile: ng.ICompileService) => new CORS.CORSTestDirective($http, $compile));

appJob.addController('job', JobController);