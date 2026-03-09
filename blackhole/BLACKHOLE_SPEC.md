# Gargantua Black Hole Recreation - Technical Specification

## Overview
Recreate the realistic black hole "Gargantua" from Interstellar using Three.js and Ray Marching techniques.

## Physics Background

### Key Visual Components
1. **Event Horizon** - The black sphere where light cannot escape
2. **Accretion Disk** - Superheated matter orbiting the black hole
3. **Gravitational Lensing** - Light bending around the black hole
4. **Doppler Beaming** - One side brighter (approaching), other dimmer (receding)
5. **Photon Sphere** - Light orbiting at 1.5 Schwarzschild radius

### Ray Marching Algorithm
```
For each pixel:
  1. Cast ray from camera
  2. March ray through curved spacetime (simplified geodesic)
  3. Check if ray:
     - Hits event horizon (black)
     - Crosses accretion disk (sample color/temperature)
     - Escapes to infinity (background stars)
  4. Accumulate color with proper blending
```

## Shader Implementation Details

### Vertex Shader (Simple pass-through)
```glsl
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = vec4(position, 1.0);
}
```

### Fragment Shader Key Components

#### 1. Schwarzschild Metric Approximation
```glsl
// Simplified light bending
vec3 bendRay(vec3 pos, vec3 dir, float blackHoleMass) {
  float r = length(pos);
  float rs = 2.0 * blackHoleMass; // Schwarzschild radius
  
  // Newtonian approximation for light bending
  vec3 acceleration = -blackHoleMass * pos / (r * r * r);
  return normalize(dir + acceleration * stepSize);
}
```

#### 2. Accretion Disk
- Inner radius: 3 * Schwarzschild radius (ISCO - Innermost Stable Circular Orbit)
- Outer radius: 8 * Schwarzschild radius
- Temperature gradient: Hotter near center (white/blue), cooler outside (orange/red)
- Rotation: Prograde with disk (causes Doppler shift)

#### 3. Doppler Beaming Formula
```glsl
// Relative velocity component toward viewer
float v_dot_n = dot(diskVelocity, viewDirection);
float doppler = 1.0 / (1.0 - v_dot_n / c);
// Apply beaming (brightness ∝ doppler^4 for relativistic beaming)
float beaming = pow(doppler, 4.0);
```

#### 4. Gravitational Redshift
```glsl
// Redshift near black hole
float redshift = sqrt(1.0 - rs / r);
color *= redshift; // Dimming effect
```

#### 5. Color Temperature to RGB
```glsl
vec3 temperatureToRGB(float temp) {
  // Blackbody approximation
  // temp in Kelvin: 1000K = red, 6000K = white, 10000K+ = blue
  vec3 color;
  temp = clamp(temp, 1000.0, 40000.0) / 100.0;
  // ... (full implementation needed)
  return color;
}
```

## File Structure
```
blackhole/
├── index.html      # Main page with Three.js setup
├── js/
│   └── main.js     # Three.js scene, camera, renderer
├── shaders/
│   ├── vertex.glsl # Simple pass-through
│   └── fragment.glsl # Ray marching with all physics
```

## Performance Considerations
- Use adaptive step sizes (smaller near black hole, larger far away)
- Limit max iterations (128-256 steps)
- Consider lower resolution for ray marching buffer

## Visual Reference
- Event horizon: Perfectly black sphere
- Photon ring: Thin bright ring at ~1.5 rs
- Accretion disk: Wide, flat disk with temperature gradient
- Lensing: Background stars appear distorted/ringed around black hole
- Doppler: One side of disk significantly brighter

## Additional Effects (Optional but Impressive)
1. Volumetric glow around accretion disk
2. Animated accretion disk (turbulence/rotation)
3. Background starfield with lensing
4. Camera orbit controls
5. Time dilation visualization

## Success Criteria
- Clear event horizon (black center)
- Visible accretion disk with temperature colors
- Asymmetry from Doppler beaming
- Some gravitational lensing of background
- Smooth animation (30+ FPS)
