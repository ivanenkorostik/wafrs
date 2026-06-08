import type { SavedRoute } from "../../types";
import "./modalRoutes.css";

type SavedRoutesModalProps = {
  savedRoutes: SavedRoute[];
  isLoading: boolean;
  error: string | null;
  onClose: () => void;
  onDeleteRoute: (id: number) => Promise<void>;
  onSelectRoute: (route: SavedRoute) => Promise<void>;
};

function SavedRoutesModal({
  savedRoutes,
  isLoading,
  error,
  onClose,
  onDeleteRoute,
  onSelectRoute,
}: SavedRoutesModalProps) {
  return (
    <div className="savedRoutes_overlay" onClick={onClose}>
      <section
        className="savedRoutes_modal"
        onClick={(event) => event.stopPropagation()}
      >
        <button className="savedRoutes_close" type="button" onClick={onClose}>
          ×
        </button>

        <h2 className="savedRoutes_title">Збережені маршрути</h2>

        {isLoading && <p>Завантаження...</p>}
        {error && <p className="savedRoutes_error">{error}</p>}

        {!isLoading && !error && savedRoutes.length === 0 && (
          <p className="savedRoutes_empty">У вас ще немає збережених маршрутів</p>
        )}

        <div className="savedRoutes_list">
          {savedRoutes.map((route) => (
            <article
              className="savedRoutes_card"
              key={route.id}
              role="button"
              tabIndex={0}
              aria-label={`Відкрити маршрут ${route.start_location} — ${route.finish_location}`}
              onClick={() => onSelectRoute(route)}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  onSelectRoute(route);
                }
              }}
            >
              <button
                className="savedRoutes_delete"
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  onDeleteRoute(route.id);
                }}
                aria-label="Видалити маршрут"
              >
                ×
              </button>

              <p className="savedRoutes_direction">
                {route.start_location} → {route.finish_location}
              </p>

              <div className="savedRoutes_badges">
                <span>{route.distance}</span>
                <span>{route.duration}</span>
                <span>{route.fuel}</span>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}

export default SavedRoutesModal;
