import './Routepanel.css';
import '../../styles/general.css';
import type { ActivePoint, GeocodedPlace, RouteResult, RouteSummary, SavedRoute } from '../../types';
import { useState } from "react";
import RouteDetails from "./RouteDetails";
import { formatDuration } from '../../utils/routeFormat';
import FavoriteRouteButton from "./FavoriteRouteButton";
import type { SavedRoutePayload } from "../../api/save_route";
import { CgEditBlackPoint } from "react-icons/cg";
import { LuMapPin } from "react-icons/lu";
import { IoIosCloseCircle } from "react-icons/io";

type RoutePanelProps = {
  startPoint: string;
  endPoint: string;
  fuel: number;
  fueltype: string;
  activePoint: ActivePoint;
  routes: RouteResult[];
  activeRouteIndex: number;
  routeSummary: RouteSummary | null;
  routeError: string | null;
  isRouteLoading: boolean;
  canCreateRoute: boolean;
  selectedVehicleModel: string | null;
  fuelMode: string | null;
  startSuggestions: GeocodedPlace[];
  endSuggestions: GeocodedPlace[];
  isStartSearchLoading: boolean;
  isEndSearchLoading: boolean;
  startSearchError: string | null;
  endSearchError: string | null;
    onStartPointChange: (value: string) => void;
  onEndPointChange: (value: string) => void;
  setActivePoint: (value: ActivePoint) => void;
  onClearStart: () => void;
  onClearEnd: () => void;
  onClearAll: () => void;
  onCreateRoute: () => void;
  onCalculateFuel: (value: number) => void;
  onSelectRoute: (index: number) => void;
  onFuelTypeChange: (value: string) => void;
  onOpenModal: () => void;
  onSelectStartPlace: (place: GeocodedPlace) => void;
  onSelectEndPlace: (place: GeocodedPlace) => void;
  savedRoutes: SavedRoute[];
  onSaveRoute: (payload: SavedRoutePayload) => Promise<void>;
  onRemoveSavedRoute: (id: number) => Promise<void>;
};

