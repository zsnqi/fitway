export const CHECKS = ['rest', 'readings', 'hover', 'gap', 'nohist', 'width', 'quality', 'guard', 'layout'];
export const ECLIPSE = 'design-research/owner-composition-exploration-r04/directions/eclipse';
export const FRAME_MS = 1000 / 60;
export const VIEWS = [[1440, 900], [1280, 800], [1024, 640], [390, 844]];
export const SNAPSHOTS = [883, 930, 960, 1002, 1085];
export const KEYS = [...Array.from({ length: 39 }, (_, i) => `h${i * 30}`), 'gap', 'peak', 'latest'];
export function configurations(views = VIEWS) {
  return views.flatMap(([width, height]) => ['web', 'fallback'].flatMap(fonts =>
    ['ar', 'en'].flatMap(lang => ['live', 'delayed', 'nohistory'].map(state =>
      ({ width, height, fonts, lang, state })))));
}
export const configName = c => `${c.lang}-${c.state}-${c.fonts}-${c.width}x${c.height}`;
