/* Educator Space · soft look shared by the games in /games. Rounds line joints and corners in every drawing, and gives
   the main pieces of art a soft drop shadow with a gentle highlight along top edges and shade along bottom edges, so
   they read as rounded objects instead of flat paper. The same filter (esSoft) is used by the labs on the main site. */
(function () {
  document.body.insertAdjacentHTML('afterbegin', `<svg width="0" height="0" style="position:absolute" aria-hidden="true" focusable="false"><defs>
    <filter id="esSoft" x="-25%" y="-25%" width="150%" height="160%" color-interpolation-filters="sRGB">
      <feGaussianBlur in="SourceAlpha" stdDeviation="1.9" result="b"/>
      <feOffset in="b" dy="1.9" result="bd"/><feComposite in="SourceAlpha" in2="bd" operator="out" result="topEdge"/>
      <feFlood flood-color="#ffffff" flood-opacity=".3"/><feComposite in2="topEdge" operator="in" result="hi"/>
      <feOffset in="b" dy="-1.9" result="bu"/><feComposite in="SourceAlpha" in2="bu" operator="out" result="botEdge"/>
      <feFlood flood-color="#06121c" flood-opacity=".22"/><feComposite in2="botEdge" operator="in" result="lo"/>
      <feGaussianBlur in="SourceAlpha" stdDeviation="5" result="sb"/><feOffset in="sb" dy="5" result="so"/>
      <feFlood flood-color="#06121c" flood-opacity=".26"/><feComposite in2="so" operator="in" result="sh"/>
      <feMerge><feMergeNode in="sh"/><feMergeNode in="SourceGraphic"/><feMergeNode in="hi"/><feMergeNode in="lo"/></feMerge>
    </filter></defs></svg>`);
  const st = document.createElement('style');
  st.textContent = `
    svg :is(path, polygon, polyline, line, rect, circle, ellipse) { stroke-linejoin: round; }
    svg :is(path, polyline, line) { stroke-linecap: round; }
    svg rect:not([rx]):not(pattern rect):not(clipPath rect):not(mask rect) { rx: 2px; }
    .soft, svg .soft { filter: url(#esSoft); }
    /* Signal Cascade: receptors, ligands and pathway proteins */
    svg .rec, svg .lig, svg .node { filter: url(#esSoft); }
    /* Gene Detectives and Chem Detectives: the lab-bench drawings */
    .bench > svg, .wells svg, .gelwrap svg { filter: url(#esSoft); }
    /* Contaminated: the rooms on the lab map */
    .map .room { filter: url(#esSoft); }`;
  document.head.appendChild(st);
})();
