import type { MouseEvent } from "react";
import { MdFavorite, MdFavoriteBorder } from "react-icons/md";
import type { SavedRoute } from "../../types";
import type { SavedRoutePayload } from "../../api/save_route";

type FavoriteRouteButtonProps = {
  routePayload: SavedRoutePayload;
  savedRoute: SavedRoute | undefined;
  onSaveRoute: (payload: SavedRoutePayload) => Promise<void>;
  onRemoveRoute: (id: number) => Promise<void>;
};

function FavoriteRouteButton({
  routePayload,
  savedRoute,
  onSaveRoute,
  onRemoveRoute,
}: FavoriteRouteButtonProps) {
  const isSaved = Boolean(savedRoute);

  async function handleClick(event: MouseEvent<HTMLButtonElement>) {
    event.stopPropagation();

    if (savedRoute) {
      await onRemoveRoute(savedRoute.id);
      return;
    }

    await onSaveRoute(routePayload);
  }

  return (
    <button
      className="routePanel_favoriteButton"
      type="button"
      onClick={handleClick}
      aria-label={isSaved ? "Видалити зі збережених" : "Зберегти маршрут"}
    >
      {isSaved ? <MdFavorite /> : <MdFavoriteBorder />}
    </button>
  );
}

export default FavoriteRouteButton;
