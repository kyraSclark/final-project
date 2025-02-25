import Drawable from '../rendering/gl/Drawable';
import {gl} from '../globals';

class ScreenBuffer extends Drawable 
{
    indices: Uint32Array;
    positions: Float32Array;

    minX: number;
    minY: number;
    maxX: number;
    maxY: number;

    constructor(minX: number, minY: number, maxX: number, maxY: number)
    {
        super();
        this.minX = minX;
        this.minY = minY;
        this.maxX = maxX;
        this.maxY = maxY;
    }

    create()
    {
        this.indices = new Uint32Array([0, 1, 2,
                                        0, 2, 3]);
        this.positions = new Float32Array([
            this.minX, this.minY, 0.0, 1.0,
            this.maxX, this.minY, 0.0, 1.0,
            this.maxX, this.maxY, 0.0, 1.0,
            this.minX, this.maxY, 0.0, 1.0]);

        this.generateIdx();
        this.generatePos();

        this.count = this.indices.length;

        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.bufIdx);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, this.indices, gl.STATIC_DRAW);

        gl.bindBuffer(gl.ARRAY_BUFFER, this.bufPos);
        gl.bufferData(gl.ARRAY_BUFFER, this.positions, gl.STATIC_DRAW);

        this.numInstances = 1;

        console.log(`Created ScreenBuffer`);
    }
};

export default ScreenBuffer;
