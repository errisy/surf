<?php

namespace Solubility {
	class Task
	{
		public function __construct()
		{
			$this->{'@@Schema'} = 'Solubility';
			$this->{'@@Table'} = 'Task';
		}
		
		public $structureID;
		
		public $total;
		
		public $left;
		
		public $numberOfClients;
		
		public $startTime;
		
	}

	class Job
	{
		public function __construct()
		{
			$this->structures = array();
			$this->slaves = array();
			$this->{'@@Schema'} = 'Solubility';
			$this->{'@@Table'} = 'Job';
		}
		
		public $jobID;
		
		public $structures;
		
		public $total;
		
		public $slaves;
		
		public function getStructure()
		{
			$running = $this->recycleJob();
			$nextID = null;
			for ($i = 0; $i < count($this->structures); $i++) {
				$id = $this->structures[$i];
				if (!in_array($id, $running) && !$nextID) $nextID = $id;
			}
			//put nextID into slaves
			if ($nextID) {
				$slave = new JobStatus();
				$slave->lastReportTime = time();
				$slave->structureID = $nextID;
				array_push($this->slaves, $slave);
			}
			return $nextID;
		}
		
		public function finishStructure($id)
		{
			//remove the id from slaves
			$activeSlaves = array();
			$running = array();
			$now = time();
			for ($i = 0; $i < count($this->slaves); $i++) {
				$slave = $this->slaves[$i];
				if ($slave->structureID == $id) {
				} else {
					if ($now - $slave->lastReportTime < 180) {
						array_push($running, $slave->structureID);
						array_push($activeSlaves, $slave);
					}
				}
			}
			$this->slaves = $activeSlaves;
			//remove this id
			$leftIDs = array();
			$nextID = null;
			//get another one;
			for ($i = 0; $i < count($this->structures); $i++) {
				$hid = $this->structures[$i];
				if ($hid != $id) {
					if (!in_array($hid, $running) && !$nextID) $nextID = $hid;
					array_push($leftIDs, $hid);
				}
			}
			$this->structures = $leftIDs;
			if ($nextID) {
				$slave = new JobStatus();
				$slave->lastReportTime = time();
				$slave->structureID = $nextID;
				array_push($this->slaves, $slave);
			}
			return $nextID;
		}
		
		public function recycleJob()
		{
			$activeSlaves = array();
			$runningJobs = array();
			$now = time();
			for ($i = 0; $i < count($this->slaves); $i++) {
				$slave = $this->slaves[$i];
				if ($now - $slave->lastReportTime < 180) {
					array_push($runningJobs, $slave->structureID);
					array_push($activeSlaves, $slave);
				}
			}
			$this->slaves = $activeSlaves;
			return $runningJobs;
		}
		
		public function updateStatus($id)
		{
			$activeSlaves = array();
			$now = time();
			for ($i = 0; $i < count($this->slaves); $i++) {
				$slave = $this->slaves[$i];
				if ($slave->structureID == $id) {
					$slave->lastReportTime = $now;
					array_push($activeSlaves, $slave);
				} else {
					if ($now - $slave->lastReportTime < 180) {
						array_push($activeSlaves, $slave);
					}
				}
			}
		}
		
	}

	class JobStatus
	{
		public function __construct()
		{
			$this->{'@@Schema'} = 'Solubility';
			$this->{'@@Table'} = 'JobStatus';
		}
		
		public $jobID;
		
		public $structureID;
		
		public $lastReportTime;
		
		public $total;
		
		public $left;
		
		public $numberOfClients;
		
	}

	class JobFinishResponse
	{
		public function __construct()
		{
			$this->{'@@Schema'} = 'Solubility';
			$this->{'@@Table'} = 'JobFinishResponse';
		}
		
		public $nextStructureID;
		
		public $result;
		
		public $total;
		
		public $left;
		
		public $numberOfClients;
		
		public $responseTime;
		
	}

	class ChainData
	{
		public function __construct()
		{
			$this->{'@@Schema'} = 'Solubility';
			$this->{'@@Table'} = 'ChainData';
		}
		
		public $name;
		
		public $value;
		
	}

	// A104B24F33G24
	class ChainResponse
	{
		public function __construct()
		{
			$this->chains = array();
			$this->{'@@Schema'} = 'Solubility';
			$this->{'@@Table'} = 'ChainResponse';
		}
		
		public $chains;
		
		public $missing = 0;
		
		public $total = 0;
		
	}
}

namespace JobServiceService {
	interface IChain
	{
	}

	class Manager
	{
		public function downloadChains(array $list)
		{
			$res = new \Solubility\ChainResponse();
			$res->missing = 0;
			$res->total = count($list);
			for ($i = 0; $i < $res->total; $i++) {
				$filename = 'psdb/' . $list[$i] . '.json';
				if (file_exists($filename)) {
					$chain = json_decode(file_get_contents($filename));
					array_push($res->chains, $chain);
				} else {
					$res->missing += 1;
				}
			}
			return $res;
		}
		
