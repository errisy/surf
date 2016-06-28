module Solubility {
    export class Task {
        constructor() {
            this['@@Schema'] = 'Solubility';
            this['@@Table'] = 'Task';
        }
        public structureID: string;
        public total: number;
        public left: number;
        public numberOfClients: number;
        public startTime: number;
    }
    export class Job {
        constructor() {
            this['@@Schema'] = 'Solubility';
            this['@@Table'] = 'Job';
        }
        public jobID: string;
        public structures: string[] = array();
        public total: number;
        public slaves: JobStatus[] = array();
        public getStructure(): string {
            var running = this.recycleJob();
            var nextID: string = null;
            for (var i: number = 0; i < count(this.structures); i++) {
                var id = this.structures[i];
                if (!in_array(id, running) && !nextID) nextID = id;
            }
            //put nextID into slaves
            if (nextID) {
                var slave = new JobStatus();
                slave.lastReportTime = time();
                slave.structureID = nextID; 
                array_push(this.slaves, slave);
            }
            return nextID;
        }
        public finishStructure(id: string): string {
            //remove the id from slaves
            var activeSlaves: Solubility.JobStatus[] = array();
            var running: string[] = array();
            var now = time();
            for (var i: number = 0; i < count(this.slaves); i++) {
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
            var leftIDs: string[] = array();
            var nextID:string = null;
            //get another one;
            for (var i: number = 0; i < count(this.structures); i++) {
                var hid = this.structures[i];
                if (hid != id) {
                    if (!in_array(hid, running) && !nextID) nextID = hid;
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
        }
        public recycleJob():string[] {
            var activeSlaves: Solubility.JobStatus[] = array();
            var runningJobs: string[] = array();
            var now = time();
            for (var i: number = 0; i < count(this.slaves); i++) {
                var slave = this.slaves[i];
                if (now - slave.lastReportTime < 180) {
                    array_push(runningJobs, slave.structureID);
                    array_push(activeSlaves, slave);
                }
            }
            this.slaves = activeSlaves;
            return runningJobs;
        }
        public updateStatus(id: string) {
            var activeSlaves: Solubility.JobStatus[] = array();
            var now = time();
            for (var i: number = 0; i < count(this.slaves); i++) {
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
        }
    }
    export class JobStatus {
        constructor() {
            this['@@Schema'] = 'Solubility';
            this['@@Table'] = 'JobStatus';
        }
        public jobID: string;
        public structureID: string;
        public lastReportTime: number;
        public total: number;
        public left: number;
        public numberOfClients: number;
    }
    export class JobFinishResponse {
        constructor() {
            this['@@Schema'] = 'Solubility';
            this['@@Table'] = 'JobFinishResponse';
        }
        public nextStructureID: string;
        public result: string;
        public total: number;
        public left: number;
        public numberOfClients: number;
        public responseTime: number; 
    }
    export class ChainData {
        constructor() {
            this['@@Schema'] = 'Solubility';
            this['@@Table'] = 'ChainData';
        }
        public name: string;
        public value: string; // A104B24F33G24
        public title: string;
        public source: string;
    }
    export class ChainResponse {
        constructor() {
            this['@@Schema'] = 'Solubility';
            this['@@Table'] = 'ChainResponse';
        }
        public chains: ChainData[] = array();
        public missing: number = 0;
        public total: number = 0;
    }
}