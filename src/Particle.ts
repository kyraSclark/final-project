import {gl} from './globals';

const POSITION_LOCATION = 2;
const VELOCITY_LOCATION = 3;
const COLOR_LOCATION = 4;
const TIME_LOCATION = 5;
const ID_LOCATION = 6;

const NUM_LOCATIONS = 7;

class ParticlesGroup
{
    numParticles: number;
    positions: Float32Array;
    velocities: Float32Array;
    colors: Float32Array;

    timeArray: Float32Array;

    particleIDs: Float32Array;

    particleVBOs: WebGLBuffer[][];
    particleTransformFeedbacks: WebGLTransformFeedback[];
    particleVAOs: WebGLVertexArrayObject[]; // Store attributes about each particle, in association with the particle's buffer

    constructor(numParticles: number)
    {
        this.numParticles = numParticles;
        this.positions = new Float32Array(this.numParticles * 3);
        this.velocities = new Float32Array(this.numParticles * 3);
        this.colors = new Float32Array(this.numParticles * 3);

        this.timeArray = new Float32Array(this.numParticles * 2);

        this.particleIDs  = new Float32Array(this.numParticles);

        // The VAO gives us room to bind these attributes to the VBO
        // [particle, attribute]
        this.particleVAOs = [gl.createVertexArray(), gl.createVertexArray()];
        this.particleTransformFeedbacks = [gl.createTransformFeedback(), gl.createTransformFeedback()];
    }

    create() 
    {
        // set defaults for all particles in ParticlesGroup
        for (let i = 0; i < this.numParticles; i++)
        {
            this.particleIDs[i] = i;

            this.positions[i*3] = 0.0;
            this.positions[i*3 + 1] = 0.0;
            this.positions[i*3 + 2] = 0.0;

            this.velocities[i*3] = 0.0;
            this.velocities[i*3 + 1] = 0.0;
            this.velocities[i*3 + 2] = 0.0;

            this.colors[i*3] = 0.0;
            this.colors[i*3 + 1] = 0.0;
            this.colors[i*3 + 2] = 0.0;

            this.timeArray[i * 2] = 0.0;
            this.timeArray[i * 2 + 1] = 0.0;
        }
    }

    setVBOs() {
        this.particleVBOs = new Array(this.particleVAOs.length);

        for (let i = 0; i < this.particleVAOs.length; ++i) {
            this.particleVBOs[i] = new Array(NUM_LOCATIONS);

            gl.bindVertexArray(this.particleVAOs[i]);

            this.particleVBOs[i][POSITION_LOCATION] = gl.createBuffer();
            gl.bindBuffer(gl.ARRAY_BUFFER, this.particleVBOs[i][POSITION_LOCATION]);
            gl.bufferData(gl.ARRAY_BUFFER, this.positions, gl.STREAM_COPY);
            gl.vertexAttribPointer(POSITION_LOCATION, 3, gl.FLOAT, false, 0, 0);
            gl.enableVertexAttribArray(POSITION_LOCATION);

            this.particleVBOs[i][VELOCITY_LOCATION] = gl.createBuffer();
            gl.bindBuffer(gl.ARRAY_BUFFER, this.particleVBOs[i][VELOCITY_LOCATION]);
            gl.bufferData(gl.ARRAY_BUFFER, this.velocities, gl.STREAM_COPY);
            gl.vertexAttribPointer(VELOCITY_LOCATION, 3, gl.FLOAT, false, 0, 0);
            gl.enableVertexAttribArray(VELOCITY_LOCATION);

            this.particleVBOs[i][COLOR_LOCATION] = gl.createBuffer();
            gl.bindBuffer(gl.ARRAY_BUFFER, this.particleVBOs[i][COLOR_LOCATION]);
            gl.bufferData(gl.ARRAY_BUFFER, this.colors, gl.STREAM_COPY);
            gl.vertexAttribPointer(COLOR_LOCATION, 3, gl.FLOAT, false, 0, 0);
            gl.enableVertexAttribArray(COLOR_LOCATION);

            this.particleVBOs[i][TIME_LOCATION] = gl.createBuffer();
            gl.bindBuffer(gl.ARRAY_BUFFER, this.particleVBOs[i][TIME_LOCATION]);
            gl.bufferData(gl.ARRAY_BUFFER, this.timeArray, gl.STREAM_COPY);
            gl.vertexAttribPointer(TIME_LOCATION, 2, gl.FLOAT, false, 0, 0);
            gl.enableVertexAttribArray(TIME_LOCATION);

            this.particleVBOs[i][ID_LOCATION] = gl.createBuffer();
            gl.bindBuffer(gl.ARRAY_BUFFER, this.particleVBOs[i][ID_LOCATION]);
            gl.bufferData(gl.ARRAY_BUFFER, this.particleIDs, gl.STATIC_READ);
            gl.vertexAttribPointer(ID_LOCATION, 1, gl.FLOAT, false, 0, 0);
            gl.enableVertexAttribArray(ID_LOCATION);

            gl.bindBuffer(gl.ARRAY_BUFFER, null);

            gl.bindTransformFeedback(gl.TRANSFORM_FEEDBACK, this.particleTransformFeedbacks[i]);
            gl.bindBufferBase(gl.TRANSFORM_FEEDBACK_BUFFER, 0, this.particleVBOs[i][POSITION_LOCATION]);
            gl.bindBufferBase(gl.TRANSFORM_FEEDBACK_BUFFER, 1, this.particleVBOs[i][VELOCITY_LOCATION]);
            gl.bindBufferBase(gl.TRANSFORM_FEEDBACK_BUFFER, 2, this.particleVBOs[i][COLOR_LOCATION]);
            gl.bindBufferBase(gl.TRANSFORM_FEEDBACK_BUFFER, 3, this.particleVBOs[i][TIME_LOCATION]);
            gl.bindTransformFeedback(gl.TRANSFORM_FEEDBACK, null);
        }
    }

    getVAO(i: number): WebGLVertexArrayObject
    {
        return this.particleVAOs[i];
    }

    getTransformFeedback(i: number): WebGLTransformFeedback
    {
        return this.particleTransformFeedbacks[i];
    }
}
export {ParticlesGroup};
