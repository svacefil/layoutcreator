import { UUIDGenerator } from './uuid.js';

export class BaseShape {
    constructor(id, x, y, type = 'active') {
        const uuidGen = new UUIDGenerator();
        this.id = id || uuidGen.generate();
        this.x = Math.max(0, x);
        this.y = Math.max(0, y);
        this.type = type;
        this.isBeingDragged = false;
    }

    toJSON() {
        return {
            id: this.id,
            type: this.type,
        };
    }
}