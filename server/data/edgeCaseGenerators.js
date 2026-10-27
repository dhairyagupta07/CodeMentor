const generators = {
  'two-sum': () => [
    { input: '2 6\n3 3', focus: 'The matching values are equal, so make sure the same index is not reused.' },
    { input: '5 14\n1 5 8 2 9', focus: 'The matching pair is near the end of the array.' },
    { input: '4 0\n-5 5 10 -10', focus: 'Negative values and a zero target.' },
  ],
  'valid-parentheses': () => [
    { input: '()', focus: 'Shortest valid pair.' },
    { input: '([)]', focus: 'Brackets close in the wrong nesting order.' },
    { input: '{[]}', focus: 'Several bracket types nested correctly.' },
  ],
  'binary-search': () => [
    { input: '1 8\n8', focus: 'Single-element array containing the target.' },
    { input: '5 9\n1 3 5 7 9', focus: 'Target at the right boundary.' },
    { input: '4 2\n1 3 5 7', focus: 'Target falls between array values.' },
  ],
  'best-time-to-buy-and-sell-stock': () => [
    { input: '1\n7', focus: 'Only one day; a transaction cannot be completed.' },
    { input: '5\n9 7 4 3 1', focus: 'Prices decrease throughout.' },
    { input: '5\n2 1 4 1 6', focus: 'A later low price leads to the best sale.' },
  ],
  'maximum-subarray': () => [
    { input: '1\n-7', focus: 'Single negative value.' },
    { input: '5\n-8 -3 -6 -2 -5', focus: 'All values are negative.' },
    { input: '5\n5 -10 6 7 -2', focus: 'The best subarray starts after a large negative value.' },
  ],
  'contains-duplicate': () => [
    { input: '1\n-5', focus: 'Single-element input cannot contain a duplicate.' },
    { input: '4\n0 -1 0 2', focus: 'Duplicate zero among negative and positive values.' },
    { input: '5\n1 2 3 4 5', focus: 'All values are unique.' },
  ],
  'reverse-array': () => [
    { input: '1\n9', focus: 'Single-element array.' },
    { input: '4\n2 2 0 -3', focus: 'Repeated values and a negative value.' },
    { input: '5\n1 2 3 4 5', focus: 'Odd number of elements; the middle stays in place.' },
  ],
  'move-zeroes': () => [
    { input: '4\n0 0 0 0', focus: 'Every value is zero.' },
    { input: '4\n1 2 3 4', focus: 'There are no zeroes to move.' },
    { input: '5\n0 -1 0 2 0', focus: 'Preserve the relative order of negative and positive values.' },
  ],
  'climbing-stairs': () => [
    { input: '1', focus: 'Smallest valid staircase.' },
    { input: '2', focus: 'First staircase with two possible routes.' },
    { input: '10', focus: 'Larger value checks the recurrence beyond the base cases.' },
  ],
}

export function generateEdgeCases(slug) {
  const generator = generators[slug]
  return generator ? generator() : null
}