		public function reportStatus($jobID, \Solubility\JobStatus $status)
		{
			$job = $this->loadJob($jobID);
			if ($job) {
				$job->updateStatus($status->structureID);
				$this->saveJob($job->jobID, $job);
				$status->total = $job->total;
				$status->left = count($job->structures);
				$status->numberOfClients = count($job->slaves);
			}
			return $status;
		}
		
		public function finishJob($jobID, \Solubility\ChainData $chain)
		{
			$structureID = $chain->name;
			file_put_contents('psdb/' . $structureID . '.json', json_encode($chain));
			$job = $this->loadJob($jobID);
			$response = new \Solubility\JobFinishResponse();
			$nextID = null;
			if ($job) {
				$nextID = $job->finishStructure($structureID);
				$response->result = $structureID;
				$response->total = $job->total;
				$response->left = count($job->structures);
				$response->responseTime = time();
				$response->numberOfClients = count($job->slaves);
				$this->saveJob($jobID, $job);
			}
			if ($nextID) {
				$response->nextStructureID = $nextID;
			} else {
				if ($response->left == 0) {
					$this->deleteJob($jobID);
				}
			}
			return $response;
		}
		
		public function applyForJob($jobID)
		{
			$job = $this->loadJob($jobID);
			$task = new \Solubility\Task();
			if ($job) {
				$nextID = $job->getStructure();
				$task->structureID = $nextID;
				$task->total = $job->total;
				$task->left = count($job->structures);
				$task->numberOfClients = count($job->slaves);
				$task->startTime = time();
				$this->saveJob($jobID, $job);
			}
			return $task;
		}
		
		public function submitJob(\Solubility\Job $job)
		{
			//check psdb
			$id = uniqid('psc');
			$job->jobID = $id;
			//structure in the format KEY_Chain.json;
			$this->removeFinished($job);
			$job->total = count($job->structures);
			$this->saveJob($job->jobID, $job);
			$status = new \Solubility\JobStatus();
			$status->jobID = $id;
			$status->total = count($job->structures);
			return $status;
		}
		
		public function saveJob($jobID, \Solubility\Job $job)
		{
			file_put_contents('task/' . $jobID . '.json', json_encode($job));
		}
		
		public function loadJob($jobID)
		{
			if (!file_exists('task/' . $jobID . '.json')) return null;
			$filecontent = file_get_contents('task/' . $jobID . '.json');
			$job = json2object(json_decode($filecontent));
			$this->removeFinished($job);
			return $job;
		}
		
		public function removeFinished(\Solubility\Job $job)
		{
			$ncStructures = array();
			for ($i = 0; $i < count($job->structures); $i++) {
				$strID = $job->structures[$i];
				if (!file_exists('psdb/' . $strID . '.json')) {
					array_push($ncStructures, $strID);
				}
			}
			$job->structures = $ncStructures;
		}
		
		public function deleteJob($jobID)
		{
			if (!file_exists('task/' . $jobID . '.json')) {
				return unlink('task/' . $jobID . '.json');
			}
			return false;
		}
		
	}
}

namespace  {
	// to be used by remote procedure calls
	class rpc
	{
		public $service;
		
		public $method;
		
		public $parameters;
		
	}

	class FieldDef
	{
		public function __construct($_name, $_view, $_sqlBinding)
		{
			$this->name = $_name;
			$this->view = $_view;
			$this->sqlBinding = $_sqlBinding;
		}
		
		public $name;
		
		public $view;
		
		public $sqlBinding;
		
	}

	interface ITableDef
	{
		public function _Insert($port, $data);
		
		public function _Update($port, $data);
		
		public function _Fetch($port, $id);
		
		public function _Delete($port, $id);
		
		public function _New();
		
		public function _getKey($item);
		
		public function _setKey($item, $key);
		
	}

	class TableItem
	{
		public static function setRemoteReady($item)
		{
			$item->{'@@Remote'} = 'ready';
		}
		
		public static function isRemoteReady($item)
		{
			return $item->{'@@Remote'} == 'ready';
		}
		
		public static function setRemoteSynchronizing($item)
		{
			$item->{'@@Remote'} = 'synchronizing';
		}
		
		public static function isRemoteSynchronizing($item)
		{
			return $item->{'@@Remote'} == 'synchronizing';
		}
		
		public static function markType(ITableDef $def, $item)
		{
			$item->{'@@Table'} = $def->_TableName;
			$item->{'@@Schema'} = $def->_SchemaName;
		}
		
		public static function getStatus($item)
		{
			return $item->{'@@Status'};
		}
		
		public static function getTable($item)
		{
			return $item->{'@@Table'};
		}
		
		public static function getSchema($item)
		{
			return $item->{'@@Schema'};
		}
		
		public static function setStatus($item, $value)
		{
			$item->{'@@Status'} = $value;
		}
		
		public static function setNew($item)
		{
			$item->{'@@Status'} = 'new';
		}
		
		public static function setLoaded($item)
		{
			$item->{'@@Status'} = 'loaded';
		}
		
