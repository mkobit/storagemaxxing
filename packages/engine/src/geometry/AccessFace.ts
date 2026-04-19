export type AccessFace =
  | 'top'
  | 'bottom'
  | 'left'
  | 'right'
  | 'front'
  | 'back'
  | 'top+front'
  | 'all-sides';

export type AccessFaces = ReadonlyArray<AccessFace>;

export type SpaceType = 'drawer' | 'shelf' | 'wall';

export const defaultAccessFace = (spaceType: SpaceType): AccessFace => {
  switch (spaceType) {
    case 'drawer':
      return 'top';
    case 'shelf':
      return 'front';
    case 'wall':
      return 'front';
    default:
      return 'front';
  }
};
