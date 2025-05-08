// 在浏览器中，THREE 已经通过 script 标签全局加载
// 在 Node.js 环境中，需要使用 import * as THREE from 'three';
const THREE = window.THREE;
import { RainEffect } from '../effects/RainEffect';
import { SnowEffect } from '../effects/SnowEffect';
import { FireworksEffect } from '../effects/FireworksEffect';
import { AuroraEffect } from '../effects/AuroraEffect';
// 删除了星系、火焰和流星雨效果的引用
import { WaterRippleEffect } from '../effects/WaterRippleEffect';
import { MagicEffect } from '../effects/MagicEffect';
import { SmokeEffect } from '../effects/SmokeEffect';
import { DNAEffect } from '../effects/DNAEffect';
import { SolarSystemEffect } from '../effects/SolarSystemEffect';

class ParticleSystem {
    constructor(options = {}) {
        this.options = {
            type: 'rain',
            count: 1000,
            speed: 1,
            size: 0.1,
            color: '#ffffff',
            ...options
        };

        this.container = null;
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.currentEffect = null;
        this.isRunning = false;
        this.clock = new THREE.Clock();

        // 效果映射表 - 删除了星系、火焰和流星雨效果
        this.effects = {
            rain: RainEffect,
            snow: SnowEffect,
            fireworks: FireworksEffect,
            aurora: AuroraEffect,
            // galaxy: GalaxyEffect, // 已删除
            // fire: FireEffect, // 已删除
            // meteorShower: MeteorShowerEffect, // 已删除
            waterRipple: WaterRippleEffect,
            magic: MagicEffect,
            smoke: SmokeEffect,
            dna: DNAEffect,
            solarSystem: SolarSystemEffect
        };

        // 绑定方法
        this._animate = this._animate.bind(this);
        this._onWindowResize = this._onWindowResize.bind(this);
    }

    init(container) {
        // 设置容器
        if (typeof container === 'string') {
            this.container = document.querySelector(container);
        } else if (container instanceof HTMLElement) {
            this.container = container;
        } else {
            throw new Error('Container must be a DOM element or selector string');
        }

        // 初始化Three.js
        this._initThree();
        
        // 初始化效果
        this.setEffect(this.options.type);

        // 开始动画
        this.isRunning = true;
        this._animate();

        // 添加窗口调整监听
        window.addEventListener('resize', this._onWindowResize, false);
    }

    _initThree() {
        // 创建场景
        this.scene = new THREE.Scene();

        // 创建相机
        const { clientWidth, clientHeight } = this.container;
        this.camera = new THREE.PerspectiveCamera(
            75,
            clientWidth / clientHeight,
            0.1,
            1000
        );
        // 增加相机距离，使所有效果都能全屏显示
        this.camera.position.z = 30;

        // 创建渲染器
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(clientWidth, clientHeight);
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.container.appendChild(this.renderer.domElement);
    }

    setEffect(type) {
        // 检查效果类型是否有效
        if (!this.effects[type]) {
            console.warn(`Effect type '${type}' not found, falling back to 'rain'`);
            type = 'rain';
        }

        // 清除当前效果
        if (this.currentEffect) {
            // 安全地从场景中移除当前效果
            if (this.currentEffect.points && this.currentEffect.points.parent) {
                this.currentEffect.points.parent.remove(this.currentEffect.points);
            } else if (this.currentEffect.mesh && this.currentEffect.mesh.parent) {
                this.currentEffect.mesh.parent.remove(this.currentEffect.mesh);
            }
            
            // 释放资源
            this.currentEffect.dispose();
        }
        
        // 重置相机位置到默认值
        this.camera.position.set(0, 0, 30);
        this.camera.lookAt(0, 0, 0);

        // 创建新效果
        const effectOptions = {
            ...this.options,
            scene: this.scene,  // 传递场景引用
            camera: this.camera // 传递相机引用
        };
        
        this.currentEffect = new this.effects[type](effectOptions);
        
        // 安全地将效果添加到场景中
        if (type !== 'solarSystem') { // 太阳系效果已在其初始化方法中自己添加到场景
            // 兼容不同的效果实现，有的用 points，有的用 mesh
            if (this.currentEffect.points) {
                this.scene.add(this.currentEffect.points);
            } else if (this.currentEffect.mesh) {
                this.scene.add(this.currentEffect.mesh);
            }
        }

        console.log('Effect changed to:', type);
    }

    updateOptions(newOptions) {
        this.options = { ...this.options, ...newOptions };
        if (this.currentEffect) {
            this.currentEffect.updateOptions(this.options);
        }
    }

    _animate() {
        if (!this.isRunning) return;

        requestAnimationFrame(this._animate);

        const delta = this.clock.getDelta();
        if (this.currentEffect) {
            // 更新当前效果
            this.currentEffect.update(delta);
            
            // 更新着色器的时间参数，如果有的话
            if (this.currentEffect.material && this.currentEffect.material.uniforms && 
                this.currentEffect.material.uniforms.time) {
                this.currentEffect.material.uniforms.time.value += delta;
            }
            
            // 如果有自定义的粒子系统，也更新它们
            if (this.currentEffect.particles) {
                for (let particle of this.currentEffect.particles) {
                    if (particle.material && particle.material.uniforms && 
                        particle.material.uniforms.time) {
                        particle.material.uniforms.time.value += delta;
                    }
                }
            }
        }

        this.renderer.render(this.scene, this.camera);
    }

    _onWindowResize() {
        if (!this.container || !this.camera || !this.renderer) return;

        const { clientWidth, clientHeight } = this.container;
        
        this.camera.aspect = clientWidth / clientHeight;
        this.camera.updateProjectionMatrix();
        
        this.renderer.setSize(clientWidth, clientHeight);
    }

    destroy() {
        this.isRunning = false;
        window.removeEventListener('resize', this._onWindowResize);

        if (this.currentEffect) {
            this.currentEffect.dispose();
        }

        if (this.renderer) {
            this.renderer.dispose();
            this.container.removeChild(this.renderer.domElement);
        }

        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.currentEffect = null;
    }
}

export { ParticleSystem };
export default ParticleSystem;
