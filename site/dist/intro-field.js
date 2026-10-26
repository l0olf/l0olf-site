(() => {
  const canvas = document.querySelector('.intro-field');
  const hero = document.querySelector('.hero-intro');
  if (!canvas || !hero) return;
  const root = document.documentElement;
  const gl = canvas.getContext('webgl', { alpha: false, antialias: false, depth: false, powerPreference: 'low-power' });
  if (!gl) return; // The CSS atmosphere also works without WebGL.

  const vertexSource = `
    attribute vec2 position;
    varying vec2 uv;
    void main() { uv = position * 0.5 + 0.5; gl_Position = vec4(position, 0.0, 1.0); }
  `;
  const fragmentSource = `
    precision mediump float;
    varying vec2 uv;
    uniform float time;
    uniform float aspect;
    uniform vec2 pointer;
    void main() {
      float t = time * 0.19;
      float mobile = 1.0 - smoothstep(0.8, 1.2, aspect);
      vec2 p = (uv - 0.5) * mix(vec2(2.8, 1.8), vec2(2.25, 2.2), mobile);
      p += pointer * 0.045;
      p.x += sin(p.y * 3.1 + t) * 0.13;
      p.y += sin(p.x * 2.7 - t * 0.8) * 0.12;
      float angle = atan(p.y, p.x);
      float radius = length(p * vec2(1.0, 1.65));
      float contour = 0.88 + 0.13 * sin(angle * 3.0 + t) + 0.07 * cos(angle * 5.0 - t * 0.7);
      float d = radius - contour;
      float halo = exp(-d * d * 6.0);
      float ribbon = exp(-d * d * 60.0);
      float edge = exp(-pow(d + 0.045, 2.0) * 230.0);
      float light = 0.55 + 0.45 * sin(angle * 2.0 + t * 1.2 - 0.6);
      vec3 base = vec3(0.082, 0.047, 0.065);
      vec3 glow = mix(vec3(0.38, 0.018, 0.075), vec3(0.95, 0.16, 0.035), light);
      vec3 color = base + glow * halo * 0.46;
      color += glow * ribbon * 0.46;
      color += vec3(0.95, 0.39, 0.15) * edge * pow(light, 3.0) * 0.35;
      float center = exp(-dot(p * vec2(1.0, 1.5), p * vec2(1.0, 1.5)) * 3.8);
      color = mix(color, base, center * 0.58);
      float vignette = 1.0 - smoothstep(0.55, 1.8, length(p));
      color = mix(base, color, vignette);
      float grain = fract(sin(dot(uv, vec2(127.1, 311.7))) * 43758.5453) - 0.5;
      gl_FragColor = vec4(color + grain * 0.012, 1.0);
    }
  `;
  const compile = (type, source) => {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      gl.deleteShader(shader);
      return null;
    }
    return shader;
  };
  const vertex = compile(gl.VERTEX_SHADER, vertexSource);
  const fragment = compile(gl.FRAGMENT_SHADER, fragmentSource);
  if (!vertex || !fragment) return;
  const program = gl.createProgram();
  gl.attachShader(program, vertex);
  gl.attachShader(program, fragment);
  gl.linkProgram(program);
  gl.deleteShader(vertex);
  gl.deleteShader(fragment);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) return;
  gl.useProgram(program);
  const buffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]), gl.STATIC_DRAW);
  const position = gl.getAttribLocation(program, 'position');
  gl.enableVertexAttribArray(position);
  gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);
  const uniforms = Object.fromEntries(['time', 'aspect', 'pointer'].map(name => [name, gl.getUniformLocation(program, name)]));
  const finePointer = matchMedia('(hover: hover) and (pointer: fine)');
  let frame = 0, elapsed = 0, last = 0, visible = true, lost = false;
  let px = 0, py = 0, targetX = 0, targetY = 0;
  const motion = () => root.classList.contains('motion-active');
  const draw = () => {
    if (lost) return;
    gl.uniform1f(uniforms.time, motion() ? elapsed : 0);
    gl.uniform1f(uniforms.aspect, canvas.clientWidth / canvas.clientHeight);
    gl.uniform2f(uniforms.pointer, motion() ? px : 0, motion() ? py : 0);
    gl.drawArrays(gl.TRIANGLES, 0, 6);
    canvas.classList.add('is-ready');
  };
  const stop = () => { cancelAnimationFrame(frame); frame = 0; last = 0; };
  const tick = now => {
    frame = 0;
    if (lost || !visible || document.hidden || !motion()) return;
    if (!last || now - last >= 32) {
      elapsed += last ? Math.min((now - last) / 1000, 0.1) : 0;
      last = now;
      px += (targetX - px) * 0.06;
      py += (targetY - py) * 0.06;
      draw();
    }
    frame = requestAnimationFrame(tick);
  };
  const sync = () => {
    stop();
    if (lost || document.hidden || !visible) return;
    draw();
    if (motion()) frame = requestAnimationFrame(tick);
  };
  const resize = () => {
    // A blurred field needs far fewer pixels than the text above it.
    const scale = Math.min(1, 1300 / canvas.clientWidth, 1000 / canvas.clientHeight);
    canvas.width = Math.round(canvas.clientWidth * scale);
    canvas.height = Math.round(canvas.clientHeight * scale);
    gl.viewport(0, 0, canvas.width, canvas.height);
    sync();
  };
  hero.addEventListener('pointermove', event => {
    if (!finePointer.matches || !motion()) return;
    const rect = hero.getBoundingClientRect();
    targetX = (event.clientX - rect.left) / rect.width - 0.5;
    targetY = (event.clientY - rect.top) / rect.height - 0.5;
  }, { passive: true });
  hero.addEventListener('pointerleave', () => { targetX = 0; targetY = 0; });
  new IntersectionObserver(entries => {
    visible = entries[0].isIntersecting;
    sync();
  }, { threshold: 0 }).observe(hero);
  let previousMotion = motion();
  new MutationObserver(() => {
    if (previousMotion === motion()) return;
    previousMotion = motion();
    sync();
  }).observe(root, { attributes: true, attributeFilter: ['class'] });
  new ResizeObserver(resize).observe(canvas);
  document.addEventListener('visibilitychange', sync);
  canvas.addEventListener('webglcontextlost', () => {
    lost = true;
    stop();
    canvas.classList.remove('is-ready');
  });
  resize();
})();