function RoutePanel({
  startPoint,
  endPoint,
  fuel,
  fueltype,
  activePoint,
  routes,
  activeRouteIndex,
  routeError,
  isRouteLoading,
  canCreateRoute,
  selectedVehicleModel,
  fuelMode,
  onStartPointChange,
  onEndPointChange,
  setActivePoint,
  onClearStart,
  onClearEnd,
  onClearAll,
  onCreateRoute,
  onSelectRoute,
  onOpenModal,
  startSuggestions,
  endSuggestions,
  isStartSearchLoading,
  isEndSearchLoading,
  startSearchError,
  endSearchError,
  onSelectStartPlace,
  onSelectEndPlace,
  savedRoutes,
  onSaveRoute,
  onRemoveSavedRoute,
  
}: RoutePanelProps) {

  const [detailsRouteIndex, setDetailsRouteIndex] = useState<number | null>(null);
  const detailsRoute = detailsRouteIndex !== null ? routes[detailsRouteIndex] ?? null : null;
  function handleOpenRouteDetails(index: number) {
    onSelectRoute(index);
    setDetailsRouteIndex(index);
  }
  function handleCloseRouteDetails() {
    setDetailsRouteIndex(null);
  }
  
  return (
    <section className="routePanel" aria-label="Route planner">
      <span className="navbar-title">Дорожня інструкція</span>
      <form className="routePanel_form">
        <div className={`routePanel_field ${activePoint === "start" ? "routePanel_field--active" : ""}`}>
          <div className="routePanel_fieldRow">
            <label className="routePanel_fieldIcon" htmlFor="start">
              <CgEditBlackPoint aria-hidden="true" />
              <span className="routePanel_visuallyHidden">Звідки</span>
            </label>
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
                <IoIosCloseCircle aria-hidden="true" />
              </button>
            </div>
          </div>
          {isStartSearchLoading && (
              <p className="routePanel_searchStatus">Шукаємо...</p>
            )}

            {startSearchError && (
              <p className="routePanel_searchError">{startSearchError}</p>
            )}

            {startSuggestions.length > 0 && (
              <div className="routePanel_suggestions">
                {startSuggestions.map((place) => (
                  <button
                    key={place.id}
                    type="button"
                    className="routePanel_suggestion"
                    onClick={() => onSelectStartPlace(place)}
                  >
                    {place.label}
                  </button>
                ))}
              </div>
            )}
        </div>

        <div className={`routePanel_field ${activePoint === "end" ? "routePanel_field--active" : ""}`}>
          <div className="routePanel_fieldRow">
            <label className="routePanel_fieldIcon routePanel_fieldIcon--end" htmlFor="end">
              <LuMapPin aria-hidden="true" />
              <span className="routePanel_visuallyHidden">Куди</span>
            </label>
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
                <IoIosCloseCircle aria-hidden="true" />
              </button>
            </div>
          </div>
          {isEndSearchLoading && (
              <p className="routePanel_searchStatus">Шукаємо...</p>
            )}

            {endSearchError && (
              <p className="routePanel_searchError">{endSearchError}</p>
            )}

            {endSuggestions.length > 0 && (
              <div className="routePanel_suggestions">
                {endSuggestions.map((place) => (
                  <button
                    key={place.id}
                    type="button"
                    className="routePanel_suggestion"
                    onClick={() => onSelectEndPlace(place)}
                  >
                    {place.label}
                  </button>
                ))}
              </div>
            )}
        </div>

        <section className="routePanel_myVehicle">
          <p>Порахувати витрати</p>
          <button onClick={onOpenModal} className="text-button" type="button">
          + Додати авто
          </button>
          {selectedVehicleModel && (
          <p className="routePanel_myVehicleModel">
            Обране авто: {selectedVehicleModel}
          </p>)}
          {fuelMode && (
            <p className="routePanel_selectedVehicle">
              Режим витрати: {fuelMode}</p>)}
        </section>           
        <button
          className="routePanel_button"
          type="button"
          disabled={!canCreateRoute || isRouteLoading}
          onClick={onCreateRoute}
        >
          {isRouteLoading ? "Будуємо..." : "Побудувати маршрут"}
        </button>

        <button
          className="routePanel_button routePanel_button--secondary"
          type="button"
          disabled={!startPoint && !endPoint}
          onClick={onClearAll}
        >
          Очистити 
        </button>
      </form>

      <section className="routePanel_routes" aria-label="Маршрути">
        <h2 className="routePanel_routesTitle">Маршрути</h2>
        {isRouteLoading && (<p className="routePanel_routeNote">Будуємо маршрут...</p>)}

        {routeError && (<p className="routePanel_searchError">{routeError}</p>)}

        {routes.length > 0 && !isRouteLoading && (
          <div className="routePanel_routeList">
            {routes.map((route, index) => {
              const fuelLiters = (route.distanceKm / 100) * fuel;
              const isActive = index === activeRouteIndex;
              const direction = `${startPoint || "Старт"} → ${endPoint || "Фініш"}`;
              const routePayload = {
                start_location: startPoint || "Старт",
                finish_location: endPoint || "Фініш",
                distance: `${route.distanceKm.toFixed(1)} км`,
                duration: formatDuration(route.durationMin),
                fuel: `${fuelLiters.toFixed(1)} л`,
              };

              const savedRoute = savedRoutes.find(
                (savedRoute) =>
                  savedRoute.start_location.trim().toLowerCase() === routePayload.start_location.trim().toLowerCase() &&
                  savedRoute.finish_location.trim().toLowerCase() === routePayload.finish_location.trim().toLowerCase()
              );
              return (
                <article
                  key={`${index}-${route.distanceKm}-${route.durationMin}`}
                  className={`routePanel_routeCard ${isActive ? "routePanel_routeCard--active" : ""}`}
                  role="button"
                  tabIndex={0}
                  aria-selected={isActive}
                  onClick={() => onSelectRoute(index)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      onSelectRoute(index);
                    }
                  }}
                  >
                    <div className="routePanel_routeCardTop">
                      <h3>Варіант {index + 1}</h3>
                      <div className="routePanel_routeBadges">
                        <span>{route.distanceKm.toFixed(1)} км</span>
                        <span>{formatDuration(route.durationMin)}</span>
                        <span>{fuelLiters.toFixed(1)} л</span>
                      </div>
                    </div>
                    <p className="routePanel_routeDirection">{direction}</p>
                    <div className="routePanel_routeCardBottom">
                      <FavoriteRouteButton
                        routePayload={routePayload}
                        savedRoute={savedRoute}
                        onSaveRoute={onSaveRoute}
                        onRemoveRoute={onRemoveSavedRoute}
                      />

                    <button className="routePanel_detailsButton"
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      handleOpenRouteDetails(index);
                    }}>
                      Детальніше
                    </button>
                    </div>
                </article>
              );
            })}
          </div>
        )}
        {routes.length === 0 && !isRouteLoading && !routeError && (
    <p className="routePanel_emptyRoutes">Прокладіть маршрут</p>
  )}
  </section>

      <RouteDetails
      isOpen={detailsRoute !== null}
      route={detailsRoute}
      fuel={fuel}
      fueltype={fueltype}
      onClose={handleCloseRouteDetails}
      />
    </section>
  );
}

export default RoutePanel;
