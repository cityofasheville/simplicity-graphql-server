export function convertLines(p0) {
  if (!p0) return [];
  if (p0.startsWith('MULTILINESTRING')) {
    const p1 = p0.substring(17, p0.length - 2).split(',');
    const p = p1.map((pair) => {
      const xy = pair.split(' ');
      return { x: Number(xy[0]), y: Number(xy[1]) };
    });
    return p;
  }
  throw new Error(`Unknown line type: ${p0}`);
}
