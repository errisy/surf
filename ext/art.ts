class ColorUtil {
    private static pad = "00";

    static RenderSinColor(cR: number, cG: number, cB: number, vR: number, vG: number, vB: number, ticks: number, cycle: number): string {
        var R = (cR + Math.round(Math.sin(ticks / cycle) * vR));
        var G = (cG + Math.round(Math.sin(ticks / cycle) * vG));
        var B = (cB + Math.round(Math.sin(ticks / cycle) * vB));
        if (R < 0) R = 0;
        if (R > 255) R = 255;
        if (G < 0) G = 0;
        if (G > 255) G = 255;
        if (B < 0) B = 0;
        if (B > 255) B = 255;
        var sR = R.toString(16);
        var sG = G.toString(16);
        var sB = B.toString(16);
        sR = ColorUtil.pad.substring(0, ColorUtil.pad.length - sR.length) + sR;
        sG = ColorUtil.pad.substring(0, ColorUtil.pad.length - sG.length) + sG;
        sB = ColorUtil.pad.substring(0, ColorUtil.pad.length - sB.length) + sB;
        return "#" + sR + sG + sB;
    }
    static interpolate(hslFrom: HSLColor, hslTo: HSLColor, from: number, to: number, value: number): HSLColor {
        var wFrom = (value - from) / (to - from);
        var wTo = (to - value) / (to - from);
        var hsl = new HSLColor();
        hsl.H = hslFrom.H * wFrom + hslTo.H * wTo;
        hsl.S = hslFrom.S * wFrom + hslTo.S * wTo;
        hsl.L = hslFrom.L * wFrom + hslTo.L * wTo;
        return hsl;
    }
    static Num2Hex(value: number):string {
        if (value < 0) value = 0;
        if (value > 255) value = 255;
        var sValue = value.toString(16);
        return sValue.length == 1 ? "0" + sValue : sValue;
    }
    static HSLfromRGB(R: number, G: number, B: number): HSLColor {
        return ColorUtil.RGB2HSL(<any>{ R: R, G: G, B: B });
    }
    static HSL2RGB(hsl: HSLColor): RGBColor {
        var h: number = hsl.H;
        var l: number = hsl.L;
        var s: number = hsl.S;
        var r, g, b;
        if (s == 0) {
            r = g = b = l; // achromatic
        } else {
            var hue2rgb = function hue2rgb(p, q, t) {
                if (t < 0) t += 1;
                if (t > 1) t -= 1;
                if (t < 1 / 6) return p + (q - p) * 6 * t;
                if (t < 1 / 2) return q;
                if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
                return p;
            }

            var q = l < 0.5 ? l * (1 + s) : l + s - l * s;
            var p = 2 * l - q;
            r = hue2rgb(p, q, h + 1 / 3);
            g = hue2rgb(p, q, h);
            b = hue2rgb(p, q, h - 1 / 3);
        }
        var rgb: RGBColor = new RGBColor();
        rgb.R = Math.round(r * 255);
        rgb.G = Math.round(g * 255);
        rgb.B = Math.round(b * 255);
        return rgb;
    }

    static RGB2HSL(rgb: RGBColor): HSLColor {
        var r: number = rgb.R;
        var g: number = rgb.G;
        var b: number = rgb.B;
        r /= 255, g /= 255, b /= 255;
        var max = Math.max(r, g, b), min = Math.min(r, g, b);
        var h, s, l = (max + min) / 2;

        if (max == min) {
            h = s = 0; // achromatic
        } else {
            var d = max - min;
            s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
            switch (max) {
                case r: h = (g - b) / d + (g < b ? 6 : 0); break;
                case g: h = (b - r) / d + 2; break;
                case b: h = (r - g) / d + 4; break;
            }
            h /= 6;
        }
        var hsl: HSLColor = new HSLColor();
        hsl.H = h;
        hsl.S = s;
        hsl.L = l;
        return hsl;
    }
    static parseRGB(value: string): RGBColor {
        var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(value);
        var rgb: RGBColor = new RGBColor();
        rgb.R = parseInt(result[1], 16);
        rgb.G = parseInt(result[2], 16);
        rgb.B = parseInt(result[3], 16);
        return rgb;
    }
}

class RGBColor {
    public R: number;
    public G: number;
    public B: number;
    public toColorString: () => string = () => {
        return '#' + ColorUtil.Num2Hex(this.R) + ColorUtil.Num2Hex(this.G) + ColorUtil.Num2Hex(this.B);
    };
    public toValue = (alpha?: number): number => {
        if (!alpha) alpha = 0;
        return alpha * 16777216 + this.R * 65536 + this.G * 256 + this.B;
    }
}
class HSLColor {
    public H: number;
    public S: number;
    public L: number;
    public tuneH: (value: number) => void = (value: number) => {
        this.H += value;
        this.H = this.H - Math.floor(this.H);
    };
    public toColorString: () => string = () => {
        var rgb = ColorUtil.HSL2RGB(this);
        return rgb.toColorString();
    };
}

