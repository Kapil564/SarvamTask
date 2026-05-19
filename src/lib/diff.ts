export type DiffOperation = "equal" | "insert" | "delete" | "substitute";

export interface DiffToken {
  type: DiffOperation;
  value: string;
}

/**
 * Greedy Token Matching with Lookahead
 * 
 * Time Complexity: O(N * K) where N is the length of the tokens and K is the lookahead window size.
 * In the worst case (no matches), it's bounded by O(N).
 * 
 * Space Complexity: O(N + M) to store the tokens and the resulting diff array.
 * 
 * Why this over LCS or Myers:
 * - LCS is O(N*M) which is too slow for large text outputs (like LLM responses).
 * - Myers Diff is O(ND) which is efficient but relatively complex to implement from scratch.
 * - For LLM outputs, differences are usually localized (a few substituted words or added adjectives).
 *   A greedy approach with a bounded lookahead correctly identifies these local changes in linear time O(N),
 *   making it incredibly fast and simple to maintain while producing highly readable diffs for natural language.
 */
export function computeTokenDiff(oldText: string, newText: string, lookahead: number = 5): DiffToken[] {
  const tokenize = (text: string) => text.split(/(\s+)/).filter(t => t.length > 0);
  const oldTokens = tokenize(oldText);
  const newTokens = tokenize(newText);
  
  const diff: DiffToken[] = [];
  let i = 0;
  let j = 0;

  while (i < oldTokens.length && j < newTokens.length) {
    if (oldTokens[i] === newTokens[j]) {
      diff.push({ type: "equal", value: oldTokens[i] });
      i++;
      j++;
    } else {
      // Lookahead to find a match
      let matchFound = false;
      
      for (let k = 1; k <= lookahead; k++) {
        // Check if old token matches a future new token (Insertion)
        if (j + k < newTokens.length && oldTokens[i] === newTokens[j + k]) {
          for (let m = 0; m < k; m++) {
            diff.push({ type: "insert", value: newTokens[j + m] });
          }
          j += k;
          matchFound = true;
          break;
        }
        
        // Check if future old token matches current new token (Deletion)
        if (i + k < oldTokens.length && oldTokens[i + k] === newTokens[j]) {
          for (let m = 0; m < k; m++) {
            diff.push({ type: "delete", value: oldTokens[i + m] });
          }
          i += k;
          matchFound = true;
          break;
        }
      }

      if (!matchFound) {
        // If it's whitespace that doesn't match, just treat as equal or distinct to avoid messy UI
        if (oldTokens[i].trim() === "" && newTokens[j].trim() === "") {
          diff.push({ type: "equal", value: newTokens[j] });
          i++;
          j++;
        } else {
          diff.push({ type: "delete", value: oldTokens[i] });
          diff.push({ type: "insert", value: newTokens[j] });
          i++;
          j++;
        }
      }
    }
  }

  // Add remaining deletions
  while (i < oldTokens.length) {
    diff.push({ type: "delete", value: oldTokens[i] });
    i++;
  }

  // Add remaining insertions
  while (j < newTokens.length) {
    diff.push({ type: "insert", value: newTokens[j] });
    j++;
  }

  return diff;
}
