class Bounds3D {
    xMin: number;
    xMax: number;
    yMin: number;
    yMax: number;
    zMin: number;
    zMax: number;
    public Includes = (point: Vector3D) => {
        if (typeof point.x == 'number' && !isNaN(point.x)) {
            if (typeof this.xMin == 'number' && !isNaN(this.xMin)) {
                this.xMin = this.xMin < point.x ? this.xMin : point.x;
            }
            else {
                this.xMin = point.x;
            }
            if (typeof this.xMax == 'number' && !isNaN(this.xMax)) {
                this.xMax = this.xMax > point.x ? this.xMax : point.x;
            }
            else {
                this.xMax = point.x;
            }
        }
        if (typeof point.y == 'number' && !isNaN(point.y)) {
            if (typeof this.yMin == 'number' && !isNaN(this.yMin)) {
                this.yMin = this.yMin < point.y ? this.yMin : point.y;
            }
            else {
                this.yMin = point.y;
            }
            if (typeof this.yMax == 'number' && !isNaN(this.yMax)) {
                this.yMax = this.yMax > point.y ? this.yMax : point.y;
            }
            else {
                this.yMax = point.y;
            }
        }
        if (typeof point.z == 'number' && !isNaN(point.z)) {
            if (typeof this.zMin == 'number' && !isNaN(this.zMin)) {
                this.zMin = this.zMin < point.z ? this.zMin : point.z;
            }
            else {
                this.zMin = point.z;
            }
            if (typeof this.zMax == 'number' && !isNaN(this.zMax)) {
                this.zMax = this.zMax > point.z ? this.zMax : point.z;
            }
            else {
                this.zMax = point.z;
            }
        }
    }
    public Expand = (vXMin: number, vXMax: number, vYMin: number, vYMax: number, vZMin: number, vZMax: number) => {
        this.xMin += vXMin;
        this.xMax += vXMax;
        this.yMin += vYMin;
        this.yMax += vYMax;
        this.zMin += vZMin;
        this.zMax += vZMax;
    }
    public Contains = (position: Vector3D): boolean => {
        if (!(this.xMin && this.xMax && this.yMin && this.yMin && this.zMin && this.zMax)) return false;
        return this.xMin <= position.x && this.xMax >= position.x && this.yMin <= position.y && this.yMax >= position.y && this.zMin <= position.z && this.zMax >= position.z;
    }
    public toString(): string {
        return 'Bounds3D{xMin: ' + this.xMin + ', xMax: ' + this.xMax + ', yMin: ' + this.yMin + ', yMax: ' + this.yMax + ', zMin: ' + this.zMin + ', zMax: ' + this.zMax + '}';
    }
}

class Vector3D {
    x: number = 0;
    y: number = 0;
    z: number = 0;
    constructor(x?: number, y?: number, z?: number) {
        if (typeof x == 'number' && !isNaN(x)) this.x = x;
        if (typeof y == 'number' && !isNaN(y)) this.y = y;
        if (typeof z == 'number' && !isNaN(z)) this.z = z;
    }
    get clone(): Vector3D {
        return new Vector3D(this.x, this.y, this.z);
    }
    public divide = (divider: number): void => {
        this.x /= divider;
        this.y /= divider;
        this.z /= divider;
    }
    public divideBy = (divider: number): Vector3D => {
        return new Vector3D(this.x / divider, this.y / divider, this.z / divider);
    }
    public multiplyBy = (multiplier: number): Vector3D => {
        return new Vector3D(this.x * multiplier, this.y * multiplier, this.z * multiplier);
    }
    public add = (value: Vector3D): Vector3D => {
        return new Vector3D(this.x + value.x, this.y + value.y, this.z + value.z);
    }
    public subtract = (value: Vector3D): Vector3D => {
        return new Vector3D(this.x - value.x, this.y - value.y, this.z - value.z);
    }
    get length(): number {
        return Math.sqrt(this.x * this.x + this.y * this.y + this.z * this.z);
    }
    get lengthSquared(): number {
        return this.x * this.x + this.y * this.y + this.z * this.z;
    }
    public orthogonalWith = (that: Vector3D): Vector3D => {
        //if (this.x == 0 && this.y == 0 && this.z == 0) throw 'host vector is 0';
        //var tLength = target.length;
        //if (tLength == 0) throw 'target vector is 0';
        //var K = -(this.x * target.x + this.y * target.y + this.z * target.z) / this.lengthSquared;
        //var orth = target.add(this.multiplyBy(K));
        //var both = new Vector3D(this.y * orth.z - orth.y * this.z, this.z * orth.x - orth.z * this.x, this.x * orth.y - orth.x * this.y);
        //var bLength = both.length;
        //if (bLength == 0) throw 'host and target vectors are in the same direction.';
        // this.x this.y this.z
        // that.x that.y that.z
        var both = new Vector3D(
            this.y * that.z - this.z * that.y,
            this.z * that.x - this.x * that.z,
            this.x * that.y - this.y * that.x
        );
        var bLength = both.length;
        if (bLength == 0) throw 'host and target vectors are in the same direction.';
        both.divide(bLength);
        return both;
    }
    static sum(...vectors: Vector3D[]): Vector3D {
        var result = new Vector3D();
        for (var i = 0; i < arguments.length; i++) {
            var item = <Vector3D>arguments[i];
            result.x += item.x;
            result.y += item.y;
            result.z += item.z;
        }
        return result;
    }
    public equals = (value: Vector3D): boolean => {
        return this.x == value.x && this.y == value.y && this.z == value.z;
    }
    public toString(): string {
        return this.x + ',' + this.y + ',' + this.z;
    }
}

