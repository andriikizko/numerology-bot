const Subscriptions = ({ onBack }) => {
  return (
    <div className="screen product-detail-screen">
      <div className="pd-topbar"><div className="pd-back" onClick={onBack}>←</div></div>
      <div className="pd-scroll">
        <div className="pd-hero">
          <div className="pd-hero-tag">Підписки</div>
          <div className="pd-hero-title">Підписка і оплати</div>
          <div className="pd-hero-desc">Тут з'явиться керування підписками та історія оплат.</div>
        </div>
      </div>
    </div>
  )
}

export default Subscriptions
