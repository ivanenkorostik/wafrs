import './routepanel.css';
import RouteInfo from '../routeinfo/routeInfo';
import type { ActivePoint, RouteResult, RouteSummary } from '../../types';

type RoutePanelProps = {
  startPoint: string;
  endPoint: string;
  fuel: number;
  activePoint: ActivePoint;
  routes: RouteResult[];
  activeRouteIndex: number;
  routeSummary: RouteSummary | null;
  routeError: string | null;
  isRouteLoading: boolean;
  canCreateRoute: boolean;
  onStartPointChange: (value: string) => void;
  onEndPointChange: (value: string) => void;
  setActivePoint: (value: ActivePoint) => void;
  onClearStart: () => void;
  onClearEnd: () => void;
  onClearAll: () => void;
  onCreateRoute: () => void;
  onCalculateFuel: (value: number) => void;
  onSelectRoute: (index: number) => void;
};

function RoutePanel({
  startPoint,
  endPoint,
  fuel,
  activePoint,
  routes,
  activeRouteIndex,
  routeSummary,
  routeError,
  isRouteLoading,
  canCreateRoute,
  onStartPointChange,
  onEndPointChange,
  setActivePoint,
  onClearStart,
  onClearEnd,
  onClearAll,
  onCreateRoute,
  onCalculateFuel,
  onSelectRoute
}: RoutePanelProps) {
  return (
    <section className="routePanel" aria-label="Route planner">
      <form className="routePanel_form">
        <div className={`routePanel_field ${activePoint === "start" ? "routePanel_field--active" : ""}`}>
          <label htmlFor="start">Звідки</label>
          <div className="routePanel_inputRow">
            <input 
              id="start" 
              type="text" 
              value={startPoint}
              placeholder={
                activePoint === "start"
                  ? "Введіть місто або виберіть на карті"
                  : "Початкова точка маршруту"
              }
              onChange={(e) => onStartPointChange(e.target.value)}
              onFocus={() => setActivePoint("start")}
            />
            <button
              className="routePanel_iconButton"
              type="button"
              aria-label="Очистити початкову точку"
              disabled={!startPoint}
              onClick={onClearStart}
            >
              x
            </button>
          </div>
        </div>

        <div className={`routePanel_field ${activePoint === "end" ? "routePanel_field--active" : ""}`}>
          <label htmlFor="end">Куди</label>
          <div className="routePanel_inputRow">
            <input 
              id="end" 
              type="text" 
              value={endPoint}
              placeholder={activePoint === "end"   
                ? "Введіть місто або виберіть на карті"
                : "Кінцева точка маршруту"
              }
              onChange={(e) => onEndPointChange(e.target.value)}
              onFocus={() => setActivePoint("end")}
            />
            <button
              className="routePanel_iconButton"
              type="button"
              aria-label="Очистити кінцеву точку"
              disabled={!endPoint}
              onClick={onClearEnd}
            >
              x
            </button>
          </div>
        </div>

        <div className="routePanel_field">
          <label htmlFor="fuel">Витрата пального</label>
          <input 
            id="fuel" 
            type="number" 
            min="0" 
            step="0.1" 
            placeholder="л / 100 км" 
            onChange={(e) => onCalculateFuel(parseFloat(e.target.value) || 0)}
          />
        </div>

        <button
          className="routePanel_button"
          type="button"
          disabled={!canCreateRoute || isRouteLoading}
          onClick={onCreateRoute}
        >
          {isRouteLoading ? "Будуємо..." : "Створити маршрут"}
        </button>

        <button
          className="routePanel_button routePanel_button--secondary"
          type="button"
          disabled={!startPoint && !endPoint}
          onClick={onClearAll}
        >
          Очистити обидві точки
        </button>
      </form>

      {routes.length > 1 && !isRouteLoading && (
        <div className="routePanel_routes" aria-label="Альтернативні маршрути">
          <h5>Варіанти маршруту</h5>
          <div className="routePanel_routeList">
            {routes.map((route, index) => {
              const fuelLiters = (route.distanceKm / 100) * fuel;
              const isActive = index === activeRouteIndex;

              return (
                <button
                  key={`${index}-${route.distanceKm}-${route.durationMin}`}
                  className={`routePanel_routeOption ${isActive ? "routePanel_routeOption--active" : ""}`}
                  type="button"
                  aria-pressed={isActive}
                  onClick={() => onSelectRoute(index)}
                >
                  <span className="routePanel_routeTitle">
                    {index === 0 ? "Основний" : `Альтернатива ${index}`}
                  </span>
                  <span>{route.distanceKm.toFixed(1)} км</span>
                  <span>{Math.round(route.durationMin)} хв</span>
                  <span>{fuelLiters.toFixed(1)} л</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {routes.length === 1 && !isRouteLoading && !routeError && (
        <p className="routePanel_routeNote">
          Для цих точок OSRM повернув тільки один маршрут.
        </p>
      )}

      <RouteInfo
        routeSummary={routeSummary}
        routeError={routeError}
        isRouteLoading={isRouteLoading}
        fuel={fuel}
      />
        </section>
  );
}

export default RoutePanel;