class PolyhedronBuilder {
    public Center: Vector3D;
    public Radius: number;
    public Surfaces: DirectionalSurface3D[] = []
    constructor(center: Vector3D, radius: number) {
        this.Center = center;
        this.Radius = radius;
        this.Surfaces.push(
            set(new DirectionalSurface3D(), (ds) => {
                ds.X = 1.0;
                ds.Y = 0.0;
                ds.Z = 0.0;
                ds.C = center.x + radius;
                ds.Origin = new Vector3D(center.x + radius, 0.0, 0.0);
                ds.Direction = new Vector3D(-1.0, 0.0, 0.0);
            }),
            set(new DirectionalSurface3D(), (ds) => {
                ds.X = 1.0;
                ds.Y = 0.0;
                ds.Z = 0.0;
                ds.C = center.x - radius;
                ds.Origin = new Vector3D(center.x - radius, 0.0, 0.0);
                ds.Direction = new Vector3D(1.0, 0.0, 0.0);
            }),
            set(new DirectionalSurface3D(), (ds) => {
                ds.X = 0.0;
                ds.Y = 1.0;
                ds.Z = 0.0;
                ds.C = center.y + radius;
                ds.Origin = new Vector3D(0.0, center.y + radius, 0.0);
                ds.Direction = new Vector3D(0.0, -1.0, 0.0);
            }),
            set(new DirectionalSurface3D(), (ds) => {
                ds.X = 0.0;
                ds.Y = 1.0;
                ds.Z = 0.0;
                ds.C = center.y - radius;
                ds.Origin = new Vector3D(0.0, center.y - radius, 0.0);
                ds.Direction = new Vector3D(0.0, 1.0, 0.0);
            }),
            set(new DirectionalSurface3D(), (ds) => {
                ds.X = 0.0;
                ds.Y = 0.0;
                ds.Z = 1.0;
                ds.C = center.z + radius;
                ds.Origin = new Vector3D(0.0, 0.0, center.z + radius);
                ds.Direction = new Vector3D(0.0, 0.0, -1.0);
            }),
            set(new DirectionalSurface3D(), (ds) => {
                ds.X = 0.0;
                ds.Y = 0.0;
                ds.Z = 1.0;
                ds.C = center.z - radius;
                ds.Origin = new Vector3D(0.0, 0.0, center.z - radius);
                ds.Direction = new Vector3D(0.0, 0.0, 1.0);
            })
        );
    }
    public TrySubtract = (vPoint: Vector3D, vRadius: number) => {
        var sur = DirectionalSurface3D.TryGetDirectionalSurface(this.Center, this.Radius, vPoint, vRadius);
        if (sur) this.Surfaces.push(sur); 
    }
    public IsEmpty = (isDebugging?: boolean) => {
        var Vertices: Vector3D[] = [];
        var count = 0;
        //var debugLines: string[] = [];
        this.Surfaces.eachCombination(3, (com) => {
            var p = Vertex.TryGetVertex(com[0], com[1], com[2]);
            //console.log('vertex:');
            //console.log(p);
            
            if (p) {
                //if (isDebugging && count < 1000) {
                //    debugLines.push(p.toString() + '\r\n');
                    
                //    count += 1;
                //}
                
                var dis = p.subtract(this.Center);

                if (isDebugging && (count == 3185 || count == 3201)) console.log(count + ',' + dis.toString() + ',' + dis.length.toString() + ',' + this.Radius);
                if ((Math.abs(dis.x) <= this.Radius + 0.0001) && (Math.abs(dis.y) <= this.Radius + 0.0001) && (Math.abs(dis.z) <= this.Radius + 0.0001) && (dis.length >= this.Radius - 0.0001)) {
                    if (this.Surfaces.every((surf) => surf.IsPositive(p))) {
                        Vertices.push(p);
                    }
                }
            }
            count += 1;
        });
        return Vertices.length == 0;
    }
    public toString(): string {
        var lines: string[] = [];
        lines.push('PolyhedronBuilder Start:\r\n');
        lines.push('Center,' + this.Center.toString() + '\r\n');
        lines.push('Radius,' + this.Radius + '\r\n');
        this.Surfaces.forEach((surface) => lines.push(surface.toString() + '\r\n'));
        lines.push('End PolyhedronBuilder\r\n');
        return lines.join('');
    }
}



