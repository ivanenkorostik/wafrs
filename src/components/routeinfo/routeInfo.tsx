
import type { RouteSummary } from "../../types";

type RouteInfoProps = {
    routeSummary: RouteSummary | null;
    fuel: number;
    routeError: string | null;
    isRouteLoading: boolean;
};

function RouteInfo({ routeSummary, fuel, routeError, isRouteLoading }: RouteInfoProps) {

    let fuelCost = 0;
    if (routeSummary) {
        fuelCost = (routeSummary.distanceKm / 100) * fuel*70;
    }
    return (
        <section className="routeInfo" aria-live="polite">
            

            {isRouteLoading && <p>Будуємо маршрут...</p>}

            {routeError && <p className="routeInfo_error">{routeError}</p>}

            {routeSummary && !isRouteLoading && (
                <dl className="routeInfo_list">
                    <div>
                        <dt>Довжина</dt>
                        <dd>{routeSummary.distanceKm.toFixed(1)} км</dd>
                    </div>
                    <div>
                        <dt>Час</dt>
                        <dd>{Math.round(routeSummary.durationMin)} хв</dd>
                    </div>
                    <div>
                        <dt>Орієнтовна вартість пального</dt>
                        <dd>{fuelCost.toFixed(2)} грн</dd>
                    </div>
                </dl>
            )}
        </section>
    );
}

export default RouteInfo;
