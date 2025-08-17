// modified version of random-normal
interface NormalOptions {
	mean?: number;
	dev?: number;
	pool?: number[];
  }
  
  function normalPool(o: { mean: number; dev: number; pool: number[] }): number {
	let r = 0;
	do {
	  const a = Math.round(normal({ mean: o.mean, dev: o.dev }));
	  if (a < o.pool.length && a >= 0) return o.pool[a];
	  r++;
	} while (r < 100);
	// Fallback if no valid index is found in 100 iterations
	return o.pool[Math.floor(Math.random() * o.pool.length)];
  }
  
  function randomNormal(o?: NormalOptions): number {
	const options = {
	  mean: 0,
	  dev: 1,
	  pool: [],
	  ...o,
	};
  
	if (Array.isArray(options.pool) && options.pool.length > 0) {
	  return normalPool({ mean: options.mean, dev: options.dev, pool: options.pool });
	}
  
	let r, a, n, e, l = options.mean, t = options.dev;
	do {
	  a = 2 * Math.random() - 1;
	  n = 2 * Math.random() - 1;
	  r = a * a + n * n;
	} while (r >= 1);
  
	e = a * Math.sqrt(-2 * Math.log(r) / r);
	return t * e + l;
  }
  
  
  // A simple normal distribution function (required by the above)
  function normal(o?: { mean: number, dev: number }): number {
	const { mean = 0, dev = 1 } = o || {};
	let r, a, n, e;
	do {
	  a = 2 * Math.random() - 1;
	  n = 2 * Math.random() - 1;
	  r = a * a + n * n;
	} while (r >= 1);
	e = a * Math.sqrt(-2 * Math.log(r) / r);
	return dev * e + mean;
  }
  
  const NUM_PARTICLES = 600;
  const PARTICLE_SIZE = 0.5; // View heights
  const SPEED = 20000; // Milliseconds
  
  interface Particle {
	x: number;
	y: number;
	diameter: number;
	duration: number;
	amplitude: number;
	offsetY: number;
	arc: number;
	startTime: number;
	colour: string;
  }
  
  let particles: Particle[];
  
  function rand(low: number, high: number): number {
	return Math.random() * (high - low) + low;
  }
  
  function createParticle(): Particle {
	const colour = {
	  r: 255,
	  g: randomNormal({ mean: 125, dev: 20 }),
	  b: 50,
	  a: rand(0, 1),
	};
	return {
	  x: -2,
	  y: -2,
	  diameter: Math.max(0, randomNormal({ mean: PARTICLE_SIZE, dev: PARTICLE_SIZE / 2 })),
	  duration: randomNormal({ mean: SPEED, dev: SPEED * 0.1 }),
	  amplitude: randomNormal({ mean: 16, dev: 2 }),
	  offsetY: randomNormal({ mean: 0, dev: 10 }),
	  arc: Math.PI * 2,
	  startTime: performance.now() - rand(0, SPEED),
	  colour: `rgba(${colour.r}, ${colour.g}, ${colour.b}, ${colour.a})`,
	};
  }
  
  function moveParticle(particle: Particle, time: number): Particle {
	const progress = ((time - particle.startTime) % particle.duration) / particle.duration;
	return {
	  ...particle,
	  x: progress,
	  y: Math.sin(progress * particle.arc) * particle.amplitude + particle.offsetY,
	};
  }
  
  function drawParticle(particle: Particle, canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D): void {
	const vh = canvas.height / 100;
  
	ctx.fillStyle = particle.colour;
	ctx.beginPath();
	ctx.ellipse(
	  particle.x * canvas.width,
	  particle.y * vh + canvas.height / 2,
	  particle.diameter * vh,
	  particle.diameter * vh,
	  0,
	  0,
	  2 * Math.PI
	);
	ctx.fill();
  }
  
  function draw(time: number, canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D): void {
	// Move particles
	particles = particles.map((particle) => moveParticle(particle, time));
  
	// Clear the canvas
	ctx.clearRect(0, 0, canvas.width, canvas.height);
  
	// Draw the particles
	particles.forEach((particle) => {
	  drawParticle(particle, canvas, ctx);
	});
  
	// Schedule next frame
	requestAnimationFrame((time) => draw(time, canvas, ctx));
  }
  
  function initializeCanvas(): [HTMLCanvasElement, CanvasRenderingContext2D] {
	const canvas = document.getElementById('particle-canvas') as HTMLCanvasElement;
	canvas.width = canvas.offsetWidth * window.devicePixelRatio;
	canvas.height = canvas.offsetHeight * window.devicePixelRatio;
	let ctx = canvas.getContext('2d') as CanvasRenderingContext2D;
  
	window.addEventListener('resize', () => {
	  canvas.width = canvas.offsetWidth * window.devicePixelRatio;
	  canvas.height = canvas.offsetHeight * window.devicePixelRatio;
	  ctx = canvas.getContext('2d') as CanvasRenderingContext2D;
	});
  
	return [canvas, ctx];
  }
  
  export function startAnimation(): void {
	const [canvas, ctx] = initializeCanvas();
	particles = [];
  
	// Create a bunch of particles
	for (let i = 0; i < NUM_PARTICLES; i++) {
	  particles.push(createParticle());
	}
  
	requestAnimationFrame((time) => draw(time, canvas, ctx));
  }