function set<T>(obj: T, func: (value: T) => any):T{
    func(obj);
    return obj;
}

class DirectionalSurface3D {
    public X: number;
    public Y: number;
    public Z: number;
    public C: number;
    public Origin: Vector3D;
    public Direction: Vector3D;
    /**
     * Determine if the point is a convex vectex.
     * @param TestPoint
     */
    public IsPositive(TestPoint: Vector3D): boolean {
        return this.Direction.x * TestPoint.x + this.Direction.y * TestPoint.y + this.Direction.z * TestPoint.z >=
            this.Direction.x * this.Origin.x + this.Direction.y * this.Origin.y + this.Direction.z * this.Origin.z;
        //return this.Direction.x * (TestPoint.x - this.Origin.x) + this.Direction.y * (TestPoint.y - this.Origin.y) + this.Direction.z * (TestPoint.z - this.Origin.z) >= 0.0;
    }
    static TryGetDirectionalSurface(HostCenter: Vector3D, HostRadius: number, SubtractCenter: Vector3D, SubtractRadius: number): DirectionalSurface3D {
        var dis = HostCenter.subtract(SubtractCenter);
        if (dis.length > HostRadius + SubtractRadius) return null;
        var X = 2.0 * dis.x;
        var Y = 2.0 * dis.y;
        var Z = 2.0 * dis.z;
        var C = HostCenter.lengthSquared - SubtractCenter.lengthSquared + SubtractRadius * SubtractRadius - HostRadius * HostRadius;
        var D = X * dis.x + Y * dis.y + Z * dis.z;
        var DK = X * HostCenter.x + Y * HostCenter.y + Z * HostCenter.z - C;
        var K = DK / D;
        var ds3D = new DirectionalSurface3D();
        ds3D.X = X;
        ds3D.Y = Y;
        ds3D.Z = Z;
        ds3D.C = C;
        //console.log('ds3D.C: ' + ds3D.C.toString());
        ds3D.Origin = new Vector3D(HostCenter.x - dis.x * K, HostCenter.y - dis.y * K, HostCenter.z - dis.z * K);
        ds3D.Direction = dis;
        //var verifyL = ds3D.X * ds3D.Origin.x + ds3D.Y * ds3D.Origin.y + ds3D.Z * ds3D.Origin.z;
        //var verifyC = ds3D.C;
        return ds3D;
    }
    public isInSurface(point: Vector3D): boolean {
        return Math.abs(point.x * this.X + point.y * this.Y + point.z * this.Z - this.C) < 1e-10;
    }

    public toString(): string {
        return this.X + ',' + this.Y + ',' + this.Z + ',' + this.C + ',' + this.Origin.toString() + ',' + this.Direction.toString();
    }

}

class Edge {
    static isOutOfBox(fe1: DirectionalSurface3D2, fe2: DirectionalSurface3D2, radius: number ) {
        //var direction = fe1.orthogonalWith(fe2);
        var sqrBase = fe2.Y * fe1.Z - fe1.Y * fe2.Z;
        var sqr2 = sqrBase * sqrBase;
        var rp1 = fe1.Y * fe1.Y + fe1.Z * fe1.Z;
        var rp2 = fe1.Y * fe2.Y + fe1.Z * fe2.Z;
        var rp3 = fe2.Y * fe2.Y + fe2.Z * fe2.Z;
        var canGetLine = -sqr2 *
            (fe2.C * fe2.C * (fe1.X * fe1.X + rp1) -
                2 * fe1.C * fe2.C * (fe1.X * fe2.X + rp2) +
                fe1.C * fe1.C * (fe2.X * fe2.X + rp3) -
                3 * radius * radius * (fe2.X * fe2.X * rp1 + sqr2 - 2 * fe1.X * fe2.X * rp2 + fe1.X * fe1.X * rp3));
        return canGetLine < -0.0001;
    }
}

