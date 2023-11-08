import { observable } from "mobx";
export const DOOR = 'Door';

const wallItems = {
    door: {
        type: DOOR,
        width: .91,
        height: 2.05,
        depth: .15
    }
}



const walls = [];



for (let i = 0; i < 6; i++) {
    const wall = { pos: { x: 0, y: 0, z: 0, w: 0 }, items: [] }
    if (i === 0) {
        wall.items.push({ ...Object.assign({}, wallItems.door), id: 0, position: { x: 0, y: 0, z: 0, w: 0 } });

    }
    walls.push(wall);
}


const store = observable({
    width: 5000,
    length: 5000,
    cwidth: 2000,
    clength: 2000,
    height: 2400,
    thickness: .09,
    type: 1,
    Walls: [],
    view: 0,


    get CutOutLength() {
        return this.clength * .001;
    },

    get CutOutWidth() {
        return this.cwidth * .001;
    },

    get Width() {
        return this.width * .001;
    },

    get Height() {
        return this.height * .001;
    },

    get Length() {
        return this.length * .001;
    },
    get Walls() {
        const walls2 = [];

       

        return walls2;
    }



});



const materials = [
    {
        name: 'tile1',
        diffuse: 'tiled1.jpg',
        specular: 'tiles1.png',
        normal: 'tilen1.png'
    }
]



export { store, materials, wallItems }