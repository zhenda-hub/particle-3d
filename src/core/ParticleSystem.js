// 在浏览器中，THREE 已经通过 script 标签全局加载
// 在 Node.js 环境中，需要使用 import * as THREE from 'three';
const THREE = window.THREE;
import { RainEffect } from '../effects/RainEffect';
import { SnowEffect } from '../effects/SnowEffect';
import { FireworksEffect } from '../effects/FireworksEffect';
import { AuroraEffect } from '../effects/AuroraEffect';
import { GalaxyEffect } from '../effects/GalaxyEffect';
import { FireEffect } from '../effects/FireEffect';
import { MeteorShowerEffect } from '../effects/MeteorShowerEffect';
import { WaterRippleEffect } from '../effects/WaterRippleEffect';
import { MagicEffect } from '../effects/MagicEffect';
import { SmokeEffect } from '../effects/SmokeEffect';
import { DNAEffect } from '../effects/DNAEffect';

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

        // 效果映射表
        this.effects = {
            rain: RainEffect,
            snow: SnowEffect,
            fireworks: FireworksEffect,
            aurora: AuroraEffect,
            galaxy: GalaxyEffect,
            fire: FireEffect,
            meteorShower: MeteorShowerEffect,
            waterRipple: WaterRippleEffect,
            magic: MagicEffect,
            smoke: SmokeEffect,
            dna: DNAEffect
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
        this.camera.position.z = 5;

        // 创建渲染器
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(clientWidth, clientHeight);
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.container.appendChild(this.renderer.domElement);
    }

    setEffect(type) {
        if (!this.effects[type]) {
            console.warn(`Effect type '${type}' not found, falling back to 'rain'`);
            type = 'rain';
        }

        // 清理当前效果
        if (this.currentEffect) {
            this.currentEffect.dispose();
            this.scene.remove(this.currentEffect.mesh);
        }

        // 创建新效果
        const EffectClass = this.effects[type];
        this.currentEffect = new EffectClass(this.options);
        this.scene.add(this.currentEffect.mesh);
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
            this.currentEffect.update(delta);
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
