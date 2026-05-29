
import type { RouteSummary } from "../../types";
import "./RouteInfo.css";
import { calculateFuelCost, calculateFuelUsed, getAverageSpeed } from "../../utils/fuel";

type RouteInfoProps = {
    routeSummary: RouteSummary | null;
    fuel: number;
    fueltype: string;

    routeError: string | null;
    isRouteLoading: boolean;
};

function RouteInfo({ routeSummary, fuel, fueltype, routeError, isRouteLoading }: RouteInfoProps) {

    const averageSpeed = getAverageSpeed(routeSummary);
    const fuelUsed = routeSummary ? calculateFuelUsed(routeSummary.distanceKm, fuel) : 0;
    const fuelCost = calculateFuelCost(fuelUsed, fueltype);

    
    


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
                        <dt>Витрачено пального</dt>
                        <dd>{fuelUsed.toFixed(2)} л</dd>
                    </div>
                    <div>
                        <dt>Використана витрата</dt>
                        <dd>{fuel.toFixed(2)} л/100 км</dd>
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
