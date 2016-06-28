var Uniprot = (function () {
    function Uniprot() {
    }
    // word+AND+word+OR+reviewed:yes+AND+organism:9606
    // uniprot supports simple query to obtain all genes and sequences;
    // uniprot;
    Uniprot.prototype.search = function (query, reviewed, onRetrieved, messageHandler) {
        var q = query.buildQueryString();
        if (reviewed)
            q += '+reviewed:yes';
        if (messageHandler)
            messageHandler('Uniprot Query: ' + q);
        var url = Uniprot.queryUrl.replace('{query}', q);
        CORS.get(url)
            .success(this.searchSuccess(onRetrieved, messageHandler))
            .error(this.searchError);
    };
    Uniprot.prototype.searchSuccess = function (onRetrieved, messageHandler) {
        return function (value) {
            if (messageHandler)
                messageHandler('Uniprot Query Success.');
            var proteins = uniprotParser.parseProteins(value);
            if (messageHandler)
                messageHandler('Uniprot Query Retrived ' + proteins.length + ' Entries.');
            onRetrieved(proteins);
        };
    };
    Uniprot.prototype.searchError = function (value) {
    };
    Uniprot.entryUrl = 'http://www.uniprot.org/uniprot/';
    Uniprot.queryUrl = 'http://www.uniprot.org/uniprot/?query={query}&sort=score&columns=id,entry%20name,reviewed,protein%20names,genes,organism,sequence&format=tab';
    return Uniprot;
}());
var uniprotParser = (function () {
    function uniprotParser() {
    }
    uniprotParser.parseProteins = function (value) {
        var lines = value.split('\n');
        lines.splice(0, 1);
        lines = lines.filter(function (line) { return line.length > 6; });
        return lines.map(function (line) {
            var protein = new Solubility.ProteinSequence();
            var entries = line.split('\t');
            protein.selected = true;
            protein.ID = entries[0];
            protein.link = Uniprot.entryUrl + protein.ID;
            protein.description = entries[3];
            protein.source = entries[5];
            protein.sequence = ProteinUtil.AminoAcidFilter(entries[6]);
            return protein;
        });
    };
    return uniprotParser;
}());
var uniprotQueryEntry = (function () {
    function uniprotQueryEntry(parent) {
        var _this = this;
        this.method = 'And';
        this.mode = 'value';
        this.not = 'Contains';
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
        this.addEntry = function () {
            //echo('add condition');
            _this.items.add(new uniprotQueryEntry(_this));
        };
        this.switchNot = function () {
            switch (_this.not) {
                case 'Contains':
                    _this.not = 'Excludes';
                    break;
                case 'Excludes':
                    _this.not = 'Contains';
                    break;
                default:
                    _this.not = 'Excludes';
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
        this.buildQueryString = function () {
            if (_this.mode == 'value') {
                var query = '(' + _this.value.replace(/^\s+/ig, '').replace(/\s+$/ig, '').replace(/\s+/ig, '+') + ')';
                if (_this.not == 'Contains') {
                    return query;
                }
                else {
                    return 'NOT' + query;
                }
            }
            else {
                var queries = _this.items.map(function (item) { return item.buildQueryString(); });
                var query;
                if (_this.method == 'And') {
                    query = queries.join('+AND+');
                }
                else {
                    query = queries.join('+OR+');
                }
                if (_this.not == 'Contains') {
                    return query;
                }
                else {
                    return 'NOT' + query;
                }
            }
        };
        this.parent = parent;
    }
    return uniprotQueryEntry;
}());
var uniprotQueryEntryModel = (function () {
    function uniprotQueryEntryModel(data, item) {
        var _this = this;
        this.modeChanged = function () {
            _this.item.refresh();
        };
        this.data = data;
        this.item = item;
        this.data.onModeChanged = this.modeChanged;
    }
    return uniprotQueryEntryModel;
}());
//# sourceMappingURL=uniprot.js.map