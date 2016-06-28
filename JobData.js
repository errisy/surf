var Solubility;
(function (Solubility) {
    var Task = (function () {
        function Task() {
            this['@@Schema'] = 'Solubility';
            this['@@Table'] = 'Task';
        }
        return Task;
    }());
    Solubility.Task = Task;
    var Job = (function () {
        function Job() {
            this.structures = array();
            this.slaves = array();
            this['@@Schema'] = 'Solubility';
            this['@@Table'] = 'Job';
        }
        Job.prototype.getStructure = function () {
            var running = this.recycleJob();
            var nextID = null;
            for (var i = 0; i < count(this.structures); i++) {
                var id = this.structures[i];
                if (!in_array(id, running) && !nextID)
                    nextID = id;
            }
            //put nextID into slaves
            if (nextID) {
                var slave = new JobStatus();
                slave.lastReportTime = time();
                slave.structureID = nextID;
                array_push(this.slaves, slave);
            }
            return nextID;
        };
        Job.prototype.finishStructure = function (id) {
            //remove the id from slaves
            var activeSlaves = array();
            var running = array();
            var now = time();
            for (var i = 0; i < count(this.slaves); i++) {
                var slave = this.slaves[i];
                if (slave.structureID == id) {
                }
                else {
                    if (now - slave.lastReportTime < 180) {
                        array_push(running, slave.structureID);
                        array_push(activeSlaves, slave);
                    }
                }
            }
            this.slaves = activeSlaves;
            //remove this id
            var leftIDs = array();
            var nextID = null;
            //get another one;
            for (var i = 0; i < count(this.structures); i++) {
                var hid = this.structures[i];
                if (hid != id) {
                    if (!in_array(hid, running) && !nextID)
                        nextID = hid;
                    array_push(leftIDs, hid);
                }
            }
            this.structures = leftIDs;
            if (nextID) {
                var slave = new JobStatus();
                slave.lastReportTime = time();
                slave.structureID = nextID;
                array_push(this.slaves, slave);
            }
            return nextID;
        };
        Job.prototype.recycleJob = function () {
            var activeSlaves = array();
            var runningJobs = array();
            var now = time();
            for (var i = 0; i < count(this.slaves); i++) {
                var slave = this.slaves[i];
                if (now - slave.lastReportTime < 180) {
                    array_push(runningJobs, slave.structureID);
                    array_push(activeSlaves, slave);
                }
            }
            this.slaves = activeSlaves;
            return runningJobs;
        };
        Job.prototype.updateStatus = function (id) {
            var activeSlaves = array();
            var now = time();
            for (var i = 0; i < count(this.slaves); i++) {
                var slave = this.slaves[i];
                if (slave.structureID == id) {
                    slave.lastReportTime = now;
                    array_push(activeSlaves, slave);
                }
                else {
                    if (now - slave.lastReportTime < 180) {
                        array_push(activeSlaves, slave);
                    }
                }
            }
        };
        return Job;
    }());
    Solubility.Job = Job;
    var JobStatus = (function () {
        function JobStatus() {
            this['@@Schema'] = 'Solubility';
            this['@@Table'] = 'JobStatus';
        }
        return JobStatus;
    }());
    Solubility.JobStatus = JobStatus;
    var JobFinishResponse = (function () {
        function JobFinishResponse() {
            this['@@Schema'] = 'Solubility';
            this['@@Table'] = 'JobFinishResponse';
        }
        return JobFinishResponse;
    }());
    Solubility.JobFinishResponse = JobFinishResponse;
    var ChainData = (function () {
        function ChainData() {
            this['@@Schema'] = 'Solubility';
            this['@@Table'] = 'ChainData';
        }
        return ChainData;
    }());
    Solubility.ChainData = ChainData;
    var ChainResponse = (function () {
        function ChainResponse() {
            this.chains = array();
            this.missing = 0;
            this.total = 0;
            this['@@Schema'] = 'Solubility';
            this['@@Table'] = 'ChainResponse';
        }
        return ChainResponse;
    }());
    Solubility.ChainResponse = ChainResponse;
})(Solubility || (Solubility = {}));
//# sourceMappingURL=JobData.js.map