import { menuPosition } from '../menuPosition';
const insets = { top: 0, bottom: 0, left: 0, right: 0 };
it.each([[667,375],[844,390],[915,412],[1024,768],[1366,768]])('anchors inside a %i by %i viewport', (width,height) => {
  const anchor={x:width-76,y:28,width:48,height:48};
  const position=menuPosition(anchor,width,height,280,insets);
  expect(position.left+position.width).toBe(anchor.x+anchor.width);
  expect(position.top).toBe(anchor.y+anchor.height+8);
  expect(position.top+Math.min(position.maxHeight,280)).toBeLessThanOrEqual(height-12);
});
it('places the menu above a low trigger and respects safe areas',()=>{
 const p=menuPosition({x:600,y:340,width:48,height:48},667,400,280,{top:20,bottom:20,left:20,right:20});
 expect(p.top).toBeLessThan(340);expect(p.left+p.width).toBeLessThanOrEqual(635);expect(p.top).toBeGreaterThanOrEqual(32);
});
