export default function Reveal({ children, delay = 0 }) {
  return (
    <div style={{ animation: `revealUp 600ms ${delay}ms cubic-bezier(.2,.8,.2,1) both` }}>
      {children}
    </div>
  );
}
