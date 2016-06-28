//php include 'rpcdef' 'JobData' 
module JobServiceService {
    export interface IChain {
        structureID: string;
        chainName: string;
    }
	export class Manager {
        public downloadChains(list: string[]): Solubility.ChainResponse{
            var res = new Solubility.ChainResponse();
            res.missing = 0;
            res.total = count(list);
            for (var i: number = 0; i < res.total; i++) {
                var filename = 'psdb/' + list[i] + '.json';
                if (file_exists(filename)){
                    var chain = json_decode(file_get_contents(filename));
                    array_push(res.chains, chain);
                }
                else {
                    res.missing += 1;
                }
            }
            return res;
		}

		public reportStatus (jobID:string, status:Solubility.JobStatus):Solubility.JobStatus{
            var job = this.loadJob(jobID);
            if (job) {
                job.updateStatus(status.structureID);
                this.saveJob(job.jobID, job);
                status.total = job.total;
                status.left = count(job.structures);
                status.numberOfClients = count(job.slaves);
            }
            return status;
		}

        public finishJob(jobID: string, chain: Solubility.ChainData):Solubility.JobFinishResponse{
            var structureID: string = chain.name;
            file_put_contents('psdb/' + structureID + '.json', json_encode(chain));

            var job = this.loadJob(jobID);
            var response = new Solubility.JobFinishResponse();
            var nextID = null;
            if (job) {
                nextID = job.finishStructure(structureID);
                response.result = structureID;
                response.total = job.total;
                response.left = count(job.structures);
                response.responseTime = time();
                response.numberOfClients = count(job.slaves);
                this.saveJob(jobID,job);
            }
            if (nextID) {
                response.nextStructureID = nextID;
            }
            else {
                
                if (response.left == 0) {
                    this.deleteJob(jobID);
                }
            }
            return response;
		}
		public applyForJob (jobID:string):Solubility.Task{
            var job = this.loadJob(jobID);
            var task = new Solubility.Task();
            if (job) {
                var nextID = job.getStructure();
                task.structureID = nextID;
                task.total = job.total;
                task.left = count(job.structures);
                task.numberOfClients = count(job.slaves);
                task.startTime = time();
                this.saveJob(jobID,job);
            }
            return task;
		}
        public submitJob(job: Solubility.Job): Solubility.JobStatus{
			//check psdb
            var id = uniqid('psc');
            job.jobID = id;
            //structure in the format KEY_Chain.json;
            this.removeFinished(job);
            job.total = count(job.structures);
            this.saveJob(job.jobID, job);
            var status = new Solubility.JobStatus();
            status.jobID = id;
            status.total = count(job.structures);
            return status;
        }

        public saveJob(jobID: string, job: Solubility.Job) {
            file_put_contents('task/' + jobID + '.json', json_encode(job));
        }
        public loadJob(jobID: string): Solubility.Job {
            if (!file_exists('task/' + jobID + '.json')) return null;
            var filecontent = file_get_contents('task/' + jobID + '.json');
            var job: Solubility.Job = json2object(json_decode(filecontent));
            this.removeFinished(job);
            return job;
        }
        public removeFinished(job: Solubility.Job) {
            var ncStructures: string[] = array();
            for (var i: number = 0; i < count(job.structures); i++) {
                var strID = job.structures[i];
                if (!file_exists('psdb/' + strID + '.json')) {
                    array_push(ncStructures, strID);
                }
            }
            job.structures = ncStructures;
        }
        public deleteJob(jobID: string): boolean {
            if (!file_exists('task/' + jobID + '.json')) {
                return unlink('task/' + jobID + '.json');
            }
            return false;
        }
 
	}

}
//---AUTOGENERATED CODE BELOW: typescript dispatcher for php, please do not modify any code blow 
include('phputil.php');
var postInput = file_get_contents("php://input");
var jsonObject: rpc = json_decode(postInput);
switch (jsonObject.service) {
	case 'Manager':
		var JobService_Manager = new JobServiceService.Manager();
		switch (jsonObject.method) {
			case 'submitJob':
				var JobService_Manager_submitJob_parameter_0: any = json2object(jsonObject.parameters[0]);
				var JobService_Manager_submitJobResult = JobService_Manager.submitJob(JobService_Manager_submitJob_parameter_0);
				echo(json_encode(JobService_Manager_submitJobResult));
				break;
			case 'applyForJob':
				var JobService_Manager_applyForJob_parameter_0: string =  jsonObject.parameters[0];
				var JobService_Manager_applyForJobResult = JobService_Manager.applyForJob(JobService_Manager_applyForJob_parameter_0);
				echo(json_encode(JobService_Manager_applyForJobResult));
				break;
			case 'reportStatus':
				var JobService_Manager_reportStatus_parameter_0: string =  jsonObject.parameters[0];
				var JobService_Manager_reportStatus_parameter_1: any = json2object(jsonObject.parameters[1]);
				var JobService_Manager_reportStatusResult = JobService_Manager.reportStatus(JobService_Manager_reportStatus_parameter_0, JobService_Manager_reportStatus_parameter_1);
				echo(json_encode(JobService_Manager_reportStatusResult));
				break;
			case 'finishJob':
				var JobService_Manager_finishJob_parameter_0: string =  jsonObject.parameters[0];
				var JobService_Manager_finishJob_parameter_1: any = json2object(jsonObject.parameters[1]);
				var JobService_Manager_finishJobResult = JobService_Manager.finishJob(JobService_Manager_finishJob_parameter_0, JobService_Manager_finishJob_parameter_1);
				echo(json_encode(JobService_Manager_finishJobResult));
				break;
			case 'downloadChains':
				var JobService_Manager_downloadChains_parameter_0: string[] =  jsonObject.parameters[0];
				var JobService_Manager_downloadChainsResult = JobService_Manager.downloadChains(JobService_Manager_downloadChains_parameter_0);
				echo(json_encode(JobService_Manager_downloadChainsResult));
				break;
		}
	break;
}
