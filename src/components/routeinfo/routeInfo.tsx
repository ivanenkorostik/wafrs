
import type { RouteSummary } from "../../types";

type RouteInfoProps = {
    routeSummary: RouteSummary | null;
    fuel: number;
    fueltype: string;

    routeError: string | null;
    isRouteLoading: boolean;
};

function RouteInfo({ routeSummary, fuel, fueltype, routeError, isRouteLoading }: RouteInfoProps) {

    const averageSpeed = routeSummary ? routeSummary.distanceKm / (routeSummary.durationMin / 60) : 0;
 // Припустимо, що це середня витрата пального в літрах на 100 км

    let fuelCost = 0;
    const fuel_95 = 73; // Припустимо, що ціна пального 73 грн за літр
    const fuel_92 = 66.39;
    const fuel_diesel = 88;
    const fuel_lpg = 48; // Припустимо, що ціна пального 48 грн за літр
    if (routeSummary && fueltype === "92") {
        fuelCost = (routeSummary.distanceKm / 100) * fuel * fuel_92;
    }
    if (routeSummary && fueltype === "95") {
        fuelCost = (routeSummary.distanceKm / 100) * fuel * fuel_95;
    }
    if (routeSummary && fueltype === "diesel") {
        fuelCost = (routeSummary.distanceKm / 100) * fuel * fuel_diesel;
    }
    else if (routeSummary && fueltype === "lpg") {
        fuelCost = (routeSummary.distanceKm / 100) * fuel * fuel_lpg; // Припустимо, що ціна газу 48 грн за літр
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
                    <div>
                        <dt>Середня швидкість</dt>
                        <dd>{averageSpeed.toFixed(1)} км/год</dd>
                    </div>
                </dl>
            )}
        </section>
    );
}

export default RouteInfo;
