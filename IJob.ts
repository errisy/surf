//rpc include 'JobData'

module JobService {
    export interface Manager {
        submitJob(job: Solubility.Job): Solubility.JobStatus;
        applyForJob(jobID: string): Solubility.Task;
        reportStatus(jobID: string, status: Solubility.JobStatus): Solubility.JobStatus;
        finishJob(jobID: string, chain: Solubility.ChainData): Solubility.JobFinishResponse;
        downloadChains(list: string[]): Solubility.ChainResponse;
    }
}