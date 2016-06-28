module ngThree {
    export interface IThreeScope extends ng.IScope  {
        three: ThreeObject;
        ready: (obj: ThreeObject) => void;
    }
    export interface IThreeDirectiveScope extends ng.IScope {
        three: string;
        ready: string;
    }
    export class ThreeDirective extends ngstd.AngularDirective<IThreeDirectiveScope> {
        constructor() {
            super();
            this.restrict = ngstd.DirectiveRestrict.A;
            this.scope.three = ngstd.BindingRestrict.OptionalBoth;
            this.scope.ready = ngstd.BindingRestrict.OptionalBoth;
            this.link = (scope: IThreeScope, element: ng.IAugmentedJQuery, attr: ng.IAttributes) => {
                var thr = new ThreeObject();
                scope.three = thr;
                thr.scene = new THREE.Scene();

                thr.camera = new THREE.PerspectiveCamera(75, element.width() / element.height(), 0.1, 1000);

                thr.raycaster = new THREE.Raycaster();

                thr.renderer = new THREE.WebGLRenderer({ antialias: true });
                thr.renderer.setPixelRatio(window.devicePixelRatio);
                thr.renderer.setSize(element.width(), element.height());
                element.append(thr.renderer.domElement);

                thr.orbit = new THREE.OrbitControls(thr.camera, thr.renderer.domElement);
                thr.orbit.autoRotate = true;
                thr.orbit.autoRotateSpeed = 20;
                thr.orbit.enabled = true;
                thr.orbit.enableRotate = true;
                thr.orbit.enableZoom = true;

                var ambientLight = new THREE.AmbientLight(0x000000);

                thr.lights.push(ambientLight);

                var lights = [];
                lights[0] = new THREE.PointLight(0xffffff, 1, 0);
                lights[1] = new THREE.PointLight(0xffffff, 1, 0);
                lights[2] = new THREE.PointLight(0xffffff, 1, 0);

                lights[0].position.set(0, 200, 0);
                lights[1].position.set(100, 200, 100);
                lights[2].position.set(- 100, - 200, - 100);

                thr.lights.push(lights[0]);
                thr.lights.push(lights[1]);
                thr.lights.push(lights[2]);

                thr.scene.add(ambientLight);
                thr.scene.add(lights[0]);
                thr.scene.add(lights[1]);
                thr.scene.add(lights[2]);
                
                
                var mousedown = (event: MouseEvent) => {
                    //event.preventDefault();
                    

                    var mouse2 = new THREE.Vector2(
                        ((event.offsetX) / thr.renderer.domElement.clientWidth) * 2 - 1,
                        - ((event.offsetY) / thr.renderer.domElement.clientHeight) * 2 + 1
                    );


                    //console.log(event, thr.renderer.domElement.clientWidth, thr.renderer.domElement.clientHeight, mouse2);
                    thr.raycaster.setFromCamera(mouse2, thr.camera);
                    var intersects = thr.raycaster.intersectObjects(thr.scene.children);
                    //console.log(intersects);
                    if (intersects.length > 0 && thr.onObjectsClicked) thr.onObjectsClicked(intersects);

                    if (intersects.length > 0 && thr.onObjectsClicked) thr.onObjectsClicked(intersects);
                    if (intersects.length > 0) intersects[0].object.material.color.setHex(Math.random() * 0xffffff);
                    intersects = undefined;
                }
                var touchstart = (event: TouchEvent) => {
                    //event.preventDefault();
                    var mouseEvent: MouseEvent = <any>{};
                    mouseEvent.clientX = event.touches[0].clientX;
                    mouseEvent.clientY = event.touches[0].clientY;
                    mousedown(mouseEvent);
                }
                thr.renderer.domElement.addEventListener('mousedown', mousedown);
                thr.renderer.domElement.addEventListener('touchstart', touchstart);
                element.css('overflow', 'hidden');


                window.addEventListener('resize', (ev: UIEvent) => {
                    thr.updateSize(element.width(), element.height());
                });
                scope.$watch(() => element.width(), (nValue: number, oValue: number) => {
                    thr.updateSize(element.width(), element.height());
                });
                scope.$watch(() => element.height(), (nValue: number, oValue: number) => {
                    thr.updateSize(element.width(), element.height());
                });

                thr.camera.position.z = 30;
                thr.draw();

                if (scope.ready) scope.ready(thr);
            }
        }
    }
    export class ThreeObject {
        scene: THREE.Scene;
        camera: THREE.Camera;
        renderer: THREE.Renderer;
        orbit: THREE.OrbitControls;
        raycaster: THREE.Raycaster;
        element: ng.IAugmentedJQuery;

        lights: THREE.Object3D[] = [];
        onObjectsClicked: (obj: THREE.Intersection[]) => void;
        public clearObjects() {
            var toRemove = this.scene.children.filter((value) => this.lights.indexOf(value) < 0);
            //this.scene.children.clear();
            toRemove.forEach((value: THREE.Object3D) => {
                //value.material.dispose();
                if (value['material']) (<THREE.Material>(value['material'])).dispose();
                if (value['geometry']) (<THREE.Geometry>(value['geometry'])).dispose();
                this.scene.remove(value);
            });
            toRemove = undefined;
        }
        public create() {

        }
        public addObject(obj3D: THREE.Object3D) {

        }
        public updateSize = (width: number, height: number) => {
            this.camera.aspect = width / height;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(width, height);
        }
        public draw = () => {
            window.requestAnimationFrame(this.draw);
            this.renderer.render(this.scene, this.camera);
        }
    }
}