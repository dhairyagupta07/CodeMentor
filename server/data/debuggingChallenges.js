export const debuggingChallenges = [
  {
    slug: 'binary-search-boundary',
    title: 'The Missing Last Element',
    difficulty: 'Easy',
    category: 'Off-by-one error',
    description: 'This binary search finds most values, but sometimes misses a target at the end of the array. Fix the smallest bug you can find.',
    buggyCode: 'n, target = map(int, input().split())\nnums = list(map(int, input().split()))\n\nleft, right = 0, n - 1\nwhile left < right:\n    middle = (left + right) // 2\n    if nums[middle] == target:\n        print(middle)\n        break\n    if nums[middle] < target:\n        left = middle + 1\n    else:\n        right = middle - 1\nelse:\n    print(-1)\n',
    examples: [
      { input: '5 9\n1 3 5 7 9', output: '4' },
      { input: '4 2\n1 3 5 7', output: '-1' },
    ],
    testCases: [
      { input: '5 9\n1 3 5 7 9', output: '4' },
      { input: '4 2\n1 3 5 7', output: '-1' },
      { input: '1 8\n8', output: '0' },
      { input: '6 -4\n-10 -7 -4 0 3 8', output: '2', isHidden: true },
    ],
    solutionNote: 'The loop stopped when left equaled right, before checking the final candidate. Use a loop condition that includes that last position.',
  },
  {
    slug: 'case-sensitive-vowels',
    title: 'The Quiet Uppercase Vowels',
    difficulty: 'Easy',
    category: 'Input normalization',
    description: 'Count the vowels in a word. This solution works for lowercase input but quietly skips uppercase vowels. Make the counting case-insensitive.',
    buggyCode: 'word = input().strip()\nvowels = "aeiou"\ncount = 0\n\nfor character in word:\n    if character in vowels:\n        count += 1\n\nprint(count)\n',
    examples: [
      { input: 'education', output: '5' },
      { input: 'CODE', output: '2' },
    ],
    testCases: [
      { input: 'education', output: '5' },
      { input: 'CODE', output: '2' },
      { input: 'Rhythm', output: '0' },
      { input: 'A quick BROWN fox', output: '5', isHidden: true },
    ],
    solutionNote: 'The vowel lookup contains only lowercase characters, but the input may use mixed case. Normalize each character or the word before checking membership.',
  },
  {
    slug: 'maximum-value',
    title: 'The First Number Wins',
    difficulty: 'Easy',
    category: 'Incorrect initialization',
    description: 'Print the largest number in the input array. The implementation returns a plausible result for positive values but fails when all values are negative.',
    buggyCode: 'n = int(input())\nnums = list(map(int, input().split()))\n\nlargest = 0\nfor value in nums:\n    if value > largest:\n        largest = value\n\nprint(largest)\n',
    examples: [
      { input: '4\n3 9 2 7', output: '9' },
      { input: '3\n-8 -3 -12', output: '-3' },
    ],
    testCases: [
      { input: '4\n3 9 2 7', output: '9' },
      { input: '3\n-8 -3 -12', output: '-3' },
      { input: '1\n-5', output: '-5' },
      { input: '5\n-20 -1 -9 -3 -12', output: '-1', isHidden: true },
    ],
    solutionNote: 'Initializing largest to zero incorrectly assumes the input contains a non-negative number. Initialize it from the first array value instead.',
  },
]
