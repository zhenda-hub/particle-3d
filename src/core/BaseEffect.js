// 在浏览器中，THREE 已经通过 script 标签全局加载
const THREE = window.THREE;

export class BaseEffect {
    constructor(options) {
        this.options = options;
        this.geometry = null;
        this.material = null;
        this.mesh = null;
        this.particles = [];
        
        this._init();
    }

    _init() {
        // 创建几何体
        this.geometry = new THREE.BufferGeometry();
        
        // 创建材质
        this.material = new THREE.PointsMaterial({
            color: this.options.color,
            size: this.options.size,
            transparent: true,
            blending: THREE.AdditiveBlending,
            depthWrite: false
        });

        // 创建实例化网格
        this.mesh = new THREE.Points(this.geometry, this.material);
    }

    update(delta) {
        // 由子类实现
    }

    updateOptions(options) {
        this.options = { ...this.options, ...options };
        this.material.color.set(this.options.color);
        this.material.size = this.options.size;
    }

    dispose() {
        if (this.geometry) {
            this.geometry.dispose();
        }
        if (this.material) {
            this.material.dispose();
        }
    }
}
