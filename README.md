# Interactive Particle System (particle-3d)

一个基于 Three.js 的交互式 3D 粒子系统，可以轻松集成到任何 Web 项目中。支持多种粒子效果（雨、雪、烟花等），并提供丰富的自定义选项。

## 特性

- 🎨 多种内置粒子效果（雨、雪、烟花）
- 🎮 支持鼠标/触摸交互
- 📱 响应式设计，自适应容器大小
- 🔧 丰富的配置选项
- 🎯 易于集成到任何 Web 项目
- ⚡ 优化的性能（使用 Three.js InstancedMesh）

## 安装

### 使用 npm

```bash
npm install interactive-particle-system
```

### 使用 CDN

```html
<!-- 先引入 Three.js -->
<script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>
<!-- 再引入粒子系统 -->
<script src="https://unpkg.com/interactive-particle-system@latest/dist/particle-system.min.js"></script>
```

## 使用方法

### 1. 在普通 HTML 项目中使用

```html
<!-- 1. 创建容器 -->
<div id="particle-container" style="width: 100%; height: 100vh;"></div>

<!-- 2. 初始化粒子系统 -->
<script>
    const particleSystem = new ParticleSystem({
        type: 'rain',    // 粒子类型：rain, snow, fireworks
        count: 1000,     // 粒子数量
        speed: 1,        // 速度
        size: 0.1,       // 大小
        color: '#ffffff' // 颜色
    });
    particleSystem.init('#particle-container');

    // 切换效果
    particleSystem.setEffect('snow');

    // 更新配置
    particleSystem.updateOptions({
        speed: 2.0,
        count: 2000
    });
</script>
```

### 2. 在 Vue 项目中使用

```vue
<!-- ParticleComponent.vue -->
<template>
    <div ref="particleContainer" class="particle-container"></div>
</template>

<script>
import { ParticleSystem } from 'interactive-particle-system'

export default {
    name: 'ParticleComponent',
    props: {
        type: {
            type: String,
            default: 'rain'
        },
        options: {
            type: Object,
            default: () => ({})
        }
    },
    mounted() {
        const particleSystem = new ParticleSystem({
            type: this.type,
            ...this.options
        });
        particleSystem.init(this.$refs.particleContainer);
    }
}
</script>
```

使用组件：
```vue
<template>
    <ParticleComponent 
        type="snow"
        :options="{
            count: 2000,
            speed: 1.5,
            color: '#ffffff'
        }"
    />
</template>
```

## 配置选项

| 选项 | 类型 | 默认值 | 描述 |
|------|------|--------|------|
| type | string | 'rain' | 粒子效果类型：'rain', 'snow', 'fireworks' |
| count | number | 1000 | 粒子数量 |
| speed | number | 1.0 | 粒子移动速度 |
| size | number | 0.1 | 粒子大小 |
| color | string | '#ffffff' | 粒子颜色 |

## API

### ParticleSystem

#### 构造函数
```javascript
const system = new ParticleSystem(options)
```

#### 方法

- `init(container)`: 初始化粒子系统
  - `container`: DOM元素或选择器字符串

- `setEffect(type)`: 切换粒子效果
  - `type`: 'rain' | 'snow' | 'fireworks'

- `updateOptions(options)`: 更新配置
  - `options`: 部分或全部配置项

- `destroy()`: 销毁粒子系统，释放资源

## 浏览器支持

支持所有现代浏览器（需要 WebGL 支持）：
- Chrome
- Firefox
- Safari
- Edge



雨 (Rain)
雪 (Snow)
烟花 (Fireworks)
极光 (Aurora)
水波纹 (Water Ripple)
魔法粒子 (Magic)
烟雾 (Smoke)
DNA螺旋 (DNA)
太阳系 (Solar System) 

