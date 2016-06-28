class Uniprot {
    static entryUrl = 'http://www.uniprot.org/uniprot/';
    static queryUrl =
    'http://www.uniprot.org/uniprot/?query={query}&sort=score&columns=id,entry%20name,reviewed,protein%20names,genes,organism,sequence&format=tab';
    // word+AND+word+OR+reviewed:yes+AND+organism:9606
    // uniprot supports simple query to obtain all genes and sequences;
    // uniprot;

    public search(query: uniprotQueryEntry, reviewed: boolean, onRetrieved: (entries: Solubility.ProteinSequence[]) => void, messageHandler?:(value:string)=>void) {
        var q = query.buildQueryString();
        if (reviewed) q += '+reviewed:yes';
        if (messageHandler) messageHandler('Uniprot Query: ' + q);
        var url = Uniprot.queryUrl.replace('{query}', q);
        CORS.get(url)
            .success(this.searchSuccess(onRetrieved, messageHandler))
            .error(this.searchError);
    }
    public searchSuccess(onRetrieved: (entries: Solubility.ProteinSequence[])=>void, messageHandler?: (value: string) => void) {
        return (value: string) => {
            if (messageHandler) messageHandler('Uniprot Query Success.');
            var proteins = uniprotParser.parseProteins(value);
            if (messageHandler) messageHandler('Uniprot Query Retrived ' + proteins.length + ' Entries.');
            onRetrieved(proteins);
        }
    }
    public searchError(value: string) {
    }
}

class uniprotParser {
    static parseProteins(value: string): Solubility.ProteinSequence[] {
        var lines = value.split('\n');
        lines.splice(0, 1);
        lines = lines.filter((line) => line.length > 6);
        return lines.map(
            (line: string) => {
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
    }
}
class uniprotQueryEntry {
    public parent: uniprotQueryEntry;
    public method: string = 'And';
    public mode: string = 'value';
    public not: string = 'Contains';
    public items: uniprotQueryEntry[] = [];
    public value: string;
    constructor(parent?: uniprotQueryEntry) {
        this.parent = parent;
    }
    public switchMethod = () => {
        //echo('switchMethod');
        if (this.method == 'And') {
            this.method = 'Or';
            return;
        }
        if (this.method == 'Or') {
            this.method = 'And';
            return;
        }
    }
    public addEntry = () => {
        //echo('add condition');
        this.items.add(new uniprotQueryEntry(this));
    }
    public switchNot = () => {
        switch (this.not) {
            case 'Contains':
                this.not = 'Excludes';
                break;
            case 'Excludes':
                this.not = 'Contains';
                break;
            default:
                this.not = 'Excludes';
                break;
        }
    }
    public switchMode = () => {
        //echo('switchMode');
        switch (this.mode) {
            case 'value':
                this.mode = 'tree';
                break;
            case 'tree':
                this.mode = 'value';
                break;
            default:
                this.mode = 'value';
                break;
        }
        //echo('mode: ' + this.mode);
        if (this.onModeChanged) this.onModeChanged();
    }
    public remove = () => {
        if (this.parent) this.parent.items.remove(this);
    }
    public onModeChanged: () => void;
    public buildQueryString = () => {
        if (this.mode == 'value') {
            var query: string = '(' + this.value.replace(/^\s+/ig, '').replace(/\s+$/ig, '').replace(/\s+/ig, '+') + ')'
            if (this.not == 'Contains') {
                return query;
            }
            else {
                return 'NOT'+query ;
            }
        }
        else {
            var queries = this.items.map((item) => item.buildQueryString());
            var query: string;
            if (this.method == 'And') {
                query = queries.join('+AND+');
            }
            else {
                query = queries.join('+OR+');
            }
            if (this.not == 'Contains') {
                return query;
            }
            else {
                return 'NOT' + query;
            }
        }
    }
}
class uniprotQueryEntryModel {
    public data: uniprotQueryEntry;
    public item: ngstd.TreeItemBase;
    constructor(data: uniprotQueryEntry, item: ngstd.TreeItemBase) {
        this.data = data;
        this.item = item;
        this.data.onModeChanged = this.modeChanged;
    }
    public modeChanged = () => {
        this.item.refresh();
    }
}
