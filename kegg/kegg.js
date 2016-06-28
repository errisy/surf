var KEGG = (function () {
    function KEGG() {
    }
    KEGG.prototype.listOrganisms = function (callback) {
        CORS.get('http://rest.genome.jp/list/organism').success(callback);
    };
    KEGG.prototype.onError = function (value, status) {
        var a;
        console.log('error:' + status);
    };
    KEGG.prototype.CancelSearch = function () {
        this.downloader.cancel = true;
        this.downloader = null;
    };
    KEGG.prototype.OrthologySearch = function (selected, reference, onRetrieved, msg) {
        var _this = this;
        if (this.downloader)
            this.CancelSearch();
        if (!KEGG.ptnOrthology.IsMatch(selected))
            return [];
        var mSelected = KEGG.ptnOrthology.Match(selected);
        var KSelected = mSelected.groups[0].toUpperCase();
        var kds = [];
        kds.uniqueComparer = function (x, y) { return x == y; };
        kds.addUnique(KSelected);
        reference.getAllEntries(kds);
        var kResults = {};
        var kDownloaded = function () {
            msg('All KEGG Orthology entries download.');
            var intOrgs = new KEGGOrthologyCondition();
            intOrgs.including = kResults[KSelected].organisms;
            var conOrgs = reference.checkCondition(kResults);
            msg('Calculating KEGG organisms that match given conditions...');
            var resOrgs = intOrgs.intersectWith(conOrgs);
            //console.log('Number of Organisms: (including: ' + intOrgs.including.length.toString() + ', excluding: ' + intOrgs.excluding.length.toString() + ')');
            //console.log(resOrgs);
            var gds = [];
            var geneEntries = kResults[KSelected].geneEntries;
            var count = 0;
            for (var key in geneEntries) {
                geneEntries[key].forEach(function (entry) { return gds.push(entry); });
                count += geneEntries[key].length;
                if (count > 100)
                    break;
            }
            //console.log('Number of Genes: ' + count.toString());
            var gResults = {};
            var gDownloaded = function () {
                msg('All genes have been downloaded...');
                var genes = [];
                for (var key in gResults) {
                    var gene = gResults[key];
                    gene.meetsCondition = resOrgs.contains(gene.organism);
                    gene.selected = gene.meetsCondition;
                    genes.push(gene);
                }
                onRetrieved(genes);
            };
            var gDownloader = new KEGGDownloader(gds, gResults, gDownloaded, msg);
            _this.downloader = gDownloader;
            gDownloader.start();
        };
        var kDownloader = new KEGGDownloader(kds, kResults, kDownloaded, msg);
        this.downloader = kDownloader;
        kDownloader.start();
    };
    KEGG.ptnOrthology = /K\d+/g;
    return KEGG;
}());
var KEGGDownloader = (function () {
    function KEGGDownloader(keys, results, callback, messageMonitor) {
        var _this = this;
        this.keys = [];
        this.items = [];
        this.cancel = false;
        this.start = function () {
            if (_this.keys) {
                _this.count = _this.keys.length;
                _this.download();
            }
        };
        this.download = function () {
            var ids;
            if (_this.keys.length > 10) {
                ids = _this.keys.splice(0, 10);
            }
            else {
                ids = _this.keys.splice(0, _this.keys.length);
            }
            var left = _this.count - _this.keys.length;
            if (_this.messageMonitor)
                _this.messageMonitor('Downloading from KEGG (' + left.toString() + '/' + _this.count.toString() + '): ' + ids.join(' '));
            var url = 'http://rest.kegg.jp/get/' + ids.join('+');
            CORS.get(url)
                .success(_this.downloadCallback)
                .error(_this.downloadError);
        };
        this.downloadCallback = function (value) {
            if (_this.cancel)
                return;
            if (_this.results) {
                //parse objects;
                var entries = KEGGParser.parse(value);
                entries.forEach(function (entry) { return _this.results[entry.entry] = entry; });
            }
            if (_this.keys.length > 0) {
                _this.download();
            }
            else {
                if (_this.callback)
                    _this.callback();
            }
        };
        this.downloadError = function (value) {
            if (_this.messageMonitor)
                _this.messageMonitor('KEGG download error. ' + _this.items.length.toString() + ' items have been downloaded.');
        };
        this.keys = keys;
        this.results = results;
        this.callback = callback;
        this.messageMonitor = messageMonitor;
    }
    return KEGGDownloader;
}());
var KEGGOrthologyCondition = (function () {
    function KEGGOrthologyCondition() {
        var _this = this;
        this.including = [];
        this.excluding = [];
        this.contains = function (value) {
            return _this.including.contains(value) && !(_this.excluding.contains(value));
        };
        this.intersectWith = function (condition) {
            var result = new KEGGOrthologyCondition();
            result.including = _this.including.intersectWith(condition.including);
            result.excluding = _this.excluding.unionWith(condition.excluding);
            return result;
        };
        this.unionWith = function (condition) {
            var result = new KEGGOrthologyCondition();
            result.including = _this.including.unionWith(condition.including);
            result.excluding = _this.excluding.intersectWith(condition.excluding);
            return result;
        };
        this.including.uniqueComparer = KEGGOrthology.organismComparer;
        this.excluding.uniqueComparer = KEGGOrthology.organismComparer;
    }
    return KEGGOrthologyCondition;
}());
var KEGGConditionNode = (function () {
    function KEGGConditionNode(parent) {
        var _this = this;
        this.method = 'And';
        this.mode = 'value';
        this.not = 'In';
        this.value = null;
        this.items = [];
        this.switchMethod = function () {
            //echo('switchMethod');
            if (_this.method == 'And') {
                _this.method = 'Or';
                return;
            }
            if (_this.method == 'Or') {
                _this.method = 'And';
                return;
            }
        };
        this.addCondition = function () {
            //echo('add condition');
            _this.items.add(new KEGGConditionNode(_this));
        };
        this.switchNot = function () {
            switch (_this.not) {
                case 'In':
                    _this.not = 'Exclude';
                    break;
                case 'Exclude':
                    _this.not = 'In';
                    break;
                default:
                    _this.not = 'Exclude';
                    break;
            }
        };
        this.switchMode = function () {
            //echo('switchMode');
            switch (_this.mode) {
                case 'value':
                    _this.mode = 'tree';
                    break;
                case 'tree':
                    _this.mode = 'value';
                    break;
                default:
                    _this.mode = 'value';
                    break;
            }
            //echo('mode: ' + this.mode);
            if (_this.onModeChanged)
                _this.onModeChanged();
        };
        this.remove = function () {
            if (_this.parent)
                _this.parent.items.remove(_this);
        };
        this.getAllEntries = function (entries) {
            if (_this.mode == 'value') {
                entries.addUnique(_this.value.toUpperCase());
            }
            else {
                for (var i = 0; i < _this.items.length; i++) {
                    _this.items[i].getAllEntries(entries);
                }
            }
        };
        this.checkCondition = function (results) {
            if (_this.mode == 'value') {
                _this.orthology = results[_this.value.toUpperCase()];
                if (_this.orthology) {
                    var condition = new KEGGOrthologyCondition();
                    switch (_this.not) {
                        case 'In':
                            condition.including = _this.orthology.organisms;
                            break;
                        case 'Exclude':
                            condition.excluding = _this.orthology.organisms;
                            break;
                        default:
                            condition.including = _this.orthology.organisms;
                            break;
                    }
                    return condition;
                }
            }
            else {
                var condition = new KEGGOrthologyCondition();
                if (_this.items.length > 0) {
                    condition = _this.items[0].checkCondition(results);
                }
                for (var i = 1; i < _this.items.length; i++) {
                    if (_this.method == 'And') {
                        condition = condition.intersectWith(_this.items[i].checkCondition(results));
                    }
                    if (_this.method == 'Or') {
                        condition = condition.unionWith(_this.items[i].checkCondition(results));
                    }
                }
                return condition;
            }
        };
        this.parent = parent;
    }
    return KEGGConditionNode;
}());
var KEGGConditionNodeModel = (function () {
    function KEGGConditionNodeModel(data, item) {
        var _this = this;
        this.modeChanged = function () {
            _this.item.refresh();
        };
        this.data = data;
        this.item = item;
        this.data.onModeChanged = this.modeChanged;
    }
    return KEGGConditionNodeModel;
}());
var KEGGParser = (function () {
    function KEGGParser() {
    }
    KEGGParser.parse = function (value) {
        var items = [];
        var entries = SectionDivider.sectionsAfterEachPattern(value, /(^|[\n\r]+)ENTRY/g);
        var entry;
        //console.log('parsing...');
        for (var i = 0; i < entries.length; i++) {
            entry = entries[i];
            if (KEGGParser.ptnGene.IsMatch(entry)) {
                items.push(KEGGParser.parseGene(entry));
            }
            if (KEGGParser.ptnOrthology.IsMatch(entry)) {
                items.push(KEGGParser.parseOrthology(entry));
            }
        }
        return items;
    };
    KEGGParser.parseOrthology = function (value) {
        //console.log('Parsing Ortholog...');
        var orth = new KEGGOrthology();
        var sections = SectionDivider.sectionsAfterEachPattern(value, /(^|[\n\r])\w+/ig);
        //sections.forEach((sec: string) => sec.replace(/^[\n\r]+/, ''));
        //console.log('section divided.');
        for (var i = 0; i < sections.length; i++) {
            sections[i] = sections[i].replace(/^[\n\r]+/, '');
        }
        //console.log(sections);
        var entry = SectionDivider.SelectSection(sections, KEGGParser.ptnOrthology)[0];
        var def = SectionDivider.SelectSection(sections, KEGGParser.ptnDefinition)[0];
        var name = SectionDivider.SelectSection(sections, KEGGParser.ptnName)[0];
        var genes = SectionDivider.SelectSection(sections, KEGGParser.ptnGenes)[0];
        //console.log(entry);
        //console.log(def);
        //console.log(name);
        var mEntry = KEGGParser.ptnOrthology.Match(entry);
        orth.entry = mEntry.groups[1];
        orth.name = name.replace(KEGGParser.ptnName, '').replace(KEGGParser.ptn2OrMore, '');
        orth.definition = def.replace(KEGGParser.ptnDefinition, '').replace(KEGGParser.ptn2OrMore, '');
        var genelines = genes.replace(KEGGParser.ptnGenes, '').split(/[\n\r]\s+/ig);
        var line;
        for (var i = 0; i < genelines.length; i++) {
            line = genelines[i];
            if (KEGGParser.ptnOrthologyGeneEntry.IsMatch(line)) {
                var m = KEGGParser.ptnOrthologyGeneEntry.Match(line);
                var org = m.groups[1].toLowerCase();
                orth.organisms.push(org);
                //var items = line.substr(m.lastIndex).split(/\s+/ig);
                orth.geneEntries[org] = KEGGParser.ptnOrthologyGeneEntryItem.Matches(line).map(function (gm) { return org + ':' + gm.groups[1]; });
            }
        }
        orth.organisms.uniqueComparer = KEGGOrthology.organismComparer;
        return orth;
    };
    KEGGParser.parseGene = function (value) {
        var gene = new KEGGGene();
        var sections = SectionDivider.sectionsAfterEachPattern(value, /(^|[\n\r])\w+/ig);
        for (var i = 0; i < sections.length; i++) {
            sections[i] = sections[i].replace(/^[\n\r]+/, '');
        }
        var entry = SectionDivider.SelectSection(sections, KEGGParser.ptnGene)[0];
        var organism = SectionDivider.SelectSection(sections, KEGGParser.ptnGeneOrganism)[0];
        var def = SectionDivider.SelectSection(sections, KEGGParser.ptnDefinition)[0];
        var name = SectionDivider.SelectSection(sections, KEGGParser.ptnName)[0];
        var aaseq = SectionDivider.SelectSection(sections, KEGGParser.ptnAASEQ)[0];
        //if (!entry || !organism || !def || !name || !aaseq) console.log(sections);
        var mEntry = KEGGParser.ptnGene.Match(entry);
        var vOrg = organism.replace(KEGGParser.ptnGeneOrganism, '');
        var mOrg = /\w+/g.Match(vOrg);
        gene.organism = mOrg.groups[0].toLowerCase();
        gene.source = vOrg.substr(mOrg.lastIndex);
        gene.entry = gene.organism + ':' + mEntry.groups[1];
        if (name)
            gene.name = name.replace(KEGGParser.ptnName, '').replace(KEGGParser.ptn2OrMore, '');
        gene.definition = def.replace(KEGGParser.ptnDefinition, '').replace(KEGGParser.ptn2OrMore, '');
        gene.proteinSequence = aaseq.replace(KEGGParser.ptnAASEQ, '').replace(/\s+/g, '');
        return gene;
    };
    KEGGParser.ptnOrthology = /ENTRY\s+(\w+)\s+KO/ig;
    KEGGParser.ptnGene = /ENTRY\s+(\w+)\s+CDS\s+(\w+)/ig;
    KEGGParser.ptnDefinition = /^DEFINITION\s{2}/ig;
    KEGGParser.ptnName = /^NAME\s{8}/ig;
    KEGGParser.ptnGeneOrganism = /^ORGANISM\s{4}/ig;
    KEGGParser.ptnGenes = /^GENES\s+/ig;
    KEGGParser.ptnAASEQ = /^AASEQ\s{7}\d+/ig;
    KEGGParser.ptn2OrMore = /\s\s+/ig;
    KEGGParser.ptnOrthologyGeneEntry = /(\w+)\:\s*/ig;
    KEGGParser.ptnOrthologyGeneEntryItem = /([\w]+)(?=\(|\s|$|^\))/ig;
    return KEGGParser;
}());
var KEGGOrganism = (function () {
    function KEGGOrganism() {
    }
    return KEGGOrganism;
}());
var KEGGOrthology = (function () {
    function KEGGOrthology() {
        this.organisms = [];
        this.geneEntries = {};
    }
    KEGGOrthology.organismComparer = function (x, y) {
        return x.toLowerCase() == y.toLowerCase();
    };
    return KEGGOrthology;
}());
var KEGGGene = (function () {
    function KEGGGene() {
    }
    return KEGGGene;
}());
//# sourceMappingURL=kegg.js.map