/*
 * Monotonic Cubic Spline function, taken from http://blog.mackerron.com/2011/01/01/javascript-cubic-splines/. Amazing work, massive thanks!
 */
var MonotonicCubicSpline = (function() {

    function MonotonicCubicSpline(x, y) {
        var alpha, beta, delta, dist, i, m, n, tau, to_fix, _i, _j, _len, _len2, _ref, _ref2, _ref3, _ref4;
        n = x.length;
        delta = [];
        m = [];
        alpha = [];
        beta = [];
        dist = [];
        tau = [];
        for (i = 0, _ref = n - 1; (0 <= _ref ? i < _ref : i > _ref); (0 <= _ref ? i += 1 : i -= 1)) {
            delta[i] = (y[i + 1] - y[i]) / (x[i + 1] - x[i]);
            if (i > 0) {
                m[i] = (delta[i - 1] + delta[i]) / 2;
            }
        }
        m[0] = delta[0];
        m[n - 1] = delta[n - 2];
        to_fix = [];
        for (i = 0, _ref2 = n - 1; (0 <= _ref2 ? i < _ref2 : i > _ref2); (0 <= _ref2 ? i += 1 : i -= 1)) {
            if (delta[i] === 0) {
                to_fix.push(i);
            }
        }
        for (_i = 0, _len = to_fix.length; _i < _len; _i++) {
            i = to_fix[_i];
            m[i] = m[i + 1] = 0;
        }
        for (i = 0, _ref3 = n - 1; (0 <= _ref3 ? i < _ref3 : i > _ref3); (0 <= _ref3 ? i += 1 : i -= 1)) {
            alpha[i] = m[i] / delta[i];
            beta[i] = m[i + 1] / delta[i];
            dist[i] = Math.pow(alpha[i], 2) + Math.pow(beta[i], 2);
            tau[i] = 3 / Math.sqrt(dist[i]);
        }
        to_fix = [];
        for (i = 0, _ref4 = n - 1; (0 <= _ref4 ? i < _ref4 : i > _ref4); (0 <= _ref4 ? i += 1 : i -= 1)) {
            if (dist[i] > 9) {
                to_fix.push(i);
            }
        }
        for (_j = 0, _len2 = to_fix.length; _j < _len2; _j++) {
            i = to_fix[_j];
            m[i] = tau[i] * alpha[i] * delta[i];
            m[i + 1] = tau[i] * beta[i] * delta[i];
        }
        this.x = x.slice(0, n);
        this.y = y.slice(0, n);
        this.m = m;
    }

    MonotonicCubicSpline.prototype.interpolate = function(x) {
        var h, h00, h01, h10, h11, i, t, t2, t3, y, _ref;
        for (i = _ref = this.x.length - 2; (_ref <= 0 ? i <= 0 : i >= 0); (_ref <= 0 ? i += 1 : i -= 1)) {
            if (this.x[i] <= x) {
                break;
            }
        }
        h = this.x[i + 1] - this.x[i];
        t = (x - this.x[i]) / h;
        t2 = Math.pow(t, 2);
        t3 = Math.pow(t, 3);
        h00 = 2 * t3 - 3 * t2 + 1;
        h10 = t3 - 2 * t2 + t;
        h01 = -2 * t3 + 3 * t2;
        h11 = t3 - t2;
        y = h00 * this.y[i] + h10 * h * this.m[i] + h01 * this.y[i + 1] + h11 * h * this.m[i + 1];
        return y;
    };

    return MonotonicCubicSpline;
    
})();