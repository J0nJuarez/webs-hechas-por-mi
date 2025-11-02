import React from 'react'
import './boton.css'

interface BotonProps {
    logoUrl?: string;
    webTitle?: string;
    onClick?: () => void;
}

const Boton: React.FC<BotonProps> = ({ logoUrl, onClick, webTitle }) => {
  return (
  <button onClick={onClick}>
  <div className="liquidGlass-wrapper button">
          <div className="liquidGlass-effect"></div>
          <div className="liquidGlass-tint"></div>
          <div className="liquidGlass-shine"></div>
          <div className="liquidGlass-text">
    <div className="btn-icon">
      {logoUrl && <img src={logoUrl} className='' alt="Logo" />}
    </div>
    <h2>Ver Web {webTitle}</h2>
  </div>
    </div>
</button>

  )
}

export default Boton