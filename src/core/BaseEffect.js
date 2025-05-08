// 在浏览器中，THREE 已经通过 script 标签全局加载
const THREE = window.THREE;

export class BaseEffect {
    constructor(options) {
        this.options = options;
        this.geometry = null;
        this.material = null;
        this.mesh = null;  // 保留兼容性
        this.points = null; // 统一使用 points 属性
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
        this.points = new THREE.Points(this.geometry, this.material);
        this.mesh = this.points; // 兼容旧代码
    }

    update(delta) {
        // 由子类实现
    }

    updateOptions(options) {
        this.options = { ...this.options, ...options };
        
        // 检查材质是否有 color 属性
        if (this.material && this.material.color && typeof this.material.color.set === 'function') {
            this.material.color.set(this.options.color);
        }
        
        // 检查材质是否有 size 属性
        if (this.material && this.options.size !== undefined) {
            this.material.size = this.options.size;
        }
    }

    dispose() {
        try {
            if (this.material) {
                // 处理材质的 uniforms 和纹理
                if (this.material.uniforms) {
                    // 安全地遍历所有 uniforms
                    Object.keys(this.material.uniforms).forEach(key => {
                        const uniform = this.material.uniforms[key];
                        if (uniform && uniform.value && 
                            typeof uniform.value.dispose === 'function') {
                            try {
                                uniform.value.dispose();
                            } catch (e) {
                                console.warn(`Error disposing uniform ${key}:`, e);
                            }
                        }
                    });
                }
                
                // 处理标准材质的 map
                if (this.material.map && typeof this.material.map.dispose === 'function') {
                    this.material.map.dispose();
                }
                
                // 销毁材质
                this.material.dispose();
            }
            
            if (this.geometry) {
                this.geometry.dispose();
            }
            
            // 清除粒子系统
            if (this.points && this.points.parent) {
                this.points.parent.remove(this.points);
            }
        } catch (e) {
            console.error('Error in dispose method:', e);
        }
    }
}
