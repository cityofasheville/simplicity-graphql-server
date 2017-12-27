module.exports = {
  convertToPolgyons(p0) {
    if (!p0) return [];
    if (p0.startsWith('POLYGON')) {
      const plist = p0.substring(8, p0.length - 1).split('),')
      .map(pp => pp.replace(/\(/g, '').replace(/\)/g, ''));
      const final = { outer: null, holes: [] };
      plist.forEach((pstring, index) => {
        const p1 = pstring.split(',');
        if (index === 0) { // outer boundary
          final.outer = { points: p1.map((pair) => {
            const xy = pair.split(' ');
            return { x: xy[0], y: xy[1] };
          }) };
        } else {
          final.holes.push({ points: p1.map((pair) => {
            const xy = pair.split(' ');
            return { x: xy[0], y: xy[1] };
          }) });
        }
      });
      return [final];
    } else if (p0.startsWith('MULTIP')) {
      const p1 = p0.substring(13, p0.length - 1).split(')),');
      const pg = p1.map((input) => {
        const cp = input.replace(/\(/g, '').split(',');
        const p = cp.map((pair) => {
          const xy = pair.split(' ');
          return { x: xy[0], y: xy[1] };
        });
        return { outer: { points: p }, holes: [] };
      });
      return pg;
    }
    throw new Error(`Unknown Property polygon type: ${obj.polygon}`);
  },
};
