var SolubleController = (function () {
    function SolubleController($http, $scope, $timeout, $interval, $location) {
        var _this = this;
        this.test = 'working!';
        this.kegg = new KEGG();
        this.ncbi = new NCBI();
        this.uniprot = new Uniprot();
        this.pdb = new PDB();
        this.mode = 0;
        this.initMode = function () {
            _this.mode = 0;
            console.log('mode: ' + _this.mode.toString());
        };
        this.init = function () {
            var search = decodeURIComponent(_this.location.absUrl());
            var index = search.indexOf('?');
            if (index > -1) {
                var query = JSON.parse(search.substring(index + 1));
                if (query.data) {
                    //try to load the data from the givin url;
                    var that_1 = _this;
                    try {
                        _this.http.get(query.data)
                            .success(function (pro) {
                            that_1.project = json2object(pro);
                            that_1.countSelected();
                        });
                    }
                    catch (ex) {
                    }
                }
                console.log(query);
            }
        };
        this.listOrganismCallback = function (value) {
            _this.test = value;
            _this.scope.$apply();
        };
        //Data;
        this.project = new Solubility.ProteinProject();
        this.caches = [];
        this.setProteins = function (proteins, operation) {
            var cache = new Solubility.ProjectCache();
            cache.name = _this.project.name;
            cache.proteins = _this.project.proteins;
            cache.tag = operation;
            _this.project.proteins = proteins;
            _this.caches.push(cache);
        };
        this.resumeCache = function (cache) {
            _this.project.name = cache.name;
            _this.project.proteins = cache.proteins;
        };
        this.removeCache = function (cache) {
            var index = _this.caches.indexOf(cache);
            _this.caches.splice(index, 1);
        };
        this.clearCache = function () {
            _this.caches = [];
        };
        this.projectNameChange = function () {
            if (_this.project.name)
                if (_this.project.name.length > 0) {
                    _this.nodeMessage = '';
                    return;
                }
            _this.nodeMessage = 'Project Name should not be empty!';
        };
        this.prepareDownload = function () {
            _this.downloadName = _this.project.name + '.json';
            _this.downloadData = 'data:text/plain;charset=utf-8,' + encodeURIComponent(JSON.stringify(_this.project));
        };
        this.loadProject = function () {
            //console.log('loadProject.');
            if (_this.fileListForLoading) {
                var reader = new FileReader();
                reader.onload = _this.onFileLoaded;
                reader.readAsText(_this.fileListForLoading[0]);
            }
        };
        this.onFileLoaded = function (ev) {
            //console.log('file loaded.');
            var reader = ev.target;
            var obj = JSON.parse(reader.result);
            //console.log('json parsed', obj);
            _this.project = json2object(obj);
            _this.countSelected();
            _this.scope.$apply();
        };
        this.combineProject = function () {
            if (_this.fileListForLoading) {
                var reader = new FileReader();
                reader.onload = _this.onCombineFileLoaded;
                reader.readAsText(_this.fileListForLoading[0]);
            }
        };
        this.onCombineFileLoaded = function (ev) {
            var reader = ev.target;
            var obj = JSON.parse(reader.result);
            var project = json2object(obj);
            _this.setProteins(_this.project.proteins.combine(project.proteins), 'Combine ' + project.name);
            _this.countSelected();
            _this.scope.$apply();
        };
        this.nodePath = '/';
        this.nodeServerChanged = function () {
            jQuery.cookie('node', _this.nodeServer);
        };
        this.nodeError = function (value) {
            console.log('NodeError: ', value);
        };
        this.nodeListFiles = function () {
            var list = {};
            list.directory = _this.nodePath;
            CORS.post(_this.nodeServer + '/list', list)
                .success(_this.nodeListFilesCallback)
                .error(_this.nodeError);
        };
        this.nodeListFilesCallback = function (value) {
            if (typeof value == 'string') {
                console.log('Node Server List Error.', value);
            }
            else {
                if (value.files)
                    value.files = value.files.filter(function (file) { return /\.json$/ig.IsMatch(file.name); });
                _this.nodeList = value;
            }
        };
        this.nodeSave = function () {
            if (!_this.project.name) {
                _this.nodeMessage = 'Project Name should not be empty!';
                return;
            }
            if (_this.project.name.length == 0) {
                _this.nodeMessage = 'Project Name should not be empty!';
                return;
            }
            var save = {};
            save.filename = _this.nodePath + _this.project.name + '.json';
            save.value = JSON.stringify(_this.project);
            var that = _this;
            var callback = function (value) {
                that.nodeListFiles();
            };
            CORS.post(_this.nodeServer + '/save', save)
                .success(callback)
                .error(_this.nodeError);
        };
        this.nodeDelete = function (name) {
        };
        this.nodeLoadFile = function (name) {
            var fget = {};
            fget.filename = _this.nodePath + name;
            var loadCallback = function (value) {
                if (typeof value == 'string') {
                    console.log('Node Server List Error.', value);
                }
                else {
                    _this.project = json2object(value);
                }
                _this.countSelected();
            };
            CORS.post(_this.nodeServer + '/get', fget)
                .success(loadCallback)
                .error(_this.nodeError);
        };
        this.nodeCombineFile = function (name) {
            var fget = {};
            fget.filename = _this.nodePath + name;
            var combineCallback = function (value) {
                if (typeof value == 'string') {
                    console.log('Node Server List Error.', value);
                }
                else {
                    _this.setProteins(_this.project.proteins.combine(value.proteins), 'Combine ' + value.name);
                }
                _this.countSelected();
            };
            CORS.post(_this.nodeServer + '/get', fget)
                .success(combineCallback)
                .error(_this.nodeError);
        };
        this.nodeEnterFolder = function (name) {
            var list = {};
            list.directory = _this.nodePath + name + '/';
            var enterCallback = function (value) {
                if (typeof value == 'string') {
                    console.log('Node Server List Error.', value);
                }
                else {
                    _this.nodePath = list.directory;
                    if (value.files)
                        value.files = value.files.filter(function (file) { return /\.json$/ig.IsMatch(file.name); });
                    _this.nodeList = value;
                }
            };
            CORS.post(_this.nodeServer + '/list', list)
                .success(enterCallback)
                .error(_this.nodeError);
        };
        this.nodeUpLevel = function () {
            if (_this.nodePath.length < 2)
                return;
            var list = {};
            var index = _this.nodePath.lastIndexOf('\/', _this.nodePath.length - 2);
            list.directory = _this.nodePath.substr(0, index + 1);
            console.log('up level:', list.directory);
            var enterCallback = function (value) {
                if (typeof value == 'string') {
                    console.log('Node Server List Error.', value);
                }
                else {
                    _this.nodePath = list.directory;
                    if (value.files)
                        value.files = value.files.filter(function (file) { return /\.json$/ig.IsMatch(file.name); });
                    _this.nodeList = value;
                }
            };
            CORS.post(_this.nodeServer + '/list', list)
                .success(enterCallback)
                .error(_this.nodeError);
        };
        //input and database
        this.sourceMode = 0;
        //Sequence
        this.addingProtein = new Solubility.ProteinSequence();
        this.detectedFASTA = [];
        //Databas Entries
        this.databaseEntries = [];
        this.entriesNCBI = '';
        this.entriesKEGG = '';
        this.entriesUniprot = '';
        this.entriesEBI = '';
        this.entriesPDB = '';
        this.databaseDownload = function () {
            new Downloader(_this.entriesNCBI.split(' ').filter(function (entry) { return entry.length > 0; }).map(function (id) { return SolubleController.urlNCBIGp.replace('{id}', id); }), _this.ncbiRetrieved, 5);
            new Downloader(_this.entriesKEGG.split(' ').filter(function (entry) { return entry.length > 0; }).map(function (id) { return SolubleController.urlKEGG.replace('{id}', id); }), _this.keggRetrieved, 5);
            new Downloader(_this.entriesUniprot.split(' ').filter(function (entry) { return entry.length > 0; }).map(function (id) { return SolubleController.urlUriprot.replace('{id}', id); }), _this.uniRetrieved, 5);
            new Downloader(_this.entriesEBI.split(' ').filter(function (entry) { return entry.length > 0; }).map(function (id) { return SolubleController.urlEBI.replace('{id}', id); }), _this.ebiRetrieved, 5);
            new Downloader(_this.entriesPDB.split(' ').filter(function (entry) { return entry.length > 0; }).map(function (id) { return SolubleController.urlPDB.replace('{id}', id); }), _this.pdbRetrieved, 5);
        };
        this.ncbiRetrieved = function (value) {
            var entry = NCBIParser.parseNCBIProteinEntry(value);
            if (entry) {
                var pro = new Solubility.ProteinSequence();
                pro.ID = entry.id;
                pro.link = 'http://www.ncbi.nlm.nih.gov/protein/' + pro.ID;
                pro.description = entry.definition;
                pro.source = entry.source;
                pro.sequence = entry.sequence;
                _this.databaseEntries.push(pro);
            }
        };
        this.keggRetrieved = function (value) {
            var gene = KEGGParser.parseGene(value);
            if (gene) {
                var pro = new Solubility.ProteinSequence();
                pro.ID = gene.entry;
                pro.link = 'http://www.genome.jp/dbget-bin/www_bget?' + pro.ID;
                pro.description = gene.definition;
                pro.source = gene.source;
                pro.sequence = gene.proteinSequence;
                _this.databaseEntries.push(pro);
                console.log(_this.databaseEntries);
            }
        };
        this.uniRetrieved = function (value) {
            var fasta = ProteinUtil.AnalyzeFASTA(value)[0];
            if (fasta) {
                var pro = new Solubility.ProteinSequence();
                pro.ID = fasta.ID;
                pro.link = 'http://www.uniprot.org/uniprot/' + pro.ID;
                pro.description = fasta.description;
                pro.source = fasta.source;
                pro.sequence = fasta.sequence;
                _this.databaseEntries.push(pro);
            }
        };
        this.ebiRetrieved = function (value) {
            var ebi = EBIParser.parseEBI(value);
            if (ebi) {
                var pro = new Solubility.ProteinSequence();
                pro.ID = ebi.ID;
                pro.link = 'http://www.ebi.ac.uk/ena/data/view/' + pro.ID;
                pro.description = ebi.definition;
                pro.source = ebi.source;
                pro.sequence = ebi.proteinSequence;
                _this.databaseEntries.push(pro);
            }
        };
        this.pdbRetrieved = function (value) {
            var fasta = ProteinUtil.AnalyzeFASTA(value)[0];
            if (fasta) {
                var pro = new Solubility.ProteinSequence();
                pro.ID = fasta.ID;
                pro.link = 'http://www.rcsb.org/pdb/explore/explore.do?structureId=' + pro.ID;
                pro.description = fasta.description;
                pro.source = fasta.source;
                pro.sequence = fasta.sequence;
                _this.databaseEntries.push(pro);
            }
        };
        this.databaseAddAll = function () {
            var proteins = _this.databaseEntries.map(function (pro) {
                ProteinUtil.CalculateProteinParameters(pro);
                return pro;
            });
            _this.setProteins(_this.project.proteins.combine(_this.databaseEntries), 'Load ' + proteins.length + ' Database Entries');
        };
        this.databaseAddSelected = function () {
            var proteins = _this.databaseEntries.filter(function (pro) {
                if (pro.selected)
                    ProteinUtil.CalculateProteinParameters(pro);
                return pro.selected;
            });
            _this.setProteins(_this.project.proteins.combine(_this.databaseEntries), 'Load ' + proteins.length + ' Selected Database Entries');
        };
        //KO
        this.koInterest = '';
        this.koReferenceTree = [new KEGGConditionNode()];
        this.koGenes = [];
        this.koAnalyze = function () {
            _this.kegg.OrthologySearch(_this.koInterest, _this.koReferenceTree[0], _this.koGenesCallback, _this.koSetMessage);
        };
        this.koGenesCallback = function (genes) {
            _this.koMessage = 'Genes that match contidion are listed.';
            _this.koGenes = genes;
        };
        this.koSetMessage = function (value) {
            _this.koMessage = value;
        };
        this.koCancel = function () {
            _this.kegg.CancelSearch();
            _this.koMessage = 'Search Cancelled.';
        };
        this.koClearGenes = function () {
            _this.koGenes = [];
        };
        this.koSelectAllGenes = function () {
            _this.koGenes.forEach(function (gene) {
                gene.selected = true;
            });
        };
        this.koSelectConditionMet = function () {
            _this.koGenes.forEach(function (gene) {
                gene.selected = gene.meetsCondition;
            });
        };
        this.koUnselectAllGenes = function () {
            _this.koGenes.forEach(function (gene) {
                gene.selected = false;
            });
        };
        this.koAddSelected = function () {
            var proteins = _this.koGenes.map(function (gene) {
                var protein = new Solubility.ProteinSequence();
                protein.ID = gene.entry;
                protein.link = 'http://www.genome.jp/dbget-bin/www_bget?' + gene.entry;
                protein.source = gene.source;
                protein.sequence = gene.proteinSequence;
                protein.description = gene.definition;
                ProteinUtil.CalculateProteinParameters(protein);
                return protein;
            });
            _this.setProteins(_this.project.proteins.combine(proteins), 'Load ' + proteins.length + ' KEGG Entries');
        };
        this.koTry = function () {
            _this.koInterest = 'K01823';
            var root = _this.koReferenceTree[0];
            root.mode = 'tree';
            root.method = 'Or';
            var node1 = new KEGGConditionNode(root);
            node1.value = 'K01641';
            var node2 = new KEGGConditionNode(root);
            node2.value = 'K00099';
            root.items.add(node1);
            root.items.add(node2);
            if (root.onModeChanged)
                root.onModeChanged();
        };
        //Blast
        this.blastSequence = '';
        this.blastLimit = 10;
        this.blastStart = function () {
            if (_this.blastLimit < 1)
                _this.blastLimit = 1;
            _this.ncbi.BLAST(ProteinUtil.AminoAcidFilter(_this.blastSequence), _this.blastLimit, _this.blastCallback, _this.blastSetMessage);
        };
        this.blastCallback = function (results) {
            _this.blastGenes.addRange(results);
        };
        this.blastSetMessage = function (value) {
            _this.blastMessage = value;
        };
        this.blastCancel = function () {
            _this.ncbi.Cancel();
        };
        this.blastTry = function () {
            _this.blastSequence = 'MKLAVYSTKQYDKKYLQQVNESFGFELEFFDFLLTEKTAKTANGCEAVCIFVNDDGSRPV'
                + 'LEELKKHGVKYIALRCAGFNNVDLDAAKELGLKVVRVPAYDPEAVAEHAIGMMMTLNRRI'
                + 'HRAYQRTRDANFSLEGLTGFTMYGKTAGVIGTGKIGVAMLRILKGFGMRLLAFDPYPSAA'
                + 'ALELGVEYVDLPTLFSESDVISLHCPLTPENYHLLNEAAFEQMKNGVMIVNTSRGALIDS'
                + 'QAAIEALKNQKIGSLGMDVYENERDLFFEDKSNDVIQDDVFRRLSACHNVLFTGHQAFLT'
                + 'AEALTSISQTTLQNLSNLEKGETCPNELV';
            _this.blastLimit = 500;
        };
        //uniprot
        this.uniprotQueryTree = [new uniprotQueryEntry()];
        this.uniprotReviewed = false;
        this.uniprotProteins = [];
        this.uniprotSetMessage = function (value) {
            _this.uniprotMessage = value;
        };
        this.uniprotModelBuilder = function (data, item) {
            return new uniprotQueryEntryModel(data, item);
        };
        this.uniprotSearch = function () {
            _this.uniprot.search(_this.uniprotQueryTree[0], _this.uniprotReviewed, _this.uniprotRetrieved, _this.uniprotSetMessage);
        };
        this.uniprotRetrieved = function (proteins) {
            _this.uniprotProteins.addRange(proteins);
        };
        this.uniprotSelectAllProteins = function () {
            _this.uniprotProteins.forEach(function (value) { return value.selected = true; });
        };
        this.uniprotUnselectAllProteins = function () {
            _this.uniprotProteins.forEach(function (value) { return value.selected = false; });
        };
        this.uniprotClearProteins = function () {
            _this.uniprotProteins.clear();
        };
        this.uniprotAddSelected = function () {
            var proteins = _this.uniprotProteins
                .filter(function (protein) { return protein.selected; })
                .map(function (value) { return ProteinUtil.CalculateProteinParameters(value); });
            _this.setProteins(_this.project.proteins.combine(proteins), 'Load ' + proteins.length + ' Uniprot Entries');
        };
        this.filterTreeInitialization = function () {
            var proteinOptions = new ConditionNodeOptions();
            proteinOptions.fields = [
                new FieldCondition('[ALL]', FieldCondition.stringConditions),
                new FieldCondition('ID', FieldCondition.stringConditions),
                new FieldCondition('link', FieldCondition.stringConditions),
                new FieldCondition('sequence', FieldCondition.stringConditions),
                new FieldCondition('source', FieldCondition.stringConditions),
                new FieldCondition('description', FieldCondition.stringConditions),
                new FieldCondition('note', FieldCondition.stringConditions),
                new FieldCondition('created', FieldCondition.numberConditions),
                new FieldCondition('hydrophobicityAverage', FieldCondition.numberConditions),
                new FieldCondition('numberOfCharge', FieldCondition.numberConditions),
                new FieldCondition('percentageOfCharge', FieldCondition.numberConditions),
                new FieldCondition('numberOfProline', FieldCondition.numberConditions),
                new FieldCondition('percentageOfProline', FieldCondition.numberConditions),
                new FieldCondition('numberOfCysteine', FieldCondition.numberConditions),
                new FieldCondition('aliphaticIndex', FieldCondition.numberConditions),
                new FieldCondition('percentageOfCysteine', FieldCondition.numberConditions),
                new FieldCondition('maxContigousHydrophobic', FieldCondition.numberConditions),
                new FieldCondition('turnFormingRate', FieldCondition.numberConditions),
                new FieldCondition('cutOff', FieldCondition.numberConditions),
                new FieldCondition('token', FieldCondition.numberConditions),
                new FieldCondition('chain', FieldCondition.stringConditions),
                new FieldCondition('matchPercentage', FieldCondition.numberConditions),
                new FieldCondition('surfaceAverage', FieldCondition.numberConditions),
                new FieldCondition('coreAverage', FieldCondition.numberConditions),
                new FieldCondition('contrast', FieldCondition.numberConditions),
                new FieldCondition('tokenHydrophobicityAverage', FieldCondition.numberConditions),
                new FieldCondition('tokenNumberOfCharge', FieldCondition.numberConditions),
                new FieldCondition('tokenPercentageOfCharge', FieldCondition.numberConditions),
                new FieldCondition('tokenNumberOfSurfaceCharge', FieldCondition.numberConditions),
                new FieldCondition('tokenPercentageOfSurfaceCharge', FieldCondition.numberConditions),
                new FieldCondition('tokenNumberOfProline', FieldCondition.numberConditions),
                new FieldCondition('tokenPercentageOfProline', FieldCondition.numberConditions),
                new FieldCondition('tokenNumberOfCysteine', FieldCondition.numberConditions),
                new FieldCondition('tokenPercentageOfCysteine', FieldCondition.numberConditions),
                new FieldCondition('tokenMaxContigousHydrophobic', FieldCondition.numberConditions),
                new FieldCondition('tokenTurnFormingRate', FieldCondition.numberConditions),
                new FieldCondition('tokenChain', FieldCondition.stringConditions),
                new FieldCondition('tokenAliphaticIndex', FieldCondition.numberConditions)
            ];
            _this.filterTree = [new ConditionNode(proteinOptions)];
            var modelOptions = new ConditionNodeOptions();
            modelOptions.fields = [
                new FieldCondition('[ALL]', null),
                new FieldCondition('model.ID', FieldCondition.stringConditions),
                new FieldCondition('model.source', FieldCondition.stringConditions),
                new FieldCondition('model.description', FieldCondition.stringConditions),
                new FieldCondition('model.hitLength', FieldCondition.numberConditions),
                new FieldCondition('model.created', FieldCondition.numberConditions),
                new FieldCondition('model.surfaceAverage', FieldCondition.numberConditions),
                new FieldCondition('model.coreAverage', FieldCondition.numberConditions),
                new FieldCondition('model.unknownAverage', FieldCondition.numberConditions),
                new FieldCondition('model.contrast', FieldCondition.numberConditions),
                new FieldCondition('model.surfaceCharge', FieldCondition.numberConditions),
                new FieldCondition('model.coreCharge', FieldCondition.numberConditions),
                new FieldCondition('model.unknownCharge', FieldCondition.numberConditions),
                new FieldCondition('model.percentageOfSurfaceCharge', FieldCondition.numberConditions),
                new FieldCondition('model.percentageOfCoreCharge', FieldCondition.numberConditions),
                new FieldCondition('model.percentageOfUnknownCharge', FieldCondition.numberConditions),
                new FieldCondition('model.surfaceCount', FieldCondition.numberConditions),
                new FieldCondition('model.coreCount', FieldCondition.numberConditions),
                new FieldCondition('model.unknownCount', FieldCondition.numberConditions),
                new FieldCondition('model.tokenCount', FieldCondition.numberConditions),
                new FieldCondition('model.truncatedNCount', FieldCondition.numberConditions),
                new FieldCondition('model.truncatedCCount', FieldCondition.numberConditions),
                new FieldCondition('model.matchCount', FieldCondition.numberConditions),
                new FieldCondition('model.matchRate', FieldCondition.numberConditions),
                new FieldCondition('model.unmatchCount', FieldCondition.numberConditions),
                new FieldCondition('model.tokenAverage', FieldCondition.numberConditions),
                new FieldCondition('model.tokenNumberOfCharge', FieldCondition.numberConditions),
                new FieldCondition('model.tokenPercentageOfCharge', FieldCondition.numberConditions),
                new FieldCondition('model.tokenNumberOfProline', FieldCondition.numberConditions),
                new FieldCondition('model.tokenPercentageOfProline', FieldCondition.numberConditions),
                new FieldCondition('model.tokenNumberOfCysteine', FieldCondition.numberConditions),
                new FieldCondition('model.tokenPercentageOfCysteine', FieldCondition.numberConditions),
                new FieldCondition('model.tokenMaxContigousHydrophobic', FieldCondition.numberConditions),
                new FieldCondition('model.tokenTurnFormingRate', FieldCondition.numberConditions),
                new FieldCondition('model.tokenAliphaticIndex', FieldCondition.numberConditions),
                new FieldCondition('model.hostAlign', FieldCondition.stringConditions),
                new FieldCondition('model.modelAlign', FieldCondition.stringConditions),
                new FieldCondition('model.scoreAlign', FieldCondition.stringConditions),
                new FieldCondition('protein.ID', FieldCondition.stringConditions),
                new FieldCondition('protein.link', FieldCondition.stringConditions),
                new FieldCondition('protein.sequence', FieldCondition.stringConditions),
                new FieldCondition('protein.source', FieldCondition.stringConditions),
                new FieldCondition('protein.description', FieldCondition.stringConditions),
                new FieldCondition('protein.note', FieldCondition.stringConditions),
                new FieldCondition('protein.created', FieldCondition.numberConditions),
                new FieldCondition('protein.hydrophobicityAverage', FieldCondition.numberConditions),
                new FieldCondition('protein.numberOfCharge', FieldCondition.numberConditions),
                new FieldCondition('protein.percentageOfCharge', FieldCondition.numberConditions),
                new FieldCondition('protein.numberOfProline', FieldCondition.numberConditions),
                new FieldCondition('protein.percentageOfProline', FieldCondition.numberConditions),
                new FieldCondition('protein.numberOfCysteine', FieldCondition.numberConditions),
                new FieldCondition('protein.aliphaticIndex', FieldCondition.numberConditions),
                new FieldCondition('protein.percentageOfCysteine', FieldCondition.numberConditions),
                new FieldCondition('protein.maxContigousHydrophobic', FieldCondition.numberConditions),
                new FieldCondition('protein.turnFormingRate', FieldCondition.numberConditions),
                new FieldCondition('protein.cutOff', FieldCondition.numberConditions),
                new FieldCondition('protein.token', FieldCondition.numberConditions),
                new FieldCondition('protein.chain', FieldCondition.stringConditions),
                new FieldCondition('protein.matchPercentage', FieldCondition.numberConditions),
                new FieldCondition('protein.surfaceAverage', FieldCondition.numberConditions),
                new FieldCondition('protein.coreAverage', FieldCondition.numberConditions),
                new FieldCondition('protein.contrast', FieldCondition.numberConditions),
                new FieldCondition('protein.tokenHydrophobicityAverage', FieldCondition.numberConditions),
                new FieldCondition('protein.tokenNumberOfCharge', FieldCondition.numberConditions),
                new FieldCondition('protein.tokenPercentageOfCharge', FieldCondition.numberConditions),
                new FieldCondition('protein.tokenNumberOfSurfaceCharge', FieldCondition.numberConditions),
                new FieldCondition('protein.tokenPercentageOfSurfaceCharge', FieldCondition.numberConditions),
                new FieldCondition('protein.tokenNumberOfProline', FieldCondition.numberConditions),
                new FieldCondition('protein.tokenPercentageOfProline', FieldCondition.numberConditions),
                new FieldCondition('protein.tokenNumberOfCysteine', FieldCondition.numberConditions),
                new FieldCondition('protein.tokenPercentageOfCysteine', FieldCondition.numberConditions),
                new FieldCondition('protein.tokenMaxContigousHydrophobic', FieldCondition.numberConditions),
                new FieldCondition('protein.tokenTurnFormingRate', FieldCondition.numberConditions),
                new FieldCondition('protein.tokenChain', FieldCondition.stringConditions),
                new FieldCondition('protein.tokenAliphaticIndex', FieldCondition.numberConditions)
            ];
            _this.modelTree = [new ConditionNode(modelOptions)];
        };
        this.runFilter = function () {
            try {
                var code = '(' + _this.filterEditor.getValue() + ')';
                var filter = eval(code);
                var oCount = _this.project.proteins.length;
                var proteins = _this.project.proteins.filter(filter.filter);
                _this.setProteins(proteins, 'Filter: ' + filter.name);
                var nCount = _this.project.proteins.length;
                _this.filterMessage = filter.name + ': ' + (oCount - nCount).toString() + ' protiens were disposed.';
            }
            catch (ex) {
                _this.filterMessage = ex.toString();
            }
        };
        this.filterCodeBase = '{\n\tname: \'{name}\',\n\tfilter: function filter(protein){\n\t\treturn {proteincode}\n\t},\n\tmodelFilter: function modelFilter(model, protein){\n\t\treturn {modelcode}\n\t}\n}';
        this.filterAll = function () {
            _this.filterEditor.setValue(_this.filterCodeBase.replace('{name}', 'all').replace('{code}', '\t\treturn true;\n'));
        };
        this.filterTemplateSelector = function (data, templates) {
            if (data.mode == 'value') {
                return templates[0];
            }
            else {
                return templates[1];
            }
        };
        this.filterModelBuilder = function (data, item) {
            return new ConditionNodeModel(data, item);
        };
        this.filterCustom = function () {
            var tryNumber = function (value) {
                var num = Number(value);
            };
            var mapper = function (prefix) {
                if (!prefix)
                    prefix = '';
                var builder = function (node) {
                    var raw = 'true';
                    if (node.mode == 'value') {
                        switch (node.condition) {
                            case '=':
                                raw = '(' + prefix + node.field.name + ' == ' + Number(node.value).toString() + ')';
                                break;
                            case '>':
                                raw = '(' + prefix + node.field.name + ' > ' + Number(node.value).toString() + ')';
                                break;
                            case '<':
                                raw = '(' + prefix + node.field.name + ' < ' + Number(node.value).toString() + ')';
                                break;
                            case '>=':
                                raw = '(' + prefix + node.field.name + ' >= ' + Number(node.value).toString() + ')';
                                break;
                            case '<=':
                                raw = '(' + prefix + node.field.name + ' <= ' + Number(node.value).toString() + ')';
                                break;
                            case '!=':
                                raw = '(' + prefix + node.field.name + ' != ' + Number(node.value).toString() + ')';
                                break;
                            case 'Equals':
                                raw = '(' + prefix + node.field.name + ' == ' + JSON.stringify(node.value) + ')';
                                break;
                            case 'Contains':
                                raw = '(' + prefix + node.field.name + '.indexOf(' + JSON.stringify(node.value) + ') > -1)';
                                break;
                            case 'BeginWith':
                                raw = '(' + prefix + node.field.name + '.indexOf(' + JSON.stringify(node.value) + ') == 0)';
                                break;
                            case 'EndWith':
                                raw = '(' + prefix + node.field.name + '.lastIndexOf(' + JSON.stringify(node.value) + ') == (protein.' + node.field.name + '.length - ' + node.value.length.toString() + ' ))';
                                break;
                            case 'RegularExpressionMatch':
                                raw = '((new RegExp(' + JSON.stringify(node.value) + ', \'ig\')).IsMatch(protein.' + node.field.name + '))';
                                break;
                            default:
                                raw = '(true)';
                                break;
                        }
                    }
                    else {
                        var raws = node.items.map(builder);
                        if (node.options.methods.indexOf(node.method) == 0) {
                            raw = raws.join(' && ');
                        }
                        else {
                            raw = raws.join(' || ');
                        }
                    }
                    if (node.options.operators.indexOf(node.operator) == 1) {
                        raw = '!' + raw;
                    }
                    return raw;
                };
                return builder;
            };
            var proteincode = mapper('protein.')(_this.filterTree[0]);
            var modelcode = mapper('')(_this.modelTree[0]);
            _this.filterEditor.setValue(_this.filterCodeBase.replace('{name}', 'Custom').replace('{proteincode}', proteincode).replace('{modelcode}', modelcode));
        };
        this.sorterFields = ['sequence.length', 'hydrophobicityAverage', 'numberOfCharge', 'percentageOfCharge', 'aliphaticIndex',
            'numberOfProline', 'percentageOfProline', 'numberOfCysteine', 'percentageOfCysteine', 'turnFormingRate', 'maxContigousHydrophobic',
            'model.ID', 'model.hitLength', 'model.surfaceAverage', 'model.coreAverage', 'model.unknownAverage', 'model.contrast',
            'model.surfaceCharge', 'model.coreCharge', 'model.unknownCharge', 'model.surfaceChargePercentage', 'model.coreChargePercentage',
            'model.unknownChargePercentage', 'model.surfaceCount', 'model.coreCount', 'model.unknownCount', 'model.tokenCount',
            'model.truncatedNCount', 'model.truncatedCCount', 'model.matchCount', 'model.matchRate', 'model.unmatchCount', 'model.tokenAverage',
            'model.tokenNumberOfCharge', 'model.tokenPercentageOfCharge', 'model.tokenNumberOfProline', 'model.tokenPercentageOfProline',
            'model.tokenNumberOfCysteine', 'model.tokenPercentageOfCysteine', 'model.tokenMaxContigousHydrophobic', 'model.tokenTurnFormingRate',
            'model.tokenAliphaticIndex', null];
        this.sorterModelFields = ['hitLength', 'surfaceAverage', 'coreAverage', 'unknownAverage', 'contrast', 'surfaceCharge',
            'coreCharge', 'unknownCharge', 'surfaceChargePercentage', 'coreChargePercentage', 'unknownChargePercentage', 'surfaceCount',
            'coreCount', 'unknownCount', 'tokenCount', 'truncatedNCount', 'truncatedCCount', 'matchCount', 'matchRate', 'unmatchCount',
            'tokenAverage', 'tokenNumberOfCharge', 'tokenPercentageOfCharge', 'tokenNumberOfProline', 'tokenPercentageOfProline', 'tokenNumberOfCysteine',
            'tokenPercentageOfCysteine', 'tokenMaxContigousHydrophobic', 'tokenTurnFormingRate', 'tokenAliphaticIndex', null];
        this.sorterPrimaryReversed = true;
        this.sorterSecondaryReversed = true;
        this.sorterCodeBase = '{\n\tname: \'{name}\',,\n\tmodelcomparer: function modelcomparer(x, y){\n{model}\t},\n\tcomparer: function comparer(x, y){\n{protein}\t}\n}';
        this.sorterModelPrimaryReversed = true;
        this.sorterModelSecondaryReversed = true;
        this.builderSorter = function () {
            var modelPrimary;
            var modelSecondary;
            if (_this.sorterModelPrimary) {
                if (_this.sorterModelSecondary) {
                    modelPrimary = _this.sorterModelPrimary;
                    modelSecondary = _this.sorterModelSecondary;
                }
                else {
                    modelPrimary = _this.sorterModelPrimary;
                    modelSecondary = null;
                }
            }
            else {
                if (_this.sorterModelSecondary) {
                    modelPrimary = _this.sorterModelSecondary;
                    modelSecondary = null;
                }
                else {
                    return;
                }
            }
            var primary;
            var secondary;
            if (_this.sorterPrimary) {
                if (_this.sorterSecondary) {
                    primary = _this.sorterPrimary;
                    secondary = _this.sorterSecondary;
                }
                else {
                    primary = _this.sorterPrimary;
                    secondary = null;
                }
            }
            else {
                if (_this.sorterSecondary) {
                    primary = _this.sorterSecondary;
                    secondary = null;
                }
                else {
                    return;
                }
            }
            var sorter = {};
            sorter.Primary = primary;
            sorter.Secondary = secondary;
            sorter.ModelPrimary = modelPrimary;
            sorter.ModelSecondary = modelSecondary;
            sorter.PrimarySorter = _this.sorterPrimaryReversed ? '-1 : 1' : '1 : -1';
            sorter.SecondarySorter = _this.sorterSecondaryReversed ? '-1 : 1' : '1 : -1';
            sorter.ModelPrimarySorter = _this.sorterModelPrimaryReversed ? '-1 : 1' : '1 : -1';
            sorter.ModelSecondarySorter = _this.sorterSecondaryReversed ? '-1 : 1' : '1 : -1';
            sorter.Operator = _this.sorterPrimaryReversed ? '>' : '<';
            sorter.ModelOperator = _this.sorterModelPrimaryReversed ? '>' : '<';
            var code = _this.sorterCodeBase.replace('{name}', '{Primary}{Operator}{Secondary}'.apply(sorter));
            if (modelSecondary) {
                code = code
                    .replace('{model}', ('\t\tif(!isValidNumber(x.{ModelPrimary}))return true?{ModelPrimarySorter};\n' +
                    '\t\tif(!isValidNumber(y.{ModelPrimary}))return false?{ModelPrimarySorter};\n' +
                    '\t\tif(x.{ModelPrimary} == y.{ModelPrimary}){\n' +
                    '\t\t\tif(!isValidNumber(x.{ModelSecondary}))return true?{ModelSecondarySorter};\n' +
                    '\t\t\tif(!isValidNumber(y.{ModelSecondary}))return false?{ModelSecondarySorter};\n' +
                    '\t\t\treturn (x.{ModelSecondary} > y.{ModelSecondary})?{ModelSecondarySorter};\n' +
                    '\t\t}\n' +
                    '\t\telse{\n' +
                    '\t\t\treturn (x.{ModelPrimary} > y.{ModelPrimary})?{ModelPrimarySorter};\n' +
                    '\t\t}\n').apply(sorter));
            }
            else {
                if (modelPrimary) {
                    code = code
                        .replace('{model}', ('\t\tif(!isValidNumber(x.{ModelPrimary}))return true?{ModelPrimarySorter};\n' +
                        '\t\tif(!isValidNumber(y.{ModelPrimary}))return false?{ModelPrimarySorter};\n' +
                        '\t\treturn (x.{ModelPrimary} > y.{ModelPrimary})?{ModelPrimarySorter};\n').apply(sorter));
                }
                else {
                    code = code
                        .replace('{model}', '\t\treturn 1;\n');
                }
            }
            if (secondary) {
                code = code
                    .replace('{protein}', ('\t\tif(!isValidNumber(x.{Primary}))return true?{PrimarySorter};\n' +
                    '\t\tif(!isValidNumber(y.{Primary}))return false?{PrimarySorter};\n' +
                    '\t\tif(x.{Primary} == y.{Primary}){\n' +
                    '\t\t\tif(!isValidNumber(x.{Secondary}))return true?{SecondarySorter};\n' +
                    '\t\t\tif(!isValidNumber(y.{Secondary}))return false?{SecondarySorter};\n' +
                    '\t\t\treturn (x.{Secondary} > y.{Secondary})?{SecondarySorter};\n' +
                    '\t\t}\n' +
                    '\t\telse{\n' +
                    '\t\t\treturn (x.{Primary} > y.{Primary})?{PrimarySorter};\n' +
                    '\t\t}\n').apply(sorter));
            }
            else {
                code = code
                    .replace('{protein}', ('\t\tif(!isValidNumber(x.{Primary}))return true?{PrimarySorter};\n' +
                    '\t\tif(!isValidNumber(y.{Primary}))return false?{PrimarySorter};\n' +
                    '\t\treturn (x.{Primary} > y.{Primary})?{PrimarySorter};\n').apply(sorter));
            }
            _this.sorterEditor.setValue(code);
        };
        this.runSorter = function () {
            try {
                console.log(_this.sorterEditor);
                var code = '(' + _this.sorterEditor.getValue() + ')';
                var comparer = eval(code);
                _this.project.proteins.forEach(function (pro) {
                    if (pro.models)
                        pro.models.sort(comparer.modelcomparer);
                });
                _this.project.proteins.sort(comparer.comparer);
            }
            catch (ex) {
                _this.sorterMessage = ex.toString();
            }
        };
        //public pdbCalculationJobID: string;
        this.pdbSetMessage = function (value) {
            _this.pdbMessage = value;
        };
        this.pdbSearchForAll = function () {
            _this.pdb.searchPDB(_this.project.proteins.filter(function () { return true; }), 10, _this.pdbSetMessage, true);
        };
        this.pdbSearchForSelected = function () {
            _this.pdb.searchPDB(_this.project.proteins.filter(function (pro) { return pro.selected; }), 10, _this.pdbSetMessage, true);
        };
        this.pdbSubmitAllCalculation = function () {
            _this.project.buildChains();
            var job = new Solubility.Job();
            job.structures = _this.project.getMissingChains();
            JobServiceClient.Manager.submitJob(job, _this.pdbSubmitCalculationCallback);
        };
        this.pdbSubmitSelectedCalculation = function () {
            _this.project.buildChains();
            var job = new Solubility.Job();
            job.structures = _this.project.proteins
                .filter(function (pro) { return pro.selected; })
                .collectUnique(function (pro) { return pro.models.map(function (model) { return model.ID; }); });
            JobServiceClient.Manager.submitJob(job, _this.pdbSubmitCalculationCallback);
        };
        this.pdbCopyLinkChanged = function () {
            if (_this.pdbLinkForCopy != _this.pdbCalculationLink)
                _this.pdbLinkForCopy = _this.pdbCalculationLink;
        };
        this.pdbSubmitCalculationCallback = function (status) {
            if (typeof status == 'string') {
                _this.pdbMessage = 'Submitting Calculation Error.';
                console.log(status);
            }
            else {
                var absUrl = _this.location.absUrl();
                var index = absUrl.lastIndexOf('\/');
                _this.pdbCalculationLink = absUrl.substr(0, index + 1) + 'job.html?' + status.jobID;
                _this.pdbLinkForCopy = _this.pdbCalculationLink;
            }
        };
        this.pdbObtainAllSurface = function () {
            _this.project.buildChains();
            var structures = _this.project.getMissingChains();
            var chains = _this.project.getMissingChains();
            if (chains.length > 0) {
                _this.obtainMessage = 'Downloading {0} missing chains from the PSSS server...'.format(chains.length);
                JobServiceClient.Manager.downloadChains(chains, _this.pdbSurfaceDownloadCallback);
            }
            else {
            }
        };
        this.pdbSurfaceDownloadCallback = function (value) {
            value.chains.forEach(function (data) {
                _this.project.chains[data.name].surface = data.value;
            });
            if (value.missing > 0) {
                _this.obtainMessage = '{0} of {1} chain surface have not been analyzed. Please check if the surface residue analysis has been done.'.format(value.missing, value.total) +
                    ' If not, please use the buttons above to analyze surface and open new tabs to run the jobs.';
            }
            else {
                _this.obtainMessage = 'All {0} chain surface have been retrieved.'.format(value.total);
            }
        };
        this.pdbAlignAll = function () {
            //perform alignments for all sequences;
            //var d = this.aligner.runner.finished;
            //var c = this.aligner.runner.total;
            _this.aligner = new ProteinClustal(_this.project.proteins, _this.project);
            _this.aligner.onComplete = _this.pdbAlignComplete;
            _this.aligner.start();
        };
        this.pdbCancelAlign = function () {
            _this.aligner.stop();
            _this.aligner = undefined;
        };
        this.pdbAlignComplete = function () {
            _this.aligner = undefined;
        };
        this.onSurfaceFileRetieved = function (value) {
            if (typeof value == 'object') {
                var data = value;
                _this.project.chains[data.name].surface = data.value;
            }
        };
        this.onSurfaceFileComplete = function (downloaded, failed) {
            //try to find out how many was not downloaded;
            var chains = _this.project.getMissingChains();
            var urls = chains.map(function (chain) { return 'psdb\/' + chain + '.json'; });
        };
        this.countNotCalculated = function () {
        };
        this.countNotAligned = function () {
            _this.numberOfNotAligned = _this.project.proteins.sum(function (pro) { return pro.models.sum(function (model) { return model.scoreAlign ? 0 : 1; }); });
        };
        //Alignment & Export
        this.selectMode = 0;
        this.countSelected = function () {
            console.log('count selection');
            _this.numberOfSelected = _this.project.proteins.count(function (pro) { return pro.selected; });
        };
        this.selectSelectAll = function () {
            _this.project.proteins.forEach(function (pro) { return pro.selected = true; });
            _this.countSelected();
        };
        this.selectUnselectAll = function () {
            _this.project.proteins.forEach(function (pro) { return pro.selected = false; });
            _this.countSelected();
        };
        this.selectFilter = function () {
            try {
                var code = '(' + _this.selectEditor.getValue() + ')';
                var func = eval(code);
                for (var i = 0; i < _this.project.proteins.length; i++) {
                    var protein = _this.project.proteins[i];
                    protein.selected = func.selector(i, protein, _this.project.proteins);
                }
                _this.selectMessage = '';
            }
            catch (ex) {
                _this.selectMessage = ex.toString();
            }
            _this.countSelected();
        };
        //Align
        this.alignmentRequests = [];
        this.alignSelected = function () {
            var align = 'new string';
            var we = 'hello';
            var request = new ClustalORequest();
            request.entries = _this.project.proteins.filter(function (pro) { return pro.selected; }).map(function (pro) {
                var request = new ClustalORequestEntry();
                request.key = pro.ID;
                request.protein = pro;
                request.sequence = pro.sequence;
                return request;
            });
            _this.alignmentRequests.push(request);
            request.sendRequest();
        };
        this.proteinFields = ['ID', 'selected', 'link', 'sequence', 'source', 'description', 'note', 'hydrophobicityAverage', 'numberOfCharge', 'percentageOfCharge', 'numberOfProline', 'percentageOfProline', 'numberOfCysteine', 'aliphaticIndex', 'percentageOfCysteine', 'maxContigousHydrophobic', 'turnFormingRate', 'cutOff', 'token', 'model', 'chain', 'matchPercentage', 'surfaceAverage', 'coreAverage', 'contrast', 'tokenHydrophobicityAverage', 'tokenNumberOfCharge', 'tokenPercentageOfCharge', 'tokenNumberOfSurfaceCharge', 'tokenPercentageOfSurfaceCharge', 'tokenNumberOfProline', 'tokenPercentageOfProline', 'tokenNumberOfCysteine', 'tokenPercentageOfCysteine', 'tokenMaxContigousHydrophobic', 'tokenTurnFormingRate', 'tokenChain', 'tokenAliphaticIndex'];
        this.prepareCSV = function () {
            if (_this.project.name) {
                _this.csvName = _this.project.name + '.csv';
            }
            else {
                _this.csvName = 'proteins.csv';
            }
            var keyFormat = /^\w+$/ig;
            var lines = _this.project.proteins.map(function (pro) {
                var lineSegments = _this.proteinFields.map(function (field) {
                    var value = pro[field];
                    if (value) {
                        switch (typeof value) {
                            case 'string':
                                return value;
                            case 'number':
                                return value.toString();
                        }
                    }
                    else {
                        return '';
                    }
                });
                return lineSegments.join(',');
            });
            lines.splice(0, 0, _this.proteinFields.join(','));
            _this.csvData = 'data:text/xml;base64,' + btoa(lines.join('\r\n'));
        };
        this.prepareXML = function () {
            if (_this.project.name) {
                _this.xmlName = _this.project.name + '.xml';
            }
            else {
                _this.xmlName = 'proteins.xml';
            }
            var keyFormat = /^\w+$/ig;
            var lines = _this.project.proteins.map(function (pro) {
                var lineSegments = ['\t<Protein '];
                for (var key in pro) {
                    if (keyFormat.IsMatch(key)) {
                        var value = pro[key];
                        switch (typeof value) {
                            case 'string':
                                lineSegments.push(' ', key, '="', value.encodeXML(), '"');
                                break;
                            case 'number':
                                lineSegments.push(' ', key, '="', value.toString(), '"');
                                break;
                        }
                    }
                }
                lineSegments.push('/>\r\n');
                return lineSegments.join('');
            });
            _this.xmlData = 'data:text/xml;base64,' + btoa('<XML>\r\n' + lines.join('') + '</XML>');
        };
        this.prepareCustomized = function () {
            if (_this.project.name) {
                _this.customizedName = _this.project.name + '.xml';
            }
            else {
                _this.customizedName = 'proteins.xml';
            }
            try {
                var code = '(' + _this.exportEditor.getValue() + ')';
                var func = eval(code);
                var builder = [];
                func.prepare(builder, _this.proteinFields.filter(function () { return true; }));
                for (var i = 0; i < _this.project.proteins.length; i++) {
                    var protein = _this.project.proteins[i];
                    if (!func.build(builder, i, protein, _this.project.proteins, _this.proteinFields.filter(function () { return true; })))
                        break;
                }
                _this.customizedData = 'data:text/plain;base64,' + btoa(func.finish(builder, _this.proteinFields.filter(function () { return true; })));
                _this.exportMessage = '';
            }
            catch (ex) {
                console.log('error:', ex);
                _this.exportMessage = ex.toString();
            }
        };
        this.exportTab = function () {
            var keyFormat = /^\w+$/ig;
            var lines = _this.project.proteins.map(function (pro) {
                var lineSegments = _this.proteinFields.map(function (field) {
                    var value = pro[field];
                    if (value) {
                        switch (typeof value) {
                            case 'string':
                                return value;
                            case 'number':
                                return value.toString();
                        }
                    }
                    else {
                        return '';
                    }
                });
                return lineSegments.join('\t');
            });
            lines.splice(0, 0, _this.proteinFields.join('\t'));
            _this.exportText = lines.join('\r\n');
        };
        this.exportBuilder = function () {
            try {
                var code = '(' + _this.exportEditor.getValue() + ')';
                var func = eval(code);
                var builder = [];
                func.prepare(builder, _this.proteinFields.filter(function () { return true; }));
                for (var i = 0; i < _this.project.proteins.length; i++) {
                    var protein = _this.project.proteins[i];
                    if (!func.build(builder, i, protein, _this.project.proteins, _this.proteinFields.filter(function () { return true; })))
                        break;
                }
                _this.exportText = func.finish(builder, _this.proteinFields.filter(function () { return true; }));
                _this.exportMessage = '';
            }
            catch (ex) {
                console.log('error:', ex);
                _this.exportMessage = ex.toString();
            }
        };
        //Sequence Viewer
        this.sequenceVisible = false;
        this.sequences = [];
        //Alignment Viewer
        this.alignments = [];
        this.http = $http;
        this.scope = $scope;
        this.location = $location;
        CORS.http = $http;
        CORS.timeout = $timeout;
        CORS.interval = $interval;
        RPC.http = $http;
        this.filterTreeInitialization();
        //$scope.$on('$viewContentLoaded', this.initMode);
        this.nodeServer = jQuery.cookie('node');
        if (this.nodeServer)
            this.nodeListFiles();
        //console.log('absUrl', $location.absUrl(), 'path', $location.path(), 'host', $location.host(), 'url', $location.url());
    }
    SolubleController.prototype.addingSequenceChange = function () {
        this.addingProtein.sequence = ProteinUtil.AminoAcidFilter(this.addingSequence);
    };
    SolubleController.prototype.addProtein = function () {
        if (!this.addingProtein.sequence)
            return;
        if (this.addingProtein.sequence.length == 0)
            return;
        ProteinUtil.CalculateProteinParameters(this.addingProtein);
        this.setProteins(this.project.proteins.combine([this.addingProtein]), 'Add ' + this.addingProtein.ID);
        this.addingProtein = new Solubility.ProteinSequence();
        this.addingSequence = '';
    };
    SolubleController.prototype.sequenceTry = function () {
        this.addingProtein = new Solubility.ProteinSequence();
        this.addingProtein.ID = 'b1380';
        this.addingProtein.link = 'http://www.genome.jp/dbget-bin/www_bget?eco:b1380';
        this.addingProtein.source = 'Escherichia coli K-12 MG1655';
        this.addingProtein.description = 'ldhA, fermentative D-lactate dehydrogenase, NAD-dependent (EC:1.1.1.28)';
        this.addingSequence = 'MKLAVYSTKQYDKKYLQQVNESFGFELEFFDFLLTEKTAKTANGCEAVCIFVNDDGSRPV\r\n'
            + 'LEELKKHGVKYIALRCAGFNNVDLDAAKELGLKVVRVPAYDPEAVAEHAIGMMMTLNRRI\r\n'
            + 'HRAYQRTRDANFSLEGLTGFTMYGKTAGVIGTGKIGVAMLRILKGFGMRLLAFDPYPSAA\r\n'
            + 'ALELGVEYVDLPTLFSESDVISLHCPLTPENYHLLNEAAFEQMKNGVMIVNTSRGALIDS\r\n'
            + 'QAAIEALKNQKIGSLGMDVYENERDLFFEDKSNDVIQDDVFRRLSACHNVLFTGHQAFLT\r\n'
            + 'AEALTSISQTTLQNLSNLEKGETCPNELV';
    };
    SolubleController.prototype.inputDetectFASTA = function () {
        this.detectedFASTA = ProteinUtil.AnalyzeFASTA(this.inputFASTA);
    };
    SolubleController.prototype.addFASTA = function () {
        this.detectedFASTA.forEach(function (fasta) { return ProteinUtil.CalculateProteinParameters(fasta); });
        this.setProteins(this.project.proteins.combine(this.detectedFASTA), 'Load ' + this.detectedFASTA.length + ' FASTA');
        this.detectedFASTA = [];
        this.inputFASTA = '';
    };
    SolubleController.prototype.fastaTry = function () {
        this.inputFASTA = '>tr|C3TB72|C3TB72_ECOLX D-lactate dehydrogenase OS=Escherichia coli GN=ldhA PE=3 SV=1\r\n'
            + 'MKLAVYSTKQYDKKYLQQVNESFGFELEFFDFLLTEKTAKTANGCEAVCIFVNDDGSRPV\r\n'
            + 'LEELKKHGVKYIALRCAGFNNVDLDAAKELGLKVVRVPAYDPEAVAEHAIGMMMTLNRRI\r\n'
            + 'HRAYQRTRDANFSLEGLTGFTMYGKTAGVIGTGKIGVAMLRILKGFGMRLLAFDPYPSAA\r\n'
            + 'ALELGVEYVDLPTLFSESDVISLHCPLTPENYHLLNEAAFDQMKNGVMIVNTSRGALIDS\r\n'
            + 'QAAIEALKNQKIGSLGMDVYENERDLFFEDKSNDVIQDDVFRRLSACHNVLFTGHQAFLT\r\n'
            + 'AEALTSISQTTLQNLSNLEKGETCPNELV\r\n'
            + '>tr|J7R0U0|J7R0U0_ECOLX Fermentative D-lactate dehydrogenase, NAD-dependent OS=Escherichia coli chi7122 GN=ldhA PE=3 SV=1\r\n'
            + 'MKLAVYSTKQYDKKYLQQVNESFGFELEFFDFLLTEKTAKTANGCEAVCIFVNDDGSRPV\r\n'
            + 'LEELKKHGVKYIALRCAGFNNVDLDAAKELGLKVVRVPAYDPEAVAEHAIGMMMTLNRRI\r\n'
            + 'HRAYQRTRDANFSLEGLTGFTMYGKTAGVIGTGKIGVAMLRILKGFGMRLLAFDPYPSAA\r\n'
            + 'ALELGVEYVDLPTLFSESDVISLHCPLTPENYHLLNEAAFDQMKNGVMIVNTSRGALIDS\r\n'
            + 'QAAIEALKNQKIGSLGMDVYENERDLFFEDKSNDVIQDDVFRRLSACHNVLFTGHQAFLT\r\n'
            + 'AEALTSISQTTLQNLSNLEKGETCPNELV\r\n';
        this.inputDetectFASTA();
    };
    SolubleController.prototype.koTemplateSelector = function (data, templates) {
        //echo('selector: ' +  data.mode);
        switch (data.mode) {
            case 'value':
                return templates[0];
            case 'tree':
                return templates[1];
            default:
                return templates[0];
        }
    };
    SolubleController.prototype.koModelBuilder = function (data, item) {
        return new KEGGConditionNodeModel(data, item);
    };
    SolubleController.prototype.uniprotTemplateSelector = function (data, templates) {
        switch (data.mode) {
            case 'value':
                return templates[0];
            case 'tree':
                return templates[1];
            default:
                return templates[0];
        }
    };
    SolubleController.prototype.uniprotTry = function () {
        var root = this.uniprotQueryTree[0];
        root.mode = 'tree';
        root.method = 'And';
        var node1 = new uniprotQueryEntry(root);
        node1.value = 'insulin';
        var node2 = new uniprotQueryEntry(root);
        node2.value = 'homo';
        var node3 = new uniprotQueryEntry(root);
        node3.switchNot();
        node3.value = 'receptor';
        root.items.add(node1);
        root.items.add(node2);
        root.items.add(node3);
        if (root.onModeChanged)
            root.onModeChanged();
    };
    SolubleController.prototype.showSequence = function (protein) {
        this.sequenceIndex = this.sequences.length;
        this.sequences.push(protein);
        this.mode = 9;
    };
    SolubleController.prototype.showAlignment = function (model) {
        var data = {};
        data.alignment = {};
        data.title = '{0}=>{1}'.format(this.selectedProtein.ID, model.ID);
        data.alignment.$score = model.scoreAlign;
        data.alignment.$surface = this.project.chains[model.ID].surface;
        data.alignment[this.selectedProtein.ID] = model.hostAlign;
        data.alignment.$model = model.modelAlign;
        this.alignmentIndex = this.alignments.length;
        this.alignments.push(data);
        this.mode = 10;
    };
    SolubleController.$inject = ['$http', '$scope', '$timeout', '$interval', '$location'];
    SolubleController.urlNCBIGp = 'http://www.ncbi.nlm.nih.gov/sviewer/viewer.cgi?tool=portal&sendto=on&log$=seqview&db=protein&dopt=gpwithparts&sort=&val={id}&from=begin&to=end&extrafeat=984';
    SolubleController.urlKEGG = 'http://rest.kegg.jp/get/{id}';
    SolubleController.urlUriprot = 'http://www.uniprot.org/uniprot/{id}.fasta';
    SolubleController.urlPDB = 'http://www.rcsb.org/pdb/files/fasta.txt?structureIdList={id}';
    SolubleController.urlEBI = 'http://www.ebi.ac.uk/ena/data/view/{id}&display=text';
    return SolubleController;
}());
var appSoluble = new ngstd.AngularModule('soluble', ['angucomplete-alt', 'ngMaterial']);
appSoluble.includePHPDateFilter();
appSoluble.includeMouseSelectDirective();
appSoluble.trustUrl(/^\s*(data|http|https):/);
appSoluble.includePageDirective();
appSoluble.includeStartFromFilter();
appSoluble.includePagesFilter();
appSoluble.includeCaptchaDirecive();
appSoluble.includeFileUploadDirective();
appSoluble.includeImageEditorDirective();
appSoluble.includeOpenFileDirective();
appSoluble.includeString2DateDirective();
appSoluble.includeNum2StrDirective();
appSoluble.includeBool2StrDirective();
appSoluble.includeContentDirective();
appSoluble.includeGalleryDirective();
PDB.includePDBModelFilter(appSoluble);
AceEditor.EnableAceDirective(appSoluble);
//appSoluble.addDirective('content', ($compile, $http) => new viewmodel.ContentDirective($compile, $http));
appSoluble.includeTreeDirective();
appSoluble.addDirective('sequence', function () { return new SequenceDirective(); });
appSoluble.addDirective('alignment', function () { return new AlignmentDirective(); });
appSoluble.addDirective('three', function () { return new ngThree.ThreeDirective(); });
appSoluble.addDirective('cors', function ($http, $compile) { return new CORS.CORSTestDirective($http, $compile); });
appSoluble.addController('app', SolubleController);
//# sourceMappingURL=index.js.map