		public static function requiresUpdate($item)
		{
			if ($item->{'@@Remote'} != 'synchronizing' && ($item->{'@@Status'} == 'new' || $item->{'@@Status'} == 'to be deleted' || $item->{'@@Status'} == 'changed')) {
				$item->{'@@hashKey'} = $item->{'$$hashKey'};
				$item->{'@@Error'} = null;
				$item->{'@@Remote'} = 'synchronizing';
				return true;
			} else {
				return false;
			}
		}
		
		public static function hashKey($item)
		{
			return $item->{'$$hashKey'};
		}
		
		public static function setRemoteHashKey($item)
		{
			if ($item->{'$$hashKey'}) {
				$item->{'@@hashKey'} = $item->{'$$hashKey'};
				return true;
			} else {
				return false;
			}
		}
		
		public static function getRemoteHashKey($item)
		{
			return $item->{'@@hashKey'};
		}
		
		public static function setToBeDeleted($item)
		{
			$item->{'@@Status'} = 'to be deleted';
		}
		
		public static function isToBeDeleted($item)
		{
			return $item->{'@@Status'} == 'to be deleted';
		}
		
		public static function setChanged($item)
		{
			if ($item->{'@@Status'} == 'new' || $item->{'@@Status'} == 'to be deleted') {
			} else {
				$item->{'@@Status'} = 'changed';
			}
		}
		
		public static function setInserted($item)
		{
			$item->{'@@Status'} = 'inserted';
		}
		
		public static function isInserted($item)
		{
			return $item->{'@@Status'} == 'inserted';
		}
		
		public static function setUpdated($item)
		{
			$item->{'@@Status'} = 'updated';
		}
		
		public static function isUpdated($item)
		{
			return $item->{'@@Status'} == 'updated';
		}
		
		public static function isError($item)
		{
			return $item->{'@@Status'} == 'error';
		}
		
		public static function setDeleted($item)
		{
			$item->{'@@Status'} = 'deleted';
		}
		
		public static function clearError($item)
		{
			$item->{'@@Error'} = null;
		}
		
		public static function setError($item, $value)
		{
			$item->{'@@Status'} = 'error';
			$item->{'@@Error'} = $value;
		}
		
		public static function getError($item)
		{
			return $item->{'@@Error'};
		}
		
		public static function setBackChanged($item)
		{
			$item->{'@@Status'} = 'changed';
		}
		
		public static function isNew($item)
		{
			return $item->{'@@Status'} == 'new';
		}
		
		public static function isLoaded($item)
		{
			return $item->{'@@Status'} == 'loaded';
		}
		
		public static function isChanged($item)
		{
			return $item->{'@@Status'} == 'changed';
		}
		
		public static function isDeleted($item)
		{
			return $item->{'@@Status'} == 'deleted';
		}
		
	}

	//---AUTOGENERATED CODE BELOW: typescript dispatcher for php, please do not modify any code blow 
	include('phputil.php');
	$postInput = file_get_contents('php://input');
	$jsonObject = json_decode($postInput);
	switch ($jsonObject->service) {
		case 'Manager':
			$JobService_Manager = new \JobServiceService\Manager();
			switch ($jsonObject->method) {
				case 'submitJob':
					$JobService_Manager_submitJob_parameter_0 = json2object($jsonObject->parameters[0]);
					$JobService_Manager_submitJobResult = $JobService_Manager->submitJob($JobService_Manager_submitJob_parameter_0);
					echo(json_encode($JobService_Manager_submitJobResult));
					break;
				case 'applyForJob':
					$JobService_Manager_applyForJob_parameter_0 = $jsonObject->parameters[0];
					$JobService_Manager_applyForJobResult = $JobService_Manager->applyForJob($JobService_Manager_applyForJob_parameter_0);
					echo(json_encode($JobService_Manager_applyForJobResult));
					break;
				case 'reportStatus':
					$JobService_Manager_reportStatus_parameter_0 = $jsonObject->parameters[0];
					$JobService_Manager_reportStatus_parameter_1 = json2object($jsonObject->parameters[1]);
					$JobService_Manager_reportStatusResult = $JobService_Manager->reportStatus($JobService_Manager_reportStatus_parameter_0, $JobService_Manager_reportStatus_parameter_1);
					echo(json_encode($JobService_Manager_reportStatusResult));
					break;
				case 'finishJob':
					$JobService_Manager_finishJob_parameter_0 = $jsonObject->parameters[0];
					$JobService_Manager_finishJob_parameter_1 = json2object($jsonObject->parameters[1]);
					$JobService_Manager_finishJobResult = $JobService_Manager->finishJob($JobService_Manager_finishJob_parameter_0, $JobService_Manager_finishJob_parameter_1);
					echo(json_encode($JobService_Manager_finishJobResult));
					break;
				case 'downloadChains':
					$JobService_Manager_downloadChains_parameter_0 = $jsonObject->parameters[0];
					$JobService_Manager_downloadChainsResult = $JobService_Manager->downloadChains($JobService_Manager_downloadChains_parameter_0);
					echo(json_encode($JobService_Manager_downloadChainsResult));
					break;
			}
			break;
	}
}
?>