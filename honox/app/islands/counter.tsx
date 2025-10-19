import { useState } from 'hono/jsx'

export const Counter = () => {
  const [count, setCount] = useState(0)
  return (
    <div>
      <p>Count: {count}</p>
      <button 
        className='btn btn-outline'
        onClick={() => setCount(count + 1)}
      >
        Increment
      </button>
    </div>
  )
}
