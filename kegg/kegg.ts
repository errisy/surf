class KEGG {
    constructor() {

    }
    public listOrganisms(callback: ng.IHttpPromiseCallback<string>) {
        CORS.get('http://rest.genome.jp/list/organism').success(callback);
    }
    public onError(value: string, status: number) {
        var a: ng.IHttpPromiseCallback<string>;
        console.log('error:' + status);
    }
    static ptnOrthology = /K\d+/g;
    private downloader: KEGGDownloader;
    public CancelSearch() {
        this.downloader.cancel = true;
        this.downloader = null;
    }
    public OrthologySearch(selected: string, reference: KEGGConditionNode, onRetrieved: (genes: KEGGGene[]) => void, msg: (value: string) => void) {
        if (this.downloader) this.CancelSearch();
        if (!KEGG.ptnOrthology.IsMatch(selected)) return [];
        var mSelected = KEGG.ptnOrthology.Match(selected);
        var KSelected: string = mSelected.groups[0].toUpperCase();

        var kds: string[] = [];
        
        kds.uniqueComparer = (x, y) => x == y;
        kds.addUnique(KSelected);
        reference.getAllEntries(kds);

        var kResults: { [key: string]: KEGGOrthology } = {};

        var kDownloaded = () => {
            msg('All KEGG Orthology entries download.');
            var intOrgs = new KEGGOrthologyCondition();
            intOrgs.including = kResults[KSelected].organisms;
            var conOrgs = reference.checkCondition(kResults);
            msg('Calculating KEGG organisms that match given conditions...');
            var resOrgs = intOrgs.intersectWith(conOrgs);
            //console.log('Number of Organisms: (including: ' + intOrgs.including.length.toString() + ', excluding: ' + intOrgs.excluding.length.toString() + ')');
            //console.log(resOrgs);
            
            var gds: string[] = [];
            var geneEntries = kResults[KSelected].geneEntries;
            var count: number = 0; 
            for (var key in geneEntries) {
                geneEntries[key].forEach((entry) => gds.push(entry));
                count += geneEntries[key].length;
                if (count > 100) break;
            }
            //console.log('Number of Genes: ' + count.toString());
            var gResults: { [key: string]: KEGGGene } = {};
            var gDownloaded = () => {
                msg('All genes have been downloaded...');
                var genes: KEGGGene[] = [];
                for (var key in gResults) {
                    var gene = gResults[key];
                    gene.meetsCondition = resOrgs.contains(gene.organism);
                    gene.selected = gene.meetsCondition;
                    genes.push(gene);
                }
                onRetrieved(genes);
            };
            var gDownloader = new KEGGDownloader(gds, gResults, gDownloaded, msg);
            this.downloader = gDownloader;
            gDownloader.start();
        };
        var kDownloader = new KEGGDownloader(kds, kResults, kDownloaded, msg);
        this.downloader = kDownloader;
        kDownloader.start();
    }
    public getKOList;


}

