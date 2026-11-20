// Página provisoria mientras se construye cada área de Marketing.
// Cada área reemplaza su page.jsx; cuando no quede ninguna, se puede borrar este archivo.
export default function EnConstruccion({ title, description }) {
  return (
    <>
      <div className="adm-header">
        <h1>{title}</h1>
      </div>
      <div className="adm-content">
        <div className="adm-empty">
          <p>{description}</p>
          <p>Esta sección se está construyendo.</p>
        </div>
      </div>
    </>
  );
}
