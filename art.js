var ColorUtil = (function () {
    function ColorUtil() {
    }
    ColorUtil.RenderSinColor = function (cR, cG, cB, vR, vG, vB, ticks, cycle) {
        var R = (cR + Math.round(Math.sin(ticks / cycle) * vR));
        var G = (cG + Math.round(Math.sin(ticks / cycle) * vG));
        var B = (cB + Math.round(Math.sin(ticks / cycle) * vB));
        if (R < 0)
            R = 0;
        if (R > 255)
            R = 255;
        if (G < 0)
            G = 0;
        if (G > 255)
            G = 255;
        if (B < 0)
            B = 0;
        if (B > 255)
            B = 255;
        var sR = R.toString(16);
        var sG = G.toString(16);
        var sB = B.toString(16);
        sR = ColorUtil.pad.substring(0, ColorUtil.pad.length - sR.length) + sR;
        sG = ColorUtil.pad.substring(0, ColorUtil.pad.length - sG.length) + sG;
        sB = ColorUtil.pad.substring(0, ColorUtil.pad.length - sB.length) + sB;
        return "#" + sR + sG + sB;
    };
    ColorUtil.interpolate = function (hslFrom, hslTo, from, to, value) {
        var wFrom = (value - from) / (to - from);
        var wTo = (to - value) / (to - from);
        var hsl = new HSLColor();
        hsl.H = hslFrom.H * wFrom + hslTo.H * wTo;
        hsl.S = hslFrom.S * wFrom + hslTo.S * wTo;
        hsl.L = hslFrom.L * wFrom + hslTo.L * wTo;
        return hsl;
    };
    ColorUtil.Num2Hex = function (value) {
        if (value < 0)
            value = 0;
        if (value > 255)
            value = 255;
        var sValue = value.toString(16);
        return sValue.length == 1 ? "0" + sValue : sValue;
    };
    ColorUtil.HSLfromRGB = function (R, G, B) {
        return ColorUtil.RGB2HSL({ R: R, G: G, B: B });
    };
    ColorUtil.HSL2RGB = function (hsl) {
        var h = hsl.H;
        var l = hsl.L;
        var s = hsl.S;
        var r, g, b;
        if (s == 0) {
            r = g = b = l; // achromatic
        }
        else {
            var hue2rgb = function hue2rgb(p, q, t) {
                if (t < 0)
                    t += 1;
                if (t > 1)
                    t -= 1;
                if (t < 1 / 6)
                    return p + (q - p) * 6 * t;
                if (t < 1 / 2)
                    return q;
                if (t < 2 / 3)
                    return p + (q - p) * (2 / 3 - t) * 6;
                return p;
            };
            var q = l < 0.5 ? l * (1 + s) : l + s - l * s;
            var p = 2 * l - q;
            r = hue2rgb(p, q, h + 1 / 3);
            g = hue2rgb(p, q, h);
            b = hue2rgb(p, q, h - 1 / 3);
        }
        var rgb = new RGBColor();
        rgb.R = Math.round(r * 255);
        rgb.G = Math.round(g * 255);
        rgb.B = Math.round(b * 255);
        return rgb;
    };
    ColorUtil.RGB2HSL = function (rgb) {
        var r = rgb.R;
        var g = rgb.G;
        var b = rgb.B;
        r /= 255, g /= 255, b /= 255;
        var max = Math.max(r, g, b), min = Math.min(r, g, b);
        var h, s, l = (max + min) / 2;
        if (max == min) {
            h = s = 0; // achromatic
        }
        else {
            var d = max - min;
            s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
            switch (max) {
                case r:
                    h = (g - b) / d + (g < b ? 6 : 0);
                    break;
                case g:
                    h = (b - r) / d + 2;
                    break;
                case b:
                    h = (r - g) / d + 4;
                    break;
            }
            h /= 6;
        }
        var hsl = new HSLColor();
        hsl.H = h;
        hsl.S = s;
        hsl.L = l;
        return hsl;
    };
    ColorUtil.parseRGB = function (value) {
        var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(value);
        var rgb = new RGBColor();
        rgb.R = parseInt(result[1], 16);
        rgb.G = parseInt(result[2], 16);
        rgb.B = parseInt(result[3], 16);
        return rgb;
    };
    ColorUtil.pad = "00";
    return ColorUtil;
}());
var RGBColor = (function () {
    function RGBColor() {
        var _this = this;
        this.toColorString = function () {
            return '#' + ColorUtil.Num2Hex(_this.R) + ColorUtil.Num2Hex(_this.G) + ColorUtil.Num2Hex(_this.B);
        };
        this.toValue = function () {
            return _this.R * 65536 + _this.G * 256 + _this.B;
        };
    }
    return RGBColor;
}());
var HSLColor = (function () {
    function HSLColor() {
        var _this = this;
        this.tuneH = function (value) {
            _this.H += value;
            _this.H = _this.H - Math.floor(_this.H);
        };
        this.toColorString = function () {
            var rgb = ColorUtil.HSL2RGB(_this);
            return rgb.toColorString();
        };
    }
    return HSLColor;
}());
//# sourceMappingURL=art.js.map