class KEGGDownloader {
    public keys: string[] = [];
    public items: any[] = [];
    public results: { [key: string]: any };
    public callback: () => void;
    public count: number;
    public cancel: boolean = false;
    constructor(keys: string[], results: { [key: string]: any }, callback: () =>void, messageMonitor?: (value: string)=>void ) {
        this.keys = keys;
        this.results = results;
        this.callback = callback;
        this.messageMonitor = messageMonitor;
    }
    public messageMonitor: (value: string) => void;
    public start = () => {
        if (this.keys) {
            this.count = this.keys.length;
            this.download();
        }
    }
    private download = () => {
        var ids: string[];
        if (this.keys.length > 10) {
            ids = this.keys.splice(0, 10);
        }
        else {
            ids = this.keys.splice(0, this.keys.length);
        }
        var left = this.count - this.keys.length;
        if (this.messageMonitor) this.messageMonitor('Downloading from KEGG (' + left.toString() + '/' + this.count.toString() + '): ' + ids.join(' '));
        var url = 'http://rest.kegg.jp/get/' + ids.join('+');
        CORS.get(url)
            .success(this.downloadCallback)
            .error(this.downloadError);
    }
    private downloadCallback = (value: string) => {
        if (this.cancel) return;
        if (this.results) {
            //parse objects;
            var entries: any[] = KEGGParser.parse(value);
            entries.forEach((entry: KEGGEntry) => this.results[entry.entry] = entry);
        }
        if (this.keys.length > 0) {
            this.download();
        }
        else {
            if (this.callback) this.callback();
        }
    }
    private downloadError = (value: string) => {
        if (this.messageMonitor) this.messageMonitor('KEGG download error. ' + this.items.length.toString() + ' items have been downloaded.');
    }
}
class KEGGOrthologyCondition {
    constructor() {
        this.including.uniqueComparer = KEGGOrthology.organismComparer;
        this.excluding.uniqueComparer = KEGGOrthology.organismComparer;
    }
    public including: string[] = [];
    public excluding: string[] = [];
    public contains = (value: string) => {
        return this.including.contains(value) && !(this.excluding.contains(value));
    }
    public intersectWith = (condition: KEGGOrthologyCondition) => {
        var result = new KEGGOrthologyCondition();
        result.including = this.including.intersectWith(condition.including);
        result.excluding = this.excluding.unionWith(condition.excluding);
        return result;
    }
    public unionWith = (condition: KEGGOrthologyCondition) => {
        var result = new KEGGOrthologyCondition();
        result.including = this.including.unionWith(condition.including);
        result.excluding = this.excluding.intersectWith(condition.excluding);
        return result;
    }
}
class KEGGConditionNode {
    public method: string = 'And';
    public mode: string = 'value';
    public not: string = 'In';
    public value: string = null;
    public items: KEGGConditionNode[] = [];
    public parent: KEGGConditionNode;
    public orthology: KEGGOrthology;
    
