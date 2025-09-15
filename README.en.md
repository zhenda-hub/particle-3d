# Interactive Particle System (particle-3d)

## Introduction

An interactive 3D particle system based on Three.js that can be easily integrated into any web project. Supports multiple particle effects (rain, snow, fireworks, etc.) and provides rich customization options.

## Features

- 🎨 Multiple built-in particle effects (rain, snow, fireworks, aurora, water ripple, magic particles, solar system)
- 🎮 Mouse/touch interaction support
- 📱 Responsive design, adapts to container size
- 🔧 Rich configuration options
- 🎯 Easy to integrate into any web project
- ⚡ Optimized performance (using Three.js InstancedMesh)

## Examples

### Basic Usage Example

```html
<!-- 1. Create container -->
<div id="particle-container" style="width: 100%; height: 100vh;"></div>

<!-- 2. Initialize particle system -->
<script>
    const particleSystem = new ParticleSystem({
        type: 'rain',    // Particle type: rain, snow, fireworks
        count: 1000,     // Particle count
        speed: 1,        // Speed
        size: 0.1,       // Size
        color: '#ffffff' // Color
    });
    particleSystem.init('#particle-container');

    // Switch effect
    particleSystem.setEffect('snow');

    // Update configuration
    particleSystem.updateOptions({
        speed: 2.0,
        count: 2000
    });
</script>
```

### Vue Project Usage Example

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

## Quick Start

### Installation

#### Using npm

```bash
npm install interactive-particle-system
```

#### Using CDN

```html
<!-- First include Three.js -->
<script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>
<!-- Then include particle system -->
<script src="https://unpkg.com/interactive-particle-system@latest/dist/particle-system.min.js"></script>
```

### Basic Usage

1. Create a container element
2. Initialize the particle system
3. Configure particle effects

```javascript
const particleSystem = new ParticleSystem({
    type: 'snow',
    count: 2000,
    speed: 1.5,
    size: 0.08,
    color: '#ffffff'
});
particleSystem.init('#container');
```

## Contributing

Welcome to contribute code! Please follow these steps:

1. Fork the project
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## Issue Reporting

If you encounter any problems or have suggestions, please report them through:

1. Create a new issue in GitHub Issues
2. Describe the detailed problem phenomenon and reproduction steps
3. Provide browser version and operating system information

## License

This project is open source under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- Thanks to [Three.js](https://threejs.org/) for the powerful 3D rendering engine
- Thanks to all contributors and users for their support
- Inspiration from various excellent particle effect implementations

## Supported Particle Effects

- 🌧️ Rain
- ❄️ Snow
- 🎆 Fireworks
- 🌌 Aurora
- 💧 Water Ripple
- ✨ Magic Particles
- 🌞 Solar System
