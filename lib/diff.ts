export interface DiffOp {
  type: 'equal' | 'insert' | 'delete';
  text: string;
}

export function diffWords(a: string, b: string): DiffOp[] {
  const aw = a.split(/(\s+)/);
  const bw = b.split(/(\s+)/);
  const matrix: number[][] = [];

  for (let i = 0; i <= aw.length; i++) {
    matrix[i] = [];
    for (let j = 0; j <= bw.length; j++) {
      if (i === 0 || j === 0) matrix[i][j] = 0;
      else if (aw[i - 1] === bw[j - 1]) matrix[i][j] = matrix[i - 1][j - 1] + 1;
      else matrix[i][j] = Math.max(matrix[i - 1][j], matrix[i][j - 1]);
    }
  }
  const ops: DiffOp[] = [];
  let i = aw.length, j = bw.length;
  while (i > 0 && j > 0) {
    if (aw[i-1] === bw[j-1]) {
      ops.unshift({ type: 'equal', text: aw[i-1] });
      i--; j--;
    } else if (matrix[i-1][j] >= matrix[i][j-1]) {
      ops.unshift({ type: 'delete', text: aw[i-1] });
      i--;
    } else {
      ops.unshift({ type: 'insert', text: bw[j-1] });
      j--;
    }
  }
  while (i-- > 0) ops.unshift({ type: 'delete', text: aw[i] });
  while (j-- > 0) ops.unshift({ type: 'insert', text: bw[j] });
  return ops;
}
