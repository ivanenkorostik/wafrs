import './routepanel.css';
import RouteInfo from '../routeinfo/routeInfo';

type ActivePoint = "start" | "end" | null;

type RoutePanelProps = {
  startPoint: string;
  endPoint: string;
  activePoint: ActivePoint;
  setStartPoint: (value: string) => void;
  setEndPoint: (value: string) => void;
  setActivePoint: (value: ActivePoint) => void;
};

function RoutePanel({ startPoint, endPoint, activePoint, setStartPoint, setEndPoint, setActivePoint }: RoutePanelProps) {
  return (
    <section className="routePanel" aria-label="Route planner">
      <form className="routePanel_form">
        <div className={`routePanel_field ${activePoint === "start" ? "routePanel_field--active" : ""}`}>
          <label htmlFor="start">Звідки</label>
          <input 
            id="start" 
            type="text" 
            value={startPoint}
            placeholder={
              activePoint === "start"
                ? "Введіть місто або виберіть на карті"
                : "Початкова точка маршруту"
            }
            onChange={(e) => setStartPoint(e.target.value)}
            onFocus={() => setActivePoint("start")}
          />
        </div>

        <div className={`routePanel_field ${activePoint === "end" ? "routePanel_field--active" : ""}`}>
          <label htmlFor="end">Куди</label>
          <input 
            id="end" 
            type="text" 
            value={endPoint}
            placeholder={activePoint === "end"   
              ? "Введіть місто або виберіть на карті"
              : "Кінцева точка маршруту"
            }
            onChange={(e) => setEndPoint(e.target.value)}
            onFocus={() => setActivePoint("end")}
          />
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
