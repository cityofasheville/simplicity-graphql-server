module.exports = {
  convertToPolgyons(p0) {
    if (!p0) return [];
    if (p0.startsWith('POLYGON')) {
      const p1 = p0.substring(9, p0.length - 2).split(',');
      const p = p1.map((pair) => {
        const xy = pair.split(' ');
        return { x: xy[0], y: xy[1] };
      });
      return [{ points: p }];
    } else if (p0.startsWith('MULTIP')) {
      const p1 = p0.substring(13, p0.length - 1).split(')),');
      const pg = p1.map((input) => {
        const cp = input.replace(/\(/g, '').split(',');
        const p = cp.map((pair) => {
          const xy = pair.split(' ');
          return { x: xy[0], y: xy[1] };
        });
        return { points: p };
      });
      return pg;
    }
    throw new Error(`Unknown Property polygon type: ${obj.polygon}`);
  },
};
