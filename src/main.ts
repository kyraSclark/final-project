import {vec2, vec3, vec4} from 'gl-matrix';
import * as DAT from 'dat.gui';
import Square from './geometry/Square';
import {ParticlesGroup} from './Particle';
import ScreenBuffer from './geometry/ScreenBuffer';

import OpenGLRenderer from './rendering/gl/OpenGLRenderer';
import Camera from './Camera';
import {setGL, FBO} from './globals';
import ShaderProgram, {Shader} from './rendering/gl/ShaderProgram';


const controls = {
  Particle_Color: [ 0, 0, 255 ],
  Gravity: 30.0,
  'Obstacle Size': 30.0,
  'Lock Camera': true,
};

let time: number = 0.0;
let camera_locked = true;

let particles: ParticlesGroup;
let square: Square; // for each particle
let screenBuf: ScreenBuffer;  // for obstacles color
let screenBufP: ScreenBuffer; // for obstacles area

let obstacle_positions: Array<vec2>;
obstacle_positions = new Array<vec2>();
obstacle_positions.push(vec2.fromValues(0.5, 0.5)); // Default starting obstacle


function loadScene() {
  square = new Square();
  square.create();

  screenBuf = new ScreenBuffer(0, 0, 1, 1);
  screenBuf.create();
  screenBufP = new ScreenBuffer(-0.5, -0.5, 0.5, 0.5);
  screenBufP.create();

  particles = new ParticlesGroup(1000);
  particles.create();
  particles.setVBOs();

  square.setNumInstances(1); // Grid of Particles
}

