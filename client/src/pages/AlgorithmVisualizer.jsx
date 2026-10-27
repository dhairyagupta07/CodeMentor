import { useMemo, useState } from 'react'
import { ArrowLeft, ArrowRight, Play, RotateCcw, Waypoints } from 'lucide-react'

function parseNumbers(value) {
  if (!value.trim()) return []
  const numbers = value.split(',').map((part) => Number(part.trim()))
  return numbers.length <= 20 && numbers.every(Number.isFinite) ? numbers : []
}

function buildTrace(algorithm, values, target, text) {
  if (algorithm === 'binary-search') {
    if (values.some((value, index) => index > 0 && value <= values[index - 1])) {
      return [{ index: -1, message: 'Sort the values in ascending order with no duplicates, then restart the walkthrough.' }]
    }
    const steps = []
    let left = 0
    let right = values.length - 1
    while (left <= right) {
      const middle = Math.floor((left + right) / 2)
      steps.push({ index: middle, message: `Check index ${middle}: ${values[middle]}. Search range is ${left} to ${right}.` })
      if (values[middle] === target) {
        steps.push({ index: middle, message: `Found ${target} at index ${middle}.` })
        return steps
      }
      if (values[middle] < target) left = middle + 1
      else right = middle - 1
    }
    steps.push({ index: -1, message: `${target} is not in this sorted array.` })
    return steps
  }
  if (algorithm === 'two-sum') {
    const steps = []
    const seen = new Map()
    for (let index = 0; index < values.length; index += 1) {
      const complement = target - values[index]
      steps.push({
        index,
        message: seen.has(complement)
          ? `The complement ${complement} is already at index ${seen.get(complement)}. Pair found: ${seen.get(complement)} and ${index}.`
          : `At index ${index}, value ${values[index]} needs ${complement}. No match yet, so save ${values[index]}.`,
      })
      if (seen.has(complement)) return steps
      seen.set(values[index], index)
    }
    return steps.length ? steps : [{ index: -1, message: 'Enter at least one array value to begin.' }]
  }

  const steps = []
  const stack = []
  const matching = { ')': '(', ']': '[', '}': '{' }
  for (let index = 0; index < text.length; index += 1) {
    const character = text[index]
    if ('([{'.includes(character)) {
      stack.push(character)
      steps.push({ index, character, stack: [...stack], message: `Push opening bracket ${character} onto the stack.` })
    } else {
      const top = stack.at(-1)
      const matched = matching[character] === top
      if (matched) stack.pop()
      steps.push({
        index,
        character,
        stack: [...stack],
        message: matched
          ? `Closing bracket ${character} matches ${top}; pop the stack.`
          : `Closing bracket ${character} does not match the current stack top.`,
      })
      if (!matched) return steps
    }
  }
  steps.push({ index: -1, character: '', stack: [...stack], message: stack.length ? 'Input ended while opening brackets remain.' : 'Input ended with an empty stack; the brackets are balanced.' })
  return steps
}

export default function AlgorithmVisualizer() {
  const [algorithm, setAlgorithm] = useState('binary-search')
  const [arrayInput, setArrayInput] = useState('1, 3, 5, 7, 9')
  const [targetInput, setTargetInput] = useState('7')
  const [bracketInput, setBracketInput] = useState('([])')
  const values = useMemo(() => parseNumbers(arrayInput), [arrayInput])
  const target = Number(targetInput)
  const trace = useMemo(
    () => buildTrace(algorithm, values, target, bracketInput),
    [algorithm, values, target, bracketInput],
  )
  const [step, setStep] = useState(0)
  const currentStep = Math.min(step, Math.max(trace.length - 1, 0))

  function updateInput(setter, value) {
    setter(value)
    setStep(0)
  }

  return (
    <main className="page-shell visualizer-page">
      <div className="page-heading"><div><span className="eyebrow"><Waypoints size={14} /> ALGORITHM WALKTHROUGH</span><h1>See each step unfold.</h1><p>Explore how common algorithms update their state. These are guided examples, not executions of your submitted code.</p></div></div>
      <section className="dashboard-panel visualizer-panel">
        <div className="visualizer-controls">
          <label>Algorithm<select value={algorithm} onChange={(event) => { setAlgorithm(event.target.value); setStep(0) }}><option value="binary-search">Binary search</option><option value="two-sum">Two Sum · hash map</option><option value="stack">Balanced brackets · stack</option></select></label>
          {algorithm === 'stack' ? <label>Bracket sequence<input value={bracketInput} onChange={(event) => updateInput(setBracketInput, event.target.value)} maxLength={80} /></label> : <>
            <label>{algorithm === 'binary-search' ? 'Sorted values' : 'Values'}<input value={arrayInput} onChange={(event) => updateInput(setArrayInput, event.target.value)} placeholder="1, 3, 5, 7, 9" /></label>
            <label>Target<input type="number" value={targetInput} onChange={(event) => updateInput(setTargetInput, event.target.value)} /></label>
          </>}
        </div>
        {(algorithm !== 'stack' && !values.length) && <div role="alert" className="alert-error">Enter comma-separated numbers to visualize.</div>}
        {(algorithm === 'binary-search' && values.some((value, index) => index > 0 && value <= values[index - 1])) && <div role="alert" className="alert-error">Binary search requires ascending, distinct values.</div>}
        {(algorithm !== 'stack' && !Number.isFinite(target)) && <div role="alert" className="alert-error">Enter a valid numeric target.</div>}
        {algorithm !== 'stack' && values.length > 0 && <div className="visual-array" aria-label="Array state">{values.map((value, index) => <div className={index === trace[currentStep]?.index ? 'visual-cell active' : 'visual-cell'} key={`${value}-${index}`}><span>{value}</span><small>{index}</small></div>)}</div>}
        {algorithm === 'stack' && <div className="visual-stack-state"><div><span>Input</span><strong>{bracketInput || '(empty)'}</strong></div><div><span>Current stack</span><strong>{trace[currentStep]?.stack?.join(' ') || '(empty)'}</strong></div>{trace[currentStep]?.character && <div><span>Current character</span><strong>{trace[currentStep].character}</strong></div>}</div>}
        <div className="visual-step-card"><span className="eyebrow">STEP {trace.length ? currentStep + 1 : 0} OF {trace.length}</span><p>{trace[currentStep]?.message || 'Set up an input to create a walkthrough.'}</p></div>
        <div className="visualizer-actions"><button className="button button-outline" disabled={currentStep <= 0} onClick={() => setStep((value) => Math.max(0, value - 1))}><ArrowLeft size={15} /> Previous</button><button className="button button-outline" onClick={() => setStep(0)}><RotateCcw size={14} /> Restart</button><button className="button button-primary" disabled={currentStep >= trace.length - 1} onClick={() => setStep((value) => Math.min(trace.length - 1, value + 1))}><Play size={14} /> Next step <ArrowRight size={14} /></button></div>
      </section>
    </main>
  )
}
