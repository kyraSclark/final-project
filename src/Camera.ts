var CameraControls = require('3d-view-controls');
import {vec3, mat4} from 'gl-matrix';

class Camera {
  controls: any;
  projectionMatrix: mat4 = mat4.create();
  viewMatrix: mat4 = mat4.create();
  fovy: number = 45;
  aspectRatio: number = 1;
  near: number = 0.1;
  far: number = 1000;
  position: vec3 = vec3.create();
  direction: vec3 = vec3.create();
  target: vec3 = vec3.create();

  up: vec3 = vec3.create();
  right: vec3 = vec3.create();
  forward: vec3 = vec3.create();

  lockedPos: vec3;
  lockedTarget: vec3;

  updateCameraAxes()
  {
    this.position = this.controls.eye;
    this.up = this.controls.up;
    vec3.subtract(this.forward, this.target, this.position);
    vec3.normalize(this.forward, this.forward);
    vec3.cross(this.right, this.forward, this.up);
    vec3.normalize(this.right, this.right);
  }

  constructor(position: vec3, target: vec3) {
    this.lockedPos = position;
    this.lockedTarget = target;
    
    this.controls = CameraControls(document.getElementById('canvas'), {
      eye: position,
      center: target,
    });
    vec3.add(this.target, this.position, this.direction);
    mat4.lookAt(this.viewMatrix, this.controls.eye, this.controls.center, this.controls.up);
  
    this.updateCameraAxes();
  }

  setAspectRatio(aspectRatio: number) {
    this.aspectRatio = aspectRatio;
  }

  updateProjectionMatrix() {
    mat4.perspective(this.projectionMatrix, this.fovy, this.aspectRatio, this.near, this.far);
  }

  update() {
    this.controls.tick();
    vec3.add(this.target, this.position, this.direction);
    mat4.lookAt(this.viewMatrix, this.controls.eye, this.controls.center, this.controls.up);
  
    this.updateCameraAxes();
  }

  reset(position: vec3, target: vec3)
  {
    this.lockedPos = position;
    this.lockedTarget = target;
    this.controls = CameraControls(document.getElementById('canvas'), {
      eye: position, 
      center: target,
    });

    vec3.add(this.target, this.position, this.direction);
    mat4.lookAt(this.viewMatrix, this.controls.eye, this.controls.center, this.controls.up);
    this.updateCameraAxes();
  }
};

export default Camera;
