
class PolyhedronBuilder2 {
    public Center: Vector3D;
    public AtomRadius: number;
    public WaterRadius: number;
    public Surfaces: DirectionalSurface3D2[] = [];
    public boxUnit: number;
    public options: SurfaceSearchOptions;
    constructor(center: Vector3D, atomRadius: number, waterRadius: number, options: SurfaceSearchOptions) {
        this.Center = center;
        this.AtomRadius = atomRadius;
        this.WaterRadius = waterRadius;
        this.boxUnit = atomRadius * options.centerAtomFactor + waterRadius;
        var boxUnit = this.boxUnit;
        this.options = options;
        this.Surfaces.push(
            set(new DirectionalSurface3D2(), (ds) => {
                ds.X = 1.0;
                ds.Y = 0.0;
                ds.Z = 0.0;
                ds.C = boxUnit;
                ds.Origin = ds.multiplyAsVector3D(boxUnit);
                ds.Direction = ds.multiplyAsVector3D(-1);
            }),
            set(new DirectionalSurface3D2(), (ds) => {
                ds.X = -1.0;
                ds.Y = 0.0;
                ds.Z = 0.0;
                ds.C = boxUnit;
                ds.Origin = ds.multiplyAsVector3D(boxUnit);
                ds.Direction = ds.multiplyAsVector3D(-1);
            }),
            set(new DirectionalSurface3D2(), (ds) => {
                ds.X = 0.0;
                ds.Y = 1.0;
                ds.Z = 0.0;
                ds.C = boxUnit;
                ds.Origin = ds.multiplyAsVector3D(boxUnit);
                ds.Direction = ds.multiplyAsVector3D(-1);
            }),
            set(new DirectionalSurface3D2(), (ds) => {
                ds.X = 0.0;
                ds.Y = -1.0;
                ds.Z = 0.0;
                ds.C = boxUnit;
                ds.Origin = ds.multiplyAsVector3D(boxUnit);
                ds.Direction = ds.multiplyAsVector3D(-1);
            }),
            set(new DirectionalSurface3D2(), (ds) => {
                ds.X = 0.0;
                ds.Y = 0.0;
                ds.Z = 1.0;
                ds.C = boxUnit;
                ds.Origin = ds.multiplyAsVector3D(boxUnit);
                ds.Direction = ds.multiplyAsVector3D(-1);
            }),
            set(new DirectionalSurface3D2(), (ds) => {
                ds.X = 0.0;
                ds.Y = 0.0;
                ds.Z = -1.0;
                ds.C = boxUnit;
                ds.Origin = ds.multiplyAsVector3D(boxUnit);
                ds.Direction = ds.multiplyAsVector3D(-1);
            })
        );
    }
    static Zero = new Vector3D();
    public TrySubtract = (subtractAtomPosition: Vector3D, subtractAtomRadius: number) => {
        var sur = DirectionalSurface3D2.TryGetDirectionalSurface(this.AtomRadius, subtractAtomPosition.subtract(this.Center), subtractAtomRadius, this.WaterRadius, this.options);
        if (sur) this.Surfaces.push(sur);
    }
    public FoundPoint: Vector3D;
    public IsEmpty = (isDebugging?: boolean) => {
        //var Vertices: Vector3D[] = [];
        //var count = 0;

        var point: Vector3D = this.Surfaces.someCombinationCheck2(3,
            (item1, item2) => Edge.isOutOfBox(item1, item2, this.boxUnit),
            (com) => {
                var p = Vertex.TryGetVertex(com[0], com[1], com[2]);
                if (p){
                    if ((Math.abs(p.x) <= (this.boxUnit)) && (Math.abs(p.y) <= (this.boxUnit)) && (Math.abs(p.z) <= (this.boxUnit)) && (p.length >= this.boxUnit)) {
                        if( this.Surfaces.every(
                            (surf) => {
                                if (com.indexOf(surf) > -1) return true;
                                return surf.IsPositive(p);
                            })) return p;
                    }
                }
                return false;
            });
        //theoreticall we should be able to make a 'water molecule' at the position of the point;
        //here we check if that's correct:
        if (point) this.FoundPoint = point;
        //if (isDebugging && point) {
        //    console.log('point: ', point);
        //    console.log('>>>>>>>>>>>>>>>>>>>>>>>>>>>>Point to Center > Radius: ', point.length > this.Radius, point.length, this.Radius);
        //    this.Surfaces.every((surface) => {
        //        if (!surface.AtomCenter) return true;
        //        var dis = point.subtract(surface.AtomCenter);
        //        var result = dis.length >= surface.AtomRadius;
        //        //console.log('Point to Atom > Radius: ', result, dis.length, surface.AtomRadius, surface.AtomCenter);
        //        //console.log(dis);
        //        return result;
        //    });
        //}
        return !point;
        //return count == 0;
    }
    public toString(): string {
        var lines: string[] = [];
        lines.push('PolyhedronBuilder Start:\r\n');
        lines.push('Center,' + this.Center.toString() + '\r\n');
        lines.push('Radius,' + this.AtomRadius + '\r\n');
        this.Surfaces.forEach((surface) => lines.push(surface.toString() + '\r\n'));
        lines.push('End PolyhedronBuilder\r\n');
        return lines.join('');
    }
}
class DirectionalSurface3D2 {
    public X: number;
    public Y: number;
    public Z: number;
    public C: number;
    public Factor: number;
    public Origin: Vector3D;
    public Direction: Vector3D;
    public AtomCenter: Vector3D;
    public AtomRadius: number;
    /**
     * Determine if the point is a convex vectex.
     * @param TestPoint
     */
    public IsPositive(TestPoint: Vector3D): boolean {

        var left = this.Direction.x * TestPoint.x + this.Direction.y * TestPoint.y + this.Direction.z * TestPoint.z;
        var right = this.Direction.x * this.Origin.x + this.Direction.y * this.Origin.y + this.Direction.z * this.Origin.z;
        var result = left >= right;
        //console.log('IsPositive:', result, left, right, this);
        return result;
        //return this.Direction.x * TestPoint.x + this.Direction.y * TestPoint.y + this.Direction.z * TestPoint.z >=
        //    this.Direction.x * this.Origin.x + this.Direction.y * this.Origin.y + this.Direction.z * this.Origin.z;
        //return this.Direction.x * (TestPoint.x - this.Origin.x) + this.Direction.y * (TestPoint.y - this.Origin.y) + this.Direction.z * (TestPoint.z - this.Origin.z) >= 0.0;
    }
    static TryGetDirectionalSurface(CenterAtomRadius: number, DisplacementToCenterAtom: Vector3D,  SubtractAtomRadius: number, WaterRadius: number, options: SurfaceSearchOptions): DirectionalSurface3D2 {
        //console.log('TryGetDirectionalSurface', SubtractCenter, SubtractRadius);
        //we assume the origin is zero;
        //from (x^2 + y^2 + z^2 == r^2 and (x-px)^2 + (y-py)^2 + (z-pz)^2 ==R^2) 
        //we can get 2*px*x + 2*py*y + 2*pz*z == px^2 + py^2 + pz^2 + r^2 - R^2
        //therefore 

        
        var CenterRadius: number = CenterAtomRadius * options.subtractAtomFactor + WaterRadius;
        var SubtractRadius: number = SubtractAtomRadius * options.subtractAtomFactor + WaterRadius;
        var pXYZsquare = DisplacementToCenterAtom.lengthSquared;
        if (pXYZsquare == 0) throw 'overlapping atom';

        //var dis = SubtractCenter.multiplyBy(-1);;
        if (DisplacementToCenterAtom.length > CenterRadius + SubtractRadius) return null;

        var ds3D = new DirectionalSurface3D2();
        ds3D.X = 2.0 * DisplacementToCenterAtom.x;
        ds3D.Y = 2.0 * DisplacementToCenterAtom.y;
        ds3D.Z = 2.0 * DisplacementToCenterAtom.z;
        ds3D.C = pXYZsquare + CenterRadius * CenterRadius - SubtractRadius * SubtractRadius;
        ds3D.AtomCenter = DisplacementToCenterAtom;
        ds3D.AtomRadius = SubtractAtomRadius;
        // then the center of the surface (crossed by the line from Zero to the Subtract point has a common factor:
        // (px^2 + py^2 + pz^2 + r^2 - R^2)/(2 * (px^2 + py^2 + pz^2))
        var CrossPointFactor = ds3D.C / 2 / pXYZsquare;
        ds3D.Factor = CrossPointFactor;
        // {px, py, pz} * CrossPointFactor is the CrossPoint
        ds3D.Origin = DisplacementToCenterAtom.multiplyBy(CrossPointFactor);
        //Make the direction facing to the Origin (Zero);
        ds3D.Direction = DisplacementToCenterAtom.multiplyBy(-1);
        return ds3D;
    }
    public isInSurface(point: Vector3D): boolean {
        return Math.abs(point.x * this.X + point.y * this.Y + point.z * this.Z - this.C) < 1e-10;
    }
    public toString(): string {
        return this.X + ',' + this.Y + ',' + this.Z + ',' + this.C + ',' + this.Origin.toString() + ',' + this.Direction.toString();
    }
    public multiplyAsVector3D(multiplier: number): Vector3D {
        return new Vector3D(this.X * multiplier, this.Y * multiplier, this.Z * multiplier);
    }
    /*
     * This calculates the direct of the shared edge
     */
    public orthogonalWith = (that: DirectionalSurface3D2): Vector3D => {
        var both = new Vector3D(
            this.Y * that.Z - this.Z * that.Y,
            this.Z * that.X - this.X * that.Z,
            this.X * that.Y - this.Y * that.X
        );
        var bLength = both.length;
        if (bLength == 0) throw 'host and target vectors are in the same direction.';
        both.divide(bLength);
        return both;
    }
}