class Vertex {
    /**
     * Solve the surface equation to obtain the point
     * @param fe1
     * @param fe2
     * @param fe3
     */
    static TryGetVertex(fe1: DirectionalSurface3D, fe2: DirectionalSurface3D, fe3: DirectionalSurface3D): Vector3D {
        //console.log(fe1, fe2, fe3);
        var D = Vertex.Determinant(fe1.X, fe1.Y, fe1.Z, fe2.X, fe2.Y, fe2.Z, fe3.X, fe3.Y, fe3.Z);
        var DX = Vertex.Determinant(fe1.C, fe1.Y, fe1.Z, fe2.C, fe2.Y, fe2.Z, fe3.C, fe3.Y, fe3.Z);
        var DY = Vertex.Determinant(fe1.X, fe1.C, fe1.Z, fe2.X, fe2.C, fe2.Z, fe3.X, fe3.C, fe3.Z);
        var DZ = Vertex.Determinant(fe1.X, fe1.Y, fe1.C, fe2.X, fe2.Y, fe2.C, fe3.X, fe3.Y, fe3.C);
        //console.log(D, DX, DY, DZ);
        if (D == 0.0) {
            return null;
        }
        else {
            var point = new Vector3D(DX / D, DY / D, DZ / D);
            //if (!fe1.isInSurface(point)) console.log(point.toString() + ' not in ' + fe1.toString());
            //if (!fe2.isInSurface(point)) console.log(point.toString() + ' not in ' + fe2.toString());
            //if (!fe3.isInSurface(point)) console.log(point.toString() + ' not in ' + fe3.toString());
            return point;
        }
    }
    static Determinant(a1: number, b1: number, c1: number, a2: number, b2: number, c2: number, a3: number, b3: number, c3: number): number {
        return a1 * b2 * c3 + b1 * c2 * a3 + c1 * a2 * b3 - c1 * b2 * a3 - b1 * a2 * c3 - a1 * c2 * b3;
    }
}

interface Array<T> {
    eachCombination(size: number, action: (combination: T[]) => any): void;
    eachCombinationCheck2(size: number, check2: (item1: T, item2: T) => boolean, action: (combination: T[]) => any): void;
    someCombinationCheck2(size: number, check2: (item1: T, item2: T) => boolean, action: (combination: T[]) => any): any;
}

Array.prototype.eachCombination = (size: number, action: (combination: any[])=>any):void => {
    var that: any[] = eval('this');
    var length = that.length;
    if (size > length) return;
    class iterator {
        constructor(from: number, level: number, indices: number[]) {
            if (level > size) {
                action(indices.map((index) => that[index]));
            }
            else {
                for (var i = from; i < length - size + level; i++) {
                    indices[level] = i;
                    var next = indices.filter((value) => true);
                    new iterator(i + 1, level + 1, next);
                }
            }
        }
    }
    new iterator(0, 1, []);
}


Array.prototype.eachCombinationCheck2 = (size: number, check2: (item1: any, item2: any) => boolean, action: (combination: any[]) => any): void => {
    var that: any[] = eval('this');
    var length = that.length;
    if (size > length) return;
    class iterator {
        constructor(from: number, level: number, indices: number[]) {
            if (level == 3) {
                //console.log(indices);
                if (check2(that[indices[0]], that[indices[1]])) return;
            }
            if (level > size) {
                action(indices.map((index) => that[index]));
            }
            else {
                for (var i = from; i < length - size + level; i++) {
                    indices[level-1] = i;
                    var next = indices.filter((value) => true);
                    new iterator(i + 1, level + 1, next);
                }
            }
        }
    }
    new iterator(0, 1, []);
}

Array.prototype.someCombinationCheck2 = (size: number, check2: (item1: any, item2: any) => boolean, action: (combination: any[]) => boolean): boolean => {
    var that: any[] = eval('this');
    var length = that.length;
    if (size > length) return false;
    var result: any = false;
    class iterator {
        constructor(from: number, level: number, indices: number[]) {
            if (level == 3) {
                //console.log(indices);
                if (check2(that[indices[0]], that[indices[1]])) return;
            }
            if (level > size) {
                result = action(indices.map((index) => that[index]));
                if(result) return;
            }
            else {
                for (var i = from; i < length - size + level; i++) {
                    indices[level - 1] = i;
                    var next = indices.filter((value) => true);
                    new iterator(i + 1, level + 1, next);
                    if (result) return;
                }
            }
        }
    }
    new iterator(0, 1, []);
    //console.log('result:', result);
    return result;
}