    constructor(parent?: KEGGConditionNode) {
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
    public addCondition = () => {
        //echo('add condition');
        this.items.add(new KEGGConditionNode(this));
    }
    public switchNot =() => {
        switch (this.not) {
            case 'In':
                this.not = 'Exclude';
                break;
            case 'Exclude':
                this.not = 'In';
                break;
            default:
                this.not = 'Exclude';
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

    public getAllEntries = (entries: string[]) => {
        if (this.mode == 'value') {
            entries.addUnique(this.value.toUpperCase());
        }
        else {
            for (var i: number = 0; i < this.items.length; i++) {
                this.items[i].getAllEntries(entries);
            }
        }
    }

    public checkCondition = (results: { [key: string]: any }): KEGGOrthologyCondition => {
        if (this.mode == 'value') {
            this.orthology = results[this.value.toUpperCase()];
            if (this.orthology)  {
                var condition = new KEGGOrthologyCondition();
                switch (this.not) {
                    case 'In':
                        condition.including = this.orthology.organisms;
                        break;
                    case 'Exclude':
                        condition.excluding = this.orthology.organisms;
                        break;
                    default:
                        condition.including = this.orthology.organisms;
                        break;
                }
                return condition;
            }
        }
        else {
            var condition = new KEGGOrthologyCondition();
            if (this.items.length > 0) {
                condition = this.items[0].checkCondition(results);
            }
            for (var i: number = 1; i < this.items.length; i++) {
                if (this.method == 'And') {
                    condition = condition.intersectWith(this.items[i].checkCondition(results));
                }
                if (this.method == 'Or') {
                    condition = condition.unionWith(this.items[i].checkCondition(results));
                }
            }
            return condition;
        }
    }
}
class KEGGConditionNodeModel {
    public data: KEGGConditionNode;
    public item: ngstd.TreeItemBase;
    constructor(data: KEGGConditionNode, item: ngstd.TreeItemBase) {
        this.data = data;
        this.item = item;
        this.data.onModeChanged = this.modeChanged;
    }
    public modeChanged = ()=> {
        this.item.refresh();
    }
}
 

class KEGGParser  {
    static ptnOrthology = /ENTRY\s+(\w+)\s+KO/ig;
    static ptnGene = /ENTRY\s+(\w+)\s+CDS\s+(\w+)/ig;
    static parse(value: string): any[] {
        var items: any[] = [];
        var entries = SectionDivider.sectionsAfterEachPattern(value, /(^|[\n\r]+)ENTRY/g);
        var entry: string;
        //console.log('parsing...');
        for (var i: number = 0; i < entries.length; i++) {
            entry = entries[i];
            if (KEGGParser.ptnGene.IsMatch(entry)) {
                items.push(KEGGParser.parseGene(entry));
            }
            if (KEGGParser.ptnOrthology.IsMatch(entry)) {
                items.push(KEGGParser.parseOrthology(entry));
            }
        }
        return items;
    }
    static ptnDefinition = /^DEFINITION\s{2}/ig;
    static ptnName = /^NAME\s{8}/ig;
    static ptnGeneOrganism = /^ORGANISM\s{4}/ig;
    static ptnGenes = /^GENES\s+/ig;
    static ptnAASEQ = /^AASEQ\s{7}\d+/ig;
    static ptn2OrMore = /\s\s+/ig;
    static ptnOrthologyGeneEntry = /(\w+)\:\s*/ig;
    static ptnOrthologyGeneEntryItem = /([\w]+)(?=\(|\s|$|^\))/ig;
    static parseOrthology(value: string): KEGGOrthology {
        //console.log('Parsing Ortholog...');
        var orth = new KEGGOrthology();
        var sections = SectionDivider.sectionsAfterEachPattern(value, /(^|[\n\r])\w+/ig);
        //sections.forEach((sec: string) => sec.replace(/^[\n\r]+/, ''));
        //console.log('section divided.');
        for (var i: number = 0; i < sections.length; i++) {
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
        var line: string; 
        for (var i: number = 0; i < genelines.length; i++) {
            line = genelines[i];
            if (KEGGParser.ptnOrthologyGeneEntry.IsMatch(line)) {
                var m = KEGGParser.ptnOrthologyGeneEntry.Match(line);
                var org = m.groups[1].toLowerCase();
                orth.organisms.push(org);
                //var items = line.substr(m.lastIndex).split(/\s+/ig);
                orth.geneEntries[org] = KEGGParser.ptnOrthologyGeneEntryItem.Matches(line).map((gm) => org + ':' + gm.groups[1]);

                    //items.filter((gEntry) => KEGGParser.ptnOrthologyGeneEntryItem.IsMatch(gEntry))
                    //.map((gEntry) => org + ':' + KEGGParser.ptnOrthologyGeneEntryItem.Match(gEntry).groups[1]);
            }
        }
        orth.organisms.uniqueComparer = KEGGOrthology.organismComparer;
        return orth;
    }
    static parseGene(value: string): KEGGGene {
        var gene = new KEGGGene();
        var sections = SectionDivider.sectionsAfterEachPattern(value, /(^|[\n\r])\w+/ig);

        for (var i: number = 0; i < sections.length; i++) {
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
        if (name) gene.name = name.replace(KEGGParser.ptnName, '').replace(KEGGParser.ptn2OrMore, '');
        gene.definition = def.replace(KEGGParser.ptnDefinition, '').replace(KEGGParser.ptn2OrMore, '');
        gene.proteinSequence = aaseq.replace(KEGGParser.ptnAASEQ, '').replace(/\s+/g, '');
        return gene;
    }
}

interface KEGGEntry {
    entry: string;
}
class KEGGOrganism {
    public entry: string;
    public name: string;
}
class KEGGOrthology implements KEGGEntry{
    public entry: string;
    public name: string;
    public definition: string;
    public organisms: string[] = [];
    public geneEntries: { [organism: string]: string[] } = {};
    static organismComparer = (x: string, y: string) => {
        return x.toLowerCase() == y.toLowerCase();
    }
}
class KEGGGene implements KEGGEntry{
    public entry: string;
    public organism: string;
    public source: string;
    public name: string;
    public definition: string;
    public proteinSequence: string;
    public meetsCondition: boolean;
    public selected: boolean;
}