function main() {
  const gui = new DAT.GUI();
  gui.addColor(controls, 'Particle_Color').name("Particle Color").onChange(setParticleColor);
  gui.add(controls, 'Gravity', 1.0, 100.0).step(1.0).onChange(setParticleAcceleration);
  gui.add(controls, 'Obstacle Size', 5.0, 200.0).step(1.0).onChange(setObstacleSize);
  gui.add(controls, 'Lock Camera').onChange(lockCamera);

  const canvas = <HTMLCanvasElement> document.getElementById('canvas');
  const gl = <WebGL2RenderingContext> canvas.getContext('webgl2');
  if (!gl) {
    alert('WebGL 2 not supported!');
  }
  setGL(gl);

  loadScene();

  // Create Camera
  const camera = new Camera(vec3.fromValues(0, 0, -100.0), vec3.fromValues(0, -10, 0));

  // Create Renderer
  const renderer = new OpenGLRenderer(canvas);
  renderer.setClearColor(0.1, 0.1, 0.1, 1);
  
  // GL Settings
  gl.disable(gl.CULL_FACE);
  gl.enable(gl.DEPTH_TEST);
  gl.disable(gl.BLEND);
  gl.clearColor(0.1, 0.1, 0.1, 1);
  gl.blendFunc(gl.ONE, gl.ONE); // Additive blending

  // Create Particle Shader
  const particleShader = new ShaderProgram([
    new Shader(gl.VERTEX_SHADER, require('./shaders/particle-vert.glsl')),
    new Shader(gl.FRAGMENT_SHADER, require('./shaders/particle-frag.glsl')),
  ]);

  const obstacleBufferShader = new ShaderProgram([
    new Shader(gl.VERTEX_SHADER, require('./shaders/obstacle-buf-vert.glsl')),
    new Shader(gl.FRAGMENT_SHADER, require('./shaders/obstacle-buf-frag.glsl')),
  ], false, ["sampleCoords"]);

  const addObstacleShader = new ShaderProgram([
    new Shader(gl.VERTEX_SHADER, require('./shaders/obstacle-add-vert.glsl')),
    new Shader(gl.FRAGMENT_SHADER, require('./shaders/obstacle-add-frag.glsl')),
  ], false, ["from Center"]);
  
  const obstacleAddToBufferShader = new ShaderProgram([
    new Shader(gl.VERTEX_SHADER, require('./shaders/obstacle-add-to-buf-vert.glsl')),
    new Shader(gl.FRAGMENT_SHADER, require('./shaders/obstacle-add-to-buf-frag.glsl')),
  ], false, ["sampleCoords"]);


  // Transform Feedback for Particles
  // Transform Feedback is the process for capturing Primitives from the Vertex
  // Processing steps, recording that data in Buffer Objects, which allows one to
  // resubmit data multiple times. Transform Feedback allows shaders to write vertices
  // back to VBOs. We are using them to update the changing variables like position, 
  // velocity, acceleration, and color back to the buffer as they change.  
  let variable_buffer_data = ["v_pos", "v_vel", "v_col", "v_time"];
  const transformFeedbackShader = new ShaderProgram([
    new Shader(gl.VERTEX_SHADER, require('./shaders/particle-transfeed-vert.glsl')),
    new Shader(gl.FRAGMENT_SHADER, require('./shaders/particle-transfeed-frag.glsl')),
    ], true, variable_buffer_data
  );

  // SETTER FUNCTIONS
  function setParticleColor() {
    transformFeedbackShader.setParticleColor(vec3.fromValues(
      controls.Particle_Color[0]/255.0,
      controls.Particle_Color[1]/255.0,
      controls.Particle_Color[2]/255.0
    ));
  }

  function setParticleAcceleration() {
    transformFeedbackShader.setParticleAcceleration(vec3.fromValues(0.0, controls.Gravity, 0.0));
  }

  function lockCamera()
  {
    camera_locked = controls["Lock Camera"];
  }

  function setObstacleSize()
  {
    addObstacleShader.setObstacleSize(controls["Obstacle Size"]);
    obstacleAddToBufferShader.setObstacleSize(controls["Obstacle Size"]);
  }

  function setupTexture(width: number, height: number)
  {
    let texelData: any = [];
    let obstacleColor = [127, 127, 0, 0];
    // Add color to every texture cell
    for (let i = 0; i < width * height; ++i)
    {
      texelData.push.apply(texelData, obstacleColor);
    }

    // GL work to set up a texture
    let texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture); // bind texture to this texture slot
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array(texelData));
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    return texture;
  }

  // SET SHADER VALUES
  transformFeedbackShader.setColor(vec4.fromValues(0.0, 1.0, 1.0, 1.0));
  setParticleColor();
  setParticleAcceleration();
  setObstacleSize();
  lockCamera();

  // This function will be called every frame
  function tick() {
    // Update Camera
    if (camera_locked)
    {
      camera.reset(vec3.fromValues(0, 0, -100.0), vec3.fromValues(0.0, -10, 0));
    }
    camera.update();

    // Update time
    time = time + 1.0;
    transformFeedbackShader.setTime(time);

    // Render objects using Renderers
    gl.viewport(0, 0, window.innerWidth, window.innerHeight);

    // clear current frame buffer (old obstacle data)
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    // activate texture slot with obstacle texture
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, texture);

    renderer.clear();

    gl.disable(gl.BLEND); // We do not want the obstacles to blend in 
    renderer.renderObs(camera, obstacleBufferShader, [screenBuf]);
    // Blend the uncolored part of the square with the background of the image, making a circle
    gl.enable(gl.BLEND); 

    renderer.transformParticles(camera, transformFeedbackShader, [particles]);

    renderer.renderParticles(camera, particleShader, square, [particles]);

    // Tell the browser to call `tick` again whenever it renders a new frame
    requestAnimationFrame(tick);
  }

  window.addEventListener('resize', function() {
    renderer.setSize(window.innerWidth, window.innerHeight);
    camera.setAspectRatio(window.innerWidth / window.innerHeight);
    camera.updateProjectionMatrix();

    addObstacleShader.setDimensions(window.innerWidth, window.innerHeight);
    obstacleAddToBufferShader.setDimensions(window.innerWidth, window.innerHeight);
    
  }, false);

  renderer.setSize(window.innerWidth, window.innerHeight);
  camera.setAspectRatio(window.innerWidth / window.innerHeight);
  camera.updateProjectionMatrix();


  // INITIALIZE TEXTURE AND FRAME BUFFER FOR OBSTACLES
  gl.viewport(0, 0, window.innerWidth, window.innerHeight);
  gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  var width = gl.drawingBufferWidth;
  var height = gl.drawingBufferHeight;

  var texture = setupTexture(width, height);
  let _FBO = FBO.create(gl, width, height);

  addObstacleShader.setDimensions(width, height);
  obstacleAddToBufferShader.setDimensions(width, height);

  gl.enable(gl.BLEND); // Blends away the null parts of the obstacle textures

  // OBSTACLE-USER INTERACTION CODE 
  function addObstacle(x: number, y: number)
  {
    addObstacleShader.setObstaclePos(vec2.fromValues(x, 1.0 - y), camera);
    gl.useProgram(addObstacleShader.prog);
    _FBO.bind(gl, texture, null);

    renderer.renderObs(camera, addObstacleShader, [screenBufP]);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.bindTexture(gl.TEXTURE_2D, null);


    obstacleAddToBufferShader.setObstaclePos(vec2.fromValues(x, 1.0 - y), camera);
    gl.useProgram(obstacleAddToBufferShader.prog);
    _FBO.bind(gl, texture, null);

    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, texture);

    renderer.renderObs(camera, obstacleAddToBufferShader, [screenBuf]);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.bindTexture(gl.TEXTURE_2D, null);
  }

  var rightClick = 2;
  var isMouseDragging = false;

  canvas.onmousedown = function(event) // ADD OBSTACLE
  {
    if(event.button === rightClick && camera_locked)
    {
      if(isMouseDragging)
      {
        addObstacle((event.clientX / window.innerWidth), (event.clientY / window.innerHeight));
      }
    }
    transformFeedbackShader.setObstaclePos(vec2.fromValues(
      (2.0 * event.clientX / window.innerWidth) - 1.0,
      1.0 - (2.0 * event.clientY / window.innerHeight)
      ), camera);

    isMouseDragging = true;
  }

  for (let i = 0; i < obstacle_positions.length; i++)
  {
    addObstacle(obstacle_positions[i][0], obstacle_positions[i][0]);
  }

  canvas.onmouseup = function(event)
  {
    if(event.button === rightClick && camera_locked)
    {
      obstacle_positions.push(vec2.fromValues(
        (event.clientX / window.innerWidth),
        (event.clientY / window.innerHeight)
      ));
    }
    isMouseDragging = false;
  }

  canvas.onmousemove = function(event)
  {
    if(isMouseDragging && camera_locked)
    {
      addObstacle((event.clientX / window.innerWidth), (event.clientY / window.innerHeight));
    }
  }

  // Start the render loop
  tick();
}

main();
