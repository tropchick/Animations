// winter amount 0..1 from the size of the snowman (shared by the picture and the soundtrack)
const clamp = (x: number) => Math.max(0, Math.min(1, x));
export const winterAt = (Sd: number) => clamp((Math.log(Sd) - 0.6) / (Math.log(3e4) - 0.6));
