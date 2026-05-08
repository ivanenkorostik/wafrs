import './routepanel.css';
import RouteInfo from '../routeinfo/routeInfo';

function RoutePanel() {
  return (
    <section className="routePanel" aria-label="Route planner">
      <form className="routePanel_form">
        <div className="routePanel_field">
          <label htmlFor="start">Звідки</label>
          <input id="start" type="text" placeholder="Початкова локація" />
        </div>

        <div className="routePanel_field">
          <label htmlFor="end">Куди</label>
          <input id="end" type="text" placeholder="Кінцева локація" />
        </div>

        <div className="routePanel_field">
          <label htmlFor="fuel">Витрата пального</label>
          <input id="fuel" type="number" min="0" step="0.1" placeholder="л / 100 км" />
        </div>

        <button className="routePanel_button" type="button">
          Створити маршрут
        </button>
      </form>

      <RouteInfo />
        </section>
  );
}

export default RoutePanel;
