class pdb3d {
    static presentResidueWithCuttingWaterball(three: ngThree.ThreeObject, entry: SurfaceSearchEntry, builders: PolyhedronBuilder2[]) {
        //clear stage and add lights back
        three.clearObjects();
        three.camera.position.z = 3;
        //three.lights.forEach((light) => {
        //    three.scene.add(light);
        //});

        //show the residue:
        var center = entry.residue.center;
        var setPostion = (obj3D: THREE.Mesh, position: Vector3D) => {
            obj3D.position.x = position.x - center.x;
            obj3D.position.y = position.y - center.y;
            obj3D.position.z = position.z - center.z;
        };
        entry.residue.atoms.forEach((atom) => {
            var atomGeometry = new THREE.SphereGeometry(atom.GetRadiusLiMinimumSet, 32, 32);
            var atomMaterial = new THREE.MeshPhongMaterial({
                color: 0x756289,
                emissive: 0x072534,
                side: THREE.DoubleSide,
                shading: THREE.FlatShading
            });
            var atomSphere = new THREE.Mesh(atomGeometry, atomMaterial);
            setPostion(atomSphere, atom.position);
            three.scene.add(atomSphere);
        });
        //show the rest of the chain:

        var reach: number = (SurfaceSearch.RadiusLiMinimumSet('S', 'CG') + 0.33) * 2.0;
        var rsBounds = entry.residue.GetBounds3d();
        rsBounds.Expand(-reach, reach, -reach, reach, -reach, reach);
        //console.log(entry.chain.atoms.length);
        var includeList = entry.chain.atoms.filter((atom) => (entry.residue.atoms.indexOf(atom) < 0 && rsBounds.Contains(atom.position)));

        includeList.forEach((atom) => {
            var atomGeometry = new THREE.SphereGeometry(atom.GetRadiusLiMinimumSet, 32, 32);
            var atomMaterial = new THREE.MeshPhongMaterial({
                color: 0x156289,
                emissive: 0x072534,
                side: THREE.DoubleSide,
                shading: THREE.FlatShading
            });
            var atomSphere = new THREE.Mesh(atomGeometry, atomMaterial);
            setPostion(atomSphere, atom.position);
            three.scene.add(atomSphere);
        });


        //show the waterballs:
        builders.forEach((builder) => {
            var waterPosition = builder.Center.add(builder.FoundPoint.multiplyBy((builder.AtomRadius + builder.WaterRadius) / builder.FoundPoint.length))
            var atomGeometry = new THREE.SphereGeometry(builder.WaterRadius, 32, 32);
            var atomMaterial = new THREE.MeshPhongMaterial({
                color: 0x891562,
                emissive: 0x072534,
                side: THREE.DoubleSide,
                shading: THREE.FlatShading
            });
            var atomSphere = new THREE.Mesh(atomGeometry, atomMaterial);
            setPostion(atomSphere, waterPosition);
            three.scene.add(atomSphere);
        });
        three.draw();
    }

