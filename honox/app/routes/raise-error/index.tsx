export default function RaiseErrorPage() {
  throw new Error('error raised in raise-error page!')
  return (<div>unreachable!</div>)
}
