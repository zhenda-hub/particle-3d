// 在浏览器中，THREE 已经通过 script 标签全局加载
const THREE = window.THREE;
import { BaseEffect } from '../core/BaseEffect';

export class RainEffect extends BaseEffect {
    constructor(options) {
        super(options);
        this._initParticles();
    }

    _initParticles() {
        const positions = new Float32Array(this.options.count * 3);
        const velocities = new Float32Array(this.options.count * 3);

        for (let i = 0; i < this.options.count; i++) {
            // 随机位置 - 增大分布范围
            positions[i * 3] = Math.random() * 60 - 30;     // x: -30 到 30
            positions[i * 3 + 1] = Math.random() * 60 - 30; // y: -30 到 30
            positions[i * 3 + 2] = Math.random() * 60 - 30; // z: -30 到 30

            // 雨滴速度 - 主要是向下运动
            velocities[i * 3] = (Math.random() - 0.5) * 0.2;      // x方向小幅随机
            velocities[i * 3 + 1] = -5 - Math.random() * 3;       // y方向向下，增大速度
            velocities[i * 3 + 2] = (Math.random() - 0.5) * 0.2;  // z方向小幅随机
        }

        this.geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        this.geometry.setAttribute('velocity', new THREE.BufferAttribute(velocities, 3));
    }

    update(delta) {
        const positions = this.geometry.attributes.position.array;
        const velocities = this.geometry.attributes.velocity.array;
        const speed = this.options.speed;

        for (let i = 0; i < positions.length; i += 3) {
            // 更新位置
            positions[i] += velocities[i] * speed * delta;
            positions[i + 1] += velocities[i + 1] * speed * delta;
            positions[i + 2] += velocities[i + 2] * speed * delta;

            // 如果雨滴落到底部，重置到顶部
            if (positions[i + 1] < -30) {
                positions[i + 1] = 30;
                positions[i] = Math.random() * 60 - 30;
                positions[i + 2] = Math.random() * 60 - 30;
            }
        }

        this.geometry.attributes.position.needsUpdate = true;
    }
}
