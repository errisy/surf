var JobController = (function () {
    function JobController($http, $scope, $location, $interval, $timeout) {
        var _this = this;
        this.isChrome = !!window.chrome && !!window.chrome.webstore;
        this.mode = 0;
        this.setMode = function (value) {
            _this.mode = value;
        };
        this.jobs = [];
        this.left = 0;
        this.total = 0;
        this.numberOfClient = 0;
        this.fetchJob = function () {
            _this.status = 'Obtaining Calculation Task...';
            JobServiceClient.Manager.applyForJob(_this.jobID, _this.fetchJobCallback);
        };
        this.threeReady = function (obj) {
            if (JobTest) {
                _this.three = obj;
                _this.three.onObjectsClicked = _this.on3DClicked;
                //1DMG file to caliberate:
                _this.jobID = 'Testing Mode - Set JobTest to false to disable.';
                var task = new Solubility.Task();
                task.structureID = '1DMG_A';
                task.total = 1;
                task.left = 1;
                task.numberOfClients = 1;
                _this.fetchJobCallback(task);
            }
        };
        this.fetchJobCallback = function (task) {
            if (typeof task == 'string') {
                _this.status = 'Error when Obtaining Calculation Task.';
                console.log(task);
            }
            else {
                _this.left = task.left;
                _this.total = task.total;
                _this.numberOfClient = task.numberOfClients;
                var job = new CalculationJob();
                var m = /^(\w+)_(\w+)/.Match(task.structureID);
                job.structure = m.groups[1];
                job.chain = m.groups[2];
                job.render = _this.three;
                job.onFinish = _this.onFinish;
                job.onReport = _this.onReport;
                job.lastReport = task.startTime;
                job.lastReportTime = moment().toDate();
                _this.jobs.push(job);
                _this.status = 'Calculation Task Obtained.';
                job.start();
            }
        };
        this.onReport = function (job) {
            var status = new Solubility.JobStatus();
            status.jobID = _this.jobID;
            status.structureID = job.structure + '_' + job.chain;
            status.lastReportTime = job.lastReport;
            var that = _this;
            //console.log('reporting:', job);
            var callback = function (rStatus) {
                //console.log('status:', rStatus);
                if (typeof rStatus == 'string') {
                    that.status = 'Error when updating status.';
                }
                else {
                    job.lastReport = rStatus.lastReportTime;
                    job.lastReportTime = moment().toDate();
                    that.numberOfClient = rStatus.numberOfClients;
                    that.left = rStatus.left;
                    that.total = rStatus.total;
                }
            };
            JobServiceClient.Manager.reportStatus(_this.jobID, status, callback);
        };
        this.onFinish = function (sjob, chain) {
            var that = _this;
            var callback = function (response) {
                if (typeof response == 'string') {
                    _this.status = 'Error when Obtaining Calculation Task.';
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
                    if (that.jobs.length > 10)
                        that.jobs.splice(0, 1);
                    that.status = 'Calculation Task Obtained.';
                    newJob.start();
                }
            };
            JobServiceClient.Manager.finishJob(_this.jobID, chain, callback);
        };
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
        if (!JobTest) {
            this.fetchJob();
        }
    }
    JobController.prototype.on3DClicked = function (intersects) {
        console.log(intersects);
    };
    JobController.$inject = ['$http', '$scope', '$location', '$interval', '$timeout'];
    return JobController;
}());
var CalculationJob = (function () {
    function CalculationJob() {
        var _this = this;
        this.options = new SurfaceSearchOptions(0.8, 1.2, 0.165, 0.1);
        this.start = function () {
            _this.create = moment().toDate();
            _this.progress = 'Downloading PDF file...';
            PDB.downloadPDB(_this.structure, _this.downloadCallback);
        };
        this.downloadCallback = function (value) {
            //get id from header:
            _this.progress = 'Analyzing PDB file...';
            var protein = PDBParser.parsePDB(value);
            _this.progress = 'Protein Structure File Analyzed';
            var chn = protein.chainDict[_this.chain];
            _this.proteinChain = chn;
            _this.progress = 'Analyzing Chain ' + chn.chainID + '...';
            for (var key in chn.residueDict) {
                var entry = new SurfaceSearchEntry();
                entry.residue = chn.residueDict[key];
                entry.chain = chn;
                _this.entries.push(entry);
                entry.residue.atoms.forEach(function (atom) {
                    _this.atoms.push(atom);
                });
            }
            //console.log(this.entries.length);
            _this.total = _this.entries.length;
            //if (JobTest) LogServiceClient.Debug.clear(LogCallback);
            CORS.timeout(_this.beginSearch, 0);
            //this.beginSearch();
        };
        this.beginSearch = function () {
            _this.time = moment.duration(moment().diff(_this.create)).asSeconds() + ' sec';
            if (_this.entries.length > 0) {
                var entry = _this.entries.shift();
                _this.progress = 'Analyzing ' + (_this.total - _this.entries.length).toString() + ' of ' + _this.total.toString() + '...';
                //var builders = SurfaceSearch.Search(entry, this.options);
                var isSurface = SurfaceSearch.Test(entry, _this.options);
            }
            if (moment.duration(moment().diff(_this.lastReportTime)).asSeconds() > 30) {
                _this.lastReportTime = moment().toDate();
                if (_this.onReport)
                    _this.onReport(_this);
            }
            if (_this.entries.length > 0) {
                //if (!JobTest)
                CORS.timeout(_this.beginSearch, 2);
            }
            else {
                _this.progress = 'All ' + _this.total + ' Residues Analyzed';
                var data = _this.proteinChain.data;
                //console.log(data);
                var opt = {};
                opt.hideSurface = false;
                opt.highlightSurface = true;
                opt.radiusFactor = 0.5;
                //pdb3d.presentChainAtoms(this.render, this.proteinChain, opt);
                _this.proteinChain = null; //release data for memory;
                if (_this.onFinish)
                    _this.onFinish(_this, data);
            }
        };
        this.total = 0;
        this.atoms = [];
        this.entries = [];
    }
    return CalculationJob;
}());
var JobTest = false;
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
appJob.addDirective('three', function () { return new ngThree.ThreeDirective(); });
appJob.addDirective('sequence', function () { return new SequenceDirective(); });
appJob.addDirective('cors', function ($http, $compile) { return new CORS.CORSTestDirective($http, $compile); });
appJob.addController('job', JobController);
//# sourceMappingURL=job.js.map