    static presentChainAtoms(three: ngThree.ThreeObject, chain: Chain, options?: pdb3dOptions) {
        //clear stage and add lights back
        
        three.clearObjects();
        three.camera.position.z = 5;
        //three.lights.forEach((light) => {
        //    three.scene.add(light);
        //});
        var center = chain.center;

        var shouldHighlightSurface: boolean = false;
        var shouldShowPsuedoGammaCarbon: boolean = false;
        var shouldHideSurface: boolean = false;
        var shouldHideCore: boolean = false;
        var radiusFactor: number = 1;
        if (options) {
            shouldHighlightSurface = options.highlightSurface;
            shouldHideSurface = options.hideSurface;
            shouldHideCore = options.hideCore;
            shouldShowPsuedoGammaCarbon = options.showPsuedoGammaCarbon;
            if (typeof options.radiusFactor == 'number') radiusFactor = options.radiusFactor; 
        }

        for (var key in chain.residueDict) {
            var rs = chain.residueDict[key];
            if (shouldHideCore && !rs.IsSurface) continue;
            if (shouldHideSurface && rs.IsSurface) continue;
            var color = ProteinUtil.GetHydrophobicityColor(rs.name).toValue(128);
            rs.atoms.forEach((atom) => {
                var material = new THREE.MeshPhongMaterial({
                    color: ((shouldHighlightSurface && rs.IsSurface) ? 0x77ffffff : color)
                });
                material.transparent = true;
                material.opacity = 0.3;
                var geometry = new THREE.SphereGeometry(atom.GetRadiusLiMinimumSet * radiusFactor, 8, 8);
                var sphere = new THREE.Mesh(geometry, material);
                sphere.position.x = atom.position.x - center.x;
                sphere.position.y = atom.position.y - center.y;
                sphere.position.z = atom.position.z - center.z;
                three.scene.add(sphere);
            });
            if (shouldShowPsuedoGammaCarbon)
            if (rs.name == 'G') {
                var position = rs.GetPseudoBetaCarbonPosition();
                var material = new THREE.MeshPhongMaterial({
                    color: 0xff00ff
                });
                var geometry = new THREE.SphereGeometry(SurfaceSearch.RadiusLiMinimumSet('C', 'CG') * radiusFactor, 8, 8);
                var sphere = new THREE.Mesh(geometry, material);
                sphere.position.x = position.x - center.x;
                sphere.position.y = position.y - center.y;
                sphere.position.z = position.z - center.z;
                three.scene.add(sphere);
            }
        }
        three.draw();
    }
    static presentChainBonds(three: ngThree.ThreeObject, chain:Chain, showSurface?:boolean) {
        //clear stage and add lights back
        three.clearObjects();
        three.camera.position.z = 5;
        //three.lights.forEach((light) => {
        //    three.scene.add(light);
        //});
        var center = chain.center;


        var residues: Residue[] = [];
        for (var key in chain.residueDict) {
            var rs = chain.residueDict[key];
            var color = ProteinUtil.GetHydrophobicityColor(rs.name).toValue();
            residues.push(rs);
            rs.BuildBonds().forEach((bond) => {
                var material = new THREE.LineBasicMaterial({
                    color: ((showSurface && rs.IsSurface) ? 0xffffff : color)
                });
                var geometry = new THREE.Geometry();
                geometry.vertices.push(new THREE.Vector3(bond.Position1.x - center.x, bond.Position1.y - center.y, bond.Position1.z - center.z));
                geometry.vertices.push(new THREE.Vector3(bond.Position2.x - center.x, bond.Position2.y - center.y, bond.Position2.z - center.z));
                var line = new THREE.Line(geometry, material);
                three.scene.add(line);
            });
        }
        residues.sort((a, b) => (a.index > b.index) ? 1 : -1);
        var last: Residue;
        for (var i = 0; i < residues.length; i++) {
            var rs = residues[i];
            if (last && last.index == rs.index -1) {
                var c = last.AtomByName('C');
                var n = rs.AtomByName('N');
                if (c && n) {
                    var material = new THREE.LineBasicMaterial({
                        color: ProteinUtil.GetHydrophobicityColor(c.name).toValue()
                    });
                    var geometry = new THREE.Geometry();
                    geometry.vertices.push(new THREE.Vector3(c.position.x - center.x, c.position.y - center.y, c.position.z - center.z));
                    geometry.vertices.push(new THREE.Vector3(n.position.x - center.x, n.position.y - center.y, n.position.z - center.z));
                    var line = new THREE.Line(geometry, material);
                    three.scene.add(line);
                }
            }
            last = rs;
        }
        three.draw();
    }
}

interface pdb3dOptions {
    highlightSurface: boolean;
    showPsuedoGammaCarbon: boolean;
    hideSurface: boolean;
    hideCore: boolean;
    radiusFactor: number;
}
