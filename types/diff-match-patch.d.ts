declare module 'diff-match-patch' {
  export class diff_match_patch {
    diff_main(a: string, b: string): [number, string][];
    diff_cleanupSemantic(diffs: [number, string][]): void;
  }
}
