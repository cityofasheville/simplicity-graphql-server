function convertOnePolygon(p0) {
  const plist = p0.substring(1, p0.length - 1).split('),')
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
  return final;
}

module.exports = {
  convertToPolgyons(p0) {
    if (!p0) return [];
    if (p0.startsWith('POLYGON')) {
      return [convertOnePolygon(p0.substring(7))];
    } else if (p0.startsWith('MULTIP')) {
      // Strip off the outer parentheses
      let pp = p0.substring(13, p0.length - 1);
      let done = false;
      let counter = 0;
      const polygons = [];
      while (!done) {
        ++ counter;
        if (counter > 100) done = true;
        const end = pp.indexOf('))', 0); // End of current polygon
        if (end >= 0) {
          const poly = pp.substring(0, end + 2);
          polygons.push(convertOnePolygon(poly));
          pp = pp.substring(end + 2);
          if (pp[0] === ',') pp = pp.substring(1);
        } else {
          done = true;
        }
      }
      return polygons;
    }
    throw new Error(`Unknown Property polygon type: ${p0}`);
  },
};
